import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPhone, FiMapPin, FiCreditCard, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CheckoutPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { cart, subtotal, deliveryCharge, totalAmount, clearCart, totalItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    phoneNumber: '+91',
    language: 'english',
    street: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/shop/place-order`, {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        phoneNumber: form.phoneNumber,
        language: form.language,
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        shippingAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        paymentMethod: form.paymentMethod,
      });

      if (res.data.success) {
        setOrderId(res.data.data.orderId);
        clearCart();
      }
    } catch (error) {
      console.error('Order placement error:', error);
      alert('Failed to place order. Please try again.');
    }
    setLoading(false);
  };

  // ─── Success Screen ─────────────────────────────────
  if (orderId) {
    return (
      <div className="shop-page">
        <header className="shop-header">
          <div className="shop-header-inner">
            <Link to="/shop" className="shop-logo">
              <span className="logo-icon">🛍️</span>
              <span className="logo-text">Automaton<span className="logo-accent">Store</span></span>
            </Link>
          </div>
        </header>
        <div className="order-success">
          <div className="success-card">
            <FiCheckCircle className="success-icon" />
            <h1>Order Placed Successfully! 🎉</h1>
            <p className="success-subtitle">
              You will receive a <strong>confirmation call from our AI assistant Aria</strong> shortly 
              to verify your order details.
            </p>
            <div className="success-details">
              <div className="success-row">
                <span>Order ID</span>
                <span className="order-id-value">{orderId}</span>
              </div>
              <div className="success-row">
                <span>Phone</span>
                <span>{form.phoneNumber}</span>
              </div>
              <div className="success-row">
                <span>Payment</span>
                <span>{form.paymentMethod.toUpperCase()}</span>
              </div>
            </div>
            <div className="success-actions">
              <Link to={`/track/${orderId}`} className="track-btn">Track Order</Link>
              <Link to="/shop" className="continue-btn">Continue Shopping</Link>
            </div>
            <div className="ai-call-notice">
              <FiPhone className="pulse" />
              <p>Our AI assistant <strong>Aria</strong> is calling you now to confirm your order...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout Form ──────────────────────────────────
  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">Automaton<span className="logo-accent">Store</span></span>
          </Link>
          <div className="shop-header-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <Link to="/cart" className="admin-link">← Back to Cart</Link>
          </div>
        </div>
      </header>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div className="checkout-section">
            <h3><FiPhone /> Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="customerName" value={form.customerName} onChange={handleChange} required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required placeholder="+91 9876543210" />
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <select name="language" value={form.language} onChange={handleChange}>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="kannada">Kannada</option>
                  <option value="marathi">Marathi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="checkout-section">
            <h3><FiMapPin /> Shipping Address</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Street Address *</label>
                <input name="street" value={form.street} onChange={handleChange} required placeholder="House No, Street, Colony" />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input name="city" value={form.city} onChange={handleChange} required placeholder="City" />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input name="state" value={form.state} onChange={handleChange} required placeholder="State" />
              </div>
              <div className="form-group">
                <label>Pincode *</label>
                <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="6-digit pincode" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="checkout-section">
            <h3><FiCreditCard /> Payment Method</h3>
            <div className="payment-options">
              {[
                { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                { value: 'upi', label: 'UPI (GPay/PhonePe)', icon: '📱' },
                { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
                { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
              ].map(opt => (
                <label key={opt.value} className={`payment-option ${form.paymentMethod === opt.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={form.paymentMethod === opt.value}
                    onChange={handleChange}
                  />
                  <span className="payment-icon">{opt.icon}</span>
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="place-order-btn" disabled={loading || cart.length === 0}>
            {loading ? 'Placing Order...' : `Place Order — ₹${totalAmount.toLocaleString()}`}
          </button>
          <p className="checkout-note">
            <FiShield /> After placing your order, our AI assistant Aria will call you to confirm the details.
          </p>
        </form>

        {/* Order Summary Sidebar */}
        <div className="checkout-summary">
          <h3>Your Order ({totalItems} items)</h3>
          <div className="checkout-items">
            {cart.map(item => (
              <div key={item.productId} className="checkout-item">
                <img src={item.image} alt={item.name} />
                <div>
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="checkout-item-qty">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                </div>
                <span className="checkout-item-total">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
          <div className="summary-row"><span>Delivery</span><span className={deliveryCharge === 0 ? 'free' : ''}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
          <div className="summary-divider"></div>
          <div className="summary-row total"><span>Total</span><span>₹{totalAmount.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );
}
