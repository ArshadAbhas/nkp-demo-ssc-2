import React, { useState, useEffect } from 'react';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders`);
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'shipped':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      default:
        return '';
    }
  };

  if (loading && orders.length === 0) return <div className="empty-message">Loading orders...</div>;
  if (error) return <div className="empty-message" style={{ color: 'red' }}>{error}</div>;
  if (orders.length === 0) return <div className="empty-message">No orders yet</div>;

  return (
    <div>
      <h2>Order History</h2>
      <div className="order-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-id">Order #{order.id}</div>
              <div className={`order-status ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </div>
            </div>
            <div>
              <strong>Email:</strong> {order.customer_email}
            </div>
            <div className="order-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item">
                  Product ID: {item.productId}, Quantity: {item.quantity}
                </div>
              ))}
            </div>
            <div className="order-total">Total: ₹{order.total_price.toFixed(2)}</div>
            <div style={{ fontSize: '0.85em', color: '#999', marginTop: '10px' }}>
              Ordered: {new Date(order.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderList;
