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

class Rating(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    seller_id: str  # User being rated
    buyer_id: str   # User giving the rating
    listing_id: str # Listing related to the rating
    rating: int = Field(ge=1, le=5)  # 1-5 star rating
    review: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class RatingCreate(BaseModel):
    seller_id: str
    listing_id: str
    rating: int = Field(ge=1, le=5)
    review: Optional[str] = None

class RatingSummary(BaseModel):
    seller_id: str
    average_rating: float
    total_ratings: int
    rating_breakdown: dict  # {5: count, 4: count, etc.}

class AdvancedSearchParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    location: Optional[str] = None
    radius_miles: Optional[int] = None  # Search within X miles of location
    # Eggs specific filters
    egg_type: Optional[str] = None
    feed_type: Optional[str] = None
    max_days_old: Optional[int] = None  # Freshness filter for eggs
    # Poultry specific filters
    breed: Optional[str] = None
    age_range: Optional[str] = None
    # General filters
    min_rating: Optional[float] = None
    sort_by: Optional[str] = "created_at"  # created_at, price, rating, distance
    sort_order: Optional[str] = "desc"  # asc, desc
    limit: int = 20
    skip: int = 0

class Follow(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    follower_id: str  # User who is following
    following_id: str  # User being followed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class FollowCreate(BaseModel):
    following_id: str

class FollowStats(BaseModel):
    user_id: str
    followers_count: int
    following_count: int
    is_following: Optional[bool] = None  # Whether current user is following this user

class Conversation(BaseModel):
    id: str
    listing_id: str
    listing_title: str
    other_user_name: str
    last_message: str
    last_message_time: datetime
    unread_count: int

# === Admin Models ===

class ListingFlag(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    listing_id: str
    flagger_id: str  # User who flagged the listing
    reason: str  # "suspicious", "scam", "inappropriate", "fake", "other"
    description: Optional[str] = None  # Additional details
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed: bool = False  # Whether admin has reviewed this flag
    reviewed_by: Optional[str] = None  # Admin user ID
    reviewed_at: Optional[datetime] = None
    action_taken: Optional[str] = None  # "removed", "cleared", "warned"
    
    class Config:
        populate_by_name = True

class FlagCreate(BaseModel):
    reason: str
    description: Optional[str] = None

class AdminListingAction(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    listing_id: str
    admin_id: str
    action: str  # "deactivate", "reactivate", "delete", "clear_flags"
    reason: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class AdminActionCreate(BaseModel):
    listing_id: str
    action: str
    reason: str
    notes: Optional[str] = None

class AdminNotification(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    type: str  # "flagged_listing", "suspicious_activity", "user_report"
    title: str
    message: str
    related_id: Optional[str] = None  # listing_id, user_id, etc.
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

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

# User Profile with Rating Info
@api_router.get("/users/{user_id}", response_model=dict)
async def get_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = serialize_object_id(user)
        # Remove password from response
        user.pop('password', None)
        
        # Add rating information if user is a seller
        rating_summary_pipeline = [
            {"$match": {"seller_id": user_id}},
            {"$group": {
                "_id": None,
                "average_rating": {"$avg": "$rating"},
                "total_ratings": {"$sum": 1}
            }}
        ]
        
        rating_result = await db.ratings.aggregate(rating_summary_pipeline).to_list(length=1)
        
        if rating_result:
            user["seller_rating"] = {
                "average_rating": round(rating_result[0]["average_rating"], 1),
                "total_ratings": rating_result[0]["total_ratings"]
            }
        else:
            user["seller_rating"] = {
                "average_rating": 0.0,
                "total_ratings": 0
            }
        
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
            last_message_time=conv_data["last_message_time"] or datetime.utcnow(),
            unread_count=unread_count
        ))
    
    return conversations

# Rating System Endpoints
@api_router.post("/ratings", response_model=Rating)
async def create_rating(rating_data: RatingCreate, buyer_id: str):
    """Create a new rating for a seller"""
    # Check if buyer has already rated this seller for this listing
    existing_rating = await db.ratings.find_one({
        "seller_id": rating_data.seller_id,
        "buyer_id": buyer_id,
        "listing_id": rating_data.listing_id
    })
    
    if existing_rating:
        raise HTTPException(status_code=400, detail="You have already rated this seller for this listing")
    
    # Verify the listing exists and get seller info
    listing = await db.listings.find_one({"_id": ObjectId(rating_data.listing_id)})
    if not listing or listing["user_id"] != rating_data.seller_id:
        raise HTTPException(status_code=404, detail="Listing not found or seller mismatch")
    
    # Create the rating
    rating_dict = rating_data.dict()
    rating_dict['buyer_id'] = buyer_id
    
    result = await db.ratings.insert_one(rating_dict)
    rating = await db.ratings.find_one({"_id": result.inserted_id})
    return serialize_object_id(rating)

@api_router.get("/sellers/{seller_id}/ratings", response_model=List[Rating])
async def get_seller_ratings(seller_id: str, limit: int = 20, skip: int = 0):
    """Get all ratings for a specific seller"""
    cursor = db.ratings.find({"seller_id": seller_id}).sort("created_at", -1).limit(limit).skip(skip)
    ratings = await cursor.to_list(length=limit)
    return [serialize_object_id(rating) for rating in ratings]

@api_router.get("/sellers/{seller_id}/rating-summary", response_model=RatingSummary)
async def get_seller_rating_summary(seller_id: str):
    """Get rating summary statistics for a seller"""
    # Aggregate ratings for the seller
    pipeline = [
        {"$match": {"seller_id": seller_id}},
        {"$group": {
            "_id": "$seller_id",
            "average_rating": {"$avg": "$rating"},
            "total_ratings": {"$sum": 1},
            "ratings": {"$push": "$rating"}
        }}
    ]
    
    result = await db.ratings.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return RatingSummary(
            seller_id=seller_id,
            average_rating=0.0,
            total_ratings=0,
            rating_breakdown={5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        )
    
    data = result[0]
    
    # Calculate rating breakdown
    rating_breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for rating in data["ratings"]:
        rating_breakdown[rating] += 1
    
    return RatingSummary(
        seller_id=seller_id,
        average_rating=round(data["average_rating"], 1),
        total_ratings=data["total_ratings"],
        rating_breakdown=rating_breakdown
    )

# Advanced Search Endpoint
@api_router.post("/advanced-search", response_model=List[Listing])
async def advanced_search(search_params: AdvancedSearchParams):
    """Advanced search with multiple filters and sorting options"""
    query = {"is_active": True}
    
    # Text search
    if search_params.query:
        query["$or"] = [
            {"title": {"$regex": search_params.query, "$options": "i"}},
            {"description": {"$regex": search_params.query, "$options": "i"}},
            {"breed": {"$regex": search_params.query, "$options": "i"}},
            {"egg_type": {"$regex": search_params.query, "$options": "i"}},
            {"location": {"$regex": search_params.query, "$options": "i"}}
        ]
    
    # Category filter
    if search_params.category:
        query["category"] = search_params.category
    
    # Price range filter
    if search_params.min_price is not None or search_params.max_price is not None:
        price_query = {}
        if search_params.min_price is not None:
            price_query["$gte"] = search_params.min_price
        if search_params.max_price is not None:
            price_query["$lte"] = search_params.max_price
        query["price"] = price_query
    
    # Location filter
    if search_params.location:
        query["location"] = {"$regex": search_params.location, "$options": "i"}
    
    # Category-specific filters
    if search_params.egg_type:
        query["egg_type"] = {"$regex": search_params.egg_type, "$options": "i"}
    
    if search_params.feed_type:
        query["feed_type"] = {"$regex": search_params.feed_type, "$options": "i"}
    
    if search_params.breed:
        query["breed"] = {"$regex": search_params.breed, "$options": "i"}
    
    # Freshness filter for eggs (max days old)
    if search_params.max_days_old and search_params.category == "eggs":
        cutoff_date = datetime.utcnow() - timedelta(days=search_params.max_days_old)
        query["laid_date"] = {"$gte": cutoff_date.isoformat()[:10]}
    
    # Sorting
    sort_field = search_params.sort_by
    sort_direction = -1 if search_params.sort_order == "desc" else 1
    
    # Handle special sorting cases
    if sort_field == "rating":
        # For rating sort, we'll need to do aggregation to join with ratings
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "ratings",
                    "localField": "user_id",
                    "foreignField": "seller_id",
                    "as": "seller_ratings"
                }
            },
            {
                "$addFields": {
                    "average_rating": {
                        "$cond": {
                            "if": {"$gt": [{"$size": "$seller_ratings"}, 0]},
                            "then": {"$avg": "$seller_ratings.rating"},
                            "else": 0
                        }
                    }
                }
            },
            {"$sort": {"average_rating": sort_direction}},
            {"$limit": search_params.limit},
            {"$skip": search_params.skip}
        ]
        
        cursor = db.listings.aggregate(pipeline)
        listings = await cursor.to_list(length=search_params.limit)
    else:
        # Regular sorting
        cursor = db.listings.find(query).sort(sort_field, sort_direction).limit(search_params.limit).skip(search_params.skip)
        listings = await cursor.to_list(length=search_params.limit)
    
    return [serialize_object_id(listing) for listing in listings]

# Follow System Endpoints
@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user_id: str):
    """Follow a user"""
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    
    # Check if user exists
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing_follow = await db.follows.find_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow relationship
    follow_data = {
        "follower_id": current_user_id,
        "following_id": user_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.follows.insert_one(follow_data)
    follow = await db.follows.find_one({"_id": result.inserted_id})
    return serialize_object_id(follow)

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, current_user_id: str):
    """Unfollow a user"""
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot unfollow yourself")
    
    # Remove follow relationship
    result = await db.follows.delete_one({
        "follower_id": current_user_id,
        "following_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="You are not following this user")
    
    return {"message": "Successfully unfollowed user"}

@api_router.get("/users/{user_id}/followers")
async def get_user_followers(user_id: str, limit: int = 20, skip: int = 0):
    """Get users following this user"""
    # Get follow relationships first
    follows = await db.follows.find({"following_id": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    followers = []
    for follow in follows:
        # Get follower user details
        try:
            follower_user = await db.users.find_one({"_id": ObjectId(follow["follower_id"])})
            if follower_user:
                followers.append({
                    "_id": str(follow["_id"]),
                    "created_at": follow["created_at"],
                    "follower": {
                        "_id": str(follower_user["_id"]),
                        "name": follower_user["name"],
                        "location": follower_user["location"],
                        "email": follower_user["email"]
                    }
                })
        except Exception:
            continue  # Skip invalid follower IDs
    
    return followers

@api_router.get("/users/{user_id}/following")
async def get_user_following(user_id: str, limit: int = 20, skip: int = 0):
    """Get users this user is following"""
    # Get follow relationships first
    follows = await db.follows.find({"follower_id": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    following = []
    for follow in follows:
        # Get following user details
        try:
            following_user = await db.users.find_one({"_id": ObjectId(follow["following_id"])})
            if following_user:
                following.append({
                    "_id": str(follow["_id"]),
                    "created_at": follow["created_at"],
                    "following": {
                        "_id": str(following_user["_id"]),
                        "name": following_user["name"],
                        "location": following_user["location"],
                        "email": following_user["email"]
                    }
                })
        except Exception:
            continue  # Skip invalid following IDs
    
    return following

@api_router.get("/users/{user_id}/follow-stats")
async def get_user_follow_stats(user_id: str, current_user_id: Optional[str] = None):
    """Get user's follow statistics"""
    # Count followers and following
    followers_count = await db.follows.count_documents({"following_id": user_id})
    following_count = await db.follows.count_documents({"follower_id": user_id})
    
    is_following = None
    if current_user_id:
        follow_relationship = await db.follows.find_one({
            "follower_id": current_user_id,
            "following_id": user_id
        })
        is_following = follow_relationship is not None
    
    return FollowStats(
        user_id=user_id,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following
    )

@api_router.get("/feed/following")
async def get_following_feed(current_user_id: str, limit: int = 20, skip: int = 0):
    """Get recent listings from users you follow"""
    # Get users that current user follows
    follows = await db.follows.find({"follower_id": current_user_id}).to_list(length=1000)
    following_user_ids = [follow["following_id"] for follow in follows]
    
    if not following_user_ids:
        return []  # User doesn't follow anyone
    
    # Get listings from followed users
    listings = await db.listings.find({
        "user_id": {"$in": following_user_ids},
        "is_active": True
    }).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Enrich listings with seller information
    feed_items = []
    for listing in listings:
        try:
            seller = await db.users.find_one({"_id": ObjectId(listing["user_id"])})
            if seller:
                listing_dict = serialize_object_id(listing)
                listing_dict["seller_name"] = seller["name"]
                listing_dict["seller_location"] = seller["location"]
                # Ensure created_at is included
                if "created_at" not in listing_dict:
                    listing_dict["created_at"] = listing.get("created_at")
                feed_items.append(listing_dict)
        except Exception:
            continue  # Skip listings with invalid user IDs
    
    return feed_items

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
    
    # Admin notification counts
    unread_notifications = await db.admin_notifications.count_documents({"read": False})
    high_priority_notifications = await db.admin_notifications.count_documents({
        "read": False, 
        "priority": {"$in": ["high", "urgent"]}
    })
    
    # Flagged listings count
    unreviewed_flags = await db.listing_flags.count_documents({"reviewed": False})
    
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
        },
        "admin_alerts": {
            "unread_notifications": unread_notifications,
            "high_priority_notifications": high_priority_notifications,
            "unreviewed_flags": unreviewed_flags
        }
    }

# === Admin Listing Management Endpoints ===

# Flag a listing (for users)
@api_router.post("/listings/{listing_id}/flag")
async def flag_listing(listing_id: str, flag_data: FlagCreate, current_user_id: str):
    """Allow users to flag suspicious/inappropriate listings"""
    # Check if listing exists
    listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if user already flagged this listing
    existing_flag = await db.listing_flags.find_one({
        "listing_id": listing_id,
        "flagger_id": current_user_id
    })
    if existing_flag:
        raise HTTPException(status_code=400, detail="You have already flagged this listing")
    
    # Create flag
    flag_dict = flag_data.dict()
    flag_dict.update({
        "listing_id": listing_id,
        "flagger_id": current_user_id
    })
    
    result = await db.listing_flags.insert_one(flag_dict)
    
    # Create admin notification
    notification_data = {
        "type": "flagged_listing",
        "title": f"Listing Flagged: {listing['title'][:50]}...",
        "message": f"Listing flagged for: {flag_data.reason}",
        "related_id": listing_id,
        "priority": "high" if flag_data.reason in ["scam", "suspicious"] else "normal"
    }
    await db.admin_notifications.insert_one(notification_data)
    
    return {"message": "Listing flagged successfully"}

# Get all admin notifications
@api_router.get("/admin/notifications")
async def get_admin_notifications(unread_only: bool = False, limit: int = 50):
    """Get admin notifications with priority items first"""
    filter_query = {}
    if unread_only:
        filter_query["read"] = False
    
    notifications = await db.admin_notifications.find(filter_query).sort([
        ("priority", -1), ("created_at", -1)
    ]).limit(limit).to_list(length=limit)
    
    return [serialize_object_id(notification) for notification in notifications]

# Mark notification as read
@api_router.patch("/admin/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark admin notification as read"""
    result = await db.admin_notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# Get all listings for admin with flag information
@api_router.get("/admin/listings")
async def get_admin_listings(
    status: str = "all",  # "all", "active", "flagged", "inactive"
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all listings with admin information and flag status"""
    
    # Build query
    query = {}
    if status == "active":
        query["is_active"] = True
    elif status == "inactive":
        query["is_active"] = False
    elif status == "flagged":
        # Get listing IDs that have been flagged
        flagged_listings = await db.listing_flags.find({"reviewed": False}).to_list(length=1000)
        flagged_listing_ids = [flag["listing_id"] for flag in flagged_listings]
        query["_id"] = {"$in": [ObjectId(lid) for lid in flagged_listing_ids]}
    
    if category:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}}
        ]
    
    # Get listings
    listings = await db.listings.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Enrich with seller info and flag information
    enriched_listings = []
    for listing in listings:
        try:
            listing_dict = serialize_object_id(listing)
            
            # Get seller information
            seller = await db.users.find_one({"_id": ObjectId(listing["user_id"])})
            if seller:
                listing_dict["seller_name"] = seller["name"]
                listing_dict["seller_email"] = seller["email"]
            
            # Get flag information
            flags = await db.listing_flags.find({"listing_id": listing_dict["_id"]}).to_list(length=100)
            listing_dict["flags"] = [serialize_object_id(flag) for flag in flags]
            listing_dict["flag_count"] = len(flags)
            listing_dict["unreviewed_flags"] = len([f for f in flags if not f.get("reviewed", False)])
            
            # Get admin actions history
            actions = await db.admin_actions.find({"listing_id": listing_dict["_id"]}).sort("created_at", -1).to_list(length=10)
            listing_dict["admin_actions"] = [serialize_object_id(action) for action in actions]
            
            enriched_listings.append(listing_dict)
        except Exception:
            continue
    
    return enriched_listings

# Admin action on listing
@api_router.post("/admin/listings/{listing_id}/action")
async def admin_listing_action(listing_id: str, action_data: AdminActionCreate, admin_id: str = "admin"):
    """Perform admin action on a listing"""
    
    # Check if listing exists
    listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Perform the action
    if action_data.action == "deactivate":
        await db.listings.update_one(
            {"_id": ObjectId(listing_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
    elif action_data.action == "reactivate":
        await db.listings.update_one(
            {"_id": ObjectId(listing_id)},
            {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
        )
    elif action_data.action == "delete":
        await db.listings.delete_one({"_id": ObjectId(listing_id)})
    elif action_data.action == "clear_flags":
        # Mark all flags for this listing as reviewed
        await db.listing_flags.update_many(
            {"listing_id": listing_id},
            {"$set": {"reviewed": True, "reviewed_by": admin_id, "reviewed_at": datetime.utcnow(), "action_taken": "cleared"}}
        )
    
    # Record the admin action
    action_record = action_data.dict()
    action_record.update({
        "listing_id": listing_id,
        "admin_id": admin_id
    })
    await db.admin_actions.insert_one(action_record)
    
    # Create success notification
    notification_data = {
        "type": "admin_action",
        "title": f"Action Completed: {action_data.action.title()}",
        "message": f"Listing '{listing['title'][:30]}...' has been {action_data.action}d",
        "related_id": listing_id,
        "priority": "normal"
    }
    await db.admin_notifications.insert_one(notification_data)
    
    return {"message": f"Listing {action_data.action}d successfully"}

# Get flagged listings summary
@api_router.get("/admin/flags/summary")
async def get_flags_summary():
    """Get summary of flagged listings for admin dashboard"""
    
    # Count unreviewed flags by reason
    pipeline = [
        {"$match": {"reviewed": False}},
        {"$group": {
            "_id": "$reason",
            "count": {"$sum": 1}
        }}
    ]
    flag_counts = await db.listing_flags.aggregate(pipeline).to_list(length=100)
    
    # Total unreviewed flags
    total_unreviewed = sum(item["count"] for item in flag_counts)
    
    # Recent flagged listings (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_flags = await db.listing_flags.count_documents({
        "created_at": {"$gte": week_ago}
    })
    
    return {
        "total_unreviewed_flags": total_unreviewed,
        "flags_by_reason": {item["_id"]: item["count"] for item in flag_counts},
        "recent_flags_this_week": recent_flags
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