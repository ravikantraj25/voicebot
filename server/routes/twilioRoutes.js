/**
 * Twilio Webhook Routes — Enhanced with RAG Support
 * Multi-level IVR + Recording callback + RAG Policy Engine
 */
const express = require('express');
const router = express.Router();
const {
  handleVoice,
  handleResponse,
  handleSupport,
  handleSupportResponse,
  handleAfterSupport,
  handleStatus,
  handleRecording,
} = require('../controllers/twilioController');
const {
  handleRagSupport,
  handleRagAction,
  handleRagQuery,
} = require('../controllers/ragSupportController');

// ─── Level 1: Main Menu ───────────────────────────────────────────
router.post('/voice', handleVoice);
router.post('/response', handleResponse);

// ─── Level 2: Support Menu (Original IVR) ────────────────────────
router.post('/support', handleSupport);
router.post('/support-response', handleSupportResponse);

// ─── Level 2: RAG-Powered Support (AI + Policy) ──────────────────
// When customer presses 3 → routes to RAG support for intelligent
// policy-validated handling of: refunds, cancellations, returns
router.post('/rag-support', handleRagSupport);
router.post('/rag-action', handleRagAction);

// ─── Level 3: Post Resolution ─────────────────────────────────────
router.post('/after-support', handleAfterSupport);

// ─── Callbacks ────────────────────────────────────────────────────
router.post('/status', handleStatus);
router.post('/recording', handleRecording);

// ─── RAG Policy Query API (for dashboard & WhatsApp bot) ──────────
// POST /api/twilio/rag-query
// Body: { query: "Can I cancel my order?", orderId: "...", language: "hindi" }
router.post('/rag-query', handleRagQuery);

// Inbound WhatsApp
router.post('/whatsapp-inbound', require('../controllers/twilioController').handleWhatsAppInbound);

module.exports = router;
