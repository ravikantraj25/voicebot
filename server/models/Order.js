/**
 * Order Model — Enhanced
 * Now includes product details, AI summary, sentiment, recording, WhatsApp fallback
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // ─── Customer Info ──────────────────────────
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    customerName: {
      type: String,
      default: null,
    },
    customerEmail: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['english', 'hindi', 'kannada', 'marathi'],
      default: 'english',
    },

    // ─── Shipping Address ───────────────────────
    shippingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },

    // ─── Order Items (multiple products) ────────
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      productName: { type: String },
      productPrice: { type: Number },
      quantity: { type: Number, default: 1 },
      image: { type: String },
    }],

    // ─── Order Totals ───────────────────────────
    subtotal: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    // ─── Payment ────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card', 'netbanking'],
      default: 'cod',
    },

    // ─── Status & Call ──────────────────────────
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'failed', 'no-response', 'escalated', 'shipped', 'delivered'],
      default: 'pending',
    },
    callSid: {
      type: String,
      default: null,
    },
    callDuration: {
      type: Number,
      default: 0,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    issueType: {
      type: String,
      enum: ['none', 'delivery', 'payment', 'product', 'agent-transfer'],
      default: 'none',
    },

    // ─── Legacy Product Fields (backward compat) ─
    productName: {
      type: String,
      default: null,
    },
    productQty: {
      type: Number,
      default: 1,
    },
    productPrice: {
      type: Number,
      default: 0,
    },

    // ─── Delivery ───────────────────────────────
    estimatedDelivery: {
      type: Date,
      default: null,
    },

    // ─── AI Summary (Feature 8) ─────────────────
    aiSummary: {
      type: String,
      default: null,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', null],
      default: null,
    },
    flagged: {
      type: Boolean,
      default: false,
    },

    // ─── Call Recording (Feature 13) ────────────
    recordingUrl: {
      type: String,
      default: null,
    },
    recordingSid: {
      type: String,
      default: null,
    },

    // ─── WhatsApp Fallback (Feature 9) ──────────
    whatsappSent: {
      type: Boolean,
      default: false,
    },

    // ─── Conversation Transcript ────────────────
    transcript: [
      {
        role: { type: String, enum: ['bot', 'customer'] },
        text: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
