/**
 * Shop Routes - Customer-facing API
 */
const express = require('express');
const router = express.Router();
const { placeOrder, trackOrder } = require('../controllers/shopController');

router.post('/place-order', placeOrder);
router.get('/track/:id', trackOrder);

module.exports = router;
