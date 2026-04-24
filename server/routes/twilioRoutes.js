/**
 * Twilio Webhook Routes — Enhanced
 * Multi-level IVR + Recording callback
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

// Level 1 — Main Menu
router.post('/voice', handleVoice);
router.post('/response', handleResponse);

// Level 2 — Support Menu
router.post('/support', handleSupport);
router.post('/support-response', handleSupportResponse);

// Level 3 — Post Resolution
router.post('/after-support', handleAfterSupport);

// Callbacks
router.post('/status', handleStatus);
router.post('/recording', handleRecording);

// Inbound Calling
router.post('/inbound', require('../controllers/twilioController').handleInboundVoice);

// Inbound WhatsApp
router.post('/whatsapp-inbound', require('../controllers/twilioController').handleWhatsAppInbound);

module.exports = router;
