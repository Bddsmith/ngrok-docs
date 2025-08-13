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
    # Get followers with user details
    pipeline = [
        {"$match": {"following_id": user_id}},
        {"$addFields": {
            "follower_object_id": {"$toObjectId": "$follower_id"}
        }},
        {"$lookup": {
            "from": "users",
            "localField": "follower_object_id",
            "foreignField": "_id",
            "as": "follower_info"
        }},
        {"$unwind": "$follower_info"},
        {"$project": {
            "_id": 1,
            "created_at": 1,
            "follower": {
                "_id": "$follower_info._id",
                "name": "$follower_info.name",
                "location": "$follower_info.location",
                "email": "$follower_info.email"
            }
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    followers = await db.follows.aggregate(pipeline).to_list(length=limit)
    return [serialize_object_id(follower) for follower in followers]

@api_router.get("/users/{user_id}/following")
async def get_user_following(user_id: str, limit: int = 20, skip: int = 0):
    """Get users this user is following"""
    # Get following with user details
    pipeline = [
        {"$match": {"follower_id": user_id}},
        {"$addFields": {
            "following_object_id": {"$toObjectId": "$following_id"}
        }},
        {"$lookup": {
            "from": "users",
            "localField": "following_object_id",
            "foreignField": "_id",
            "as": "following_info"
        }},
        {"$unwind": "$following_info"},
        {"$project": {
            "_id": 1,
            "created_at": 1,
            "following": {
                "_id": "$following_info._id",
                "name": "$following_info.name",
                "location": "$following_info.location",
                "email": "$following_info.email"
            }
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    following = await db.follows.aggregate(pipeline).to_list(length=limit)
    return [serialize_object_id(follow) for follow in following]

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
    # Get listings from followed users
    pipeline = [
        {"$match": {"follower_id": current_user_id}},
        {"$lookup": {
            "from": "listings",
            "localField": "following_id",
            "foreignField": "user_id",
            "as": "listings"
        }},
        {"$unwind": "$listings"},
        {"$match": {"listings.is_active": True}},
        {"$addFields": {
            "following_object_id": {"$toObjectId": "$following_id"}
        }},
        {"$lookup": {
            "from": "users",
            "localField": "following_object_id",
            "foreignField": "_id",
            "as": "seller_info"
        }},
        {"$unwind": "$seller_info"},
        {"$project": {
            "_id": "$listings._id",
            "title": "$listings.title",
            "description": "$listings.description",
            "category": "$listings.category",
            "price": "$listings.price",
            "images": "$listings.images",
            "location": "$listings.location",
            "created_at": "$listings.created_at",
            "user_id": "$listings.user_id",
            # Include all listing fields
            "breed": "$listings.breed",
            "age": "$listings.age",
            "health_status": "$listings.health_status",
            "size": "$listings.size",
            "material": "$listings.material",
            "condition": "$listings.condition",
            "egg_type": "$listings.egg_type",
            "laid_date": "$listings.laid_date",
            "feed_type": "$listings.feed_type",
            "quantity_available": "$listings.quantity_available",
            "farm_practices": "$listings.farm_practices",
            # Add seller info for context
            "seller_name": "$seller_info.name",
            "seller_location": "$seller_info.location"
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    feed_items = await db.follows.aggregate(pipeline).to_list(length=limit)
    return [serialize_object_id(item) for item in feed_items]

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