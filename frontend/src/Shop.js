import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useApp } from './App';  // Now works thanks to export in App.js

const Shop = () => {
  const [products, setProducts] = useState([]);
  const { addToCart, addToWishlist } = useApp();

  useEffect(() => {
    axios.get('/api/products')
      .then(res => setProducts(res.data || []))
      .catch(err => {
        console.error('Failed to load products:', err);
        setProducts([]);
      });
  }, []);

  if (products.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 text-center">
        <h1 className="text-5xl font-bold text-blue-400 py-10">Shop All Products</h1>
        <p className="text-xl text-gray-300">Loading products... (run backend if empty)</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-900">
      <h1 className="text-5xl text-center py-10 font-bold text-blue-400">Shop All Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 pb-20">
        {products.map(product => (
          <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
            <div className="bg-gray-700 h-64 flex items-center justify-center">
              <p className="text-gray-500">Image Placeholder</p> {/* Replace with real image later */}
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-blue-400">{product.name || 'Unnamed Product'}</h3>
              <p className="text-gray-300 mt-2">${product.price || '0.00'}</p>
              <p className="text-gray-400 text-sm mt-2">{product.description || 'No description available'}</p>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => addToCart(product.id, product.price)}
                  className="flex-1 bg-blue-600 py-3 rounded hover:bg-blue-700 transition"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => addToWishlist(product.id)}
                  className="px-6 py-3 bg-gray-700 rounded hover:bg-gray-600 transition"
                >
                  ❤️
                </button>
              </div>
              <Link to={`/product/${product.id}`} className="block mt-4 text-center text-blue-400 hover:underline">
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;