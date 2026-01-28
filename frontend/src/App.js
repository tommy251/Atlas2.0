import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import your page components (these should now exist as .js files in src/)
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'; // Local fallback (change to your Render URL when deployed)
const API = `${BACKEND_URL}/api`;

// Context
const AppContext = createContext();
const useApp = () => useContext(AppContext);

// Header Component (uses context)
const Header = () => {
  const { cartCount, wishlistCount, navigate, searchQuery, setSearchQuery } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-blue-500/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
            Atlas2.0
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors">
              Search
            </button>
          </form>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-blue-400 transition-colors">Home</Link>
            <Link to="/shop" className="text-gray-300 hover:text-blue-400 transition-colors">Shop</Link>
            <Link to="/about" className="text-gray-300 hover:text-blue-400 transition-colors">About</Link>
            <Link to="/contact" className="text-gray-300 hover:text-blue-400 transition-colors">Contact</Link>
            <Link to="/cart" className="text-gray-300 hover:text-blue-400 transition-colors">
              Cart ({cartCount})
            </Link>
            <Link to="/wishlist" className="text-gray-300 hover:text-blue-400 transition-colors">
              Wishlist ({wishlistCount})
            </Link>
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Login
            </Link>
          </div>

          <button className="md:hidden text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4 bg-gray-800 rounded-lg p-4">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none"
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-lg">
                Search
              </button>
            </form>
            <Link to="/" className="block text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/shop" className="block text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Shop</Link>
            <Link to="/about" className="block text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/contact" className="block text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            <Link to="/cart" className="block text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>
              Cart ({cartCount})
            </Link>
            <Link to="/wishlist" className="block text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>
              Wishlist ({wishlistCount})
            </Link>
            <Link to="/login" className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center" onClick={() => setIsMenuOpen(false)}>
              Login
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

// Full AppProvider with all functions (safe try/catch to prevent crashes when backend is not running)
const AppProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState(localStorage.getItem('user') || null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateCartCount();
      updateWishlistCount();
    }
  }, []);

  const updateCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.get(`${API}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      const count = response.data.items ? response.data.items.reduce((total, item) => total + item.quantity, 0) : 0;
      setCartCount(count);
    } catch (error) {
      console.error('Error updating cart count (backend may not be running):', error);
      setCartCount(0);
    }
  };

  const updateWishlistCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.get(`${API}/wishlist/${userId}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      setWishlistCount(response.data.length || 0);
    } catch (error) {
      console.error('Error updating wishlist count (backend may not be running):', error);
      setWishlistCount(0);
    }
  };

  const addToCart = async (itemId, price, color = '', storage = '') => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      await axios.post(`${API}/cart/add`, {
        user_id: userId,
        item_id: itemId,
        price,
        color,
        storage
      }, { headers: { Authorization: `Bearer ${token || ''}` } });
      updateCartCount();
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart (backend may be offline)');
    }
  };

  const addToWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      await axios.post(`${API}/wishlist/add`, { user_id: userId, item_id: itemId }, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      updateWishlistCount();
      alert('Added to wishlist!');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Failed to add to wishlist (backend may be offline)');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
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
    navigate,
    searchQuery,
    setSearchQuery
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="App bg-gray-900 text-white min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-20">
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