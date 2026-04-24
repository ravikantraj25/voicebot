import { Link } from 'react-router-dom';
import { FiShoppingCart, FiSun, FiMoon } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function ShopHeader() {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  return (
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
          <Link to="/cart" className="cart-btn">
            <FiShoppingCart size={22} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          <Link to="/admin" className="admin-link">Admin</Link>
        </div>
      </div>
    </header>
  );
}
