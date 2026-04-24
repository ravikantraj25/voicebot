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

module.exports = { generateCallSummary, parseSearchQuery };
