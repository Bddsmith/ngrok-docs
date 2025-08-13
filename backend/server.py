from fastapi import FastAPI, APIRouter, HTTPException, status
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')

# Helper function to convert ObjectId to string
def serialize_object_id(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# === Data Models ===

class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    phone: str
    location: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    location: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Listing(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str
    description: str
    category: str  # "poultry", "coop", "cage", "eggs"
    price: float
    images: List[str] = []  # base64 encoded images
    location: str
    # Poultry specific fields
    breed: Optional[str] = None
    age: Optional[str] = None
    health_status: Optional[str] = None
    # Coop/Cage specific fields
    size: Optional[str] = None
    material: Optional[str] = None
    condition: Optional[str] = None
    # Eggs specific fields
    egg_type: Optional[str] = None  # "chicken", "duck", "quail", etc.
    laid_date: Optional[str] = None  # when eggs were collected
    feed_type: Optional[str] = None  # "organic", "free-range", "pasture-raised", etc.
    quantity_available: Optional[str] = None  # "12 dozen", "2 dozen", etc.
    farm_practices: Optional[str] = None  # "cage-free", "organic certified", etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    class Config:
        populate_by_name = True

class ListingCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float
    images: List[str] = []
    location: str
    breed: Optional[str] = None
    age: Optional[str] = None
    health_status: Optional[str] = None
    size: Optional[str] = None
    material: Optional[str] = None
    condition: Optional[str] = None
    # Eggs specific fields
    egg_type: Optional[str] = None
    laid_date: Optional[str] = None
    feed_type: Optional[str] = None
    quantity_available: Optional[str] = None
    farm_practices: Optional[str] = None

class Message(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    sender_id: str
    receiver_id: str
    listing_id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    
    class Config:
        populate_by_name = True

class MessageCreate(BaseModel):
    receiver_id: str
    listing_id: str
    content: str

class Conversation(BaseModel):
    id: str
    listing_id: str
    listing_title: str
    other_user_name: str
    last_message: str
    last_message_time: datetime
    unread_count: int

# === Authentication Helpers ===

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.utcnow().timestamp() + 86400}  # 24 hours
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# === API Endpoints ===

# Health check
@api_router.get("/")
async def root():
    return {"message": "Poultry Marketplace API", "status": "running"}

# User Authentication
@api_router.post("/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    user_dict = user_data.dict()
    user_dict['password'] = hash_password(user_data.password)
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Generate token
    token = create_access_token(user_id)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user_id": user_id
    }

@api_router.post("/auth/login", response_model=dict)
async def login_user(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    token = create_access_token(str(user['_id']))
    
    return {
        "message": "Login successful",
        "token": token,
        "user_id": str(user['_id'])
    }

# User Profile
@api_router.get("/users/{user_id}", response_model=User)
async def get_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = serialize_object_id(user)
        # Remove password from response
        user.pop('password', None)
        return user
    except Exception as e:
        raise HTTPException(status_code=404, detail="User not found")

# Listings
@api_router.get("/listings", response_model=List[Listing])
async def get_listings(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    cursor = db.listings.find(query).sort("created_at", -1).limit(limit).skip(skip)
    listings = await cursor.to_list(length=limit)
    
    return [serialize_object_id(listing) for listing in listings]

@api_router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    try:
        listing = await db.listings.find_one({"_id": ObjectId(listing_id), "is_active": True})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        return serialize_object_id(listing)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Listing not found")

@api_router.post("/listings", response_model=Listing)
async def create_listing(listing_data: ListingCreate, user_id: str):
    # In a real app, you'd extract user_id from JWT token
    listing_dict = listing_data.dict()
    listing_dict['user_id'] = user_id
    listing_dict['is_active'] = True  # Ensure is_active is set
    
    result = await db.listings.insert_one(listing_dict)
    
    # Get the created listing
    listing = await db.listings.find_one({"_id": result.inserted_id})
    return serialize_object_id(listing)

@api_router.get("/users/{user_id}/listings", response_model=List[Listing])
async def get_user_listings(user_id: str):
    cursor = db.listings.find({"user_id": user_id, "is_active": True}).sort("created_at", -1)
    listings = await cursor.to_list(length=100)
    
    return [serialize_object_id(listing) for listing in listings]

# Search
@api_router.get("/search", response_model=List[Listing])
async def search_listings(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    query = {"is_active": True}
    
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"breed": {"$regex": q, "$options": "i"}}
        ]
    
    if category:
        query["category"] = category
    
    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["price"] = price_query
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    cursor = db.listings.find(query).sort("created_at", -1).limit(limit).skip(skip)
    listings = await cursor.to_list(length=limit)
    
    return [serialize_object_id(listing) for listing in listings]

# Messages
@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate, sender_id: str):
    # In a real app, you'd extract sender_id from JWT token
    message_dict = message_data.dict()
    message_dict['sender_id'] = sender_id
    
    result = await db.messages.insert_one(message_dict)
    
    # Get the created message
    message = await db.messages.find_one({"_id": result.inserted_id})
    return serialize_object_id(message)

@api_router.get("/users/{user_id}/conversations", response_model=List[Conversation])
async def get_user_conversations(user_id: str):
    # Get all messages where user is sender or receiver
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": user_id},
                    {"receiver_id": user_id}
                ]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "listing_id": "$listing_id",
                    "other_user": {
                        "$cond": [
                            {"$eq": ["$sender_id", user_id]},
                            "$receiver_id",
                            "$sender_id"
                        ]
                    }
                },
                "last_message": {"$first": "$content"},
                "last_message_time": {"$first": "$created_at"},
                "messages": {"$push": "$$ROOT"}
            }
        }
    ]
    
    conversations_cursor = db.messages.aggregate(pipeline)
    conversations_data = await conversations_cursor.to_list(length=100)
    
    conversations = []
    for conv_data in conversations_data:
        # Get listing details
        listing = await db.listings.find_one({"_id": ObjectId(conv_data["_id"]["listing_id"])})
        # Get other user details
        other_user = await db.users.find_one({"_id": ObjectId(conv_data["_id"]["other_user"])})
        
        # Count unread messages
        unread_count = len([msg for msg in conv_data["messages"] 
                           if msg["receiver_id"] == user_id and not msg.get("read", False)])
        
        conversations.append(Conversation(
            id=f"{conv_data['_id']['listing_id']}_{conv_data['_id']['other_user']}",
            listing_id=conv_data["_id"]["listing_id"],
            listing_title=listing["title"] if listing else "Unknown Listing",
            other_user_name=other_user["name"] if other_user else "Unknown User",
            last_message=conv_data["last_message"],
            last_message_time=conv_data["last_message_time"],
            unread_count=unread_count
        ))
    
    return conversations

