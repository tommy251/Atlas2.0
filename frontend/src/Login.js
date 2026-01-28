import React, { useState } from 'react';
import { useApp } from './App';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Dummy login - accept any email/password for testing
    if (email && password) {
      localStorage.setItem('user', email);
      localStorage.setItem('token', 'dummy-jwt-token-12345'); // Fake token
      setMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } else {
      setMessage('Please fill in both fields');
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">Login to Atlas2.0</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 py-4 rounded-lg font-bold hover:bg-blue-700 transition text-lg"
          >
            Login
          </button>
        </form>

        {message && (
          <p className={`text-center mt-6 text-lg ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}

        <p className="text-center text-gray-400 mt-8 text-sm">
          Demo: Any email + any password works!
        </p>
      </div>
    </div>
  );
};

export default Login;