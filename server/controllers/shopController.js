/**
 * Shop Controller
 * Handles customer-facing order placement with auto AI call trigger
 */
const Order = require('../models/Order');
const Product = require('../models/Product');
const { initiateCall } = require('../services/twilioService');

/**
 * POST /api/shop/place-order
 * Customer places an order → auto-triggers AI confirmation call
 */
const placeOrder = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      phoneNumber,
      language = 'english',
      items, // [{ productId, quantity }]
      shippingAddress,
      paymentMethod = 'cod',
    } = req.body;

    if (!phoneNumber || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and at least one item are required',
      });
    }

    // Fetch product details and calculate totals
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity || 1,
        image: product.image,
      });

      subtotal += product.price * (item.quantity || 1);

      // Decrease stock
      product.stock = Math.max(0, product.stock - (item.quantity || 1));
      await product.save();
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products found' });
    }

    const deliveryCharge = subtotal > 499 ? 0 : 40;
    const totalAmount = subtotal + deliveryCharge;

    // Build a human-readable product summary for the AI agent
    const productSummary = orderItems.map(i => `${i.quantity}x ${i.productName}`).join(', ');

    // Create the order
    const order = await Order.create({
      customerName,
      customerEmail,
      phoneNumber,
      language,
      items: orderItems,
      shippingAddress: shippingAddress || {},
      paymentMethod,
      subtotal,
      deliveryCharge,
      totalAmount,
      // Legacy fields for backward compatibility with ConversationManager
      productName: productSummary,
      productQty: orderItems.reduce((s, i) => s + i.quantity, 0),
      productPrice: totalAmount,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      status: 'pending',
    });

    console.log(`🛒 New order placed: ${order._id} by ${customerName} (${phoneNumber})`);

    // Auto-trigger AI confirmation call
    try {
      const call = await initiateCall(phoneNumber, order._id.toString(), language);
      order.callSid = call.sid;
      await order.save();
      console.log(`📞 Auto-call triggered for order ${order._id}`);
    } catch (callError) {
      console.error(`❌ Auto-call failed for order ${order._id}:`, callError.message);
      // Order is still created even if call fails
    }

    // Emit real-time event to admin dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', {
        orderId: order._id,
        customerName,
        phoneNumber,
        items: orderItems,
        totalAmount,
        status: 'pending',
      });
      io.emit('orderUpdated');
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! You will receive a confirmation call shortly.',
      data: {
        orderId: order._id,
        items: orderItems,
        subtotal,
        deliveryCharge,
        totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('❌ Place order error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
};

/**
 * GET /api/shop/track/:id
 * Customer tracks their order status
 */
const trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        customerName: order.customerName,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        shippingAddress: order.shippingAddress,
        estimatedDelivery: order.estimatedDelivery,
        aiSummary: order.aiSummary,
        transcript: order.transcript,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to track order' });
  }
};

module.exports = { placeOrder, trackOrder };
