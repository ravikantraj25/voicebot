import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiChevronLeft, FiCheck, FiTruck, FiShield } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/api/products/${id}`);
        setProduct(res.data.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  if (loading) return <div className="shop-page"><div className="detail-loading">Loading product...</div></div>;
  if (!product) return <div className="shop-page"><div className="detail-loading">Product not found</div></div>;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'long', month: 'short', day: 'numeric'
  });

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">Automaton<span className="logo-accent">Store</span></span>
          </Link>
          <div className="shop-header-actions">
            <Link to="/cart" className="cart-btn">
              <FiShoppingCart size={22} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          </div>
        </div>
      </header>

      <div className="product-detail">
        <Link to="/shop" className="back-link"><FiChevronLeft /> Back to Shop</Link>
        
        <div className="detail-grid">
          {/* Image */}
          <div className="detail-image-section">
            <div className="detail-image-main">
              <img src={product.image} alt={product.name} />
              {discount > 0 && <span className="discount-badge lg">{discount}% OFF</span>}
            </div>
          </div>

          {/* Info */}
          <div className="detail-info-section">
            {product.brand && <span className="detail-brand">{product.brand}</span>}
            <h1 className="detail-title">{product.name}</h1>
            
            <div className="detail-rating">
              <span className="rating-badge">
                <FiStar /> {product.rating}
              </span>
              <span className="rating-reviews">{product.reviewCount?.toLocaleString()} ratings</span>
            </div>

            <div className="detail-pricing">
              <span className="detail-price">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="detail-original">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="detail-discount-text">Save ₹{(product.originalPrice - product.price).toLocaleString()}</span>
                </>
              )}
            </div>

            <p className="detail-description">{product.description}</p>

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="detail-features">
                <h3>Key Features</h3>
                <ul>
                  {product.features.map((f, i) => (
                    <li key={i}><FiCheck className="check-icon" /> {f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="detail-actions">
              <div className="qty-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button className={`add-cart-btn lg ${added ? 'added' : ''}`} onClick={handleAdd}>
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>

            {/* Delivery & Trust */}
            <div className="detail-trust">
              <div className="trust-item">
                <FiTruck /> <span>Free delivery on orders above ₹499</span>
              </div>
              <div className="trust-item">
                <FiTruck /> <span>Estimated delivery by {deliveryDate}</span>
              </div>
              <div className="trust-item">
                <FiShield /> <span>AI-powered order confirmation call</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
