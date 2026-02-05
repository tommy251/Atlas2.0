import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

import Home from './Home';
import Shop from './Shop';
import ProductDetail from './ProductDetail';
import Cart from './Cart';
import Wishlist from './Wishlist';
import Search from './Search';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Footer from './Footer';

const API_BASE = '/api';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

// ==================== HEADER (Fixed - always visible) ====================
const Header = () => {
  const { cartCount, wishlistCount, user, logout, searchQuery, setSearchQuery } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md border-b border-blue-500/20 shadow-lg">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Logo - always visible */}
          <Link to="/" className="text-2xl md:text-3xl font-bold text-blue-400 whitespace-nowrap">
            Atlas2.0
          </Link>

          {/* Search bar - compact on mobile */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs sm:max-w-md md:max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-5 py-3 bg-gray-800 border border-gray-600 rounded-2xl text-white text-sm md:text-base focus:outline-none focus:border-blue-500"
            />
          </form>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-x-6 text-sm md:text-base">
            <Link to="/" className="text-gray-300 hover:text-blue-400">Home</Link>
            <Link to="/shop" className="text-gray-300 hover:text-blue-400">Shop</Link>
            <Link to="/about" className="text-gray-300 hover:text-blue-400">About</Link>
            <Link to="/contact" className="text-gray-300 hover:text-blue-400">Contact</Link>
            <Link to="/cart" className="text-gray-300 hover:text-blue-400">Cart ({cartCount})</Link>
            <Link to="/wishlist" className="text-gray-300 hover:text-blue-400">Wishlist ({wishlistCount})</Link>

            {user ? (
              <div className="flex items-center gap-x-4">
                <span className="text-gray-300">Hi, {user}</span>
                <button onClick={logout} className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700">Login</Link>
            )}
          </div>

          {/* Hamburger - always visible on mobile/tablet */}
          <button 
            className="text-white p-2 lg:hidden z-[110]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Compact Dropdown Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-2xl py-6 px-4 z-[100]">
            <div className="flex flex-col gap-y-6 text-xl text-center">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="py-3 text-gray-300 hover:text-blue-400">Home</Link>
              <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="py-3 text-gray-300 hover:text-blue-400">Shop</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="py-3 text-gray-300 hover:text-blue-400">About</Link>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="py-3 text-gray-300 hover:text-blue-400">Contact</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="py-3 text-gray-300 hover:text-blue-400">Cart ({cartCount})</Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="py-3 text-gray-300 hover:text-blue-400">Wishlist ({wishlistCount})</Link>

              {user ? (
                <button 
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="py-4 bg-red-600 text-white rounded-2xl text-xl mt-4"
                >
                  Logout
                </button>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="py-4 bg-blue-600 text-white rounded-2xl text-xl mt-4"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

// AppProvider + App (same as before)

const AppProvider = ({ children }) => {
  // ... your current AppProvider code (no change)
};

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="bg-gray-900 text-white min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-20">
            <Routes>
              {/* ... your routes ... */}
            </Routes>
          </main>
          <Footer />
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;