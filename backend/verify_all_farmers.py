import asyncio
from app.core.database import connect_to_mongo, get_db

async def verify_demo():
    await connect_to_mongo()
    db = get_db()
    if db is None: return
    
    # Verify ALL existing farmers so they can access the dashboard immediately
    result = await db.farmers.update_many(
        {}, 
        {"$set": {
            "is_aadhar_verified": True,
            "is_pan_verified": True,
            "profile_completed": True,
            "documents_uploaded": ["aadhar:verified", "pan:verified"]
        }}
    )
    print(f"Successfully verified {result.modified_count} farmers for the presentation.")

asyncio.run(verify_demo())
