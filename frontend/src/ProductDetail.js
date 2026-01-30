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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data);
        // Preselect first options if available
        if (res.data.colors?.length > 0) setSelectedColor(res.data.colors[0]);
        if (res.data.storage?.length > 0) setSelectedStorage(res.data.storage[0]);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Product not found — back to shop?');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-2xl text-blue-400 animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-24 min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-2xl text-red-500">{error || 'Product not found'}</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl overflow-hidden shadow-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative bg-gray-700 h-96 flex items-center justify-center rounded-xl overflow-hidden">
            <div className="bg-gray-600 border-4 border-dashed border-gray-500 rounded-xl w-64 h-64 flex items-center justify-center">
              <p className="text-gray-400 text-center">Main Product Image<br />(Add real URL later)</p>
            </div>
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full text-lg font-bold">
              ₦{product.price.toLocaleString()}
            </div>
            {product.best_price && (
              <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                Best Price
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-400 mb-4">{product.name}</h1>
              <p className="text-gray-300 mb-6">{product.description}</p>

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div className="mb-6">
                  <label className="block text-gray-400 mb-2">Color:</label>
                  <select 
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    {product.colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Storage */}
              {product.storage?.length > 0 && (
                <div className="mb-6">
                  <label className="block text-gray-400 mb-2">Storage:</label>
                  <select 
                    value={selectedStorage}
                    onChange={(e) => setSelectedStorage(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    {product.storage.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specs Table */}
              {Object.keys(product.specs || {}).length > 0 && (
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-blue-400 mb-3">Specifications</h2>
                  <table className="w-full text-gray-300">
                    <tbody>
                      {Object.entries(product.specs).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-700">
                          <td className="py-2 font-medium">{key}</td>
                          <td className="py-2 text-right">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => addToCart(product.id, product.price, selectedColor, selectedStorage)}
                className="flex-1 bg-blue-600 py-4 rounded-lg hover:bg-blue-700 transition font-bold text-lg"
              >
                Add to Cart
              </button>
              <button 
                onClick={() => addToWishlist(product.id)}
                className="px-6 py-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition text-2xl"
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