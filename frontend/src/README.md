# Atlas2.0

An e-commerce platform for quality phones and accessories in Nigeria, inspired by revenes.com. Built with React, Tailwind CSS, and a FastAPI backend with MongoDB.

## Features
- **Product Catalog**: Browse phones and accessories with category filters, search, and price competitiveness badges.
- **Spreadsheet-Sourced Images**: Images from `products.csv`, stored in `frontend/public/images` or hosted externally (e.g., Cloudinary).
- **Cart & Wishlist**: Add items with color/storage options, authenticated or anonymous.
- **Nigeria-Specific**: Prices in ₦, tailored for the Nigerian market (e.g., Tecno Spark at ₦45,000).
- **Price Competitiveness**: `best_price` flag for products, displayed as a badge in the frontend.

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Python 3.8+
- MongoDB (e.g., MongoDB Atlas free tier)
- Render account[](https://render.com)
- GitHub repo: https://github.com/tommy251/Atlas2.0
- Spreadsheet exported as `products.csv` (e.g., `id,name,price,image_url,category,description,colors,storage,specs,best_price`)

## Project Structure