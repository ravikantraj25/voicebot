/**
 * Call Controller — Enhanced
 * Handles call initiation with product details, recording, WhatsApp fallback,
 * AI summaries, and real-time Socket.io events
 */
const Order = require('../models/Order');
const { initiateCall } = require('../services/twilioService');
const { generateCallSummary } = require('../services/groqService');
const { transcribeAudio } = require('../services/deepgramService');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/call
 * Initiate a new voice call with product details
 */
const startCall = async (req, res) => {
  try {
    const { phoneNumber, language, productName, productQty, productPrice } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    if (!language || !['english', 'hindi', 'kannada', 'marathi'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Valid language is required (english, hindi, kannada, marathi)',
      });
    }

    // Create order with product info
    const order = await Order.create({
      phoneNumber,
      language,
      status: 'pending',
      productName: productName || null,
      productQty: productQty || 1,
      productPrice: productPrice || 0,
    });

    // Initiate Exotel call
    const call = await initiateCall(phoneNumber, order._id.toString(), language);
    order.callSid = call.sid;
    await order.save();

    console.log(`✅ Call started for order ${order._id} (${order.productName || 'no product'})`);

    // Emit real-time event
    const io = req.app.get('io');
    const activeCalls = req.app.get('activeCalls');

    activeCalls.set(order._id.toString(), {
      orderId: order._id,
      phoneNumber,
      language,
      productName: order.productName,
      startedAt: new Date(),
    });

    io.emit('callStarted', {
      orderId: order._id,
      phoneNumber,
      language,
      productName: order.productName,
      productQty: order.productQty,
      productPrice: order.productPrice,
    });

    io.emit('orderUpdated');

    res.status(201).json({
      success: true,
      message: 'Call initiated successfully',
      data: {
        orderId: order._id,
        callSid: call.sid,
        phoneNumber,
        language,
        productName: order.productName,
        status: order.status,
      },
    });
  } catch (error) {
    console.error(`❌ Start call error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to initiate call', error: error.message });
  }
};

/**
 * POST /api/call/retry/:id
 * Retry a call for an existing order
 */
const retryCall = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = 'pending';
    order.retryCount += 1;
    await order.save();

    const call = await initiateCall(order.phoneNumber, order._id.toString(), order.language);
    order.callSid = call.sid;
    await order.save();

    console.log(`🔄 Retry call #${order.retryCount} for order ${order._id}`);

    const io = req.app.get('io');
    io.emit('orderUpdated');

    res.status(200).json({
      success: true,
      message: 'Retry call initiated successfully',
      data: { orderId: order._id, callSid: call.sid, retryCount: order.retryCount },
    });
  } catch (error) {
    console.error(`❌ Retry call error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to retry call', error: error.message });
  }
};

/**
 * POST /api/call/batch
 * Batch call multiple customers
 */
const batchCall = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Contacts array is required' });
    }

    const results = [];
    const validLanguages = ['english', 'hindi', 'kannada', 'marathi'];

    for (const contact of contacts) {
      try {
        const { phoneNumber, language = 'english' } = contact;
        const lang = validLanguages.includes(language) ? language : 'english';

        const order = await Order.create({ phoneNumber, language: lang, status: 'pending' });
        const call = await initiateCall(phoneNumber, order._id.toString(), lang);
        order.callSid = call.sid;
        await order.save();

        results.push({ phoneNumber, language: lang, status: 'initiated', orderId: order._id });
      } catch (err) {
        results.push({ phoneNumber: contact.phoneNumber, status: 'failed', error: err.message });
      }
    }

    const io = req.app.get('io');
    io.emit('orderUpdated');

    res.status(201).json({
      success: true,
      message: `${results.filter((r) => r.status === 'initiated').length}/${contacts.length} calls initiated`,
      data: results,
    });
  } catch (error) {
    console.error(`❌ Batch call error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to process batch calls', error: error.message });
  }
};

/**
 * POST /api/call/summary/:id
 * Generate AI summary for a completed call using Groq
 */
const generateSummary = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const result = await generateCallSummary(order);

    order.aiSummary = result.summary;
    order.sentiment = result.sentiment;
    order.flagged = result.flagged;
    await order.save();

    const io = req.app.get('io');
    io.emit('orderUpdated');

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(`❌ Summary error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to generate summary' });
  }
};

/**
 * POST /api/call/voice-command
 * Transcribes admin voice and returns parsed intent via Groq
 */
const handleVoiceCommand = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio provided' });
    }

    // 1. Transcribe audio using Deepgram
    const transcript = await transcribeAudio(req.file.buffer);
    if (!transcript) {
      return res.status(200).json({ success: true, intent: { action: 'none' }, transcript: '' });
    }

    // 2. Parse intent using Groq LLM
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an intent parser for a dashboard voice assistant.
Parse the following transcript into a JSON object with this exact structure:
{
  "action": "call_pending" | "call_language" | "filter_failed" | "refresh" | "search" | "unknown",
  "language": "hindi" | "english" | "kannada" | "marathi" | null,
  "searchQuery": "optional exact text to search for"
}
Examples:
"call all pending hindi orders" -> {"action": "call_language", "language": "hindi"}
"show me failed calls" -> {"action": "filter_failed"}
"how many confirmed today" -> {"action": "search", "searchQuery": "how many confirmed today"}
Only return valid JSON, nothing else.`
        },
        { role: 'user', content: transcript }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const intent = JSON.parse(completion.choices[0].message.content);

    res.status(200).json({
      success: true,
      transcript,
      intent
    });
  } catch (error) {
    console.error('❌ Voice command error:', error);
    res.status(500).json({ success: false, message: 'Voice command failed' });
  }
};

module.exports = { startCall, retryCall, batchCall, generateSummary, handleVoiceCommand };
