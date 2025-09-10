import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from datetime import datetime
import uuid
from pathlib import Path
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def add_test_employee():
    employee_id = "test123"
    password = "testpassword"
    existing = await db.employees.find_one({"employee_id": employee_id})
    if existing:
        print("Test employee already exists.")
        return

    employee = {
        "id": str(uuid.uuid4()),
        "employee_id": employee_id,
        "name": "Test Employee",
        "email": "test@municipality.com",
        "department": "sanitation",
        "contact_phone": "1234567890",
        "password_hash": bcrypt.hash(password),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "performance_stats": {
            "total_complaints_resolved": 0,
            "total_complaints_assigned": 0,
            "average_resolution_time": 0,
            "last_activity": datetime.utcnow().isoformat()
        }
    }
    await db.employees.insert_one(employee)
    print("Test employee created! ID: test123, Password: testpassword")

if __name__ == "__main__":
    asyncio.run(add_test_employee())