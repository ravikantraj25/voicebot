/**
 * E-Commerce Policy Knowledge Base
 * ─────────────────────────────────────────────────────────────────
 * This is the SINGLE SOURCE OF TRUTH for the AI voice agent.
 * All T&C, refund rules, cancellation rules, and order policies
 * are defined here as structured "chunks" for RAG retrieval.
 *
 * HOW RAG WORKS HERE (No vector DB needed — Groq is fast enough):
 * 1. Customer asks a question during a call
 * 2. We keyword-match to find the most relevant policy chunks
 * 3. We inject those chunks into Groq's system prompt
 * 4. Groq answers ONLY using the injected policy — no hallucinations
 */

const POLICY_CHUNKS = [

  // ─────────────────────────────────────────────
  // SECTION 1: ORDER MANAGEMENT
  // ─────────────────────────────────────────────
  {
    id: 'order-confirmation',
    section: 'Order Management',
    topic: 'order confirmation process',
    keywords: ['confirm', 'order confirm', 'confirmation', 'place order', 'book order'],
    policy: `
ORDER CONFIRMATION POLICY:
- Orders are confirmed only after the customer presses 1 (or says "yes/confirm") during the AI voice call.
- Upon confirmation, the customer receives a WhatsApp message within 60 seconds as proof of order.
- Orders remain in "pending" status for up to 48 hours if the customer does not respond to the call.
- Pending orders are automatically cancelled after 48 hours of no response.
- A confirmed order cannot be modified — only cancelled within the cancellation window.
- Order ID is assigned immediately upon system creation and is shared via WhatsApp confirmation.
    `.trim(),
  },

  {
    id: 'order-cancellation',
    section: 'Order Management',
    topic: 'cancel order cancellation policy',
    keywords: ['cancel', 'cancellation', 'cancel order', 'don\'t want', 'reject', 'stop order'],
    policy: `
ORDER CANCELLATION POLICY:
- Customers can cancel an order FREE OF CHARGE within 1 hour of confirmation (full refund).
- Cancellations requested between 1 hour and 24 hours after confirmation: ₹50 flat cancellation fee deducted from refund.
- Cancellations after 24 hours but before shipment: ₹100 cancellation fee, 80% refund of order value.
- Orders that have already been SHIPPED cannot be cancelled — customer must initiate a return after delivery.
- To cancel: customer must say "cancel" or press 2 during a follow-up call, OR reply "CANCEL" on WhatsApp with the Order ID.
- AI agent CAN mark an order for cancellation directly during the call if it is within the 1-hour free window.
- Cancellation confirmation is sent via WhatsApp within 5 minutes of request.
    `.trim(),
  },

  {
    id: 'order-modification',
    section: 'Order Management',
    topic: 'modify change order address quantity',
    keywords: ['modify', 'change order', 'update order', 'change address', 'change quantity', 'wrong address'],
    policy: `
ORDER MODIFICATION POLICY:
- Orders CAN be modified within 30 minutes of placement only.
- Modifications allowed: delivery address, quantity (subject to stock availability), contact number.
- Modifications NOT allowed: changing the product itself (must cancel and re-order).
- To modify: customer must call customer support or reply to the WhatsApp confirmation message with "MODIFY [details]".
- The AI agent CANNOT directly modify orders — it must escalate to a human agent for modifications.
- If modification request comes after 30 minutes, the AI agent must inform the customer and suggest cancellation + re-order.
    `.trim(),
  },

  // ─────────────────────────────────────────────
  // SECTION 2: REFUND POLICY
  // ─────────────────────────────────────────────
  {
    id: 'refund-general',
    section: 'Refunds',
    topic: 'refund policy money back',
    keywords: ['refund', 'money back', 'return money', 'payment refund', 'get money back', 'paisa wapas'],
    policy: `
REFUND POLICY — GENERAL RULES:
- Refunds are processed within 5-7 business days to the original payment method.
- UPI and wallet refunds: 1-3 business days.
- Credit/Debit card refunds: 5-7 business days (bank processing time).
- Cash on Delivery (COD) orders: Refunds via bank transfer (NEFT/IMPS) within 7 business days. Customer must provide bank account details.
- Refund eligibility is determined at the time of return or cancellation, not at the time of request.
- Partial refunds are issued when: (a) only part of the order is returned, (b) cancellation fees apply, (c) item condition deductions apply.
- The AI agent CAN initiate a refund request for eligible orders. The actual refund is processed by the finance team.
    `.trim(),
  },

  {
    id: 'refund-damaged',
    section: 'Refunds',
    topic: 'damaged wrong item defective product refund',
    keywords: ['damaged', 'defective', 'broken', 'wrong product', 'wrong item', 'not working', 'faulty', 'dead on arrival'],
    policy: `
REFUND FOR DAMAGED / WRONG / DEFECTIVE PRODUCTS:
- If the customer receives a damaged, defective, or wrong product: FULL refund OR free replacement is offered.
- Customer must report damage/defect within 48 hours of delivery. Reports after 48 hours may not be eligible.
- Photo/video proof must be sent via WhatsApp to the support number within 24 hours of raising the complaint.
- Once proof is verified (within 24-48 hours), a pickup is scheduled within 2 business days.
- Refund or replacement is processed within 5 business days of successful item pickup.
- For wrong product delivered: AI agent must mark the order with issue type "product" and escalate immediately.
- No restocking fee is charged for damaged/defective/wrong product returns.
    `.trim(),
  },

  {
    id: 'refund-no-delivery',
    section: 'Refunds',
    topic: 'not delivered lost shipment non delivery',
    keywords: ['not delivered', 'not received', 'missing package', 'lost in transit', 'shipment lost', 'nahi aaya', 'delivery nahi'],
    policy: `
REFUND FOR NON-DELIVERY:
- If an order is not delivered within the expected delivery window (typically 3-7 business days from shipment), customer can raise a complaint.
- Complaint must be raised within 15 days of the original expected delivery date.
- The logistics team investigates for 2 business days.
- If confirmed lost in transit: FULL refund is processed within 5-7 business days.
- If tracking shows "delivered" but customer claims non-receipt: A formal investigation is raised. During investigation, a provisional replacement may be offered at the company's discretion.
- AI agent must escalate "not delivered" complaints to the delivery issue queue immediately.
    `.trim(),
  },

  // ─────────────────────────────────────────────
  // SECTION 3: RETURN POLICY
  // ─────────────────────────────────────────────
  {
    id: 'return-policy',
    section: 'Returns',
    topic: 'return product send back return window',
    keywords: ['return', 'send back', 'return product', 'return policy', 'return window', 'wapas karna'],
    policy: `
RETURN POLICY:
- Standard return window: 7 days from the date of delivery.
- Products eligible for return: Electronics, Clothing, Home & Kitchen (with original tags/packaging).
- Products NOT eligible for return: Perishable goods, Personal hygiene products, Digital downloads, Customized/personalized items.
- Items must be in original condition: unused, with original tags, original packaging, and all accessories included.
- Restocking fee: ₹0 for defective/wrong items. ₹49 flat fee for "change of mind" returns.
- Pickup is scheduled within 2 business days of return request approval.
- Refund is initiated within 2 business days of successful pickup and quality check.
- AI agent CAN initiate a return request for eligible items within the 7-day window.
    `.trim(),
  },

  {
    id: 'return-electronics',
    section: 'Returns',
    topic: 'electronics return mobile phone laptop warranty',
    keywords: ['electronics', 'mobile', 'phone', 'laptop', 'headphone', 'charger', 'electronic return', 'warranty'],
    policy: `
ELECTRONICS RETURN & WARRANTY POLICY:
- Electronics have a 7-day return window for defects (Dead on Arrival).
- "Change of mind" returns for electronics: NOT accepted after the box is opened.
- Electronics come with manufacturer warranty (6 months to 2 years depending on product).
- For warranty claims after the 7-day return window: Customer must contact the manufacturer directly.
- The AI agent must inform customers that manufacturer warranty details are on the product documentation.
- Accessories bundled with electronics (charger, cable, etc.) must be returned together.
- If only the accessory is defective: Company provides a replacement accessory without requiring full product return.
    `.trim(),
  },

  // ─────────────────────────────────────────────
  // SECTION 4: DELIVERY POLICY
  // ─────────────────────────────────────────────
  {
    id: 'delivery-timeline',
    section: 'Delivery',
    topic: 'delivery time shipping when will arrive',
    keywords: ['delivery', 'shipping', 'when will arrive', 'delivery date', 'how long', 'track order', 'kab aayega'],
    policy: `
DELIVERY TIMELINE & SHIPPING POLICY:
- Standard Delivery: 3-7 business days (depending on pincode).
- Express Delivery (available in select cities): 1-2 business days. Additional charge: ₹99.
- Same-Day Delivery (available in metro cities): Orders placed before 12 PM. Additional charge: ₹149.
- Free shipping on orders above ₹499.
- Shipping charge for orders below ₹499: ₹49 flat.
- Delivery attempts: Maximum 3 attempts. After 3 failed attempts, order is returned to warehouse.
- If order is returned to warehouse due to failed delivery attempts: Customer can request redelivery (₹49 charge) or full refund.
- Tracking details are sent via WhatsApp and SMS within 24 hours of shipment.
    `.trim(),
  },

  {
    id: 'delivery-address',
    section: 'Delivery',
    topic: 'change delivery address wrong address redirect',
    keywords: ['change address', 'wrong address', 'redirect delivery', 'different address', 'new address'],
    policy: `
DELIVERY ADDRESS POLICY:
- Delivery address can only be changed BEFORE the order is shipped.
- Once shipped, address cannot be changed. Customer must wait for delivery attempt and arrange alternative.
- To change address: Contact support within 30 minutes of order placement.
- AI agent CANNOT change the delivery address directly — must escalate to human agent for address modifications.
- If the package is returned due to wrong address provided by customer: Redelivery is charged at ₹49, or full refund minus ₹49 shipping fee.
    `.trim(),
  },

  // ─────────────────────────────────────────────
  // SECTION 5: PAYMENT POLICY
  // ─────────────────────────────────────────────
  {
    id: 'payment-methods',
    section: 'Payment',
    topic: 'payment methods UPI card COD cash on delivery',
    keywords: ['payment', 'pay', 'UPI', 'card', 'COD', 'cash on delivery', 'EMI', 'net banking', 'payment method'],
    policy: `
PAYMENT METHODS & POLICY:
- Accepted payment methods: UPI, Credit/Debit Cards, Net Banking, Wallets (Paytm, PhonePe, Google Pay), Cash on Delivery.
- Cash on Delivery (COD): Available for orders up to ₹10,000. Additional COD charge: ₹25.
- EMI: Available on credit cards for orders above ₹3,000 (bank-specific terms apply).
- Payment must be completed at the time of order placement for prepaid orders.
- If a prepaid payment fails: The order is NOT placed. Customer must retry with a different payment method.
- If money is deducted but order is not placed: Auto-refund within 24 hours. No manual claim needed.
- AI agent must never ask for full card numbers, CVV, or UPI PIN. Report such requests as security violations.
    `.trim(),
  },

  {
    id: 'payment-failure',
    section: 'Payment',
    topic: 'payment failed deducted money not placed order',
    keywords: ['payment failed', 'money deducted', 'charged twice', 'double charge', 'payment issue', 'paisa kata'],
    policy: `
PAYMENT FAILURE POLICY:
- If payment is deducted but order is not confirmed: Auto-refund within 24 hours (UPI/Wallet) or 5-7 business days (Card/Net Banking).
- If customer is charged twice: Raise a duplicate charge complaint. Investigation within 24 hours, refund within 3 business days.
- To verify payment status: Customer must share the transaction reference ID (UTR number for UPI, transaction ID for cards).
- AI agent must escalate "double charge" complaints with HIGH PRIORITY to the payment team.
- The AI agent should reassure the customer that no action is needed for auto-refunds — the system processes it automatically.
    `.trim(),
  },

  // ─────────────────────────────────────────────
  // SECTION 6: AI AGENT PERMISSIONS & BOUNDARIES
  // ─────────────────────────────────────────────
  {
    id: 'ai-agent-permissions',
    section: 'AI Agent Rules',
    topic: 'what AI can and cannot do agent permissions',
    keywords: ['what can you do', 'can you help', 'agent action', 'bot capabilities'],
    policy: `
AI AGENT PERMISSIONS (WHAT THE AI BOT CAN DO):
✅ CAN DO:
- Confirm order placement (press 1 / say yes)
- Cancel an order that is within the 1-hour free cancellation window
- Initiate a return request for eligible items within 7-day return window
- Initiate a refund request for damaged/defective products (after customer confirms and provides details)
- Provide delivery status and estimated delivery date (from order data)
- Answer questions about policies (using this knowledge base)
- Flag an order as having a delivery/payment/product issue
- Escalate to human agent for complex issues
- Send WhatsApp confirmation for any action taken

❌ CANNOT DO:
- Change delivery address (must escalate)
- Modify order details beyond cancellation (must escalate)
- Process actual payment or access payment systems
- Provide refund amount for non-standard cases without human approval
- Handle warranty claims (must direct to manufacturer)
- Access or share another customer's order details
- Approve a return/refund request that falls outside policy windows without escalation
    `.trim(),
  },

  {
    id: 'escalation-rules',
    section: 'AI Agent Rules',
    topic: 'when to escalate human agent complex issue',
    keywords: ['human agent', 'speak to person', 'escalate', 'complex', 'manager', 'supervisor', 'kisi se baat'],
    policy: `
ESCALATION RULES — WHEN AI MUST TRANSFER TO HUMAN AGENT:
- Customer requests to speak to a human agent (no questions asked — immediate transfer)
- Double charge / unauthorized transaction complaints
- Order modification requests (address, quantity after 30 minutes)
- Return/refund requests that fall outside policy windows
- Customer expresses extreme frustration or uses abusive language
- Fraud or security concerns
- Orders with a total value above ₹5,000 requiring cancellation (requires human approval)
- Any situation where the AI is unsure of the correct policy — "When in doubt, escalate out"

When escalating: AI must summarize the issue in one sentence before transferring.
Human agent availability: Monday to Saturday, 9 AM to 6 PM IST.
If outside hours: AI must take the complaint and promise a callback within 2 business hours on the next working day.
    `.trim(),
  },

  // ─────────────────────────────────────────────
  // SECTION 7: SPECIAL SITUATIONS
  // ─────────────────────────────────────────────
  {
    id: 'festival-sale',
    section: 'Special Situations',
    topic: 'sale discount offer coupon promo code',
    keywords: ['sale', 'discount', 'offer', 'coupon', 'promo', 'festival', 'cashback', 'deal'],
    policy: `
SALE & DISCOUNT POLICY:
- Discounts applied at checkout are final and cannot be applied after order placement.
- Coupon codes cannot be combined. Only one coupon per order.
- Cashback offers are credited within 24-48 hours of order delivery (not at order placement).
- Sale items: Return policy remains the same (7 days). Refund is for the amount paid (after discount), not MRP.
- If a sale price changes after order placement but before delivery: Customer gets the price they paid at checkout (no price adjustments).
- "Price Drop Protection" is not offered. Price differences before and after purchase are not refunded.
    `.trim(),
  },

  {
    id: 'out-of-stock',
    section: 'Special Situations',
    topic: 'out of stock unavailable item not available',
    keywords: ['out of stock', 'not available', 'unavailable', 'stock finished', 'sold out'],
    policy: `
OUT OF STOCK POLICY:
- If an item goes out of stock after order placement but before shipment: Full refund is processed automatically within 24 hours.
- Customer is notified via WhatsApp and SMS immediately upon stock unavailability.
- Alternative product may be suggested — but customer has full choice to accept or take refund.
- AI agent must check order status before confirming stock. If stock is uncertain, agent must escalate.
- Waitlist/pre-order for out-of-stock items: Customer can register interest via WhatsApp reply "NOTIFY [product name]".
    `.trim(),
  },

];

