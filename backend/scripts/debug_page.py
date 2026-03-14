import asyncio
from playwright.async_api import async_playwright

async def debug_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        url = "https://www.myscheme.gov.in/schemes/syss"
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="networkidle")
        
        # Dump all headers
        for tag in ["h1", "h2", "h3", "h4", "span"]:
            elements = await page.query_selector_all(tag)
            for el in elements:
                text = await el.inner_text()
                if text.strip():
                    print(f"[{tag}]: {text.strip()}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_page())
