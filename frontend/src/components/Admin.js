import React, { useState, useEffect } from 'react';
import './Admin.css';

function Admin({ onBack }) {
  const [adminKey, setAdminKey] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: adminKey })
      });
      if (response.ok) {
        localStorage.setItem('adminKey', adminKey);
        setIsLoggedIn(true);
        setMessage('Login successful!');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Invalid admin key');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  // Fetch products and orders
  const fetchData = async () => {
    setLoading(true);
    try {
      const key = localStorage.getItem('adminKey') || adminKey;
      const [productsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/orders`, {
          headers: { 'X-Admin-Key': key }
        })
      ]);
      
      if (productsRes.ok) {
        setProducts(await productsRes.json());
      }
      if (ordersRes.ok) {
        setOrders(await ordersRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add or update product
  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = localStorage.getItem('adminKey') || adminKey;
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': key
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          stock: parseInt(formData.stock)
        })
      });

      if (response.ok) {
        setMessage(editingId ? 'Product updated!' : 'Product added!');
        setFormData({ name: '', price: '', description: '', stock: '' });
        setEditingId(null);
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage('Error: ' + error.error);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock
    });
    setEditingId(product.id);
  };

  // Delete product
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure?')) {
      const key = localStorage.getItem('adminKey') || adminKey;
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': key }
        });
        if (response.ok) {
          setMessage('Product deleted!');
          fetchData();
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (error) {
        setMessage('Error: ' + error.message);
      }
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const key = localStorage.getItem('adminKey') || adminKey;
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': key
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setMessage('Order status updated!');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    setIsLoggedIn(false);
    setAdminKey('');
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingId(null);
  };

  // Check if already logged in
  useEffect(() => {
    const storedKey = localStorage.getItem('adminKey');
    if (storedKey) {
      setAdminKey(storedKey);
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="login-box">
          <h2>🔐 Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin API key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
          {message && <p className="message">{message}</p>}
          <p className="hint">Default key: admin-secret-key-2026</p>
          <button className="back-btn" onClick={onBack}>← Back to Store</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <div className="admin-header-actions">
          <button className="back-btn" onClick={onBack}>← Back to Store</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="admin-content">
        {/* Add Product Form */}
        <div className="form-section">
          <h2>{editingId ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="price"
                placeholder="Price"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="stock"
                placeholder="Stock Quantity"
                value={formData.stock}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', price: '', description: '', stock: '' });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Products Table */}
        <div className="table-section">
          <h2>📦 Products</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>₹{product.price.toFixed(2)}</td>
                    <td>{product.description}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Orders Table */}
        <div className="table-section">
          <h2>📋 Recent Orders</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Email</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_email}</td>
                    <td>₹{order.total_price.toFixed(2)}</td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`status-select status-${order.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-view">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
