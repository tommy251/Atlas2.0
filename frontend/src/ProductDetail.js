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
  const [adding, setAdding] = useState(false);  // Loading state

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
    setAdding(true);
    await addToCart(product.id, product.price, selectedColor, selectedStorage);
    setAdding(false);
  };

  const handleAddToWishlist = async () => {
    setAdding(true);
    await addToWishlist(product.id);
    setAdding(false);
  };

  if (loading) return <div className="pt-24 text-center text-blue-400 animate-pulse">Loading...</div>;
  if (error || !product) return <div className="pt-24 text-center text-red-500">{error}</div>;

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image + Details (same as before) */}
          {/* ... your existing image and details code ... */}

          {/* Action Buttons with loading */}
          <div className="flex gap-4 mt-6">
            <button 
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 bg-blue-600 py-4 rounded-lg hover:bg-blue-700 font-bold text-lg disabled:opacity-70"
            >
              {adding ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
            <button 
              onClick={handleAddToWishlist}
              disabled={adding}
              className="px-6 py-4 bg-gray-700 rounded-lg hover:bg-gray-600 text-2xl disabled:opacity-70"
            >
              {adding ? '...' : '❤️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;