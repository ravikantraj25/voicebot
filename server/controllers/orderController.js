/**
 * Order Controller — Enhanced
 * With AI-powered natural language search (Groq), CSV export,
 * enhanced analytics with sentiment & WhatsApp stats
 */
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { initiateCall } = require('../services/twilioService');
const { parseSearchQuery } = require('../services/groqService');

/**
 * GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(`❌ Fetch orders error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

/**
 * GET /api/orders/analytics — Enhanced with sentiment & WhatsApp stats
 */
const getAnalytics = async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const confirmed = await Order.countDocuments({ status: 'confirmed' });
    const rejected = await Order.countDocuments({ status: 'rejected' });
    const pending = await Order.countDocuments({ status: 'pending' });
    const failed = await Order.countDocuments({ status: 'failed' });
    const noResponse = await Order.countDocuments({ status: 'no-response' });
    const escalated = await Order.countDocuments({ status: 'escalated' });

    // Sentiment stats
    const positive = await Order.countDocuments({ sentiment: 'positive' });
    const neutral = await Order.countDocuments({ sentiment: 'neutral' });
    const negative = await Order.countDocuments({ sentiment: 'negative' });

    // WhatsApp & recording stats
    const whatsappSent = await Order.countDocuments({ whatsappSent: true });
    const recorded = await Order.countDocuments({ recordingUrl: { $ne: null } });
    const flagged = await Order.countDocuments({ flagged: true });

    const successRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        total, confirmed, rejected, pending, failed, noResponse, escalated,
        positive, neutral, negative,
        whatsappSent, recorded, flagged,
        successRate: parseFloat(successRate),
      },
    });
  } catch (error) {
    console.error(`❌ Analytics error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

/**
 * POST /api/orders/search — AI-powered natural language search
 */
const searchOrders = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    // Parse natural language query using Groq
    const filters = await parseSearchQuery(query);
    console.log(`🔍 NL Search: "${query}" → `, JSON.stringify(filters));

    // Build MongoDB query from parsed filters
    const mongoQuery = {};

    if (filters.status) mongoQuery.status = filters.status;
    if (filters.language) mongoQuery.language = filters.language;
    if (filters.sentiment) mongoQuery.sentiment = filters.sentiment;
    if (filters.flagged !== undefined) mongoQuery.flagged = filters.flagged;
    if (filters.whatsappSent !== undefined) mongoQuery.whatsappSent = filters.whatsappSent;

    if (filters.searchText) {
      mongoQuery.$or = [
        { phoneNumber: { $regex: filters.searchText, $options: 'i' } },
        { productName: { $regex: filters.searchText, $options: 'i' } },
      ];
    }

    if (filters.dateFilter) {
      const now = new Date();
      switch (filters.dateFilter) {
        case 'today':
          mongoQuery.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
          break;
        case 'yesterday': {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          mongoQuery.createdAt = { $gte: yesterday, $lt: today };
          break;
        }
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          mongoQuery.createdAt = { $gte: weekAgo };
          break;
        }
      }
    }

    const orders = await Order.find(mongoQuery).sort({ createdAt: -1 }).lean();

    // Build human-readable description of what was found
    const parts = [];
    if (filters.status) parts.push(filters.status);
    if (filters.language) parts.push(filters.language);
    if (filters.sentiment) parts.push(filters.sentiment);
    if (filters.dateFilter && filters.dateFilter !== 'all') parts.push(filters.dateFilter);
    const description = parts.length > 0
      ? `${orders.length} ${parts.join(' ')} call${orders.length !== 1 ? 's' : ''}`
      : `${orders.length} result${orders.length !== 1 ? 's' : ''}`;

    res.status(200).json({
      success: true,
      query,
      description,
      filters,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error(`❌ Search error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

/**
 * POST /api/orders
 * Auto-creates an order and immediately initiates an outbound AI call.
 */
const createOrder = async (req, res) => {
  try {
    const { phoneNumber, productName, productQty, productPrice } = req.body;
    
    if (!phoneNumber || !productName) {
      return res.status(400).json({ success: false, message: 'Phone number and product name are required' });
    }

    // Lookup customer language
    const customer = await Customer.findOne({ phoneNumber });
    const language = customer?.preferredLanguage || 'english';

    // Create Order
    const order = await Order.create({
      phoneNumber,
      language,
      status: 'pending',
      productName,
      productQty: productQty || 1,
      productPrice: productPrice || 0,
    });

    // Auto-initiate call
    const call = await initiateCall(phoneNumber, order._id.toString(), language);
    order.callSid = call.sid;
    await order.save();

    console.log(`🤖 Auto-call triggered for order ${order._id}`);

    const io = req.app.get('io');
    io.emit('orderUpdated');

    res.status(201).json({ success: true, message: 'Order created and AI call triggered', data: order });
  } catch (error) {
    console.error(`❌ Create order error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

/**
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const io = req.app.get('io');
    io.emit('orderUpdated');

    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

/**
 * GET /api/orders/export — CSV export
 */
const exportCSV = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();

    const headers = [
      'Order ID', 'Phone', 'Language', 'Status', 'Product', 'Qty', 'Price',
      'Sentiment', 'Flagged', 'WhatsApp Sent', 'Issue Type', 'AI Summary',
      'Duration (s)', 'Created At',
    ];

    const rows = orders.map((o) => [
      o._id, o.phoneNumber, o.language, o.status,
      o.productName || 'N/A', o.productQty || 0, o.productPrice || 0,
      o.sentiment || 'N/A', o.flagged ? 'YES' : 'NO',
      o.whatsappSent ? 'YES' : 'NO', o.issueType || 'none',
      o.aiSummary || 'N/A', o.callDuration || 0,
      new Date(o.createdAt).toLocaleString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="call-report-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

module.exports = { getOrders, getAnalytics, searchOrders, deleteOrder, exportCSV, createOrder };
