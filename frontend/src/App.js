import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for cart, wishlist, and authentication
const AppContext = createContext();

const useApp = () => useContext(AppContext);

// Components
const Header = () => {
  const { cartCount, wishlistCount } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
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
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
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

          <button
            className="md:hidden text-gray-300 hover:text-blue-400"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
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

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        setFeaturedProducts(response.data.products.slice(0, 6));
      } catch (error) {
        console.error('Error fetching featured products:', error);
      }
    };
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="hero-bg pt-20 pb-12 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Atlas2.0</h1>
          <p className="text-lg md:text-xl mb-6 text-gray-300">
            Discover quality phones and accessories in Nigeria
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Shop Now
          </button>
        </div>
      </section>

      <section className="py-12 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Featured Products</h2>
          <div className="grid-responsive">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Shop by Category</h2>
          <div className="grid-responsive">
            {['Phones', 'Accessories', 'Pre-Owned'].map((category) => (
              <div
                key={category}
                onClick={() => navigate(`/shop?category=${encodeURIComponent(category)}`)}
                className="bg-gray-800 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{category}</h3>
                <p className="text-gray-400">Explore our {category.toLowerCase()} collection</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard = ({ product }) => {
  const { addToCart, addToWishlist } = useApp();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="product-card relative">
      <Link to={`/product/${product.id}`}>
        <div className="relative w-full h-48 mb-4">
          {!imageError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg">
              <span className="text-gray-400">Image not available</span>
            </div>
          )}
          {product.best_price && (
            <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Best Price
            </span>
          )}
        </div>
      </Link>
      <div>
        <Link to={`/product/${product.id}`}>
          <h3 className="hover:text-blue-400">{product.name}</h3>
        </Link>
        <p className="price">₦{product.price.toLocaleString()}</p>
        <div className="flex space-x-2 justify-center">
          <button
            onClick={() => addToCart(product.id, product.price)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
          <button
            onClick={() => addToWishlist(product.id)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceFilter, setPriceFilter] = useState(2000000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`)
        ]);
        setProducts(productsRes.data.products);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesPrice = product.price <= priceFilter;
    return matchesCategory && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Shop</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-gray-800 rounded-lg p-6 sticky top-24">
              <h3 className="text-xl font-semibold text-white mb-4">Filters</h3>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 mb-2">
                  Max Price: ₦{priceFilter.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="50000"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">
            <div className="grid-responsive">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-xl">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { addToCart, addToWishlist } = useApp();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
        setSelectedColor(response.data.colors[0] || '');
        setSelectedStorage(response.data.storage[0] || '');
        
        const relatedRes = await axios.get(`${API}/products?category=${response.data.category}`);
        setRelatedProducts(relatedRes.data.products.filter(p => p.id !== id).slice(0, 3));
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product.id, product.price, selectedColor, selectedStorage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="relative w-full h-96">
              {!imageError ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg">
                  <span className="text-gray-400">Image not available</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-white">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-blue-400 mb-6">
              ₦{product.price.toLocaleString()}
              {product.best_price && (
                <span className="ml-4 bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded-full">
                  Best Price
                </span>
              )}
            </p>
            <p className="text-gray-300 mb-8">{product.description}</p>

            {product.colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Color:</label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {product.colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {product.storage.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Storage:</label>
                <select
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {product.storage.map(storage => (
                    <option key={storage} value={storage}>{storage}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Cart
              </button>
              <button
                onClick={() => addToWishlist(product.id)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add to Wishlist
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              <div className="space-y-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-8">Related Products</h2>
            <div className="grid-responsive">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { updateCartCount } = useApp();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.get(`${API}/cart/${userId}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      setCartItems(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity, color = '', storage = '') => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.put(`${API}/cart/update`, {
        user_id: userId,
        item_id: itemId,
        quantity: quantity,
        color: color,
        storage: storage,
        price: 0
      }, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      
      if (response.data.success) {
        await fetchCart();
        updateCartCount();
      }
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeItem = async (itemId, color = '', storage = '') => {
    await updateQuantity(itemId, 0, color, storage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl mb-4">Your cart is empty</p>
            <Link to="/shop" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-white font-semibold">Product</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Color</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Storage</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Price</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Total</th>
                    <th className="px-6 py-3 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-600">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12">
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                e.target.src = '/images/placeholder.png';
                              }}
                            />
                          </div>
                          <span className="text-white ml-3">{item.item_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.color || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-300">{item.storage || 'N/A'}</td>
                      <td className="px-6 py-4 text-white">₦{item.price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.item_id, parseInt(e.target.value), item.color, item.storage)}
                          className="w-16 px-2 py-1 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-white font-semibold">₦{(item.price * item.quantity).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => removeItem(item.item_id, item.color, item.storage)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-gray-700 flex justify-between items-center">
              <span className="text-xl font-semibold text-white">Total: ₦{total.toLocaleString()}</span>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { updateWishlistCount } = useApp();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.get(`${API}/wishlist/${userId}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      setWishlistItems(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.delete(`${API}/wishlist/remove`, {
        data: { user_id: userId, item_id: itemId },
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      
      if (response.data.success) {
        await fetchWishlist();
        updateWishlistCount();
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Your Wishlist</h1>
        
        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl mb-4">Your wishlist is empty</p>
            <Link to="/shop" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid-responsive">
            {wishlistItems.map((item) => (
              <div key={item.item_id} className="product-card">
                <Link to={`/product/${item.item_id}`}>
                  <div className="relative w-full h-48 mb-4">
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.target.src = '/images/placeholder.png';
                      }}
                    />
                    {item.best_price && (
                      <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        Best Price
                      </span>
                    )}
                  </div>
                </Link>
                <div>
                  <Link to={`/product/${item.item_id}`}>
                    <h3 className="hover:text-blue-400">{item.item_name}</h3>
                  </Link>
                  <p className="price">₦{item.price.toLocaleString()}</p>
                  <button
                    onClick={() => removeFromWishlist(item.item_id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove from Wishlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Search = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, []);

  const performSearch = async (searchQuery) => {
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Search Results for "{query}"</h1>
        
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-xl mb-4">No products found matching your search.</p>
            <Link to="/shop" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid-responsive">
            {searchResults.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const About = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">About Atlas2.0</h1>
        <div className="bg-gray-800 rounded-lg p-8">
          <p className="text-gray-300 text-lg mb-6">
            Welcome to Atlas2.0, your trusted source for quality phones and accessories in Nigeria. 
            We bring you the best in technology at affordable prices.
          </p>
          <p className="text-gray-300 text-lg mb-6">
            Our mission is to deliver reliable electronics tailored for the Nigerian market, from brand-new devices 
            to carefully selected pre-owned options, all backed by our commitment to quality.
          </p>
          <p className="text-gray-300 text-lg">
            Shop with confidence at Atlas2.0 - where innovation meets value.
          </p>
        </div>
      </div>
    </div>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${API}/contact`, formData);
      setSubmitMessage(response.data.message);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitMessage('Error sending message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows="5"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          {submitMessage && (
            <div className="mt-4 p-4 bg-green-600 text-white rounded-lg">
              {submitMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const response = await axios.post(`${API}${endpoint}`, formData);
      setMessage(response.data.message);
      
      if (response.data.success) {
        if (isLogin) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', formData.username);
          navigate('/');
        } else {
          setIsLogin(true);
          setFormData({ username: '', email: '', password: '' });
        }
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            {isLogin ? 'Login' : 'Sign Up'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            <div>
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          
          {message && (
            <div className="mt-4 p-4 bg-blue-600 text-white rounded-lg">
              {message}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-black text-gray-400 py-8">
      <div className="container mx-auto px-4 text-center">
        <p>© 2025 Atlas2.0. All rights reserved.</p>
      </div>
    </footer>
  );
};

const AppProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState(localStorage.getItem('user') || null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.Authorization = `Bearer ${token}`;
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
      const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  };

  const updateWishlistCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.get(`${API}/wishlist/${userId}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      setWishlistCount(response.data.length);
    } catch (error) {
      console.error('Error updating wishlist count:', error);
    }
  };

  const addToCart = async (itemId, price, color = '', storage = '') => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.post(
        `${API}/cart/add`,
        {
          user_id: userId,
          item_id: itemId,
          price: price,
          color: color,
          storage: storage
        },
        { headers: { Authorization: `Bearer ${token || ''}` } }
      );
      
      if (response.data.success) {
        updateCartCount();
        alert('Added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart');
    }
  };

  const addToWishlist = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user') || 'anonymous';
      const response = await axios.post(
        `${API}/wishlist/add`,
        { user_id: userId, item_id: itemId },
        { headers: { Authorization: `Bearer ${token || ''}` } }
      );
      
      if (response.data.success) {
        updateWishlistCount();
        alert('Added to wishlist!');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Error adding to wishlist');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    axios.defaults.headers.Authorization = null;
    updateCartCount();
    updateWishlistCount();
    navigate('/login');
  };

  return (
    <AppContext.Provider value={{
      cartCount,
      wishlistCount,
      user,
      addToCart,
      addToWishlist,
      updateCartCount,
      updateWishlistCount,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="App bg-gray-900 text-white">
        <Router>
          <Header />
          <main className="min-h-screen">
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
        </Router>
      </div>
    </AppProvider>
  );
}

export default App;