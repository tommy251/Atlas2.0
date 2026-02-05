import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useApp } from './App';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, addToWishlist } = useApp();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [actionLoading, setActionLoading] = useState('');  // 'cart' or 'wishlist' or ''

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data);
        if (res.data.colors?.length > 0) setSelectedColor(res.data.colors[0]);
        if (res.data.storage?.length > 0) setSelectedStorage(res.data.storage[0]);
        setLoading(false);
      } catch (err) {
        setError('Product not found');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setActionLoading('cart');
    await addToCart(product.id, product.price, selectedColor, selectedStorage);
    setActionLoading('');
  };

  const handleAddToWishlist = async () => {
    setActionLoading('wishlist');
    await addToWishlist(product.id);
    setActionLoading('');
  };

  if (loading) return <div className="pt-24 text-center text-blue-400 animate-pulse text-2xl">Loading...</div>;
  if (error || !product) return <div className="pt-24 text-center text-red-500 text-2xl">{error}</div>;

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-gray-700 h-96 rounded-2xl flex items-center justify-center">
            <p className="text-gray-400">Main Image (Add real)</p>
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-bold text-blue-400 mb-4">{product.name}</h1>
            <p className="text-gray-300 mb-6">{product.description}</p>

            {/* Colors/Storage/Specs same as before */}

            <div className="flex gap-4 mt-10">
              <button 
                onClick={handleAddToCart}
                disabled={actionLoading === 'cart'}
                className="flex-1 bg-blue-600 py-4 rounded-lg hover:bg-blue-700 font-bold text-lg disabled:opacity-70"
              >
                {actionLoading === 'cart' ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
              <button 
                onClick={handleAddToWishlist}
                disabled={actionLoading === 'wishlist'}
                className="px-6 py-4 bg-gray-700 rounded-lg hover:bg-gray-600 text-2xl disabled:opacity-70"
              >
                {actionLoading === 'wishlist' ? '...' : '❤️'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;