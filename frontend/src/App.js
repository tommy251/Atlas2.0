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

// ==================== HEADER (Mobile-first) ====================
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-blue-500/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-400">Atlas2.0</Link>

          {/* Search bar - smaller on mobile */}
          <form onSubmit={handleSearch} className="flex-1 mx-3 max-w-xs sm:max-w-md">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="px-5 bg-blue-600 text-white rounded-r-lg text-sm font-medium">
                Search
              </button>
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-x-6 text-sm">
            <Link to="/" className="text-gray-300 hover:text-blue-400">Home</Link>
            <Link to="/shop" className="text-gray-300 hover:text-blue-400">Shop</Link>
            <Link to="/about" className="text-gray-300 hover:text-blue-400">About</Link>
            <Link to="/contact" className="text-gray-300 hover:text-blue-400">Contact</Link>
            <Link to="/cart" className="text-gray-300 hover:text-blue-400">Cart ({cartCount})</Link>
            <Link to="/wishlist" className="text-gray-300 hover:text-blue-400">Wishlist ({wishlistCount})</Link>

            {user ? (
              <div className="flex items-center gap-x-4">
                <span className="text-gray-300">Hi, {user}</span>
                <button onClick={logout} className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm hover:bg-red-700">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-blue-600 rounded-lg text-white text-sm hover:bg-blue-700">Login</Link>
            )}
          </div>

          {/* Hamburger - visible on mobile & tablet */}
          <button 
            className="lg:hidden text-gray-300 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu - Full screen overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black z-50 lg:hidden pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-y-8 text-2xl text-center py-10">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-gray-300 py-4">Home</Link>
              <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="text-gray-300 py-4">Shop</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-gray-300 py-4">About</Link>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-gray-300 py-4">Contact</Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="text-gray-300 py-4">Cart ({cartCount})</Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="text-gray-300 py-4">Wishlist ({wishlistCount})</Link>

              {user ? (
                <>
                  <div className="text-gray-300 py-4">Hi, {user}</div>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="py-5 bg-red-600 text-white rounded-xl text-xl">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="py-5 bg-blue-600 text-white rounded-xl text-xl">
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

// ==================== APP PROVIDER ====================
const AppProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const getUserId = () => user || 'anonymous';

  const updateCartCount = async () => {
    try {
      const res = await axios.get(`/api/cart/${getUserId()}`);
      const count = res.data.items ? res.data.items.reduce((a, b) => a + b.quantity, 0) : 0;
      setCartCount(count);
    } catch { setCartCount(0); }
  };

  const updateWishlistCount = async () => {
    try {
      const res = await axios.get(`/api/wishlist/${getUserId()}`);
      setWishlistCount(res.data.length || 0);
    } catch { setWishlistCount(0); }
  };

  const addToCart = async (itemId, price, color = '', storage = '') => {
    await axios.post('/api/cart/add', { user_id: getUserId(), item_id: itemId, price, color, storage });
    updateCartCount();
  };

  const addToWishlist = async (itemId) => {
    await axios.post('/api/wishlist/add', { user_id: getUserId(), item_id: itemId });
    updateWishlistCount();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    navigate('/login');
  };

  const value = { cartCount, wishlistCount, user, addToCart, addToWishlist, logout, updateCartCount, updateWishlistCount, searchQuery, setSearchQuery };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="bg-gray-900 text-white min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-20 pb-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/search" element={<Search />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;