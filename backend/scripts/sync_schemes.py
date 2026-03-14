import asyncio
import os
from dotenv import load_dotenv

# Load .env to get API keys for the Crawler's LLM component
load_dotenv()

from app.services.scheme_crawler import SchemeCrawler
from app.core.database_sql import init_db

async def initial_sync():
    """Script to run the first migration and crawl of schemes."""
    print("🚀 Initializing SQL Database for Schemes...")
    init_db()
    
    print("🌍 Starting myScheme.gov.in Crawler...")
    print("   (Note: This will use Playwright to fetch real schemes and Groq LLM to parse rules)")
    
    crawler = SchemeCrawler()
    await crawler.run()
    
    print("✅ Initial sync completed. Your local SQLite database is now populated.")

if __name__ == "__main__":
    asyncio.run(initial_sync())
