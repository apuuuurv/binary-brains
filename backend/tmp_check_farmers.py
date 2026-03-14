import asyncio
from app.core.database import connect_to_mongo, get_db

async def check():
    await connect_to_mongo()
    db = get_db()
    if db is None:
        print("DB instance is None!")
        return
    farmers = await db.farmers.find().to_list(10)
    print(f"Total Farmers found: {len(farmers)}")
    for f in farmers:
        print(f"ID: {f.get('_id')} | Name: {f.get('full_name')} | Crops: {f.get('primary_crops')} | State: {f.get('state')} | Income: {f.get('annual_income')} | Land: {f.get('land_size_hectares')}")

asyncio.run(check())
