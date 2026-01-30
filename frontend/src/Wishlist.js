import React, { useState, useEffect } from 'react';
import { useApp } from './App';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { wishlistCount, updateWishlistCount, user, addToCart } = useApp();
  const [wishlistItems, setWishlistItems] = useState([]);  // Fixed: consistent name
  const [loading, setLoading] = useState(true);

  const userId = user || 'anonymous';

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await axios.get(`/api/wishlist/${userId}`);
        setWishlistItems(res.data.items || []);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [userId]);

  const removeFromWishlist = async (itemId) => {
    try {
      await axios.delete('/api/wishlist/remove', { data: { user_id: userId, item_id: itemId } });
      updateWishlistCount();
      setWishlistItems(prev => prev.filter(i => i.item_id !== itemId));
    } catch {
      alert('Failed to remove');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-2xl text-blue-400 animate-pulse">Loading wishlist...</p>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <h1 className="text-4xl font-bold text-blue-400 mb-8">Wishlist</h1>
        <p className="text-2xl text-gray-300">Your wishlist is empty — save items from shop!</p>
        <Link to="/shop" className="mt-8 inline-block px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-xl font-bold">
          Browse Shop →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">Wishlist ({wishlistCount} items)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {wishlistItems.map(item => (
          <div key={item.item_id} className="bg-gray-800 rounded-xl p-6 hover:shadow-blue-500/50 transition">
            <div className="bg-gray-700 h-48 rounded-lg mb-4 flex items-center justify-center">
              <p className="text-gray-400 text-center">Image<br />(Add real)</p>
            </div>
            <h3 className="text-xl font-bold text-blue-400 mb-2">{item.item_name}</h3>
            <p className="text-2xl font-bold mb-4">₦{item.price.toLocaleString()}</p>
            <div className="flex gap-3">
              <button onClick={() => addToCart(item.item_id, item.price)} className="flex-1 bg-blue-600 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                Add to Cart
              </button>
              <button onClick={() => removeFromWishlist(item.item_id)} className="px-4 py-3 bg-red-600 rounded-lg hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;