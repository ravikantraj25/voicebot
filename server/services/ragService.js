/**
 * RAG Service — Retrieval-Augmented Generation
 * ─────────────────────────────────────────────────────────────────
 * This service powers the AI agent's ability to answer customer
 * questions using ONLY the company's official T&C and policies.
 *
 * Architecture:
 *   Customer Query → Retrieve Relevant Policy Chunks → Inject into
 *   Groq Prompt → AI answers within policy boundaries → Response
 *
 * Three core functions:
 * 1. answerPolicyQuestion()   — for voice IVR / call support
 * 2. processAgentAction()     — to decide what action to take (refund/cancel/etc.)
 * 3. generateActionSummary()  — human-readable summary of what the bot did
 */

const Groq = require('groq-sdk');
const {
  retrieveRelevantPolicies,
  formatPolicyContext,
  getAllPoliciesFormatted,
} = require('../knowledge/ecommerce_policies');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// ─────────────────────────────────────────────────────────────────
// FUNCTION 1: Answer a policy question using RAG
// Used when customer asks: "What is your refund policy?"
//                          "Can I cancel my order?"
//                          "When will I get my money back?"
// ─────────────────────────────────────────────────────────────────
const answerPolicyQuestion = async (customerQuery, orderContext = null, language = 'english') => {
  try {
    // Step 1: Retrieve the most relevant policy chunks (RAG retrieval)
    const relevantChunks = retrieveRelevantPolicies(customerQuery, 3);
    const policyContext = formatPolicyContext(relevantChunks);

    // Step 2: Build order context string if available
    const orderInfo = orderContext
      ? `
CUSTOMER'S CURRENT ORDER DETAILS:
- Order ID: ${orderContext._id || 'N/A'}
- Product: ${orderContext.productName || 'N/A'} (Qty: ${orderContext.productQty || 1}, Price: ₹${orderContext.productPrice || 0})
- Order Status: ${orderContext.status || 'pending'}
- Language: ${orderContext.language || 'english'}
- Issue Type (if any): ${orderContext.issueType || 'none'}
- Call Duration: ${orderContext.callDuration || 0} seconds
`.trim()
      : 'No specific order context available.';

    // Step 3: Language instruction for the response
    const langInstruction = {
      english: 'Respond in clear, simple English.',
      hindi: 'हिंदी में जवाब दें। सरल भाषा में।',
      kannada: 'ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. ಸರಳ ಭಾಷೆಯಲ್ಲಿ.',
      marathi: 'मराठीत उत्तर द्या. साध्या भाषेत.',
    }[language] || 'Respond in clear, simple English.';

    // Step 4: Call Groq with injected policy context (this is RAG!)
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are "Aria", the AI voice assistant for Automaton AI Infosystem, an e-commerce company.
You MUST answer customer questions ONLY using the POLICY CONTEXT provided below.
Do NOT make up any policies, timelines, amounts, or rules that are not in the context.
If the answer is not in the provided policy context, say: "I don't have specific information about that. Let me connect you to our support team."
Keep responses SHORT (2-3 sentences max) — this is a voice call, not a text message.
Be empathetic, professional, and helpful.
${langInstruction}

RELEVANT POLICY CONTEXT:
─────────────────────────
${policyContext}
─────────────────────────

${orderInfo}`,
        },
        {
          role: 'user',
          content: customerQuery,
        },
      ],
      temperature: 0.2, // Low temperature = factual, consistent answers
      max_tokens: 200,  // Keep it short for voice
    });

    return {
      answer: completion.choices[0].message.content.trim(),
      policiesUsed: relevantChunks.map((c) => c.id),
      confidence: relevantChunks.length > 0 ? 'high' : 'low',
    };
  } catch (error) {
    console.error('❌ RAG answerPolicyQuestion error:', error.message);
    return {
      answer: "I'm sorry, I couldn't retrieve the information right now. Please hold while I connect you to our support team.",
      policiesUsed: [],
      confidence: 'error',
    };
  }
};

// ─────────────────────────────────────────────────────────────────
// FUNCTION 2: Process an Agent Action with Policy Validation
// Before the bot takes any action (cancel, refund, return),
// it checks if the action is ALLOWED by policy.
//
// Returns: { allowed, reason, action, requiresEscalation }
// ─────────────────────────────────────────────────────────────────
const processAgentAction = async (requestedAction, order) => {
  try {
    // Get all relevant policies for action validation
    const allPolicies = getAllPoliciesFormatted();

    const orderAge = order.createdAt
      ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60)) // age in minutes
      : 0;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a policy enforcement engine for Automaton AI Infosystem.
Your job is to decide if a requested action is ALLOWED based on company policies.
Return ONLY valid JSON with these exact fields:
- "allowed": true or false
- "reason": A 1-sentence explanation of why it is allowed or not
- "action": The specific action to take (one of: "cancel_order", "initiate_return", "initiate_refund", "escalate_to_human", "provide_information", "no_action")
- "requiresEscalation": true if a human must approve this, false if AI can handle it autonomously
- "customerMessage": A 1-2 sentence message to read to the customer in plain language

COMPANY POLICIES:
${allPolicies}`,
        },
        {
          role: 'user',
          content: `Requested Action: ${requestedAction}

Order Details:
- Order ID: ${order._id}
- Product: ${order.productName || 'N/A'} (Qty: ${order.productQty || 1}, Price: ₹${order.productPrice || 0})
- Current Status: ${order.status}
- Order Age: ${orderAge} minutes old
- Issue Type: ${order.issueType || 'none'}
- Language: ${order.language}

Is this action allowed by policy? What should the AI agent do?`,
        },
      ],
      temperature: 0.1, // Very low — we need consistent policy enforcement
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    console.log(`🤖 RAG Action Decision for "${requestedAction}":`, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('❌ RAG processAgentAction error:', error.message);
    // Safe fallback — escalate if unsure
    return {
      allowed: false,
      reason: 'Policy validation error — escalating to human for safety.',
      action: 'escalate_to_human',
      requiresEscalation: true,
      customerMessage: "I'm having trouble processing your request. Let me connect you to our support team right away.",
    };
  }
};

