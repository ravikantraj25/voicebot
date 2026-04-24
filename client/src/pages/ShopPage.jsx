import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiStar, FiShoppingCart, FiFilter, FiChevronDown, FiSun, FiMoon } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const categoryIcons = {
  electronics: '💻', clothing: '👕', home: '🏠', beauty: '💄',
  sports: '🏸', books: '📚', toys: '🧸', grocery: '🛒',
};

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [addedProduct, setAddedProduct] = useState(null);
  const { addToCart, totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [category, sort]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (sort) params.append('sort', sort);
      if (search) params.append('search', search);
      const res = await axios.get(`${API}/api/products?${params}`);
      setProducts(res.data.data);
    } catch (e) {
      console.error('Fetch products error:', e);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/api/products/categories`);
      setCategories(res.data.data);
    } catch (e) {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedProduct(product._id);
    setTimeout(() => setAddedProduct(null), 1500);
  };

  const discount = (orig, price) => orig ? Math.round(((orig - price) / orig) * 100) : 0;

  return (
    <div className="shop-page">
      {/* Header */}
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/shop" className="shop-logo">
            <span className="logo-icon">🛍️</span>
            <span className="logo-text">Automaton<span className="logo-accent">Store</span></span>
          </Link>
          <form className="shop-search" onSubmit={handleSearch}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="shop-header-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Theme">
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <Link to="/cart" className="cart-btn">
              <FiShoppingCart size={22} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
            <Link to="/admin" className="admin-link">Admin</Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {!search && category === 'all' && (
        <div className="hero-banner">
          <div className="hero-content">
            <div className="hero-badge">✨ NEW: AI-Powered Checkout</div>
            <h1>Experience Shopping, <br/><span className="gradient-text">Reimagined.</span></h1>
            <p>Browse our premium collection. Place an order, and our AI Voice Agent Aria will instantly call you to confirm. You can even negotiate or change your order entirely on the phone!</p>
            <div className="hero-stats">
              <div className="stat"><strong><FiStar className="stat-icon"/> 4.9/5</strong> Customer Rating</div>
              <div className="stat"><strong>🚀 2-Day</strong> Free Delivery</div>
              <div className="stat"><strong>🤖 24/7</strong> AI Support</div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="glowing-orb"></div>
            <img src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=600&auto=format&fit=crop" alt="Premium Audio" className="hero-img" />
          </div>
        </div>
      )}

      {/* Category Bar */}
      <div className="category-bar">
        <button
          className={`cat-chip ${category === 'all' ? 'active' : ''}`}
          onClick={() => setCategory('all')}
        >
          🔥 All
        </button>
        {categories.map(c => (
          <button
            key={c._id}
            className={`cat-chip ${category === c._id ? 'active' : ''}`}
            onClick={() => setCategory(c._id)}
          >
            {categoryIcons[c._id] || '📦'} {c._id.charAt(0).toUpperCase() + c._id.slice(1)}
            <span className="cat-count">{c.count}</span>
          </button>
        ))}
      </div>

      {/* Sort & Results */}
      <div className="shop-toolbar">
        <p className="results-count">
          {loading ? 'Loading...' : `${products.length} products found`}
        </p>
        <div className="sort-select">
          <FiFilter size={14} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <FiChevronDown size={14} />
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card skeleton">
              <div className="skeleton-img"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products found. Try a different search or category.</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card">
              {product.originalPrice && discount(product.originalPrice, product.price) > 0 && (
                <span className="discount-badge">
                  {discount(product.originalPrice, product.price)}% OFF
                </span>
              )}
              <Link to={`/shop/${product._id}`} className="product-image-wrap">
                <img src={product.image} alt={product.name} loading="lazy" />
              </Link>
              <div className="product-info">
                {product.brand && <span className="product-brand">{product.brand}</span>}
                <Link to={`/shop/${product._id}`} className="product-name">
                  {product.name}
                </Link>
                <div className="product-rating">
                  <FiStar className="star-icon" />
                  <span>{product.rating}</span>
                  <span className="review-count">({product.reviewCount?.toLocaleString()})</span>
                </div>
                <div className="product-price-row">
                  <span className="product-price">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="product-original-price">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                <button
                  className={`add-cart-btn ${addedProduct === product._id ? 'added' : ''}`}
                  onClick={() => handleAddToCart(product)}
                >
                  {addedProduct === product._id ? '✓ Added!' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
