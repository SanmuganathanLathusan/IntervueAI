import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_database("IntervueAI")

# Collections
users_collection = db.get_collection("users")
interviews_collection = db.get_collection("interviews")

async def get_db():
    return db
