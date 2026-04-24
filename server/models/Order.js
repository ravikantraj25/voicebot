/**
 * Order Model — Enhanced
 * Now includes product details, AI summary, sentiment, recording, WhatsApp fallback
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['english', 'hindi', 'kannada', 'marathi'],
      default: 'english',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'failed', 'no-response', 'escalated'],
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

    // ─── Product Details (Feature 3) ────────────
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
