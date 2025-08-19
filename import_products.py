import csv
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
import json
import asyncio

# Load environment variables
ROOT_DIR = Path(__file__).parent
dotenv_path = ROOT_DIR / '.env'
with open(dotenv_path, 'r') as f:
    for line in f:
        if line.strip() and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            os.environ[key] = value

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def import_products(csv_file_path):
    try:
        await db.products.delete_many({})
        print("Cleared existing products collection.")

        with open(csv_file_path, mode='r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            products = []
            for row in csv_reader:
                print(f"Processing row: {row}")  # Debug output
                required_columns = ['id', 'name', 'price', 'description', 'image_url', 'category', 'colors', 'storage', 'specs']
                for col in required_columns:
                    if col not in row:
                        print(f"Missing column: {col}")
                        raise KeyError(f"Column {col} not found in CSV")
                
                # Parse colors (comma-separated string)
                colors = row['colors'].split(',') if row['colors'] else []
                
                # Parse storage (comma-separated string)
                storage = row['storage'].split(',') if row['storage'] else []
                
                # Parse specs (JSON string), handle empty or invalid cases
                specs = {}
                if row['specs'] and row['specs'].strip():
                    try:
                        specs = json.loads(row['specs'])
                    except json.JSONDecodeError as e:
                        print(f"Invalid JSON in specs for row {row}: {row['specs']} - Error: {str(e)}")
                        raise
                
                product = {
                    "id": row['id'],
                    "name": row['name'],
                    "price": float(row['price'].replace(',', '')),  # Handle commas in price
                    "image_url": row['image_url'],
                    "images": [row['image_url']] if row['image_url'] else [],  # Handle empty image_url
                    "description": row['description'],
                    "category": row['category'],
                    "colors": colors,
                    "storage": storage,
                    "specs": specs
                }
                products.append(product)

            if products:
                result = await db.products.insert_many(products)
                print(f"Imported {len(result.inserted_ids)} products successfully.")
            else:
                print("No products to import.")

    except FileNotFoundError:
        print(f"Error: The file {csv_file_path} was not found.")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in specs column: {str(e)}")
    except KeyError as e:
        print(f"An error occurred: {str(e)} - Check CSV column names match: {', '.join(required_columns)}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        client.close()
        print("MongoDB connection closed.")

if __name__ == "__main__":
    csv_file_path = os.path.join(ROOT_DIR, 'products.csv')
    asyncio.run(import_products(csv_file_path))