import { Link } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalItems, subtotal, deliveryCharge, totalAmount } = useCart();

  if (cart.length === 0) {
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
        <div className="empty-cart">
          <FiShoppingCart size={64} />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/shop" className="shop-now-btn">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">Automaton<span className="logo-accent">Store</span></span>
          </Link>
          <div className="shop-header-actions">
            <Link to="/shop" className="admin-link">← Continue Shopping</Link>
          </div>
        </div>
      </header>

      <div className="cart-layout">
        <div className="cart-items-section">
          <h2 className="cart-title">Shopping Cart <span>({totalItems} items)</span></h2>
          {cart.map(item => (
            <div key={item.productId} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                {item.brand && <span className="cart-item-brand">{item.brand}</span>}
                <div className="cart-item-price-row">
                  <span className="cart-item-price">₹{item.price.toLocaleString()}</span>
                  {item.originalPrice && (
                    <span className="cart-item-original">₹{item.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="cart-item-actions">
                <div className="qty-selector">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}><FiMinus /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}><FiPlus /></button>
                </div>
                <span className="cart-item-total">₹{(item.price * item.quantity).toLocaleString()}</span>
                <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal ({totalItems} items)</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span className={deliveryCharge === 0 ? 'free' : ''}>
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{totalAmount.toLocaleString()}</span>
          </div>
          <Link to="/checkout" className="checkout-btn">
            Proceed to Checkout <FiArrowRight />
          </Link>
          <p className="ai-notice">🤖 You'll receive an AI confirmation call after placing your order</p>
        </div>
      </div>
    </div>
  );
}
