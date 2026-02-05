import React, { useState, useEffect } from 'react';
import { useApp } from './App';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cartCount, updateCartCount, user } = useApp();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = user || 'anonymous';

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get(`/api/cart/${userId}`);
        setCartItems(res.data.items || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load cart — try refreshing');
        setLoading(false);
      }
    };
    fetchCart();
  }, [userId]);

  const updateQuantity = async (itemKey, newQty) => {
    if (newQty <= 0) {
      removeItem(itemKey);
      return;
    }
    try {
      const item = cartItems.find(i => `${i.item_id}-${i.color}-${i.storage}` === itemKey);
      await axios.put('/api/cart/update', {
        user_id: userId,
        item_id: item.item_id,
        price: item.price,
        quantity: newQty,
        color: item.color || '',
        storage: item.storage || ''
      });
      updateCartCount();
      setCartItems(prev => prev.map(i => i === item ? { ...i, quantity: newQty } : i));
    } catch (err) {
      alert('Failed to update quantity');
    }
  };

  const removeItem = async (itemKey) => {
    try {
      const item = cartItems.find(i => `${i.item_id}-${i.color}-${i.storage}` === itemKey);
      await axios.put('/api/cart/update', {
        user_id: userId,
        item_id: item.item_id,
        price: item.price,
        quantity: 0,
        color: item.color || '',
        storage: item.storage || ''
      });
      updateCartCount();
      setCartItems(prev => prev.filter(i => i !== item));
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center"></div>
        <p className="text-2xl text-blue-400 animate-pulse">Loading cart...</p>
      </div>
    );
  }

  if (error || cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center"></div>
        <h1 className="text-4xl font-bold text-blue-400 mb-8">Your Cart</h1>
        <p className="text-2xl text-gray-300">{error || 'Your cart is empty — add items from shop!'}</p>
        <Link to="/shop" className="mt-8 inline-block px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition text-xl font-bold">
          Go Shopping →
        </Link>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">Your Cart ({cartCount} items)</h1>
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-8">
        {cartItems.map(item => {
          const key = `${item.item_id}-${item.color}-${item.storage}`;
          return (
            <div key={key} className="flex items-center justify-between border-b border-gray-700 py-6 last:border-0">
              <div className="flex items-center space-x-6">
                <div className="bg-gray-700 w-24 h-24 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-center text-xs">Image<br />(Add real)</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-400">{item.item_name || 'Product'}</h3>
                  <p className="text-gray-400">{item.color} {item.storage}</p>
                  <p className="text-lg font-bold">₦{item.price.toLocaleString()} each</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <button onClick={() => updateQuantity(key, item.quantity - 1)} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">-</button>
                  <span className="text-xl w-12 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(key, item.quantity + 1)} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">+</button>
                </div>
                <button onClick={() => removeItem(key)} className="text-red-500 hover:text-red-400 font-semibold">
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        <div className="text-right mt-8">
          <p className="text-2xl font-bold text-blue-400">Total: ₦{total.toLocaleString()}</p>
          <Link to="/checkout" className="mt-4 inline-block px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 text-xl font-bold">
  Proceed to Checkout →
</Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;