/**
 * Retrieve the most relevant policy chunks for a given customer query
 * Uses keyword matching — fast, no vector DB needed, works offline
 *
 * @param {string} query - The customer's question or issue description
 * @param {number} maxChunks - Maximum number of chunks to return (default: 3)
 * @returns {Array} Array of relevant policy chunks
 */
const retrieveRelevantPolicies = (query, maxChunks = 3) => {
  if (!query) return [];

  const queryLower = query.toLowerCase();

  // Score each chunk based on keyword matches
  const scored = POLICY_CHUNKS.map((chunk) => {
    let score = 0;

    // Check keyword matches
    chunk.keywords.forEach((keyword) => {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 2; // Each keyword match = 2 points
      }
    });

    // Check topic match (partial)
    const topicWords = chunk.topic.toLowerCase().split(' ');
    topicWords.forEach((word) => {
      if (word.length > 3 && queryLower.includes(word)) {
        score += 1; // Topic word match = 1 point
      }
    });

    // Check section match
    if (queryLower.includes(chunk.section.toLowerCase())) {
      score += 3;
    }

    return { ...chunk, score };
  });

  // Sort by score descending, filter out zero-score chunks
  const relevant = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);

  // If nothing matched, return the AI agent permissions as fallback
  if (relevant.length === 0) {
    return POLICY_CHUNKS.filter((c) => c.id === 'ai-agent-permissions');
  }

  return relevant;
};

/**
 * Format retrieved chunks into a clean context string for the LLM prompt
 * @param {Array} chunks - Array of policy chunks
 * @returns {string} Formatted context string
 */
const formatPolicyContext = (chunks) => {
  if (!chunks || chunks.length === 0) return '';

  return chunks
    .map((c) => `[${c.section.toUpperCase()}]\n${c.policy}`)
    .join('\n\n---\n\n');
};

/**
 * Get ALL policies formatted (for full knowledge base injection)
 * Use sparingly — only for complex multi-topic queries
 */
const getAllPoliciesFormatted = () => {
  return POLICY_CHUNKS.map((c) => `[${c.section.toUpperCase()} — ${c.topic}]\n${c.policy}`).join('\n\n---\n\n');
};

module.exports = {
  POLICY_CHUNKS,
  retrieveRelevantPolicies,
  formatPolicyContext,
  getAllPoliciesFormatted,
};
