import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPackage, FiCheck, FiPhone, FiTruck, FiHome } from 'react-icons/fi';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered'];
const statusLabels = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  rejected: 'Cancelled',
  failed: 'Call Failed',
};
const statusIcons = {
  pending: <FiPackage />,
  confirmed: <FiCheck />,
  shipped: <FiTruck />,
  delivered: <FiHome />,
};

export default function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API}/api/shop/track/${id}`);
        setOrder(res.data.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchOrder();
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="shop-page"><div className="detail-loading">Loading order...</div></div>;
  if (!order) return <div className="shop-page"><div className="detail-loading">Order not found</div></div>;

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isRejected = order.status === 'rejected';

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

      <div className="track-page">
        <h1>Track Your Order</h1>
        <p className="track-order-id">Order #{order.orderId?.toString().slice(-8)}</p>

        {/* Status Timeline */}
        <div className="status-timeline">
          {isRejected ? (
            <div className="status-rejected">
              <span className="rejected-icon">✕</span>
              <h3>Order Cancelled</h3>
              <p>This order was cancelled based on your call response.</p>
            </div>
          ) : (
            <div className="timeline-steps">
              {statusSteps.map((step, i) => (
                <div key={step} className={`timeline-step ${i <= currentStepIndex ? 'active' : ''} ${i === currentStepIndex ? 'current' : ''}`}>
                  <div className="step-dot">
                    {i < currentStepIndex ? <FiCheck /> : statusIcons[step]}
                  </div>
                  <span className="step-label">{statusLabels[step]}</span>
                  {i < statusSteps.length - 1 && <div className="step-line"></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Info */}
        <div className="track-grid">
          <div className="track-card">
            <h3>Order Items</h3>
            {order.items?.map((item, i) => (
              <div key={i} className="track-item">
                <img src={item.image} alt={item.productName} />
                <div>
                  <p className="track-item-name">{item.productName}</p>
                  <p className="track-item-qty">Qty: {item.quantity} × ₹{item.productPrice?.toLocaleString()}</p>
                </div>
              </div>
            ))}
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          <div className="track-card">
            <h3>Shipping Details</h3>
            <p><strong>{order.customerName}</strong></p>
            {order.shippingAddress && (
              <p className="track-address">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
            )}
            {order.estimatedDelivery && (
              <p className="track-delivery">
                <FiTruck /> Estimated: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                  weekday: 'long', month: 'short', day: 'numeric'
                })}
              </p>
            )}
          </div>

          {/* AI Call Transcript */}
          {order.transcript?.length > 0 && (
            <div className="track-card transcript-card">
              <h3><FiPhone /> AI Call Transcript</h3>
              <div className="transcript-list">
                {order.transcript.map((t, i) => (
                  <div key={i} className={`transcript-msg ${t.role}`}>
                    <span className="msg-role">{t.role === 'bot' ? '🤖 Aria' : '👤 You'}</span>
                    <p>{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {order.aiSummary && (
            <div className="track-card">
              <h3>🧠 AI Call Summary</h3>
              <p className="ai-summary-text">{order.aiSummary}</p>
            </div>
          )}
        </div>

        <div className="track-actions">
          <Link to="/shop" className="continue-btn">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
