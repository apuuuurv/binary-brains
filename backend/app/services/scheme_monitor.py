# backend/app/services/scheme_monitor.py
import requests
from bs4 import BeautifulSoup
import uuid
from typing import List

class SchemeMonitor:
    """
    Lightweight proactive monitoring service that simulates checking
    an external government portal for new or updated schemes.
    """

    MOCK_URL = "https://agricoop.nic.in/en/Agriculture"

    @staticmethod
    def scrape_latest_schemes() -> List[dict]:
        """
        Fetches the latest crawled schemes from the SQL database to show on the dashboard.
        """
        from app.core.database_sql import SessionLocal, SchemeSQL
        db = SessionLocal()
        try:
            # Show up to 15 recently synced schemes on the dashboard
            schemes = db.query(SchemeSQL).order_by(SchemeSQL.id.desc()).limit(15).all()
            if not schemes:
                return SchemeMonitor._get_mock_data()
            
            return [
                {
                    "id": s.scheme_id,
                    "title": s.name,
                    "url": s.source_url,
                    "source": "myScheme.gov.in",
                    "status": "Synced",
                    "description": s.description,
                    "insights": ["AI-Parsed Eligibility", "Direct Government Data"]
                } for s in schemes
            ]
        except Exception as e:
            print(f"⚠️ Failed to fetch schemes from DB: {str(e)}")
            return SchemeMonitor._get_mock_data()
        finally:
            db.close()

    @staticmethod
    def _get_mock_data() -> List[dict]:
        return [
                {
                    "id": "SCH-PMKSY-2026",
                    "title": "Pradhan Mantri Krishi Sinchayee Yojana Guidelines Updated",
                    "url": "https://pmksy.gov.in/",
                    "source": "Ministry of Agriculture",
                    "status": "Updated",
                    "description": "The Ministry of Agriculture has released updated guidelines for the Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) focusing on 'Per Drop More Crop'.",
                    "insights": ["Focus on micro-irrigation", "Increased subsidy for small farmers", "Simplified application process"]
                }
            ]
