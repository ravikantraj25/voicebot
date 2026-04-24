/**
 * Order Routes — Enhanced
 * GET /api/orders           → Fetch all call logs
 * GET /api/orders/analytics → Get analytics (with sentiment & WhatsApp stats)
 * GET /api/orders/export    → Export as CSV
 * POST /api/orders/search   → AI-powered natural language search
 * DELETE /api/orders/:id    → Delete an order
 */
const express = require('express');
const router = express.Router();
const {
  getOrders,
  getAnalytics,
  searchOrders,
  deleteOrder,
  exportCSV,
} = require('../controllers/orderController');

router.get('/', getOrders);
router.get('/analytics', getAnalytics);
router.get('/export', exportCSV);
router.post('/search', searchOrders);
router.delete('/:id', deleteOrder);

module.exports = router;