# Admin - Get all users
@api_router.get("/admin/users", response_model=List[dict])
async def get_all_users():
    cursor = db.users.find({}, {"password": 0})  # Exclude password field
    users = await cursor.to_list(length=1000)
    
    # Add user statistics
    users_with_stats = []
    for user in users:
        user = serialize_object_id(user)
        
        # Count user's listings
        listing_count = await db.listings.count_documents({
            "user_id": user["_id"], 
            "is_active": True
        })
        
        # Count user's messages
        message_count = await db.messages.count_documents({
            "$or": [
                {"sender_id": user["_id"]},
                {"receiver_id": user["_id"]}
            ]
        })
        
        user["listing_count"] = listing_count
        user["message_count"] = message_count
        users_with_stats.append(user)
    
    return users_with_stats

# Admin - Get user statistics
@api_router.get("/admin/stats", response_model=dict)
async def get_admin_stats():
    total_users = await db.users.count_documents({})
    active_listings = await db.listings.count_documents({"is_active": True})
    total_messages = await db.messages.count_documents({})
    
    # Users registered in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_users = await db.users.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Listings by category
    poultry_count = await db.listings.count_documents({"category": "poultry", "is_active": True})
    coop_count = await db.listings.count_documents({"category": "coop", "is_active": True})
    cage_count = await db.listings.count_documents({"category": "cage", "is_active": True})
    eggs_count = await db.listings.count_documents({"category": "eggs", "is_active": True})
    
    return {
        "total_users": total_users,
        "active_listings": active_listings,
        "total_messages": total_messages,
        "recent_users": recent_users,
        "listings_by_category": {
            "poultry": poultry_count,
            "coop": coop_count,
            "cage": cage_count,
            "eggs": eggs_count
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()