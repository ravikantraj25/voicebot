/**
 * App Component
 * Root component with routing for both customer storefront and admin dashboard
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import Dashboard from './pages/Dashboard';
import ShopPage from './pages/ShopPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import TrackOrder from './pages/TrackOrder';

function App() {
  return (
    <CartProvider>
      <Router>
        {/* Toast Notification Container */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '12px',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              fontSize: '14px',
            },
          }}
        />

        <Routes>
          {/* Customer Storefront */}
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/track/:id" element={<TrackOrder />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<Dashboard />} />

          {/* Default: redirect to shop */}
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
