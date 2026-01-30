import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import your page components
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

// Use relative API paths
const API_BASE = '/api';

// Context
const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// Header Component (updated for auth)
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
          <Link to="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
            Atlas2.0
          </Link>

          {/* Search — full width on mobile */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 md:mx-8">
            <div className="flex w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors text-sm">
                Search
              </button>
            </div>
          </form>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">Home</Link>
            <Link to="/shop" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">Shop</Link>
            <Link to="/about" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">About</Link>
            <Link to="/contact" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">Contact</Link>
            <Link to="/cart" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
              Cart ({cartCount})
            </Link>
            <Link to="/wishlist" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">
              Wishlist ({wishlistCount})
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300 text-sm">Hi, {user}!</span>
                <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu — full screen overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/95 z-40 pt-20 px-4">
            <div className="flex flex-col space-y-6 text-center">
              <Link to="/" className="text-2xl text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/shop" className="text-2xl text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link to="/about" className="text-2xl text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link to="/contact" className="text-2xl text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              <Link to="/cart" className="text-2xl text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
              <Link to="/wishlist" className="text-2xl text-gray-300 hover:text-blue-400" onClick={() => setIsMenuOpen(false)}>
                Wishlist ({wishlistCount})
              </Link>
              {user ? (
                <>
                  <span className="text-2xl text-gray-300">Hi, {user}!</span>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="px-8 py-4 bg-red-600 text-white rounded-lg text-xl">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl" onClick={() => setIsMenuOpen(false)}>
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
// AppProvider – updated with auth
const AppProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // On mount: load user/token from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(storedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateCartCount(storedUser);
      updateWishlistCount(storedUser);
    }
  }, []);

  const getUserId = () => user || 'anonymous';

  const updateCartCount = async (uid = getUserId()) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await axios.get(`${API_BASE}/cart/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const count = response.data.items ? response.data.items.reduce((total, item) => total + item.quantity, 0) : 0;
      setCartCount(count);
    } catch (error) {
      setCartCount(0);
    }
  };

  const updateWishlistCount = async (uid = getUserId()) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await axios.get(`${API_BASE}/wishlist/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistCount(response.data.length || 0);
    } catch (error) {
      setWishlistCount(0);
    }
  };

  const addToCart = async (itemId, price, color = '', storage = '') => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API_BASE}/cart/add`, {
        user_id: getUserId(),
        item_id: itemId,
        price,
        color,
        storage
      }, { headers: { Authorization: `Bearer ${token}` } });
      updateCartCount();
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  const addToWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem('token') || '';
      await axios.post(`${API_BASE}/wishlist/add`, { user_id: getUserId(), item_id: itemId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateWishlistCount();
      alert('Added to wishlist!');
    } catch (error) {
      alert('Failed to add to wishlist');
    }
  };

  const login = (username, token) => {
    localStorage.setItem('user', username);
    localStorage.setItem('token', token);
    setUser(username);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    updateCartCount();
    updateWishlistCount();
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
    login,
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