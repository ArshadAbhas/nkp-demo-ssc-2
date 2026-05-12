import React, { useState, useEffect } from 'react';
import './App.css';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import OrderList from './components/OrderList';

function App() {
  const [currentPage, setCurrentPage] = useState('products');
  const [cart, setCart] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🛍️ E-Commerce Store</h1>
        <nav className="nav">
          <button
            className={currentPage === 'products' ? 'active' : ''}
            onClick={() => setCurrentPage('products')}
          >
            Products
          </button>
          <button
            className={currentPage === 'cart' ? 'active' : ''}
            onClick={() => setCurrentPage('cart')}
          >
            Cart ({cart.length})
          </button>
          <button
            className={currentPage === 'orders' ? 'active' : ''}
            onClick={() => setCurrentPage('orders')}
          >
            Orders
          </button>
        </nav>
      </header>

      {stats && (
        <div className="stats-bar">
          <div className="stat">📦 Products: {stats.total_products}</div>
          <div className="stat">📊 Orders: {stats.total_orders}</div>
          <div className="stat">💰 Revenue: ${stats.total_revenue.toFixed(2)}</div>
          <div className="stat">📈 Stock: {stats.total_stock} units</div>
        </div>
      )}

      <main className="main-content">
        {currentPage === 'products' && <ProductList onAddToCart={addToCart} />}
        {currentPage === 'cart' && (
          <Cart cart={cart} onRemoveFromCart={removeFromCart} onClearCart={clearCart} />
        )}
        {currentPage === 'orders' && <OrderList />}
      </main>

      <footer className="footer">
        <p>E-Commerce Demo | Kubernetes-Ready Application</p>
      </footer>
    </div>
  );
}

export default App;
