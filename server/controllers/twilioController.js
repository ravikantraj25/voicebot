/**
 * Twilio Controller — Enhanced
 * Multi-level IVR with product details, recording, WhatsApp fallback,
 * AI summaries, and real-time Socket.io events
 */
const twilio = require('twilio');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { getMessages, getVoiceConfig } = require('../services/messageService');
const { sendWhatsAppFallback, sendWhatsAppConfirmation } = require('../services/twilioService');
const { generateCallSummary, processWhatsAppMessage } = require('../services/groqService');

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Build product greeting string based on language
 */
const getProductGreeting = (order, language) => {
  if (!order.productName) return '';

  const greetings = {
    english: `You have ordered ${order.productQty} ${order.productName} for ${order.productPrice} rupees.`,
    hindi: `आपने ${order.productQty} ${order.productName} ₹${order.productPrice} में ऑर्डर किया है।`,
    kannada: `ನೀವು ${order.productQty} ${order.productName} ₹${order.productPrice} ಗೆ ಆರ್ಡರ್ ಮಾಡಿದ್ದೀರಿ.`,
    marathi: `तुम्ही ${order.productQty} ${order.productName} ₹${order.productPrice} ला ऑर्डर केला आहे.`,
  };

  return greetings[language] || greetings.english;
};

/**
 * POST /api/twilio/voice — Level 1: Main Menu
 */
