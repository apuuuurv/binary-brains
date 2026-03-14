import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from app.core.database_sql import SessionLocal, SchemeSQL
from sqlalchemy.orm import Session
import json
import os
from openai import OpenAI
from app.ml.utils.logger import get_logger

logger = get_logger(__name__)

class SchemeCrawler:
    """
    Crawler service for myScheme.gov.in. 
    Uses Playwright to handle dynamic SPA content.
    Integrated with an LLM-based parser to structure natural language rules into JSON.
    """

    BASE_URL = "https://www.myscheme.gov.in"
    CATEGORY_URL = "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20%26%20Environment"

    def __init__(self):
        # We reuse the Groq client used in the chat to parse rules from raw text
        self.api_key = os.getenv("GROQ_API_KEY")
        self.llm_client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.groq.com/openai/v1",
        ) if self.api_key else None

    async def run(self):
        """Main entry point to scrape and sync schemes."""
        logger.info("Starting myScheme.gov.in crawler sync...")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
            page = await context.new_page()
            
            all_unique_links = []
            # Start at Page 1
            page_url = f"{self.CATEGORY_URL}"
            logger.info(f"Navigating to {page_url}")
            await page.goto(page_url, wait_until="networkidle", timeout=60000)

            # Crawl through first 5 pages using physical clicks
            for page_num in range(1, 6):
                logger.info(f"Gathering links from Page {page_num}...")
                
                # Scroll to bottom to ensure pagination is visible
                for _ in range(5):
                    await page.mouse.wheel(0, 1000)
                    await page.wait_for_timeout(500)

                # 1. Get List of Schemes on this current view
                current_page_links = await page.eval_on_selector_all(
                    "a[href*='/schemes/']", 
                    "elements => elements.map(e => e.getAttribute('href')).filter(h => h.includes('/schemes/'))"
                )
                
                new_links_found = 0
                for link in current_page_links:
                    path = ""
                    if link.startswith("/schemes/"): path = link
                    elif "/schemes/" in link: path = link[link.find("/schemes/"):]
                    
                    if path and path not in all_unique_links:
                        all_unique_links.append(path)
                        new_links_found += 1
                
                logger.info(f"Page {page_num}: Found {new_links_found} new links. Total collected: {len(all_unique_links)}")

                # Click NEXT for the next iteration (if not on last required page)
                if page_num < 5:
                    try:
                        # Find the next page number button
                        next_btn = page.locator(f"li:has-text('{page_num + 1}')")
                        if await next_btn.count() > 0:
                            await next_btn.first.click()
                        else:
                            # Fallback to arrow button if numbers aren't found
                            await page.locator(".pagination .next, .pagination li:last-child").first.click()
                        
                        await page.wait_for_timeout(3000) # Wait for SPA transition
                        await page.wait_for_load_state("networkidle")
                    except Exception as e:
                        logger.warning(f"Could not click next page: {str(e)}")
                        break 

            # Deduplicate
            scheme_links = list(set(all_unique_links))
            logger.info(f"Total unique agricultural schemes to crawl: {len(scheme_links)}")

            if not scheme_links:
                logger.warning("No scheme links found! The page structure might have changed or content is hidden.")

            for link in scheme_links:
                try:
                    full_link = f"{self.BASE_URL}{link}" if link.startswith("/") else link
                    await self._crawl_scheme_detail(page, full_link)
                except Exception as e:
                    import traceback
                    logger.error(f"Error crawling {link}: {str(e)}")
                    print(f"DEBUG Traceback for {link}:")
                    traceback.print_exc()

            await browser.close()
        logger.info("Crawler sync completed.")

    async def _crawl_scheme_detail(self, page, url: str):
        """Crawl a single scheme page and its tabs using robust text-based selectors."""
        logger.info(f"Crawling scheme: {url}")
        try:
            # Use load + manual wait for better reliability on erratic networks
            # and set referer to appear more like a normal user
            await page.goto(url, wait_until="load", timeout=60000)
            await page.wait_for_timeout(3000)
            
            # Verify we aren't on an error page before proceeding
            body_text = await page.inner_text("body")
            if "something went wrong" in body_text.lower() or "too many requests" in body_text.lower():
                logger.warning(f"Rate limited or error on {url}. Skipping.")
                return
            
            # 1. Get Title (Try H3, H1, or the browser page title as fallback)
            raw_name = ""
            # Wait a bit more for SPA to load content instead of error skeletons
            await page.wait_for_timeout(2000)
            
            for selector in ["h3", "h1", ".scheme-title", "h2"]:
                try:
                    elements = await page.query_selector_all(selector)
                    for el in elements:
                        text = await el.inner_text()
                        # Ignore common error messages or generic UI elements
                        if text and "wrong" not in text.lower() and "error" not in text.lower() and len(text.strip()) > 5:
                            raw_name = text
                            break
                    if raw_name: break
                except: continue
            
            if not raw_name or len(raw_name.strip()) < 5:
                # Fallback: check page title but also validate it
                raw_name = await page.title()
                if "wrong" in raw_name.lower() or "error" in raw_name.lower():
                    raw_name = ""
            
            # If still nothing, skip this scheme - don't save garbage
            if not raw_name or "wrong" in raw_name.lower():
                logger.warning(f"Skipping {url} as no valid title was found (likely error page).")
                return

            # Smart cleaning: Remove common suffixes and prefixes
            name = raw_name.replace("myScheme", "").replace("|", "").replace("-", "").strip()
            # If name is still empty or too short, use the scheme_id from URL
            if len(name) < 3:
                name = url.split("/")[-1].replace("-", " ").title()

            print(f"DEBUG: Extracted Name: '{name}' for URL: {url}")

            scraped_data = {
                "name": name.strip(),
                "url": url,
                "details": "",
                "benefits": "",
                "eligibility": "",
                "documents": "",
                "apply_url": ""   # Direct ministry application portal link
            }

            # 2. Extract Tab Content
            # Instead of iterating tabs by index, we look for specific text labels
            tab_labels = ["Details", "Benefits", "Eligibility", "Documents Required"]
            
            for label in tab_labels:
                try:
                    # Find a tab containing this text and click it
                    tab_button = page.get_by_role("tab", name=label, exact=False)
                    if await tab_button.count() == 0:
                        # Fallback to direct text search if role isn't set
                        tab_button = page.get_by_text(label, exact=True)
                    
                    if await tab_button.count() > 0:
                        await tab_button.first.click()
                        await page.wait_for_timeout(800) # Wait for content swap
                        
                        # The content is usually in a div following the tabs
                        # We look for the main content block that's visible
                        content_area = page.locator(".tab-content, .markdown-content, .p-4")
                        # Pick the largest text block amongst matches
                        texts = await content_area.all_inner_texts()
                        content = max(texts, key=len) if texts else ""
                        
                        if "Details" in label: scraped_data["details"] = content
                        elif "Benefits" in label: scraped_data["benefits"] = content
                        elif "Eligibility" in label: scraped_data["eligibility"] = content
                        elif "Document" in label: scraped_data["documents"] = content
                except Exception as e:
                    logger.warning(f"Failed to extract {label} tab for {name}: {str(e)}")

            # If details/eligibility still empty, try to grab whatever is on the screen
            if not scraped_data["details"]:
                scraped_data["details"] = await page.evaluate("document.body.innerText")

            # 3. Extract direct "Apply Now" link (Option A — ministry portal URL)
            # myscheme.gov.in shows an "Apply Now" button that links to the real ministry portal.
            # We capture that external href as the true application entry point.
            try:
                apply_url = ""
                # Strategy 1: look for a prominent Apply Now / Apply button with an external href
                apply_selectors = [
                    "a:has-text('Apply Now')",
                    "a:has-text('Apply now')",
                    "a:has-text('Apply Online')",
                    "a:has-text('Click to Apply')",
                    "button:has-text('Apply Now')",
                    "[class*='apply'] a",
                ]
                for sel in apply_selectors:
                    try:
                        elements = await page.query_selector_all(sel)
                        for el in elements:
                            href = await el.get_attribute("href")
                            if href and href.startswith("http") and "myscheme" not in href:
                                apply_url = href
                                break
                        if apply_url:
                            break
                    except:
                        continue

                # Strategy 2: Scan all external links on the page for a .gov.in apply portal
                if not apply_url:
                    all_links = await page.eval_on_selector_all(
                        "a[href^='http']",
                        "els => els.map(e => e.href)"
                    )
                    for href in all_links:
                        if "myscheme" not in href and ".gov.in" in href and "apply" in href.lower():
                            apply_url = href
                            break

                scraped_data["apply_url"] = apply_url
                if apply_url:
                    logger.info(f"Found Apply URL: {apply_url} for {name}")
                else:
                    logger.info(f"No direct apply URL found for {name}, will use source_url as fallback")
            except Exception as e:
                logger.warning(f"Could not extract apply URL for {name}: {str(e)}")

            # 4. Save to DB
            await self._save_to_db(scraped_data)
            
        except Exception as e:
            logger.error(f"Failed to crawl {url}: {str(e)}")
            raise e

    async def _save_to_db(self, data: dict):
        """Store the scraped data into the SQLite database."""
        # Final name cleanup
        name = data["name"].strip()
        if not name or name == "|" or len(name) < 3:
            name = data["url"].split("/")[-1].replace("-", " ").title()
        
        print(f"DEBUG: Saving scheme to DB: {name}")
        db = SessionLocal()
        try:
            url_parts = data["url"].strip("/").split("/")
            scheme_id = url_parts[-1].upper() if url_parts else "UNKNOWN"
            
            # Use LLM...
            structured_rules = self._parse_rules_with_llm(data["eligibility"])
            structured_docs = self._parse_docs_with_llm(data["documents"])

            # Check if exists
            existing = db.query(SchemeSQL).filter(SchemeSQL.scheme_id == scheme_id).first()
            if existing:
                print(f"DEBUG: Updating existing scheme {scheme_id}")
                existing.name = name
                existing.description = data["details"][:200] + "..."
                existing.details = data["details"]
                existing.benefits = data["benefits"]
                existing.eligibility_criteria = structured_rules
                existing.documents_required = structured_docs
                existing.source_url = data["url"]
                existing.apply_url = data.get("apply_url", "")
            else:
                print(f"DEBUG: Inserting new scheme {scheme_id}")
                new_scheme = SchemeSQL(
                    scheme_id=scheme_id,
                    name=name,
                    description=data["details"][:200] + "...",
                    details=data["details"],
                    benefits=data["benefits"],
                    eligibility_criteria=structured_rules,
                    documents_required=structured_docs,
                    source_url=data["url"],
                    apply_url=data.get("apply_url", "")
                )
                db.add(new_scheme)
            
            db.commit()
            print(f"DEBUG: Successfully committed {scheme_id}")
            logger.info(f"Successfully synced scheme: {data['name']} (ID: {scheme_id})")
        except Exception as e:
            print(f"DEBUG: ERROR saving to DB: {str(e)}")
            db.rollback()
        finally:
            db.close()

    def _parse_rules_with_llm(self, text: str) -> list:
        """Use LLM to structure rules into the format the RulesEngine expects."""
        if not self.llm_client or not text:
            return []
            
        try:
            prompt = f"""
            Convert the following agricultural scheme eligibility text into a list of JSON rules.
            Each rule must have 'field', 'operator' (==, !=, <, <=, >, >=, in, not_in), and 'value'.
            
            Fields available in our system:
            'income', 'land_size', 'state', 'crop_type', 'farmer_type', 'irrigation_type'
            
            Text: "{text}"
            
            Return ONLY a JSON array. 
            Example: [{"field": "income", "operator": "<", "value": "200000"}]
            """
            
            response = self.llm_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content.strip()
            # Find the JSON array in the response
            start = content.find("[")
            end = content.rfind("]") + 1
            if start != -1 and end != -1:
                return json.loads(content[start:end])
            return []
        except:
            return []

    def _parse_docs_with_llm(self, text: str) -> list:
        """Use LLM to extract a list of required documents."""
        if not self.llm_client or not text:
            return []
            
        try:
            prompt = f"Extract a plain list of essential documents from this text into a JSON array of strings: \"{text}\""
            response = self.llm_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.choices[0].message.content.strip()
            start = content.find("[")
            end = content.rfind("]") + 1
            if start != -1 and end != -1:
                return json.loads(content[start:end])
            return []
        except:
            return []

async def sync_schemes_task():
    """Service loop to sync schemes once at startup or via trigger."""
    crawler = SchemeCrawler()
    await crawler.run()
