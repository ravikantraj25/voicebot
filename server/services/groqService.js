/**
 * Groq AI Service
 * Uses Groq's Llama 3.3 70B model for:
 * - Post-call AI summaries with sentiment analysis
 * - Natural language search query parsing
 * - Smart retry time suggestions
 */
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Generate a post-call AI summary from the conversation transcript
 * Returns: { summary, sentiment, flagged }
 */
const generateCallSummary = async (order) => {
  try {
    const transcriptText = (order.transcript || [])
      .map((t) => `${t.role === 'bot' ? 'Aria (Bot)' : 'Customer'}: ${t.text}`)
      .join('\n');

    const productInfo = order.productName
      ? `Product: ${order.productQty}x ${order.productName} for ₹${order.productPrice}`
      : 'No product details';

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an AI call analyzer for Automaton AI Infosystem. Analyze voice call transcripts and return a JSON object with exactly these fields:
- "summary": A 2-sentence plain English summary of what happened on the call
- "sentiment": One of "positive", "neutral", or "negative" based on overall customer mood
- "flagged": true if customer complained, wanted to cancel, asked for manager, or expressed frustration; false otherwise
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: `Call Details:
Phone: ${order.phoneNumber}
Language: ${order.language}
Status: ${order.status}
${productInfo}
Duration: ${order.callDuration || 0} seconds

Transcript:
${transcriptText || 'No transcript available. Call status: ' + order.status}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      summary: result.summary || 'Call completed.',
      sentiment: result.sentiment || 'neutral',
      flagged: result.flagged || false,
    };
  } catch (error) {
    console.error('❌ Groq summary error:', error.message);
    // Fallback summary
    return {
      summary: `Call to ${order.phoneNumber} ended with status: ${order.status}.`,
      sentiment: order.status === 'confirmed' ? 'positive' : 'neutral',
      flagged: false,
    };
  }
};

/**
 * Parse a natural language search query into MongoDB filter
 * Input: "show failed Kannada calls today"
 * Output: { status: 'failed', language: 'kannada', dateFilter: 'today' }
 */
const parseSearchQuery = async (query) => {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You parse natural language queries about call logs into MongoDB filter objects. Return ONLY valid JSON with these optional fields:
- "status": one of "pending", "confirmed", "rejected", "failed", "no-response", "escalated"
- "language": one of "english", "hindi", "kannada", "marathi"
- "sentiment": one of "positive", "neutral", "negative"
- "flagged": true or false
- "whatsappSent": true or false
- "dateFilter": one of "today", "yesterday", "week", "all"
- "searchText": any phone number or product name to search for
Only include fields that the user explicitly asked about. Return {} if unclear.`,
        },
        { role: 'user', content: query },
      ],
      temperature: 0,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Groq search parse error:', error.message);
    return {};
  }
};

/**
 * Process incoming WhatsApp messages to generate conversational replies and detect order actions
 * Returns: { replyText, action } where action is 'confirm', 'reject', or 'none'
 */
const processWhatsAppMessage = async (order, userMessage) => {
  try {
    const productInfo = order.items 
      ? order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')
      : order.productName
        ? `${order.productQty} ${order.productName}`
        : 'recent order';

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are Aria, an AI assistant for Automaton Store communicating with a customer via WhatsApp.
The customer's order: ${productInfo} (Total: ₹${order.totalAmount || order.productPrice || 0})
Current Status of the order: "${order.status}"

RULES:
1. Keep your reply friendly, very short, and suitable for WhatsApp. Never use markdown.
2. If the user explicitly wants to confirm the order, say thanks and set "action" to "confirm" (unless it's already confirmed, then just tell them it's already confirmed and set "action" to "none").
3. If the user explicitly wants to cancel or reject the order (even if it is currently confirmed), say okay and set "action" to "reject" (unless it's already rejected, then tell them it's already cancelled and set "action" to "none").
4. If they ask a question, answer it briefly. If the order is pending, ask if they want to confirm it. Set "action" to "none".
5. Return ONLY a valid JSON object with EXACTLY two keys:
   - "replyText": Your conversational message back to the user
   - "action": Must be strictly "confirm", "reject", or "none"`,
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Groq WhatsApp process error:', error.message);
    return {
      replyText: "I'm having trouble understanding right now. Please type YES to confirm your order, or NO to cancel.",
      action: 'none'
    };
  }
};

module.exports = { generateCallSummary, parseSearchQuery, processWhatsAppMessage };

// ─── Re-export RAG-enhanced version for new code ──────────────────
// Use generatePolicyAwareSummary when you need policy context in summaries
const { generatePolicyAwareSummary } = require('./ragService');
module.exports.generatePolicyAwareSummary = generatePolicyAwareSummary;

// --- Re-export RAG-enhanced version for new code ------------------
// Use generatePolicyAwareSummary when you need policy context in summaries
const { generatePolicyAwareSummary } = require('./ragService');
module.exports.generatePolicyAwareSummary = generatePolicyAwareSummary;