const handleVoice = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const messages = getMessages(language || 'english');
    const voiceConfig = getVoiceConfig(language || 'english');

    // Get order to read product details
    const order = orderId ? await Order.findById(orderId) : null;
    const productGreeting = order ? getProductGreeting(order, language) : '';

    const twiml = new VoiceResponse();

    // The host needs to be passed via headers or environment.
    // Assuming BASE_URL is set to the ngrok public URL.
    const wsUrl = process.env.BASE_URL 
      ? process.env.BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://') 
      : `ws://${req.get('host')}`;

    // Step 1: Initial greeting before stream starts (Feature 10: Auto language detection hook)
    const initialGreeting = language === 'english' 
      ? `Hello! This is Aria. I am calling regarding your order of ${order?.productName}.`
      : 'Hello! Please say your preferred language.'; // Auto language detection prompt

    twiml.say(
      { voice: 'alice', language: 'en-IN' },
      initialGreeting
    );

    // Step 2: Connect the real-time media stream to our WebSocket server
    const connect = twiml.connect();
    const stream = connect.stream({
      url: `${wsUrl}/api/twilio/stream`,
    });
    
    stream.parameter({ name: 'orderId', value: orderId });
    stream.parameter({ name: 'language', value: language || 'english' });

    // Keep the call alive while the WebSocket stream handles the conversation
    // The stream will keep running until the call ends or times out
    twiml.pause({ length: 120 });
    twiml.say({ voice: 'alice', language: 'en-IN' }, 'Thank you for your time. Goodbye!');

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(`❌ TwiML voice error: ${error.message}`);
    const twiml = new VoiceResponse();
    twiml.say('We encountered an error. Please try again later. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * POST /api/twilio/inbound — Handles customer calling the AI agent directly
 */
const handleInboundVoice = async (req, res) => {
  try {
    const { From, CallSid } = req.body;
    console.log(`📞 Incoming call from ${From} (Sid: ${CallSid})`);

    // 1. Check if customer exists
    let customer = await Customer.findOne({ phoneNumber: From });
    let isNewCustomer = false;
    
    if (!customer) {
      customer = await Customer.create({ phoneNumber: From });
      isNewCustomer = true;
    }
    
    const language = customer.preferredLanguage || 'unknown';
    
    // 2. Create a placeholder Order/Interaction to track the call
    const order = await Order.create({
      phoneNumber: From,
      language: language === 'unknown' ? 'english' : language, // default for now
      status: 'pending',
      callSid: CallSid,
      issueType: 'none',
      productName: 'Inbound Call Inquiry'
    });

    const twiml = new VoiceResponse();
    const wsUrl = process.env.BASE_URL 
      ? process.env.BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://') 
      : `ws://${req.get('host')}`;

    // 3. Optional initial prompt (or let WebSocket handle it)
    twiml.say(
      { voice: 'alice', language: 'en-IN' },
      'Please wait while we connect you to Aria.'
    );

    // 4. Connect to WebSocket
    const connect = twiml.connect();
    const stream = connect.stream({
      url: `${wsUrl}/api/twilio/stream`,
    });
    
    stream.parameter({ name: 'orderId', value: order._id.toString() });
    stream.parameter({ name: 'language', value: language });
    stream.parameter({ name: 'isInbound', value: 'true' });
    stream.parameter({ name: 'isNewCustomer', value: isNewCustomer.toString() });

    twiml.pause({ length: 120 });
    twiml.say('Thank you for calling. Goodbye.');

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(`❌ Inbound voice error: ${error.message}`);
    const twiml = new VoiceResponse();
    twiml.say('We encountered an error processing your call. Please try again later.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * POST /api/twilio/response — Level 1: Process input
 */
const handleResponse = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const digits = req.body.Digits;
    const messages = getMessages(language || 'english');
    const voiceConfig = getVoiceConfig(language || 'english');

    const twiml = new VoiceResponse();
    const order = orderId ? await Order.findById(orderId) : null;

    switch (digits) {
      case '1':
        twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.confirmed);
        if (order) {
          order.status = 'confirmed';
          order.transcript.push({ role: 'customer', text: 'Pressed 1 — Confirmed' });
          order.transcript.push({ role: 'bot', text: messages.confirmed });
          await order.save();

          // Emit Socket.io event
          const io1 = req.app.get('io');
          const activeCalls1 = req.app.get('activeCalls');
          activeCalls1.delete(orderId);
          io1.emit('callEnded', { orderId, status: 'confirmed' });
          io1.emit('orderUpdated');

          // Send WhatsApp confirmation message
          sendWhatsAppConfirmation(order).catch((e) => console.error('WhatsApp confirm error:', e));

          // Generate AI summary in background
          generateCallSummary(order).then(async (result) => {
            order.aiSummary = result.summary;
            order.sentiment = result.sentiment;
            order.flagged = result.flagged;
            await order.save();
            io1.emit('summaryReady', { orderId, ...result });
            io1.emit('orderUpdated');
          }).catch((e) => console.error('Summary error:', e));
        }
        break;

      case '2':
        twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.rejected);
        if (order) {
          order.status = 'rejected';
          order.transcript.push({ role: 'customer', text: 'Pressed 2 — Rejected' });
          order.transcript.push({ role: 'bot', text: messages.rejected });
          await order.save();

          const io2 = req.app.get('io');
          const activeCalls2 = req.app.get('activeCalls');
          activeCalls2.delete(orderId);
          io2.emit('callEnded', { orderId, status: 'rejected' });
          io2.emit('orderUpdated');

          // Send WhatsApp rejection message
          sendWhatsAppConfirmation(order).catch((e) => console.error('WhatsApp reject error:', e));

          generateCallSummary(order).then(async (result) => {
            order.aiSummary = result.summary;
            order.sentiment = result.sentiment;
            order.flagged = result.flagged;
            await order.save();
            io2.emit('summaryReady', { orderId, ...result });
            io2.emit('orderUpdated');
          }).catch((e) => console.error('Summary error:', e));
        }
        break;

      case '3':
        if (order) {
          order.transcript.push({ role: 'customer', text: 'Pressed 3 — Support' });
          await order.save();
        }
        twiml.redirect(`/api/twilio/support?orderId=${orderId}&language=${language}`);
        break;

      default:
        twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.invalid);
        twiml.redirect(`/api/twilio/voice?orderId=${orderId}&language=${language}`);
        break;
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(`❌ TwiML response error: ${error.message}`);
    const twiml = new VoiceResponse();
    twiml.say('We encountered an error. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * POST /api/twilio/support — Level 2: Support Menu
 */
const handleSupport = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const messages = getMessages(language || 'english');
    const voiceConfig = getVoiceConfig(language || 'english');

    const twiml = new VoiceResponse();
    const gather = twiml.gather({
      numDigits: 1,
      action: `/api/twilio/support-response?orderId=${orderId}&language=${language}`,
      method: 'POST',
      timeout: 10,
      finishOnKey: '',
    });

    gather.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.supportMenu);
    twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.noInput);

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(`❌ Support menu error: ${error.message}`);
    const twiml = new VoiceResponse();
    twiml.say('Error. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * POST /api/twilio/support-response — Level 2: Process support input
 */
const handleSupportResponse = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const digits = req.body.Digits;
    const messages = getMessages(language || 'english');
    const voiceConfig = getVoiceConfig(language || 'english');

    const twiml = new VoiceResponse();
    let issueType = '';
    let responseMessage = '';

    switch (digits) {
      case '1': issueType = 'delivery'; responseMessage = messages.deliveryIssue; break;
      case '2': issueType = 'payment'; responseMessage = messages.paymentIssue; break;
      case '3': issueType = 'product'; responseMessage = messages.productIssue; break;
      case '4': issueType = 'agent-transfer'; responseMessage = messages.agentTransfer; break;
      default:
        twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.invalid);
        twiml.redirect(`/api/twilio/support?orderId=${orderId}&language=${language}`);
        res.type('text/xml');
        return res.send(twiml.toString());
    }

    if (orderId && issueType) {
      const order = await Order.findById(orderId);
      if (order) {
        order.issueType = issueType;
        order.status = issueType === 'agent-transfer' ? 'escalated' : 'confirmed';
        order.transcript.push({ role: 'customer', text: `Pressed ${digits} — ${issueType}` });
        order.transcript.push({ role: 'bot', text: responseMessage });
        await order.save();

        const io = req.app.get('io');
        io.emit('orderUpdated');
      }
    }

    const gather = twiml.gather({
      numDigits: 1,
      action: `/api/twilio/after-support?orderId=${orderId}&language=${language}`,
      method: 'POST',
      timeout: 8,
      finishOnKey: '',
    });

    gather.say({ voice: voiceConfig.voice, language: voiceConfig.language }, responseMessage);
    twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.thankYou);

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(`❌ Support response error: ${error.message}`);
    const twiml = new VoiceResponse();
    twiml.say('Error. Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * POST /api/twilio/after-support — Level 3: Post-resolution
 */
const handleAfterSupport = async (req, res) => {
  try {
    const { orderId, language } = req.query;
    const digits = req.body.Digits;
    const messages = getMessages(language || 'english');
    const voiceConfig = getVoiceConfig(language || 'english');

    const twiml = new VoiceResponse();

    if (digits === '1') {
      twiml.redirect(`/api/twilio/voice?orderId=${orderId}&language=${language}`);
    } else {
      twiml.say({ voice: voiceConfig.voice, language: voiceConfig.language }, messages.thankYou);
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    const twiml = new VoiceResponse();
    twiml.say('Goodbye.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

/**
 * POST /api/twilio/status — Call status updates
 * Also triggers WhatsApp fallback when call goes unanswered
 */
const handleStatus = async (req, res) => {
  try {
    const { orderId } = req.query;
    const { CallStatus, CallDuration } = req.body;

    console.log(`📱 Status: ${CallStatus} for order ${orderId}`);

    if (orderId) {
      const updates = {};
      const order = await Order.findById(orderId);

      if (['busy', 'no-answer', 'canceled', 'failed'].includes(CallStatus)) {
        updates.status = 'failed';

        // Trigger WhatsApp fallback for unanswered calls
        if (order && ['no-answer', 'busy'].includes(CallStatus)) {
          console.log(`📱 Triggering WhatsApp fallback for ${order.phoneNumber}`);
          const whatsappResult = await sendWhatsAppFallback(order);
          if (whatsappResult) {
            updates.whatsappSent = true;
          }
        }
      }

      if (CallDuration) {
        updates.callDuration = parseInt(CallDuration, 10);
      }

      if (Object.keys(updates).length > 0) {
        await Order.findByIdAndUpdate(orderId, updates);
      }

      // Remove from active calls and notify
      const io = req.app.get('io');
      const activeCalls = req.app.get('activeCalls');

      if (CallStatus === 'completed' || ['busy', 'no-answer', 'canceled', 'failed'].includes(CallStatus)) {
        activeCalls.delete(orderId);
        io.emit('callEnded', { orderId, status: updates.status || CallStatus });
      }
      io.emit('orderUpdated');
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(`❌ Status callback error: ${error.message}`);
    res.sendStatus(500);
  }
};

/**
 * POST /api/twilio/recording — Recording ready callback
 */
const handleRecording = async (req, res) => {
  try {
    const { orderId } = req.query;
    const { RecordingUrl, RecordingSid } = req.body;

    if (orderId && RecordingUrl) {
      await Order.findByIdAndUpdate(orderId, {
        recordingUrl: RecordingUrl + '.mp3',
        recordingSid: RecordingSid,
      });
      console.log(`🎙️ Recording saved for order ${orderId}`);

      const io = req.app.get('io');
      io.emit('orderUpdated');
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(`❌ Recording callback error: ${error.message}`);
    res.sendStatus(500);
  }
};

/**
 * POST /api/twilio/whatsapp-inbound
 * Handles incoming WhatsApp messages from Twilio Sandbox
 */
const handleWhatsAppInbound = async (req, res) => {
  try {
    const { From, Body } = req.body;
    console.log(`💬 WhatsApp from ${From}: ${Body}`);

    // Create a TwiML response
    const MessagingResponse = require('twilio').twiml.MessagingResponse;
    const twiml = new MessagingResponse();

    // Check if we have an order associated with this number recently
    const recentOrder = await Order.findOne({ phoneNumber: From.replace('whatsapp:', '') }).sort({ createdAt: -1 });

    if (recentOrder) {
      // 1. Process via Groq
      const { replyText, action } = await processWhatsAppMessage(recentOrder, Body);
      
      // 2. Save customer message and bot reply to transcript
      recentOrder.transcript.push({ role: 'customer', text: `(WhatsApp) ${Body}` });
      recentOrder.transcript.push({ role: 'bot', text: `(WhatsApp) ${replyText}` });
      
      // 3. Take action if needed
      if (action === 'confirm' && recentOrder.status !== 'confirmed') {
        recentOrder.status = 'confirmed';
      } else if (action === 'reject' && recentOrder.status !== 'rejected') {
        recentOrder.status = 'rejected';
      }
      
      await recentOrder.save();
      
      // 4. Update the live dashboard
      const io = req.app.get('io');
      if (io) {
        io.emit('orderUpdated');
        if (action === 'confirm' || action === 'reject') {
          io.emit('callEnded', { orderId: recentOrder._id, status: recentOrder.status });
        }
      }
      
      // 5. Send TwiML reply
      twiml.message(replyText);
    } else {
      twiml.message('Hi from Automaton Store! We could not find a recent order for this number. Please visit our website to place a new order.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(`❌ WhatsApp inbound error: ${error.message}`);
    const MessagingResponse = require('twilio').twiml.MessagingResponse;
    const twiml = new MessagingResponse();
    twiml.message("Sorry, I'm having trouble connecting to the system right now.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

module.exports = {
  handleVoice,
  handleResponse,
  handleSupport,
  handleSupportResponse,
  handleAfterSupport,
  handleStatus,
  handleRecording,
  handleInboundVoice,
  handleWhatsAppInbound,
};
