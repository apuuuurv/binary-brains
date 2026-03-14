from app.ml.inference.ranking_engine import SchemeRankingEngine
from app.core.database import connect_to_mongo, get_db
import asyncio
import json

async def test():
    await connect_to_mongo()
    db = get_db()
    farmer = await db.farmers.find_one()
    if not farmer:
        print("No farmer found!")
        return
    
    # Simulate API fix
    farmer["_id"] = str(farmer["_id"])
    
    engine = SchemeRankingEngine()
    results = engine.rank_schemes(farmer)
    
    print(f"Farmer: {farmer.get('full_name')} in {farmer.get('state')}")
    print(f"Eligible: {len(results['ranked_schemes'])}")
    for s in results['ranked_schemes']:
        print(f"  - {s['scheme_name']}")
    
    print(f"Ineligible: {len(results['ineligible_schemes'])}")
    for s in results['ineligible_schemes']:
        print(f"  - {s['scheme_name']} | Reason: {s['explanation']}")

asyncio.run(test())
