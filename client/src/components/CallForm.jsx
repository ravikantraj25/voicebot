/**
 * Call Form Component — Enhanced
 * Now includes product selection for realistic demo calls
 */
import React, { useState } from 'react';
import { Phone, Globe, Loader2, Sparkles, Package } from 'lucide-react';

const LANGUAGES = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'kannada', label: 'Kannada', flag: '🇮🇳' },
  { value: 'marathi', label: 'Marathi', flag: '🇮🇳' },
];

const PRODUCTS = [
  { name: 'Wireless Bluetooth Headphones', qty: 2, price: 1499 },
  { name: 'Running Shoes (Nike Revolution)', qty: 1, price: 3499 },
  { name: 'Stainless Steel Water Bottle (1L)', qty: 3, price: 599 },
  { name: 'Cotton Bedsheet Set (Double Bed)', qty: 1, price: 1299 },
  { name: 'Organic Green Tea (100 Bags)', qty: 2, price: 449 },
];

const CallForm = ({ onSubmit, isLoading, onLanguageChange }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState('english');
  const [selectedProduct, setSelectedProduct] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    const product = PRODUCTS[selectedProduct];
    onSubmit({
      phoneNumber: phoneNumber.trim(),
      language,
      productName: product.name,
      productQty: product.qty,
      productPrice: product.price,
    });
  };

  const currentProduct = PRODUCTS[selectedProduct];

  return (
    <div className="glass-card-hover p-6 animate-in opacity-0 delay-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center">
          <Sparkles size={20} className="text-brand-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-surface-100">New Call</h2>
          <p className="text-sm text-surface-400">Initiate order confirmation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone Number */}
        <div>
          <label htmlFor="phone-number" className="block text-xs font-medium text-surface-300 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              className="input-field pl-11 py-2.5 text-sm"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language-select" className="block text-xs font-medium text-surface-300 mb-1.5">
            Voice Language
          </label>
          <div className="relative">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <select
              id="language-select"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                onLanguageChange?.(e.target.value);
              }}
              className="select-field pl-11 py-2.5 text-sm"
              disabled={isLoading}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label htmlFor="product-select" className="block text-xs font-medium text-surface-300 mb-1.5">
            Order Product
          </label>
          <div className="relative">
            <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(Number(e.target.value))}
              className="select-field pl-11 py-2.5 text-sm"
              disabled={isLoading}
            >
              {PRODUCTS.map((p, i) => (
                <option key={i} value={i}>
                  {p.name} — ₹{p.price}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-surface-500 mt-1">
            {currentProduct.qty}x {currentProduct.name} · ₹{currentProduct.price}
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !phoneNumber.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Calling...
            </>
          ) : (
            <>
              <Phone size={18} />
              Start Call
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CallForm;
