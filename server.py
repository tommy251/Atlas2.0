from fastapi import FastAPI, APIRouter, HTTPException, Request
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

# Hardcode the frontend build directory (matches your Dockerfile structure)
FRONTEND_BUILD_DIR = ROOT_DIR / "frontend" / "build"

if FRONTEND_BUILD_DIR.exists():
    logger.info(f"✅ Found build directory at: {FRONTEND_BUILD_DIR}")
    logger.info(f"Contents of {FRONTEND_BUILD_DIR}:")
    for item in FRONTEND_BUILD_DIR.iterdir():
        logger.info(f"  - {item.name}")
else:
    logger.warning(f"⚠️ Build directory NOT found at: {FRONTEND_BUILD_DIR}")
    logger.info("Root directory contents for debugging:")
    for item in ROOT_DIR.iterdir():
        logger.info(f"  - {item.name}")

# Pydantic Models (unchanged)
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

# In-memory storage (unchanged)
products_data = []
cart_data = {}
wishlist_data = {}
users_data = {}
contact_forms_data = []

# Load products from CSV (unchanged)
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
                logger.info(f"✅ Loaded {len(products_data)} products from CSV")
        except Exception as e:
            logger.error(f"❌ Error loading products from CSV: {str(e)}")
    else:
        logger.info("ℹ️ No products.csv found, skipping product import")

# Lifespan (unchanged)
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_products()
    logger.info("✅ Data initialized")
    yield
    logger.info("🛑 Application shutdown")

# Create FastAPI app
app = FastAPI(
    lifespan=lifespan, 
    title="Atlas2.0 E-commerce API",
    version="1.0.0"
)

# API router
api_router = APIRouter(prefix="/api")

# Your API routes (unchanged)
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

# ... (all your other @api_router routes remain exactly the same)

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Atlas2.0",
        "version": "1.0.0",
        "build_dir": str(FRONTEND_BUILD_DIR) if FRONTEND_BUILD_DIR.exists() else "Not found",
        "build_exists": FRONTEND_BUILD_DIR.exists(),
        "products_count": len(products_data)
    }

# Include API router first (important for route precedence)
app.include_router(api_router)

# Serve frontend if build exists
if FRONTEND_BUILD_DIR.exists():
    # Mount static assets (JS, CSS, images, etc.)
    static_dir = FRONTEND_BUILD_DIR / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
        logger.info(f"✅ Mounted static assets from: {static_dir}")
    else:
        logger.warning(f"⚠️ No 'static' folder found in build — JS/CSS will 404!")

    # Serve index.html at root
    @app.get("/", include_in_schema=False)
    async def serve_index():
        index_path = FRONTEND_BUILD_DIR / "index.html"
        return FileResponse(index_path)

    # Catch-all route for React Router (SPA handling)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Serve actual files that exist in build root (e.g., favicon.ico, manifest.json)
        requested_file = FRONTEND_BUILD_DIR / full_path
        if requested_file.exists() and requested_file.is_file():
            logger.info(f"✅ Serving file from build: {requested_file}")
            return FileResponse(requested_file)
        
        # Fallback to index.html for all other routes (React Router handles it)
        index_path = FRONTEND_BUILD_DIR / "index.html"
        logger.info(f"✅ Serving index.html for SPA route: /{full_path}")
        return FileResponse(index_path)

else:
    logger.warning("⚠️ No frontend build found — serving API only")
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "message": "Atlas2.0 API is running (frontend build not found)",
            "endpoints": {
                "health": "/api/health",
                "products": "/api/products"
            }
        }

# CORS middleware (unchanged)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local running
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"🚀 Starting server on http://0.0.0.0:{port}")
    logger.info(f"📁 Frontend build dir: {FRONTEND_BUILD_DIR} (exists: {FRONTEND_BUILD_DIR.exists()})")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")