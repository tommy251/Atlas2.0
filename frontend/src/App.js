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

// Header (your current good one — no change needed)

const Header = () => {
  // ... your current Header code from last push ...
};

// AppProvider – fixed wishlist count fetch + consistent with cart
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
      updateCartCount();
      updateWishlistCount();
    }
  }, []);

  const getUserId = () => user || 'anonymous';

  const updateCartCount = async () => {
    try {
      const res = await axios.get(`/api/cart/${getUserId()}`);
      setCartCount(res.data.count || 0);  // Use .count from backend
    } catch {
      setCartCount(0);
    }
  };

  const updateWishlistCount = async () => {
    try {
      const res = await axios.get(`/api/wishlist/${getUserId()}`);
      setWishlistCount(res.data.count || 0);  // Fixed: use .count (consistent with cart)
    } catch {
      setWishlistCount(0);
    }
  };

  const addToCart = async (itemId, price, color = '', storage = '') => {
    try {
      await axios.post('/api/cart/add', { user_id: getUserId(), item_id: itemId, price, color, storage });
      updateCartCount();
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  const addToWishlist = async (itemId) => {
    try {
      const res = await axios.post('/api/wishlist/add', { user_id: getUserId(), item_id: itemId });
      setWishlistCount(res.data.wishlist_count || 0);  // Instant update from backend response
      updateWishlistCount();  // Backup fetch
    } catch (error) {
      alert('Failed to add to wishlist');
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    navigate('/login');
  };

  const value = {
    cartCount,
    wishlistCount,
    user,
    addToCart,
    addToWishlist,
    updateCartCount,
    updateWishlistCount,
    logout,
    searchQuery,
    setSearchQuery
  };

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