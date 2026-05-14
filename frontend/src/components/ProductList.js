import React, { useState, useEffect } from 'react';

function ProductList({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://10.38.191.43:5000/api/products`);
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="empty-message">Loading products...</div>;
  if (error) return <div className="empty-message" style={{ color: 'red' }}>{error}</div>;
  if (products.length === 0) return <div className="empty-message">No products available</div>;

  return (
    <div>
      <h2>Available Products</h2>
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-name">{product.name}</div>
            <div className="product-price">₹{product.price}</div>
            <div className="product-description">{product.description}</div>
            <div className="product-stock">
              Stock: {product.stock} {product.stock === 0 ? '(Out of Stock)' : ''}
            </div>
            <button
              className="btn"
              onClick={() => onAddToCart(product)}
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
