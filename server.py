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
                            except json.JSONDecodeError:
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

# === All your API routes here (unchanged) ===
@api_router.get("/")
async def api_root():
    return {"message": "Atlas2.0 E-commerce API"}

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    if category:
        return [p for p in products_data if p.get("category") == category]
    return products_data

# ... (include all your other routes: /products/{id}, /categories, /search, cart, wishlist, auth, contact, etc.)

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "products_count": len(products_data),
        "build_exists": FRONTEND_BUILD_DIR.exists()
    }

app.include_router(api_router)

# === CLEAN SPA SERVING (this fixes the /api routes being overridden) ===
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
    logger.info(f"🚀 Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")