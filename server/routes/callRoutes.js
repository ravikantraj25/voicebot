/**
 * Call Routes — Enhanced
 * POST /api/call           → Initiate a new call (with product details)
 * POST /api/call/retry/:id → Retry a call
 * POST /api/call/batch     → Batch call multiple customers
 * POST /api/call/summary/:id → Generate AI summary for a call
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { startCall, retryCall, batchCall, generateSummary, handleVoiceCommand } = require('../controllers/callController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', startCall);
router.post('/retry/:id', retryCall);
router.post('/batch', batchCall);
router.post('/summary/:id', generateSummary);
router.post('/voice-command', upload.single('audio'), handleVoiceCommand);

module.exports = router;
