import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useApp } from './App';  // We'll make sure context is accessible

const Shop = () => {
  const [products, setProducts] = useState([]);
  const { addToCart, addToWishlist } = useApp();  // For buttons

  useEffect(() => {
    axios.get('/api/products')  // Your backend endpoint for CSV products
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to load products', err));
  }, []);

  return (
    <div className="pt-24 min-h-screen bg-gray-900">
      <h1 className="text-5xl text-center py-10 font-bold text-blue-400">Shop All Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
        {products.map(product => (
          <div key={product.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <img src={product.image || '/placeholder.jpg'} alt={product.name} className="w-full h-64 object-cover rounded" />
            <h3 className="text-2xl font-bold mt-4 text-blue-400">{product.name}</h3>
            <p className="text-gray-300 mt-2">${product.price}</p>
            <div className="mt-4 space-x-4">
              <button onClick={() => addToCart(product.id, product.price)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
                Add to Cart
              </button>
              <button onClick={() => addToWishlist(product.id)} className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
                ❤️ Wishlist
              </button>
              <Link to={`/product/${product.id}`} className="block mt-2 text-blue-400 hover:underline">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;