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

  if (loading) return <div className="pt-24 text-center text-blue-400">Loading...</div>;
  if (error || !product) return <div className="pt-24 text-center text-red-500">{error}</div>;

  return (
    <div className="pt-24 min-h-screen bg-gray-900 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative bg-gray-700 h-96 rounded-2xl flex items-center justify-center overflow-hidden">
            <div className="bg-gray-600 border-4 border-dashed border-gray-500 rounded-2xl w-72 h-72 flex items-center justify-center">
              <p className="text-gray-400 text-center">Main Image<br />(Add real URL later)</p>
            </div>
            <div className="absolute top-6 right-6 bg-blue-600 text-white px-5 py-2 rounded-full text-xl font-bold">
              ₦{product.price.toLocaleString()}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-400 mb-4">{product.name}</h1>
              <p className="text-gray-300 mb-8">{product.description}</p>

              {product.colors?.length > 0 && (
                <div className="mb-6">
                  <label className="block text-gray-400 mb-2">Color</label>
                  <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white">
                    {product.colors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {product.storage?.length > 0 && (
                <div className="mb-6">
                  <label className="block text-gray-400 mb-2">Storage</label>
                  <select value={selectedStorage} onChange={e => setSelectedStorage(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white">
                    {product.storage.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {Object.keys(product.specs || {}).length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">Specifications</h2>
                  <table className="w-full text-gray-300">
                    <tbody>
                      {Object.entries(product.specs).map(([k, v]) => (
                        <tr key={k} className="border-b border-gray-700">
                          <td className="py-3 font-medium">{k}</td>
                          <td className="py-3 text-right">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => addToCart(product.id, product.price, selectedColor, selectedStorage)} className="flex-1 bg-blue-600 py-4 rounded-lg text-lg font-bold hover:bg-blue-700">
                Add to Cart
              </button>
              <button onClick={() => addToWishlist(product.id)} className="px-8 py-4 bg-gray-700 rounded-lg text-3xl hover:bg-gray-600">
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