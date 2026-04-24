const express = require('express');
const router = express.Router();
const { handleVoice, handleInbound, handleStatus } = require('../controllers/exotelController');

// Outbound call ExoML
router.post('/voice', handleVoice);
router.get('/voice', handleVoice);   // Exotel sometimes uses GET

// Inbound call handler (Passthru Applet hits this)
router.post('/inbound', handleInbound);
router.get('/inbound', handleInbound);   // Exotel sometimes uses GET

// Call status webhook
router.post('/status', handleStatus);

// Stream URL provider for Voicebot Applet
router.get('/stream-url', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
  const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  res.json({ url: `${wsUrl}/api/exotel/stream` });
});

module.exports = router;
