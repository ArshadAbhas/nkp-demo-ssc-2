import React, { useState } from 'react';

function Cart({ cart, onRemoveFromCart, onClearCart }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }

    try {
      setSubmitting(true);
      const items = cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          email
        })
      });

      if (response.ok) {
        const order = await response.json();
        setMessage(`✅ Order #${order.id} placed successfully!`);
        setEmail('');
        onClearCart();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      setMessage('Failed to place order');
      console.error('Error placing order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-message">Your cart is empty</div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>
      <div className="cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-details">
              <h3>{item.name}</h3>
              <p>Quantity: {item.quantity}</p>
              <p>Unit Price: ₹{item.price}</p>
            </div>
            <div className="cart-item-price">
              ₹{(item.price * item.quantity).toFixed(2)}
            </div>
            <button
              className="remove-btn"
              onClick={() => onRemoveFromCart(item.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">Total: ₹{total.toFixed(2)}</div>

        <form onSubmit={handleCheckout} className="checkout-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Processing...' : 'Checkout'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: message.includes('✅') ? '#d1e7dd' : '#f8d7da',
            color: message.includes('✅') ? '#0f5132' : '#842029'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
