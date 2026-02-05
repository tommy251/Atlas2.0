import React, { useState } from 'react';
import { useApp } from './App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart, user } = useApp();  // Assume you have these in context
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 text-center">
        <p className="text-2xl text-gray-300">Cart empty — add items first!</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        items: cartItems,
        customer: { name, address, email, phone },
        total: cartTotal,
        create_account: createAccount ? { email, password } : null
      };

      const res = await axios.post('/api/checkout', payload);

      if (res.data.success) {
        clearCart();
        alert(`Order placed! ID: ${res.data.order_id}. Receipt sent to ${email}.`);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    }
    setLoading(false);
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">Checkout</h1>

        {/* Order Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl text-blue-400 mb-4">Order Summary</h2>
          {cartItems.map(item => (
            <div key={item.item_id} className="flex justify-between text-gray-300 mb-2">
              <span>{item.item_name} x {item.quantity}</span>
              <span>₦{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <p className="text-2xl font-bold text-blue-400 mt-6">Total: ₦{cartTotal.toLocaleString()}</p>
        </div>

        {/* Delivery Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="px-5 py-3 bg-gray-700 rounded-lg" />
            <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required className="px-5 py-3 bg-gray-700 rounded-lg" />
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="px-5 py-3 bg-gray-700 rounded-lg md:col-span-2" />
            <textarea placeholder="Delivery Address" value={address} onChange={e => setAddress(e.target.value)} required rows={5} className="px-5 py-3 bg-gray-700 rounded-lg md:col-span-2" />
          </div>

          {/* Optional Account */}
          <div className="mt-8">
            <label className="flex items-center gap-3 text-gray-300">
              <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)} className="w-5 h-5" />
              <span>Create account for faster checkout next time? (Optional)</span>
            </label>
            {createAccount && (
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="mt-4 w-full px-5 py-3 bg-gray-700 rounded-lg"
              />
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-10 w-full bg-blue-600 py-5 rounded-lg hover:bg-blue-700 font-bold text-xl disabled:opacity-70"
          >
            {loading ? 'Processing...' : 'Proceed to Payment →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;