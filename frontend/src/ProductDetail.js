import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useApp } from './App';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart, addToWishlist } = useApp();

  useEffect(() => {
    axios.get('/api/products')
      .then(res => {
        const found = res.data.find(p => p.id === parseInt(id));
        setProduct(found || null);
      })
      .catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 text-center">
        <p className="text-2xl text-gray-300">Product not found</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Large Image Frame */}
          <div className="bg-gray-700 rounded-xl h-96 md:h-full flex items-center justify-center">
            <div className="bg-gray-600 border-4 border-dashed border-gray-500 rounded-xl w-80 h-80 flex items-center justify-center">
              <p className="text-gray-400 text-center">Large Product Image<br />(Coming soon)</p>
            </div>
          </div>

          {/* Details Frame */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-blue-400">{product.name}</h1>
              <p className="text-3xl text-gray-300 mt-4">${product.price}</p>
            </div>

            <p className="text-lg text-gray-400 leading-relaxed">
              {product.description || 'No description available. This is an amazing product from Atlas Technologies!'}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => addToCart(product.id, product.price)}
                className="flex-1 bg-blue-600 py-4 rounded-lg text-xl font-bold hover:bg-blue-700 transition"
              >
                Add to Cart
              </button>
              <button
                onClick={() => addToWishlist(product.id)}
                className="px-8 py-4 bg-gray-700 rounded-lg text-2xl hover:bg-gray-600 transition"
              >
                ❤️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;