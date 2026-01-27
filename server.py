from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
import csv
from pydantic import BaseModel
from typing import List, Optional, Dict
import json
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from fastapi.staticfiles import StaticFiles

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Pydantic Models
class Product(BaseModel):
    id: str
    name: str
    price: float
    image_url: str
    best_price: bool = False
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

# In-memory storage
products_data = []
cart_data = {}
wishlist_data = {}
users_data = {}
contact_forms_data = []

# Load products from CSV
def load_products():
    global products_data
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
                    
                    product = Product(
                        id=row.get('id', ''),
                        name=row.get('name', ''),
                        price=float(row['price'].replace(',', '')) if row.get('price') else 0.0,
                        image_url=row.get('image_url', ''),
                        best_price=row.get('best_price', 'false').lower() == 'true',
                        images=[row['image_url']] if row.get('image_url') else [],
                        description=row.get('description', ''),
                        category=row.get('category', ''),
                        colors=colors,
                        storage=storage,
                        specs=specs
                    )
                    products.append(product.dict())
                products_data = products
                logger.info(f"Loaded {len(products_data)} products from CSV")
        except Exception as e:
            logger.error(f"Error loading products from CSV: {str(e)}")
    else:
        logger.info("No products.csv found, skipping product import")

# Initialize data
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_products()
    logger.info("Data initialized")
    yield
    logger.info("Application shutdown")

# Create FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)

# Create api_router
api_router = APIRouter(prefix="/api")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Atlantis Technologies API (MongoDB removed)"}

@api_router.post("/init-db")
async def initialize_database():
    load_products()
    return {"message": "Data initialized from products.csv"}

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    if category:
        return {"products": [p for p in products_data if p.get("category") == category]}
    return {"products": products_data}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = next((p for p in products_data if p.get("id") == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories")
async def get_categories():
    return list(set(p.get("category") for p in products_data if p.get("category")))

@api_router.get("/search")
async def search_products(q: str):
    return {
        "products": [
            p for p in products_data
            if q.lower() in p.get("name", "").lower() or q.lower() in p.get("category", "").lower() or q.lower() in p.get("description", "").lower()
        ]
    }

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem):
    key = (item.user_id, item.item_id, item.color, item.storage)
    if key in cart_data:
        cart_data[key]["quantity"] += 1
    else:
        cart_data[key] = item.dict()
    cart_items = [cart_data[k] for k in cart_data if k[0] == item.user_id]
    cart_count = sum(item["quantity"] for item in cart_items)
    total = sum(item["price"] * item["quantity"] for item in cart_items)
    return {"success": True, "cart_count": cart_count, "total": total}

@api_router.put("/cart/update")
async def update_cart(item: CartItem):
    key = (item.user_id, item.item_id, item.color, item.storage)
    if item.quantity <= 0:
        cart_data.pop(key, None)
    else:
        cart_data[key] = item.dict() | {"quantity": item.quantity}
    cart_items = [cart_data[k] for k in cart_data if k[0] == item.user_id]
    cart_count = sum(item["quantity"] for item in cart_items)
    total = sum(item["price"] * item["quantity"] for item in cart_items)
    return {"success": True, "cart_count": cart_count, "total": total}

@api_router.get("/cart/{user_id}")
async def get_cart(user_id: str = "anonymous"):
    cart_items = [cart_data[k] for k in cart_data if k[0] == user_id]
    for item in cart_items:
        product = next((p for p in products_data if p["id"] == item["item_id"]), {})
        item.update({
            "item_name": product.get("name", ""),
            "image_url": product.get("image_url", "")
        })
    total = sum(item["price"] * item["quantity"] for item in cart_items)
    return {"items": cart_items, "total": total}

@api_router.post("/wishlist/add")
async def add_to_wishlist(item: WishlistItem):
    key = (item.user_id, item.item_id)
    if key not in wishlist_data:
        wishlist_data[key] = item.dict()
    wishlist_count = len([k for k in wishlist_data if k[0] == item.user_id])
    return {"success": True, "wishlist_count": wishlist_count}

@api_router.delete("/wishlist/remove")
async def remove_from_wishlist(item: WishlistItem):
    key = (item.user_id, item.item_id)
    wishlist_data.pop(key, None)
    wishlist_count = len([k for k in wishlist_data if k[0] == item.user_id])
    return {"success": True, "wishlist_count": wishlist_count}

@api_router.get("/wishlist/{user_id}")
async def get_wishlist(user_id: str = "anonymous"):
    wishlist_items = [wishlist_data[k] for k in wishlist_data if k[0] == user_id]
    for item in wishlist_items:
        product = next((p for p in products_data if p["id"] == item["item_id"]), {})
        item.update({
            "item_name": product.get("name", ""),
            "price": product.get("price", 0.0),
            "image_url": product.get("image_url", "")
        })
    return wishlist_items

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = next((u for u in users_data.values() if u["username"] == user.username), None)
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
    if any(u["username"] == user.username for u in users_data.values()):
        return {"success": False, "message": "Username already exists"}
    password_hash = pwd_context.hash(user.password)
    new_user = {"username": user.username, "email": user.email, "password_hash": password_hash}
    users_data[user.username] = new_user
    return {"success": True, "message": "Signup successful"}

@api_router.post("/contact")
async def contact(form: ContactForm):
    contact_forms_data.append(form.dict())
    return {"success": True, "message": "Thank you for your message!"}

# Include api_router
app.include_router(api_router)

# Mount the React build folder at root for proper SPA serving (fixes blank pages on refresh/render)
app.mount("/", StaticFiles(directory="build", html=True), name="site")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)