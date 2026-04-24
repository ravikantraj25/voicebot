const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { sendWhatsAppFallback } = require('../services/exotelService');

// In-memory store for pending inbound call context (CallSid → orderData)
// This bridges the gap between the Passthru applet and the Voicebot applet
const pendingInboundCalls = new Map();

/**
 * POST /api/exotel/voice
 * Exotel Passthru applet hits this for OUTBOUND calls.
 * Returns ExoML with a greeting.
 */
const handleVoice = async (req, res) => {
  try {
    const { orderId, language } = req.query;

    const exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello! This is Aria from Automaton AI. Please wait while I connect you.</Say>
</Response>`;

    res.type('text/xml');
    res.send(exoml);
  } catch (error) {
    console.error(`❌ ExoML voice error: ${error.message}`);
    res.type('text/xml');
    res.send(`<Response><Say>Error occurred. Goodbye.</Say><Hangup/></Response>`);
  }
};

/**
 * POST /api/exotel/inbound
 * 
 * Exotel Passthru applet hits this when a customer CALLS IN to your ExoPhone.
 * 
 * Flow:
 *   1. Customer dials 095-138-86363 or 080-472-81120
 *   2. Exotel Flow → Passthru Applet → hits this URL
 *   3. We look up the customer by phone number
 *   4. We create an interaction record in MongoDB
 *   5. We store the context so the Voicebot Applet (next in the flow) can use it
 *   6. We return ExoML that passes control to the next applet
 * 
 * Exotel sends these fields in the POST body:
 *   - CallSid: unique call identifier
 *   - From: caller's phone number
 *   - To: the ExoPhone number they dialed
 *   - CallType: "call-attempt" etc.
 */
const handleInbound = async (req, res) => {
  try {
    const { CallSid, From, To, CurrentAppId } = req.body;
    const callerNumber = From || req.query.From;
    const callSid = CallSid || req.query.CallSid;

    console.log(`📞 ═══════════════════════════════════════`);
    console.log(`📞 INBOUND CALL from ${callerNumber}`);
    console.log(`📞 CallSid: ${callSid}`);
    console.log(`📞 To ExoPhone: ${To}`);
    console.log(`📞 ═══════════════════════════════════════`);

    // 1. Look up existing customer
    let customer = await Customer.findOne({ 
      phoneNumber: { $in: [callerNumber, `+91${callerNumber}`, callerNumber?.replace('+91', '')] } 
    });
    let isNewCustomer = false;

    if (!customer) {
      // New customer — register them
      customer = await Customer.create({ phoneNumber: callerNumber });
      isNewCustomer = true;
      console.log(`👤 New customer registered: ${callerNumber}`);
    } else {
      console.log(`👤 Returning customer found: ${callerNumber} (lang: ${customer.preferredLanguage || 'unknown'})`);
    }

    const language = customer.preferredLanguage || 'english';

    // 2. Create an Order/Interaction record to track this inbound call
    const order = await Order.create({
      phoneNumber: callerNumber,
      language: language,
      status: 'pending',
      callSid: callSid,
      issueType: 'none',
      productName: 'Inbound Call',
      productQty: 0,
      productPrice: 0,
    });

    console.log(`📝 Inbound order created: ${order._id}`);

    // 3. Store context for the WebSocket handler to pick up
    //    When the Voicebot Applet connects via WebSocket, we use CallSid to find this context.
    pendingInboundCalls.set(callSid, {
      orderId: order._id.toString(),
      language: language,
      isInbound: true,
      isNewCustomer: isNewCustomer,
      customerName: customer.customerId || null,
    });

    // Auto-cleanup after 5 minutes
    setTimeout(() => pendingInboundCalls.delete(callSid), 5 * 60 * 1000);

    // 4. Emit to dashboard
    const io = req.app.get('io');
    const activeCalls = req.app.get('activeCalls');

    activeCalls.set(order._id.toString(), {
      orderId: order._id,
      phoneNumber: callerNumber,
      language,
      productName: 'Inbound Call',
      startedAt: new Date(),
      isInbound: true,
    });

    io.emit('callStarted', {
      orderId: order._id,
      phoneNumber: callerNumber,
      language,
      productName: 'Inbound Call',
      isInbound: true,
    });
    io.emit('orderUpdated');

    // 5. Return ExoML — pass to next applet in the flow (Voicebot Applet)
    //    The <Say> gives a brief greeting while the Voicebot applet connects.
    const greetings = {
      english: 'Welcome to Automaton AI. Connecting you to Aria now.',
      hindi: 'Automaton AI में आपका स्वागत है। Aria से जोड़ रहे हैं।',
      kannada: 'Automaton AI ಗೆ ಸ್ವಾಗತ. Aria ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ.',
      marathi: 'Automaton AI मध्ये आपले स्वागत आहे. Aria शी जोडत आहोत.',
    };

    const greeting = greetings[language] || greetings.english;

    const exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${greeting}</Say>
</Response>`;

    res.type('text/xml');
    res.send(exoml);
  } catch (error) {
    console.error(`❌ Inbound call error: ${error.message}`);
    res.type('text/xml');
    res.send(`<Response><Say>We encountered an error. Please try again later.</Say><Hangup/></Response>`);
  }
};

/**
 * POST /api/exotel/status
 * Exotel Call Status Webhook
 */
const handleStatus = async (req, res) => {
  try {
    const { orderId } = req.query;
    const callSid = req.body.CallSid;
    const status = req.body.Status || req.body.CallStatus;
    const callDuration = req.body.CallDuration || req.body.Duration;

    console.log(`📱 Exotel Status: ${status} for order ${orderId || 'unknown'} (CallSid: ${callSid})`);

    // Try to find order by orderId (outbound) or by callSid (inbound)
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (callSid) {
      order = await Order.findOne({ callSid });
    }

    if (order) {
      const updates = {};

      if (['busy', 'no-answer', 'canceled', 'failed'].includes(status)) {
        updates.status = 'failed';

        if (['no-answer', 'busy'].includes(status)) {
          const fallbackResult = await sendWhatsAppFallback(order);
          if (fallbackResult) updates.whatsappSent = true;
        }
      }

      if (callDuration) {
        updates.callDuration = parseInt(callDuration, 10);
      }

      if (Object.keys(updates).length > 0) {
        await Order.findByIdAndUpdate(order._id, updates);
      }

      const io = req.app.get('io');
      const activeCalls = req.app.get('activeCalls');

      if (status === 'completed' || ['busy', 'no-answer', 'canceled', 'failed'].includes(status)) {
        activeCalls.delete(order._id.toString());
        io.emit('callEnded', { orderId: order._id, status: updates.status || status });
      }
      io.emit('orderUpdated');
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(`❌ Status callback error: ${error.message}`);
    res.sendStatus(500);
  }
};

module.exports = {
  handleVoice,
  handleInbound,
  handleStatus,
  pendingInboundCalls,
};
