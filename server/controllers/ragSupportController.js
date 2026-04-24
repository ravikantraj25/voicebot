/**
 * RAG Support Controller
 * ─────────────────────────────────────────────────────────────────
 * Handles intelligent customer support calls using RAG.
 * When customer presses 3 (Support) → this controller takes over.
 *
 * Flow:
 *  Press 3 → Gather customer's spoken/typed issue →
 *  RAG retrieves relevant policy → AI answers with policy context →
 *  If action needed (refund/cancel/return) → Policy validation →
 *  Execute action OR escalate to human
 *
 * Routes added:
 *  POST /api/twilio/rag-support         — RAG support entry point
 *  POST /api/twilio/rag-query           — Process customer query with RAG
 *  POST /api/twilio/rag-action          — Execute a policy-validated action
 */

const twilio = require('twilio');
const Order = require('../models/Order');
const { getMessages, getVoiceConfig } = require('../services/messageService');
const {
  answerPolicyQuestion,
  processAgentAction,
  generatePolicyAwareSummary,
} = require('../services/ragService');

const VoiceResponse = twilio.twiml.VoiceResponse;

// ─────────────────────────────────────────────────────────────────
// RAG Support Menu — Entry point when customer presses 3
// Instead of fixed menu, we gather their issue in spoken form
// ─────────────────────────────────────────────────────────────────
const handleRagSupport = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const voiceConfig = getVoiceConfig(language || 'english');

    const twiml = new VoiceResponse();

    // Support menu prompt — ask customer to describe their issue
    const supportPrompts = {
      english: 'Welcome to our support line. You can say what your issue is, or press: 1 for refund, 2 to cancel order, 3 for delivery issue, 4 to speak to an agent.',
      hindi: 'सपोर्ट में आपका स्वागत है। आप अपनी समस्या बता सकते हैं, या दबाएं: 1 रिफंड के लिए, 2 ऑर्डर कैंसिल के लिए, 3 डिलीवरी समस्या के लिए, 4 एजेंट से बात के लिए।',
      kannada: 'ಬೆಂಬಲಕ್ಕೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಸಮಸ್ಯೆ ಹೇಳಿ, ಅಥವಾ ಒತ್ತಿ: 1 ರಿಫಂಡ್, 2 ಆರ್ಡರ್ ರದ್ದು, 3 ಡೆಲಿವರಿ ಸಮಸ್ಯೆ, 4 ಏಜೆಂಟ್.',
      marathi: 'सपोर्टमध्ये स्वागत आहे. तुमची समस्या सांगा, किंवा दाबा: 1 रिफंड, 2 ऑर्डर रद्द, 3 डिलिव्हरी समस्या, 4 एजंट.',
    };

    const prompt = supportPrompts[language] || supportPrompts.english;

    const gather = twiml.gather({
      input: 'dtmf',       // Accept button presses for quick actions
      numDigits: 1,
      action: `/api/twilio/rag-action?orderId=${orderId}&language=${language}`,
      method: 'POST',
      timeout: 8,
      finishOnKey: '',
    });

    gather.say({ voice: voiceConfig.voice, language: voiceConfig.language }, prompt);

    // If no input — gentle reminder
    twiml.say(
      { voice: voiceConfig.voice, language: voiceConfig.language },
      language === 'hindi'
        ? 'कोई इनपुट नहीं मिला। कृपया दोबारा कोशिश करें।'
        : 'We did not receive your input. Please call back or reach us on WhatsApp. Goodbye.'
    );

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('❌ RAG Support error:', error.message);
    const twiml = new VoiceResponse();
    twiml.say('Support service error. Please try again. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

// ─────────────────────────────────────────────────────────────────
// RAG Action Handler — Processes DTMF input (1/2/3/4)
// Each press maps to a specific action that gets policy-validated
// ─────────────────────────────────────────────────────────────────
const handleRagAction = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const digits = req.body.Digits;
    const voiceConfig = getVoiceConfig(language || 'english');
    const messages = getMessages(language || 'english');

    const twiml = new VoiceResponse();
    const order = orderId ? await Order.findById(orderId) : null;

    if (!order) {
      twiml.say(voiceConfig, 'Order not found. Please try again. Goodbye.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Map digits to action queries for policy validation
    const actionMap = {
      '1': 'Customer is requesting a refund for their order',
      '2': 'Customer wants to cancel their order',
      '3': 'Customer has a delivery issue and wants to know status or get help',
      '4': 'Customer wants to speak to a human agent',
    };

    const requestedAction = actionMap[digits];

    if (!requestedAction) {
      twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.invalid || 'Invalid option. Goodbye.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // ─── Step 1: Validate action against policy using RAG ───
    const policyDecision = await processAgentAction(requestedAction, order);
    console.log(`🔍 Policy decision for order ${orderId}:`, policyDecision);

    // ─── Step 2: Execute or escalate based on policy decision ───
    if (policyDecision.requiresEscalation || !policyDecision.allowed) {
      // ESCALATE — Policy says human must handle this
      order.issueType = digits === '1' ? 'payment' : digits === '2' ? 'delivery' : digits === '3' ? 'delivery' : 'agent-transfer';
      order.status = 'escalated';
      order.transcript.push({ role: 'customer', text: `Pressed ${digits} — ${requestedAction}` });
      order.transcript.push({ role: 'bot', text: policyDecision.customerMessage });
      await order.save();

      const io = req.app.get('io');
      io.emit('orderUpdated');

      twiml.say(
        { voice: voiceConfig.voice, language: voiceConfig.language },
        policyDecision.customerMessage || messages.agentTransfer
      );

      // Generate enhanced policy-aware summary in background
      generatePolicyAwareSummary(order, [policyDecision.action]).then(async (result) => {
        order.aiSummary = result.summary;
        order.sentiment = result.sentiment;
        order.flagged = result.flagged || result.followUpRequired;
        await order.save();
        io.emit('summaryReady', { orderId, ...result });
        io.emit('orderUpdated');
      }).catch((e) => console.error('Summary error:', e));

    } else if (policyDecision.allowed && policyDecision.action === 'cancel_order') {
      // ─── AUTO-CANCEL (within 1-hour window) ───
      order.status = 'rejected';
      order.issueType = 'delivery';
      order.transcript.push({ role: 'customer', text: 'Requested order cancellation via RAG support' });
      order.transcript.push({ role: 'bot', text: policyDecision.customerMessage });
      await order.save();

      const io = req.app.get('io');
      const activeCalls = req.app.get('activeCalls');
      activeCalls.delete(orderId);
      io.emit('callEnded', { orderId, status: 'rejected' });
      io.emit('orderUpdated');

      twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, policyDecision.customerMessage);

      // WhatsApp cancellation confirmation
      const { sendWhatsAppConfirmation } = require('../services/twilioService');
      sendWhatsAppConfirmation(order).catch((e) => console.error('WhatsApp error:', e));

      generatePolicyAwareSummary(order, ['order_cancelled']).then(async (result) => {
        order.aiSummary = result.summary;
        order.sentiment = result.sentiment;
        order.flagged = result.flagged;
        await order.save();
        io.emit('summaryReady', { orderId, ...result });
        io.emit('orderUpdated');
      }).catch((e) => console.error('Summary error:', e));

    } else if (policyDecision.allowed && policyDecision.action === 'initiate_refund') {
      // ─── INITIATE REFUND REQUEST ───
      order.issueType = 'payment';
      order.status = 'escalated'; // Refunds always go to finance team
      order.transcript.push({ role: 'customer', text: 'Requested refund via RAG support' });
      order.transcript.push({ role: 'bot', text: policyDecision.customerMessage });
      await order.save();

      const io = req.app.get('io');
      io.emit('orderUpdated');

      twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, policyDecision.customerMessage);

      generatePolicyAwareSummary(order, ['refund_initiated']).then(async (result) => {
        order.aiSummary = result.summary;
        order.sentiment = result.sentiment;
        order.flagged = result.followUpRequired;
        await order.save();
        io.emit('summaryReady', { orderId, ...result });
        io.emit('orderUpdated');
      }).catch((e) => console.error('Summary error:', e));

    } else if (policyDecision.allowed && policyDecision.action === 'initiate_return') {
      // ─── INITIATE RETURN REQUEST ───
      order.issueType = 'product';
      order.status = 'escalated';
      order.transcript.push({ role: 'customer', text: 'Requested return via RAG support' });
      order.transcript.push({ role: 'bot', text: policyDecision.customerMessage });
      await order.save();

      const io = req.app.get('io');
      io.emit('orderUpdated');

      twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, policyDecision.customerMessage);

      generatePolicyAwareSummary(order, ['return_initiated']).then(async (result) => {
        order.aiSummary = result.summary;
        order.sentiment = result.sentiment;
        order.flagged = result.followUpRequired;
        await order.save();
        io.emit('summaryReady', { orderId, ...result });
        io.emit('orderUpdated');
      }).catch((e) => console.error('Summary error:', e));

    } else {
      // ─── PROVIDE INFORMATION (delivery, tracking, general) ───
      order.transcript.push({ role: 'customer', text: `Pressed ${digits} — Information request` });
      order.transcript.push({ role: 'bot', text: policyDecision.customerMessage });
      await order.save();

      const io = req.app.get('io');
      io.emit('orderUpdated');

      twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, policyDecision.customerMessage);
    }

    // Closing message
    const closingPrompt = twiml.gather({
      numDigits: 1,
      action: `/api/twilio/after-support?orderId=${orderId}&language=${language}`,
      method: 'POST',
      timeout: 6,
      finishOnKey: '',
    });

    const closingMsg = {
      english: 'Is there anything else I can help you with? Press 1 to return to the main menu, or hang up to end the call.',
      hindi: 'क्या और कुछ मैं आपकी मदद कर सकता हूं? मुख्य मेनू के लिए 1 दबाएं, या कॉल समाप्त करने के लिए फोन रखें।',
      kannada: 'ಬೇರೇನಾದರೂ ಸಹಾಯ ಬೇಕೇ? ಮುಖ್ಯ ಮೆನುಗೆ 1 ಒತ್ತಿ.',
      marathi: 'आणखी काही मदत हवी का? मुख्य मेनूसाठी 1 दाबा.',
    };

    closingPrompt.say(
      { voice: voiceConfig.voice, language: voiceConfig.language },
      closingMsg[language] || closingMsg.english
    );

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('❌ RAG Action error:', error.message);
    const twiml = new VoiceResponse();
    twiml.say('We encountered an error. Please try again later. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

// ─────────────────────────────────────────────────────────────────
// RAG Policy Query API — For Dashboard / WhatsApp Bot
// POST /api/twilio/rag-query
// Body: { query: "Can I cancel my order?", orderId: "...", language: "hindi" }
// Returns: { answer, policiesUsed, confidence }
// ─────────────────────────────────────────────────────────────────
const handleRagQuery = async (req, res) => {
  try {
    const { query, orderId, language } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const order = orderId ? await Order.findById(orderId) : null;
    const result = await answerPolicyQuestion(query, order, language || 'english');

    res.status(200).json({
      success: true,
      query,
      answer: result.answer,
      policiesUsed: result.policiesUsed,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('❌ RAG Query API error:', error.message);
    res.status(500).json({ success: false, message: 'RAG query failed', error: error.message });
  }
};

module.exports = {
  handleRagSupport,
  handleRagAction,
  handleRagQuery,
};
