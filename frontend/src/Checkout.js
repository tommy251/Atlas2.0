import React, { useState } from 'react';
import { useApp } from './App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const { cartItems, clearCart, user } = useApp();  // Assume cartItems from context
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderData = {
        items: cartItems,
        customer: { name, address, email, phone },
        total,
        create_account: createAccount ? { email, password } : null
      };

      const res = await axios.post('/api/checkout', orderData);
      
      if (res.data.success) {
        clearCart();
        alert(`Order placed! Receipt sent to ${email}. Order ID: ${res.data.order_id}`);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed — try again');
    }
    setLoading(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 text-center">
        <p className="text-2xl text-gray-300">Your cart is empty — add items first!</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">Checkout</h1>
        
        {/* Cart Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl text-blue-400 mb-4">Order Summary ({cartItems.length} items)</h2>
          {cartItems.map(item => (
            <div key={item.item_id} className="flex justify-between text-gray-300 mb-2">
              <span>{item.item_name} x{item.quantity}</span>
              <span>₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="text-xl font-bold text-blue-400 mt-4">
            Total: ₦{total.toLocaleString()}
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="grid md:grid-cols-2 gap-6">
            <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="px-4 py-3 bg-gray-700 rounded-lg" />
            <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required className="px-4 py-3 bg-gray-700 rounded-lg" />
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="px-4 py-3 bg-gray-700 rounded-lg md:col-span-2" />
            <textarea placeholder="Delivery Address" value={address} onChange={e => setAddress(e.target.value)} required rows={4} className="px-4 py-3 bg-gray-700 rounded-lg md:col-span-2" />
          </div>

          {/* Optional Account Creation */}
          <div className="mt-8">
            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} className="w-5 h-5" />
              <span className="text-gray-300">Create account for faster checkout next time? (Optional)</span>
            </label>
            {createAccount && (
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="mt-4 w-full px-4 py-3 bg-gray-700 rounded-lg"
              />
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-8 w-full bg-blue-600 py-4 rounded-lg hover:bg-blue-700 transition font-bold text-xl disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Proceed to Payment →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;