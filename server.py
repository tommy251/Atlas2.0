from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import sys
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

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Debug info
logger.info(f"Python version: {sys.version}")
logger.info(f"Current directory: {os.getcwd()}")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Frontend build directory
FRONTEND_BUILD_DIR = ROOT_DIR / "frontend" / "build"

if FRONTEND_BUILD_DIR.exists():
    logger.info(f"✅ Found build directory at: {FRONTEND_BUILD_DIR}")
    logger.info(f"Contents of {FRONTEND_BUILD_DIR}:")
    for item in FRONTEND_BUILD_DIR.iterdir():
        logger.info(f"  - {item.name}")
else:
    logger.warning(f"⚠️ Build directory NOT found at: {FRONTEND_BUILD_DIR}")

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
orders_data = []  # <-- Added this line to fix undefined variable

# Robust CSV loader with per-row error handling + fallback products
def load_products():
    global products_data
    products_data = []
    csv_path = ROOT_DIR / 'products.csv'
    
    if not csv_path.exists():
        logger.warning(f"⚠️ products.csv not found at {csv_path} — using fallback products")
    else:
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                loaded = 0
                for row_num, row in enumerate(reader, start=2):
                    try:
                        price_str = row.get('price', '0').replace(',', '').strip()
                        price = float(price_str) if price_str else 0.0
                        
                        specs = {}
                        specs_raw = row.get('specs', '').strip()
                        if specs_raw:
                            try:
                                specs = json.loads(specs_raw)
                            except:
                                logger.warning(f"Row {row_num}: Invalid specs JSON — skipping specs")
                        
                        colors = [c.strip() for c in row.get('colors', '').split(';') if c.strip()]
                        storage = [s.strip() for s in row.get('storage', '').split(';') if s.strip()]
                        
                        product = {
                            "id": row.get('id', f"csv-{loaded}"),
                            "name": row.get('name', 'Unnamed Product'),
                            "price": price,
                            "image_url": row.get('image_url', ''),
                            "best_price": row.get('best_price', 'false').lower() == 'true',
                            "images": [row.get('image_url', '')] if row.get('image_url') else [],
                            "description": row.get('description', 'No description'),
                            "category": row.get('category', 'General'),
                            "colors": colors,
                            "storage": storage,
                            "specs": specs
                        }
                        products_data.append(product)
                        loaded += 1
                    except Exception as e:
                        logger.error(f"Row {row_num} invalid — skipping: {e} | Row: {row}")
            
            logger.info(f"✅ Loaded {len(products_data)} valid products from CSV")
        except Exception as e:
            logger.error(f"❌ Failed to read CSV: {e}")
    
    # Fallback test products if nothing loaded
    if len(products_data) == 0:
        logger.info("No products loaded — adding fallback test products")
        products_data = [
            {
                "id": "fallback-1",
                "name": "Test iPhone",
                "price": 1000000.0,
                "image_url": "",
                "best_price": True,
                "images": [],
                "description": "Fallback test product to confirm shop works",
                "category": "Phones",
                "colors": ["Black"],
                "storage": ["256GB"],
                "specs": {"RAM": "8GB"}
            }
        ]
    
    logger.info(f"Final products ready: {len(products_data)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_products()
    logger.info("✅ Data initialized")
    yield
    logger.info("🛑 Application shutdown")

app = FastAPI(
    lifespan=lifespan,
    title="Atlas2.0 E-commerce API",
    version="1.0.0"
)

api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def api_root():
    return {
        "message": "Atlas2.0 E-commerce API",
        "endpoints": [
            "/api/health",
            "/api/products",
            "/api/categories",
            "/api/search"
        ]
    }

@api_router.post("/init-db")
async def initialize_database():
    load_products()
    return {"message": "Data initialized from products.csv"}

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    if category:
        filtered = [p for p in products_data if p.get("category") == category]
        return filtered
    return products_data

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = next((p for p in products_data if p.get("id") == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.get("/categories")
async def get_categories():
    categories = list(set(p.get("category") for p in products_data if p.get("category")))
    return {"categories": sorted(categories)}

@api_router.get("/search")
async def search_products(q: str):
    if not q:
        return {"products": [], "count": 0}
    
    results = [
        p for p in products_data
        if q.lower() in p.get("name", "").lower() 
        or q.lower() in p.get("category", "").lower() 
        or q.lower() in p.get("description", "").lower()
    ]
    return {"products": results, "count": len(results)}

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
    return {"items": cart_items, "total": total, "count": len(cart_items)}

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
    return {"items": wishlist_items, "count": len(wishlist_items)}

@api_router.post("/auth/login")
async def login(user: UserLogin):
    db_user = next((u for u in users_data.values() if u["username"] == user.username), None)
    if db_user and pwd_context.verify(user.password, db_user["password_hash"]):
        token = jwt.encode({
            "sub": user.username,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, os.getenv("SECRET_KEY", "your-secret-key-12345"), algorithm="HS256")
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

@api_router.post("/checkout")
async def checkout(order: Dict):
    # Validate/order logic here (simulate payment)
    order_id = f"ORD-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Optional account creation
    if order.get("create_account"):
        signup_data = order["create_account"]
        # Reuse signup logic
        if any(u["username"] == signup_data.get("email") for u in users_data.values()):  # Use email as username?
            return {"success": False, "message": "Account exists"}
        password_hash = pwd_context.hash(signup_data["password"])
        users_data[signup_data["email"]] = {"username": signup_data["email"], "email": signup_data["email"], "password_hash": password_hash}
        # Login auto (generate token)
        token = jwt.encode({"sub": signup_data["email"], "exp": datetime.utcnow() + timedelta(days=30)}, os.getenv("SECRET_KEY", "secret"), algorithm="HS256")
    
    # Save order (in-memory for now)
    orders_data.append({"id": order_id, "customer": order["customer"], "items": order["items"], "total": order["total"]})
    
    # Simulate receipt (log + future email/SMS)
    logger.info(f"New order {order_id} from {order['customer']['email']} - Total ₦{order['total']}")
    
    return {"success": True, "order_id": order_id, "token": token if order.get("create_account") else None}

@api_router.post("/contact")
async def contact(form: ContactForm):
    contact_forms_data.append(form.dict())
    return {"success": True, "message": "Thank you for your message!"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "products_count": len(products_data),
        "build_exists": FRONTEND_BUILD_DIR.exists()
    }

app.include_router(api_router)

# === CLEAN SPA SERVING ===
if FRONTEND_BUILD_DIR.exists():
    # Single mount handles: static files, index.html at /, and fallback for React Router
    app.mount("/", StaticFiles(directory=str(FRONTEND_BUILD_DIR), html=True), name="frontend")
    logger.info("✅ Mounted frontend at / with HTML fallback for SPA routing")
else:
    logger.warning("⚠️ No build directory — API only mode")
    @app.get("/")
    async def api_only_root():
        return {"message": "API running — frontend build missing"}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"🚀 Starting server on http://0.0.0.0:{port}")
    logger.info(f"📁 Frontend build dir: {FRONTEND_BUILD_DIR} (exists: {FRONTEND_BUILD_DIR.exists()})")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")