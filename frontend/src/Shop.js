import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useApp } from './App';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, addToWishlist } = useApp();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        // Force array even if backend returns object/null/undefined
        const data = Array.isArray(res.data) ? res.data : [];
        setProducts(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-400 mb-6">Shop All Products</h1>
          <p className="text-2xl text-gray-300 animate-pulse">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-400 mb-6">Shop All Products</h1>
          <p className="text-2xl text-red-500">{error}</p>
          <p className="text-gray-400 mt-4">Check console for details or try refreshing.</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 text-center">
        <h1 className="text-5xl font-bold text-blue-400 py-10">Shop All Products</h1>
        <p className="text-xl text-gray-300">No products available right now.</p>
      </div>
    );
  }

  // Main shop grid
  return (
    <div className="pt-24 min-h-screen bg-gray-900">
      <h1 className="text-5xl text-center py-10 font-bold text-blue-400">Shop All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-8 pb-20 max-w-7xl mx-auto">
        {products.map(product => (
          <div key={product.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-2">
            {/* Product Image Frame */}
            <div className="relative bg-gray-700 h-64 flex items-center justify-center overflow-hidden">
              <div className="bg-gray-600 border-4 border-dashed border-gray-500 rounded-xl w-48 h-48 flex items-center justify-center">
                <p className="text-gray-400 text-center">Product Image<br />(Add real later)</p>
              </div>
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                ₦{product.price?.toLocaleString() || '0'}
              </div>
            </div>

            {/* Product Info Frame */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-blue-400 truncate">{product.name || 'Unnamed Product'}</h3>
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">{product.description || 'No description available'}</p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => addToCart(product.id, product.price)}
                  className="flex-1 bg-blue-600 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => addToWishlist(product.id)}
                  className="px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-xl"
                >
                  ❤️
                </button>
              </div>

              <Link 
                to={`/product/${product.id}`} 
                className="block mt-4 text-center text-blue-400 hover:text-blue-300 underline transition"
              >
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