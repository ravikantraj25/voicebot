/**
 * Product Model
 * E-commerce product catalog stored in MongoDB
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number }, // For showing discounts
  category: { 
    type: String, 
    required: true,
    enum: ['electronics', 'clothing', 'home', 'beauty', 'sports', 'books', 'toys', 'grocery']
  },
  image: { type: String, required: true },
  images: [{ type: String }], // Additional images
  stock: { type: Number, default: 50 },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  brand: { type: String },
  features: [{ type: String }],
  specifications: { type: Map, of: String },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
