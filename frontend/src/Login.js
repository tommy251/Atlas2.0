import React, { useState } from 'react';
import axios from 'axios';
import { useApp } from './App';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup ? { username, email, password } : { username, password };
      
      const res = await axios.post(endpoint, payload);
      
      if (res.data.success) {
        const token = res.data.token;
        const loggedUser = res.data.user || username;
        login(loggedUser, token);
        navigate('/');
      } else {
        setError(res.data.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Network error — try again');
    }
    setLoading(false);
  };

  return (
    <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-blue-400 text-center mb-8">
          {isSignup ? 'Sign Up' : 'Login'}
        </h1>
        
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {isSignup && (
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 py-4 rounded-lg hover:bg-blue-700 transition font-bold text-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
          </button>
        </form>
        
        <p className="text-center text-gray-400 mt-6">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="text-blue-400 hover:underline font-semibold"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;