// ─────────────────────────────────────────────────────────────────
// FUNCTION 3: Generate a Policy-Aware Call Summary
// Enhanced version of generateCallSummary that includes
// what policy was applied and what action the bot took.
// ─────────────────────────────────────────────────────────────────
const generatePolicyAwareSummary = async (order, actionsPerformed = []) => {
  try {
    const transcriptText = (order.transcript || [])
      .map((t) => `${t.role === 'bot' ? 'Aria (Bot)' : 'Customer'}: ${t.text}`)
      .join('\n');

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an AI call analyzer for Automaton AI Infosystem. 
Analyze the call transcript and return a JSON object with exactly these fields:
- "summary": A 2-sentence summary of what happened (include any actions taken by the AI)
- "sentiment": "positive", "neutral", or "negative"  
- "flagged": true if customer was frustrated, complained strongly, or issue was unresolved; false otherwise
- "policyApplied": The name of the main policy that was relevant to this call (e.g., "Cancellation Policy", "Refund Policy", "Delivery Policy")
- "actionTaken": What the AI agent actually did (e.g., "Order cancelled", "Return initiated", "Escalated to human", "Information provided")
- "followUpRequired": true if the issue requires human follow-up, false if fully resolved
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: 'user',
          content: `Order: ${order.productQty}x ${order.productName || 'N/A'} — ₹${order.productPrice || 0}
Status: ${order.status}
Language: ${order.language}
Issue: ${order.issueType || 'none'}
Actions performed by AI: ${actionsPerformed.length > 0 ? actionsPerformed.join(', ') : 'Standard confirmation flow'}

Transcript:
${transcriptText || `No transcript. Call ended with status: ${order.status}`}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      summary: result.summary || 'Call completed.',
      sentiment: result.sentiment || 'neutral',
      flagged: result.flagged || false,
      policyApplied: result.policyApplied || 'General',
      actionTaken: result.actionTaken || 'Information provided',
      followUpRequired: result.followUpRequired || false,
    };
  } catch (error) {
    console.error('❌ RAG generatePolicyAwareSummary error:', error.message);
    return {
      summary: `Call to ${order.phoneNumber} ended with status: ${order.status}.`,
      sentiment: order.status === 'confirmed' ? 'positive' : 'neutral',
      flagged: false,
      policyApplied: 'General',
      actionTaken: order.status,
      followUpRequired: order.status === 'escalated',
    };
  }
};

// ─────────────────────────────────────────────────────────────────
// FUNCTION 4: Quick Policy Check (for IVR responses)
// Lightweight check — just gets the policy text for a topic
// Used to inject policy info into standard IVR messages
// ─────────────────────────────────────────────────────────────────
const getQuickPolicyAnswer = (topic) => {
  const { retrieveRelevantPolicies, formatPolicyContext } = require('../knowledge/ecommerce_policies');
  const chunks = retrieveRelevantPolicies(topic, 1);
  return chunks.length > 0 ? chunks[0].policy : null;
};

module.exports = {
  answerPolicyQuestion,
  processAgentAction,
  generatePolicyAwareSummary,
  getQuickPolicyAnswer,
};
