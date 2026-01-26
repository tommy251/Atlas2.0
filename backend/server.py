from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles  # Added for static file serving
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
import csv
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv('DB_NAME', 'atlas2')]

# Pydantic Models
class Product(BaseModel):
    id: str
    name: str
    price: float
    image_url: str
    best_price: bool = False  # Added for price competitiveness
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

# Initialize database
async def init_db():
    # Clear existing products
    await db.products.delete_many({})
    logger.info("Existing products cleared")

    # Load products from CSV if available
    csv_path = ROOT_DIR / 'products.csv'
    if csv_path.exists():
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                products = []
                for row in reader:
                    colors = row.get('colors', '').split(';') if row.get('colors') else []
                    storage = row.get('storage', '').split(';') if row.get('storage') else []
                    specs = {}
                    if row.get('specs') and row['specs'].strip():
                        try:
                            specs = json.loads(row['specs'])
                        except json.JSONDecodeError as e:
                            logger.error(f"Invalid JSON in specs: {str(e)}")
                            specs = {}
                    
                    product = {
                        "id": row.get('id', str(ObjectId())),
                        "name": row.get('name', ''),
                        "price": float(row['price'].replace(',', '')) if row.get('price') else 0.0,
                        "image_url": row.get('image_url', ''),
                        "best_price": row.get('best_price', 'false').lower() == 'true',
                        "images": [row['image_url']] if row.get('image_url') else [],
                        "description": row.get('description', ''),
                        "category": row.get('category', ''),
                        "colors": colors,
                        "storage": storage,
                        "specs": specs
                    }
                    products.append(product)
                if products:
                    await db.products.insert_many(products)
                    logger.info(f"Inserted {len(products)} products from CSV")
        except Exception as e:
            logger.error(f"Error loading products from CSV: {str(e)}")
    else:
        logger.info("No products.csv found, skipping product import")

# Create api_router
api_router = APIRouter(prefix="/api")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Atlantis Technologies API"}

@api_router.post("/init-db")
async def initialize_database():
    await init_db()
    return {"message": "Database initialized successfully"}

@api_router.post("/import-products")
async def import_products():
    csv_path = ROOT_DIR / 'products.csv'
    if not csv_path.exists():
        raise HTTPException(status_code=400, detail="products.csv not found")
    
    try:
        await db.products.delete_many({})
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            products = []
            for row in reader:
                colors = row.get('colors', '').split(';') if row.get('colors') else []
                storage = row.get('storage', '').split(';') if row.get('storage') else []
                specs = {}
                if row.get('specs') and row['specs'].strip():
                    try:
                        specs = json.loads(row['specs'])
                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON in specs: {str(e)}")
                        specs = {}
                
                product = {
                    "id": row.get('id', str(ObjectId())),
                    "name": row.get('name', ''),
                    "price": float(row['price'].replace(',', '')) if row.get('price') else 0.0,
                    "image_url": row.get('image_url', ''),
                    "best_price": row.get('best_price', 'false').lower() == 'true',
                    "images": [row['image_url']] if row.get('image_url') else [],
                    "description": row.get('description', ''),
                    "category": row.get('category', ''),
                    "colors": colors,
                    "storage": storage,
                    "specs": specs
                }
                products.append(product)
            if products:
                await db.products.insert_many(products)
                logger.info(f"Imported {len(products)} products from CSV")
                return {"success": True, "message": f"Imported {len(products)} products"}
            else:
                return {"success": False, "message": "No products found in CSV"}
    except Exception as e:
        logger.error(f"Error importing products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importing products: {str(e)}")

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    query = {"category": category} if category else {}
    products = await db.products.find(query).to_list(1000)
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
        }, os.getenv("SECRET_KEY", "your-secret-key"), algorithm="HS256")
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

# Mount static files for React frontend (serves build folder at root)
app.mount("/", StaticFiles(directory="build", html=True), name="static")

# Include api_router
app.include_router(api_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)