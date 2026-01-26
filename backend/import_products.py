import csv
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv
import json
import asyncio
import logging
from bson import ObjectId  # Added import for ObjectId

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv('DB_NAME', 'atlas2')]

async def import_products(csv_file_path):
    try:
        await db.products.delete_many({})
        logger.info("Cleared existing products collection.")

        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            required_columns = ['id', 'name', 'price', 'image_url', 'category']
            products = []
            for row in csv_reader:
                logger.debug(f"Processing row: {row}")
                
                # Check required columns
                for col in required_columns:
                    if col not in row or not row[col]:
                        logger.warning(f"Missing or empty column {col} in row: {row}")
                        row[col] = "" if col != 'price' else "0"

                # Parse fields
                colors = row.get('colors', '').split(';') if row.get('colors') else []
                storage = row.get('storage', '').split(';') if row.get('storage') else []
                specs = {}
                if row.get('specs') and row['specs'].strip():
                    try:
                        specs = json.loads(row['specs'])
                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON in specs for row {row}: {row.get('specs')} - Error: {str(e)}")
                        specs = {}

                product = {
                    "id": row['id'] or str(ObjectId()),
                    "name": row['name'],
                    "price": float(row['price'].replace(',', '')) if row['price'] else 0.0,
                    "image_url": row['image_url'],
                    "best_price": row.get('best_price', 'false').lower() == 'true',  # Added for consistency with server.py
                    "images": [row['image_url']] if row['image_url'] else [],
                    "description": row.get('description', ''),
                    "category": row['category'],
                    "colors": colors,
                    "storage": storage,
                    "specs": specs
                }
                products.append(product)

            if products:
                result = await db.products.insert_many(products)
                logger.info(f"Imported {len(result.inserted_ids)} products successfully.")
            else:
                logger.warning("No products to import.")

    except FileNotFoundError:
        logger.error(f"Error: The file {csv_file_path} was not found.")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Error: Invalid JSON format in specs column: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        raise
    finally:
        client.close()
        logger.info("MongoDB connection closed.")

if __name__ == "__main__":
    csv_file_path = os.path.join(ROOT_DIR, 'products.csv')
    asyncio.run(import_products(csv_file_path))