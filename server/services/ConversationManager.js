/**
 * Conversation Manager
 * Orchestrates the real-time flow between Twilio Media Streams,
 * Deepgram Live STT, Groq LLM, Sarvam TTS, and the Dashboard via Socket.io.
 */
const { createLiveTranscriptionStream } = require('./deepgramService');
const { analyzeEmotion } = require('./humeService');
const { sendWhatsAppConfirmation } = require('./twilioService');
const { generateCallSummary } = require('./groqService');
const Groq = require('groq-sdk');
const Order = require('../models/Order');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class ConversationManager {
  constructor(ws, orderId, language, io, isInbound = false, isNewCustomer = false) {
    this.ws = ws;
    this.orderId = orderId;
    this.language = (language || 'unknown').toLowerCase();
    this.io = io;
    this.isInbound = isInbound;
    this.isNewCustomer = isNewCustomer;
    this.streamSid = null;
    this.order = null;
    this.transcriptHistory = [];
    this.currentUtterance = '';
    this.isBotSpeaking = false;
    this.deepgramConnection = null;
    this.isProcessing = false;
    this.isReady = false;
    this.isCallEnded = false;  // Prevents processing after call is resolved
    this.turnCount = 0;        // Track conversation turns

    this.init();
  }

  async init() {
    try {
      this.order = await Order.findById(this.orderId);

      let systemPrompt = '';

      if (this.isInbound) {
        if (this.isNewCustomer || this.language === 'unknown') {
          systemPrompt = `You are Aria, an AI Voice Assistant for an E-commerce platform.
A customer is calling you for the first time.
RULES:
1. Welcome them warmly.
2. Ask them which language they prefer: English, Hindi, Kannada, or Marathi. They must respond with yes or no for the language.
3. Once they confirm the language, switch to that language.
4. Then ask them for their Customer ID so you can pull up their order details.
5. If they provide an ID, acknowledge it and ask how you can help.
6. Keep replies short (under 25 words). Act naturally, do not use markdown or emojis.`;
        } else {
          systemPrompt = `You are Aria, an AI Voice Assistant for an E-commerce platform.
The customer is calling you. Their preferred language is ${this.language}.
RULES:
1. Speak ONLY in ${this.language}.
2. Welcome them and ask how you can help them today.
3. If they ask to solve a problem, do your best to help them or say you will connect them to a human agent.
4. Keep replies short (under 25 words). Act naturally, do not use markdown or emojis.`;
        }
      } else {
        const productInfo = this.order?.items 
          ? this.order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')
          : this.order?.productName
            ? `${this.order.productQty} ${this.order.productName}`
            : 'their recent order';
            
        const address = this.order?.shippingAddress 
          ? `${this.order.shippingAddress.street || ''}, ${this.order.shippingAddress.city || ''}, ${this.order.shippingAddress.pincode || ''}`
          : 'the address provided';
          
        const customerName = this.order?.customerName || 'Customer';

        systemPrompt = `You are Aria, a warm and friendly voice assistant calling ${customerName} to confirm their order.

ORDER DETAILS: ${productInfo}
TOTAL AMOUNT: ₹${this.order?.totalAmount || this.order?.productPrice || 0}
SHIPPING ADDRESS: ${address}
PAYMENT METHOD: ${this.order?.paymentMethod || 'COD'}
CUSTOMER LANGUAGE: ${this.language === 'unknown' ? 'english' : this.language}

RULES:
- Reply ONLY in ${this.language === 'unknown' ? 'english' : this.language}. Keep replies short and natural (under 30 words).
- Sound like a real human. Never use markdown, bullet points, asterisks, or emojis.
- Do NOT repeat the full order details after the first message.

CONVERSATION FLOW:
1. If customer wants to confirm → Say "Your order is confirmed! Thank you, have a great day!" then add [ORDER_CONFIRMED] at the end.
2. If customer wants to cancel → Say "Your order has been cancelled. Thank you for your time." then add [ORDER_REJECTED] at the end.
3. If customer wants to change the address → Use the update_shipping_address tool.
4. If customer wants to change the quantity → Use the update_order_quantity tool.
5. If customer asks a question → Answer briefly, then ask again for confirmation.

CRITICAL: When confirming or rejecting the final order, you MUST include the exact tag [ORDER_CONFIRMED] or [ORDER_REJECTED] at the very end of your message. This triggers the system to end the call.`;
      }

      this.transcriptHistory.push({
        role: 'system',
        content: systemPrompt
      });

      await this.startDeepgramStream();

      this.io.emit('liveCallStarted', {
        orderId: this.orderId,
        language: this.language,
      });

      console.log(`🧠 ConversationManager ready for order ${this.orderId} (${this.language})`);
      
      // Proactively greet the customer (don't wait for them to speak first)
      this.speakFirstGreeting();
    } catch (error) {
      console.error('❌ ConversationManager init error:', error);
    }
  }

  async startDeepgramStream() {
    try {
      this.deepgramConnection = await createLiveTranscriptionStream(
        (data) => this.handleTranscriptEvent(data),
        (err) => console.error('❌ Deepgram error:', err)
      );
      this.isReady = true;
      console.log('🎤 Deepgram stream ready');
    } catch (error) {
      console.error('❌ Deepgram stream failed:', error.message);
      this.isReady = false;
    }
  }

  handleAudio(payload) {
    if (this.isBotSpeaking || this.isCallEnded) return;

    if (this.deepgramConnection && this.isReady) {
      const audioBuffer = Buffer.from(payload, 'base64');
      try {
        this.deepgramConnection.sendAudio(audioBuffer);
      } catch (e) {
        // silently ignore
      }
    }
  }

  async handleTranscriptEvent(data) {
    if (this.isCallEnded) return;

    if (data.utteranceEnd && this.currentUtterance.trim().length > 0) {
      const finalText = this.currentUtterance.trim();
      this.currentUtterance = '';
      if (!this.isProcessing) {
        await this.processCustomerSpeech(finalText);
      }
      return;
    }

    if (data.text && data.isFinal) {
      this.currentUtterance += ' ' + data.text;
    }
  }

  async processCustomerSpeech(text) {
    if (!text || text.length < 2 || this.isCallEnded) return;
    this.isProcessing = true;
    this.turnCount++;

    try {
      console.log(`[Customer]: ${text}`);

      // Update DB and dashboard
      this.transcriptHistory.push({ role: 'user', content: text });
      if (this.order) {
        this.order.transcript.push({ role: 'customer', text });
        await this.order.save();
      }
      this.io.emit('newTranscript', { orderId: this.orderId, role: 'customer', text });

      // Emotion analysis in background (don't wait)
      analyzeEmotion(text).then((emotionData) => {
        this.io.emit('emotionUpdated', { orderId: this.orderId, ...emotionData });
      }).catch(() => {});

      // Tell dashboard bot is thinking
      this.io.emit('botThinking', { orderId: this.orderId });

      // Generate reply using FAST model with tools
      const response = await this.generateBotReply(text);
      let reply = '';
      let isConfirmed = false;
      let isRejected = false;

      // Handle Function Calling / Tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`🛠️ Tool Called: ${toolCall.function.name}`, args);
          
          if (toolCall.function.name === 'link_customer_order') {
            reply = `Thank you. I have linked your account to Customer ID ${args.customerId}. How can I assist you with your order?`;
            // Save customer ID
            const Customer = require('../models/Customer');
            await Customer.findOneAndUpdate({ phoneNumber: this.order?.phoneNumber }, { customerId: args.customerId });
          } else if (toolCall.function.name === 'update_language') {
            this.language = args.language;
            reply = `Sure, I will speak in ${args.language} now.`;
            // Update Customer DB
            const Customer = require('../models/Customer');
            await Customer.findOneAndUpdate({ phoneNumber: this.order?.phoneNumber }, { preferredLanguage: args.language });
          } else if (toolCall.function.name === 'escalate_to_n8n') {
            reply = `I am escalating this issue to our support team right now.`;
            // Simulate n8n webhook call
            console.log(`🚀 [n8n Automation Triggered] Issue: ${args.issue_description}`);
          } else if (toolCall.function.name === 'search_knowledge_base') {
            // Mock RAG retrieval
            console.log(`📚 [RAG Search] Query: ${args.query}`);
            reply = `According to our policies, your order will be delivered within 2 business days.`;
          } else if (toolCall.function.name === 'update_shipping_address') {
            reply = `Got it. I have updated your shipping address to ${args.new_address}. Should I go ahead and confirm the order now?`;
            console.log(`📝 [DB Update] Address changed to: ${args.new_address}`);
            if (this.order) {
              this.order.shippingAddress.street = args.new_address;
              await this.order.save();
              this.io.emit('orderUpdated');
            }
          } else if (toolCall.function.name === 'update_order_quantity') {
            reply = `Done! I've updated the quantity to ${args.new_quantity}. Your new total is ready. Should I confirm the order?`;
            console.log(`📝 [DB Update] Quantity changed to: ${args.new_quantity}`);
            if (this.order && this.order.items && this.order.items.length > 0) {
              const oldQty = this.order.items[0].quantity;
              this.order.items[0].quantity = args.new_quantity;
              this.order.subtotal = (this.order.subtotal / oldQty) * args.new_quantity;
              this.order.totalAmount = this.order.subtotal + this.order.deliveryCharge;
              await this.order.save();
              this.io.emit('orderUpdated');
            }
          }
          
          // Append tool response to history so model knows it was executed
          this.transcriptHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: "Success: " + reply
          });
        }
      } else {
        reply = response.content;
      }

      // Check for order resolution tags in standard replies
      if (reply) {
        isConfirmed = reply.includes('[ORDER_CONFIRMED]');
        isRejected = reply.includes('[ORDER_REJECTED]');
        reply = reply.replace('[ORDER_CONFIRMED]', '').replace('[ORDER_REJECTED]', '').trim();
      }
      
      if (!reply) reply = "I am processing that.";

      console.log(`[Aria]: ${reply}${isConfirmed ? ' [CONFIRMED]' : ''}${isRejected ? ' [REJECTED]' : ''}`);

      // Update DB
      this.transcriptHistory.push({ role: 'assistant', content: reply });
      if (this.order) {
        this.order.transcript.push({ role: 'bot', text: reply });
        if (isConfirmed) this.order.status = 'confirmed';
        if (isRejected) this.order.status = 'rejected';
        await this.order.save();
      }
      this.io.emit('newTranscript', { orderId: this.orderId, role: 'bot', text: reply });
      this.io.emit('orderUpdated');

      // Speak the reply
      this.isBotSpeaking = true;
      
      if (isConfirmed || isRejected) {
        // This is the final message — speak it and then hang up
        this.isCallEnded = true;
        await this.speakAndHangUp(reply);
        
        // Post-call actions: WhatsApp + AI Summary
        this.postCallActions(isConfirmed ? 'confirmed' : 'rejected');
      } else {
        await this.speakReply(reply);
      }

    } catch (error) {
      console.error('❌ processCustomerSpeech error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async generateBotReply(userText) {
    const tools = [
      {
        type: 'function',
        function: {
          name: 'link_customer_order',
          description: 'Links the customer to their order using their Customer ID.',
          parameters: {
            type: 'object',
            properties: {
              customerId: { type: 'string', description: 'The customer ID provided by the user.' }
            },
            required: ['customerId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_language',
          description: 'Updates the preferred spoken language of the customer.',
          parameters: {
            type: 'object',
            properties: {
              language: { type: 'string', enum: ['english', 'hindi', 'kannada', 'marathi'] }
            },
            required: ['language']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'escalate_to_n8n',
          description: 'Triggers an n8n webhook automation to escalate a complex issue.',
          parameters: {
            type: 'object',
            properties: {
              issue_description: { type: 'string', description: 'Summary of the issue to escalate.' }
            },
            required: ['issue_description']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_knowledge_base',
          description: 'Searches the RAG knowledge base for store policies, FAQs, or delivery info.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The question to search for in the knowledge base.' }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_shipping_address',
          description: 'Updates the shipping address for the order if the customer wants to change it.',
          parameters: {
            type: 'object',
            properties: {
              new_address: { type: 'string', description: 'The new shipping address provided by the customer.' }
            },
            required: ['new_address']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_order_quantity',
          description: 'Updates the quantity of the product in the order.',
          parameters: {
            type: 'object',
            properties: {
              new_quantity: { type: 'number', description: 'The new quantity the customer wants.' }
            },
            required: ['new_quantity']
          }
        }
      }
    ];

    const completion = await groq.chat.completions.create({
      messages: this.transcriptHistory,
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 150,
      tools: tools,
      tool_choice: 'auto'
    });
    
    // Add the assistant's response to history (needed for tool calls)
    if (completion.choices[0].message.tool_calls) {
      this.transcriptHistory.push(completion.choices[0].message);
    }
    
    return completion.choices[0].message;
  }

  /**
   * Send mulaw audio in Twilio-compatible 20ms chunks (160 bytes each)
   */
  async sendAudioChunked(base64Audio) {
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    const CHUNK_SIZE = 160; // 20ms of mulaw audio at 8kHz
    
    for (let offset = 0; offset < audioBuffer.length; offset += CHUNK_SIZE) {
      const chunk = audioBuffer.slice(offset, Math.min(offset + CHUNK_SIZE, audioBuffer.length));
      
      if (this.ws && this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({
          event: 'media',
          streamSid: this.streamSid,
          media: { payload: chunk.toString('base64') }
        }));
      }
      
      // Small delay between chunks to prevent overwhelming the stream
      await new Promise(r => setTimeout(r, 18));
    }
  }

  /**
   * Speak the bot's first greeting proactively (called after stream connects)
   */
  async speakFirstGreeting() {
    try {
      // Wait a moment for the stream to stabilize
      await new Promise(r => setTimeout(r, 1000));
      
      let greeting = '';
      if (this.isInbound) {
        greeting = this.language === 'hindi' 
          ? 'नमस्ते! मैं Aria हूँ। आज मैं आपकी कैसे मदद कर सकती हूँ?'
          : 'Hello! I am Aria. How can I help you today?';
      } else {
        const productInfo = this.order?.productName 
          ? `${this.order.productQty} ${this.order.productName} for ${this.order.productPrice} rupees`
          : 'your recent order';
          
        if (this.language === 'hindi') {
          greeting = `नमस्ते! मैं Aria हूँ, Automaton AI से। आपने ${this.order?.productQty || ''} ${this.order?.productName || 'आर्डर'} का ऑर्डर किया है। क्या आप इसे कन्फर्म करना चाहेंगे?`;
        } else {
          greeting = `Hi there! I am Aria from Automaton AI. I am calling about your order of ${productInfo}. Would you like to confirm this order?`;
        }
      }
      
      console.log(`[Aria]: ${greeting}`);
      
      // Save to transcript
      this.transcriptHistory.push({ role: 'assistant', content: greeting });
      if (this.order) {
        this.order.transcript.push({ role: 'bot', text: greeting });
        await this.order.save();
      }
      this.io.emit('newTranscript', { orderId: this.orderId, role: 'bot', text: greeting });
      
      // Speak it
      this.isBotSpeaking = true;
      await this.speakReply(greeting);
    } catch (error) {
      console.error('❌ First greeting error:', error);
      this.isBotSpeaking = false;
    }
  }

  /**
   * Speak a reply by sending mulaw audio chunks over the WebSocket
   */
  async speakReply(text) {
    try {
      const { generateSpeech } = require('./sarvamService');
      
      try {
        const base64Audio = await generateSpeech(text, this.language);
        await this.sendAudioChunked(base64Audio);
      } catch (e) {
        console.warn('⚠️ TTS failed:', e.message);
      }

      const speakDuration = Math.max(1500, text.split(' ').length * 350);
      setTimeout(() => { this.isBotSpeaking = false; }, speakDuration);
    } catch (error) {
      console.error('❌ speakReply error:', error);
      this.isBotSpeaking = false;
    }
  }

  /**
   * Speak the final message and disconnect the call
   */
  async speakAndHangUp(text) {
    try {
      try {
        const { generateSpeech } = require('./sarvamService');
        const base64Audio = await generateSpeech(text, this.language);
        await this.sendAudioChunked(base64Audio);
      } catch (e) {}

      console.log(`📞 Call ending for order ${this.orderId}`);
      
      // Wait for audio to finish playing then close stream
      const speakDuration = Math.max(2000, text.split(' ').length * 400);
      setTimeout(() => {
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({ event: 'stop' }));
          this.ws.close();
        }
      }, speakDuration);
    } catch (error) {
      console.error('❌ speakAndHangUp error:', error);
    }
  }

  /**
   * Run post-call actions: WhatsApp confirmation + AI summary
   */
  async postCallActions(status) {
    try {
      // Refresh order from DB
      this.order = await Order.findById(this.orderId);
      if (!this.order) return;

      // Send WhatsApp confirmation
      sendWhatsAppConfirmation(this.order).catch((e) => 
        console.error('WhatsApp error:', e.message)
      );

      // Generate AI summary
      const result = await generateCallSummary(this.order);
      this.order.aiSummary = result.summary;
      this.order.sentiment = result.sentiment;
      this.order.flagged = result.flagged;
      await this.order.save();

      // Notify dashboard
      const io = this.io;
      io.emit('callEnded', { orderId: this.orderId, status });
      io.emit('summaryReady', { orderId: this.orderId, ...result });
      io.emit('orderUpdated');

      console.log(`✅ Post-call actions done for ${this.orderId}: ${status}`);
    } catch (error) {
      console.error('❌ Post-call actions error:', error);
    }
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  destroy() {
    if (this.deepgramConnection) {
      try { this.deepgramConnection.close(); } catch (e) {}
    }
    console.log(`🧠 ConversationManager destroyed for order ${this.orderId}`);
  }
}

module.exports = ConversationManager;
