import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.services.scheme_crawler import SchemeCrawler
from app.core.database_sql import init_db

async def test_single_scheme():
    crawler = SchemeCrawler()
    # Mocking the run to just do one specific scheme
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        # Using a confirmed link from subagent
        url = "https://www.myscheme.gov.in/schemes/syss"
        print(f"Testing crawl for {url}")
        try:
            await crawler._crawl_scheme_detail(page, url)
            print("Crawl detailed called successfully.")
        except Exception as e:
            print(f"Error during test: {e}")
            import traceback
            traceback.print_exc()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_single_scheme())
