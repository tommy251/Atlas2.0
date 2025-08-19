from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from bson import ObjectId
import json

# Password hashing
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
from datetime import datetime, timedelta
import jwt

# Custom JSON encoder for MongoDB ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Pydantic Models
class Product(BaseModel):
    id: str
    name: str
    price: float
    image_url: str
    images: List[str] = []
    description: str
    category: str
    colors: List[str] = []
    storage: List[str] = []
    specs: Dict[str, str] = {}

class CartItem(BaseModel):
    user_id: str = "anonymous"
    item_id: str
    price: float
    quantity: int = 1
    color: str = ""
    storage: str = ""

class WishlistItem(BaseModel):
    user_id: str = "anonymous"
    item_id: str

class User(BaseModel):
    username: str
    email: str
    password_hash: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class ContactForm(BaseModel):
    name: str
    email: str
    message: str

# Initialize database (no hardcoded data, relies on import_products.py)
async def init_db():
    # Optionally clear existing products if needed
    await db.products.delete_many({})
    logger.info("Database initialized or cleared")

# Create api_router before routes
api_router = APIRouter(prefix="/api")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Atlantis Technologies API"}

@api_router.post("/init-db")
async def initialize_database():
    await init_db()
    return {"message": "Database initialized successfully"}

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    if category:
        products = await db.products.find({"category": category}).to_list(1000)
    else:
        products = await db.products.find().to_list(1000)
    for product in products:
        if "_id" in product:
            product["_id"] = str(product["_id"])
    return {"products": products}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if "_id" in product:
        product["_id"] = str(product["_id"])
    return product

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return categories

@api_router.get("/search")
async def search_products(q: str):
    products = await db.products.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    }).to_list(1000)
    for product in products:
        if "_id" in product:
            product["_id"] = str(product["_id"])
    return products

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem):
    existing = await db.cart.find_one({
        "user_id": item.user_id,
        "item_id": item.item_id,
        "color": item.color,
        "storage": item.storage
    })
    if existing:
        await db.cart.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"quantity": 1}}
        )
    else:
        await db.cart.insert_one(item.dict())
    cart_items = await db.cart.find({"user_id": item.user_id}).to_list(1000)
    cart_count = sum(item["quantity"] for item in cart_items)
    total = sum(item["price"] * item["quantity"] for item in cart_items)
    return {"success": True, "cart_count": cart_count, "total": total}

@api_router.put("/cart/update")
async def update_cart(item: CartItem):
    if item.quantity <= 0:
        await db.cart.delete_one({
            "user_id": item.user_id,
            "item_id": item.item_id,
            "color": item.color,
            "storage": item.storage
        })
    else:
        await db.cart.update_one(
            {
                "user_id": item.user_id,
                "item_id": item.item_id,
                "color": item.color,
                "storage": item.storage
            },
            {"$set": {"quantity": item.quantity}}
        )
    cart_items = await db.cart.find({"user_id": item.user_id}).to_list(1000)
    cart_count = sum(item["quantity"] for item in cart_items)
    total = sum(item["price"] * item["quantity"] for item in cart_items)
    return {"success": True, "cart_count": cart_count, "total": total}

@api_router.get("/cart/{user_id}")
async def get_cart(user_id: str = "anonymous"):
    cart_items = await db.cart.aggregate([
        {"$match": {"user_id": user_id}},
        {"$lookup": {
            "from": "products",
            "localField": "item_id",
            "foreignField": "id",
            "as": "product"
        }},
        {"$unwind": "$product"},
        {"$project": {
            "_id": {"$toString": "$_id"},
            "item_id": 1,
            "item_name": "$product.name",
            "price": 1,
            "quantity": 1,
            "color": 1,
            "storage": 1,
            "image_url": "$product.image_url"
        }}
    ]).to_list(1000)
    total = sum(item["price"] * item["quantity"] for item in cart_items)
    return {"items": cart_items, "total": total}

@api_router.post("/wishlist/add")
async def add_to_wishlist(item: WishlistItem):
    existing = await db.wishlist.find_one({
        "user_id": item.user_id,
        "item_id": item.item_id
    })
    if not existing:
        await db.wishlist.insert_one(item.dict())
    wishlist_count = await db.wishlist.count_documents({"user_id": item.user_id})
    return {"success": True, "wishlist_count": wishlist_count}

@api_router.delete("/wishlist/remove")
async def remove_from_wishlist(item: WishlistItem):
    await db.wishlist.delete_one({
        "user_id": item.user_id,
        "item_id": item.item_id
    })
    wishlist_count = await db.wishlist.count_documents({"user_id": item.user_id})
    return {"success": True, "wishlist_count": wishlist_count}

@api_router.get("/wishlist/{user_id}")
async def get_wishlist(user_id: str = "anonymous"):
    wishlist_items = await db.wishlist.aggregate([
        {"$match": {"user_id": user_id}},
        {"$lookup": {
            "from": "products",
            "localField": "item_id",
            "foreignField": "id",
            "as": "product"
        }},
        {"$unwind": "$product"},
        {"$project": {
            "_id": {"$toString": "$_id"},
            "item_id": 1,
            "item_name": "$product.name",
            "price": "$product.price",
            "image_url": "$product.image_url"
        }}
    ]).to_list(1000)
    return wishlist_items

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if db_user and pwd_context.verify(user.password, db_user["password_hash"]):
        token = jwt.encode({
            "sub": user.username,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, os.environ.get("SECRET_KEY", "your-secret-key"), algorithm="HS256")
        return {"success": True, "message": "Login successful", "token": token, "user": user.username}
    else:
        return {"success": False, "message": "Invalid credentials"}

@api_router.post("/auth/signup")
async def signup(user: UserSignup):
    existing = await db.users.find_one({"username": user.username})
    if existing:
        return {"success": False, "message": "Username already exists"}
    password_hash = pwd_context.hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=password_hash
    )
    await db.users.insert_one(new_user.dict())
    return {"success": True, "message": "Signup successful"}

@api_router.post("/contact")
async def contact(form: ContactForm):
    await db.contact_forms.insert_one(form.dict())
    return {"success": True, "message": "Thank you for your message!"}

# Lifespan handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Database initialized")
    yield
    client.close()
    logger.info("MongoDB client closed")

# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)

# Include api_router after routes
app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)