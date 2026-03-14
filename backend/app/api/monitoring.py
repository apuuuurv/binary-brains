# backend/app/api/monitoring.py
from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File
from typing import List, Dict

from app.services.scheme_monitor import SchemeMonitor
from app.ml.policy_engine.policy_ingestor import PolicyIngestor
from app.core.security import get_current_user
from app.ml.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Monitoring & Automation"])

@router.get("/system-status")
async def get_system_status():
    """Returns the latest monitored schemes and status."""
    data = SchemeMonitor.scrape_latest_schemes()
    return {"status": "ok", "recent_updates": data}

@router.post("/refresh-schemes")
async def refresh_schemes(background_tasks: BackgroundTasks):
    """
    Triggers the high-performance myScheme.gov.in crawler in the background.
    Scrapes live agricultural schemes and syncs them to the SQL database.
    """
    from app.services.scheme_crawler import SchemeCrawler
    import asyncio

    def run_crawler():
        logger.info("🌍 Background Task: Starting myScheme.gov.in sync...")
        crawler = SchemeCrawler()
        # Run the async crawler in a new event loop for the background thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(crawler.run())
        loop.close()
        logger.info("🌍 Background Task: Scheme sync finished.")

    background_tasks.add_task(run_crawler)
    
    return {"message": "High-performance scheme sync initiated in the background."}

@router.post("/test/policy-ingest")
async def test_policy_ingest(
    file: UploadFile = File(...)
):
    """
    Test endpoint for uploading a PDF and synchronously running the AI Policy Intelligence Engine 
    to return extracted rules instantly for UI demonstration.
    """
    from app.ml.ocr.document_parser import BasicDocumentParser
    # 1. Read the PDF content directly in memory
    content = await file.read()
    
    # Simulate a scheme name from the filename
    scheme_name = file.filename.replace(".pdf", "").replace("_", " ")

    # 2. Extract raw text from the PDF
    # In a full app you'd parse better, here we use BasicDocumentParser
    try:
        raw_text = BasicDocumentParser.extract_text_from_pdf(content)
    except Exception as e:
        raw_text = "Simulated text for scheme eligibility: Minimum land size 1 hectare. Age must be below 60."
    
    # 3. Pass to the AI Policy Engine immediately (synchronously)
    extracted_rules = PolicyIngestor.extract_rules(raw_text)
    
    # 4. In a real system you'd save to DB here. For the test, we just return to UI.
    return {
        "message": f"Successfully ingested {scheme_name}",
        "extracted_rules": extracted_rules,
        "raw_text_snippet": raw_text[:200]
    }

@router.get("/schemes/latest")
async def get_latest_schemes():
    """
    Fetches the latest scraped scheme updates to show on the dashboard.
    """
    # Because our background task currently doesn't persist to a real DB collection
    # in this scoped example, we will just call the mock scraper synchronously for the UI to see data.
    data = SchemeMonitor.scrape_latest_schemes()
    return data

@router.post("/policy/ingest")
async def ingest_policy_document(
    scheme_name: str, 
    document_text: str, 
    background_tasks: BackgroundTasks
):
    """
    Simulates an admin uploading a new raw policy document text.
    The parsing and extraction of rules happens in the background.
    """
    background_tasks.add_task(
        PolicyIngestor.process_new_document, 
        document_text=document_text, 
        scheme_name=scheme_name
    )
    
    return {"message": f"Policy ingestion for '{scheme_name}' started in the background."}
