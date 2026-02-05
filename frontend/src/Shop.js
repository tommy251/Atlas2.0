import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useApp } from './App';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, addToWishlist } = useApp();
  const [addingId, setAddingId] = useState(null);  // For loading feedback

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        const data = Array.isArray(res.data) ? res.data : [];
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load products');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (id, price) => {
    setAddingId(id);
    await addToCart(id, price);
    setAddingId(null);
  };

  const handleAddToWishlist = async (id) => {
    setAddingId(`w-${id}`);
    await addToWishlist(id);
    setAddingId(null);
  };

  if (loading) return <div className="pt-24 text-center text-blue-400 animate-pulse">Loading...</div>;
  if (error) return <div className="pt-24 text-center text-red-500">{error}</div>;
  if (products.length === 0) return <div className="pt-24 text-center text-gray-300">No products</div>;

  return (
    <div className="pt-24 min-h-screen bg-gray-900">
      <h1 className="text-5xl text-center py-10 font-bold text-blue-400">Shop All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 pb-20 max-w-7xl mx-auto">
        {products.map(product => (
          <div key={product.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all">
            <div className="bg-gray-700 h-64 flex items-center justify-center">
              <p className="text-gray-400">Image (Add real)</p>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-blue-400 truncate">{product.name}</h3>
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">{product.description}</p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleAddToCart(product.id, product.price)}
                  disabled={addingId === product.id}
                  className="flex-1 bg-blue-600 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-70"
                >
                  {addingId === product.id ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => handleAddToWishlist(product.id)}
                  disabled={addingId === `w-${product.id}`}
                  className="px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 text-xl disabled:opacity-70"
                >
                  {addingId === `w-${product.id}` ? '...' : '❤️'}
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