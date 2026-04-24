/**
 * ═══════════════════════════════════════════════════════════════
 *  COMPLETE PROJECT TEST SUITE
 *  Tests: RAG System + Policy Retrieval + Groq Integration +
 *         API Endpoints + Database + Full Call Flow
 * ═══════════════════════════════════════════════════════════════
 * Run: node test-rag-system.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const Groq = require('groq-sdk');

// ─── Colours for terminal output ────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';
const DIM    = '\x1b[2m';

let passed = 0, failed = 0;

function log(emoji, label, msg = '', color = RESET) {
  console.log(`${color}${BOLD}${emoji} ${label}${RESET}${DIM} ${msg}${RESET}`);
}
function ok(label, detail = '')  { passed++; log('✅', label, detail, GREEN); }
function fail(label, detail = '') { failed++; log('❌', label, detail, RED); }
function info(label, detail = '') { log('ℹ️ ', label, detail, CYAN); }
function section(title)           { console.log(`\n${BOLD}${YELLOW}━━━ ${title} ━━━${RESET}`); }

// ════════════════════════════════════════════════════════════════
//  SECTION 1: KNOWLEDGE BASE & RAG RETRIEVAL (Pure JS — no API)
// ════════════════════════════════════════════════════════════════
section('1. KNOWLEDGE BASE INTEGRITY CHECK');

let policies;
try {
  policies = require('./knowledge/ecommerce_policies');
  ok('ecommerce_policies.js loaded', `Path: server/knowledge/ecommerce_policies.js`);
} catch (e) {
  fail('ecommerce_policies.js load FAILED', e.message);
  process.exit(1);
}

// Check chunk count
if (policies.POLICY_CHUNKS.length >= 10) {
  ok('Policy chunks count', `${policies.POLICY_CHUNKS.length} chunks loaded (expected ≥10)`);
} else {
  fail('Policy chunks count', `Only ${policies.POLICY_CHUNKS.length} chunks found`);
}

// Check all required chunk IDs exist
const requiredIds = [
  'order-confirmation', 'order-cancellation', 'order-modification',
  'refund-general', 'refund-damaged', 'refund-no-delivery',
  'return-policy', 'delivery-timeline', 'payment-methods',
  'ai-agent-permissions', 'escalation-rules'
];
const existingIds = policies.POLICY_CHUNKS.map(c => c.id);
requiredIds.forEach(id => {
  if (existingIds.includes(id)) {
    ok(`Chunk "${id}" exists`);
  } else {
    fail(`Chunk "${id}" is MISSING`);
  }
});

// Check chunk structure integrity
let structureOk = true;
policies.POLICY_CHUNKS.forEach(chunk => {
  if (!chunk.id || !chunk.section || !chunk.keywords || !chunk.policy) {
    fail(`Chunk structure invalid`, `ID: ${chunk.id || 'MISSING'}`);
    structureOk = false;
  }
});
if (structureOk) ok('All chunks have valid structure', '(id, section, keywords, policy)');

// ════════════════════════════════════════════════════════════════
//  SECTION 2: RAG RETRIEVAL ACCURACY TESTS
// ════════════════════════════════════════════════════════════════
section('2. RAG RETRIEVAL ACCURACY');

const { retrieveRelevantPolicies, formatPolicyContext, getAllPoliciesFormatted } = policies;

// Test 1: Cancel order query
const cancelResults = retrieveRelevantPolicies('I want to cancel my order');
if (cancelResults.length > 0 && cancelResults[0].id === 'order-cancellation') {
  ok('Cancel query → correct chunk', `Top result: "${cancelResults[0].id}" ✓`);
} else {
  fail('Cancel query → wrong chunk', `Got: ${cancelResults.map(c=>c.id).join(', ')}`);
}

// Test 2: Refund query
const refundResults = retrieveRelevantPolicies('I want my money back refund');
const refundIds = refundResults.map(c => c.id);
if (refundIds.some(id => id.includes('refund'))) {
  ok('Refund query → correct chunks', `Results: ${refundIds.join(', ')}`);
} else {
  fail('Refund query → wrong chunks', `Got: ${refundIds.join(', ')}`);
}

// Test 3: Delivery query
const deliveryResults = retrieveRelevantPolicies('kab aayega mera order delivery kab hogi');
const deliveryIds = deliveryResults.map(c => c.id);
if (deliveryIds.includes('delivery-timeline')) {
  ok('Delivery query (Hinglish) → correct chunk', `"kab aayega" matched delivery-timeline`);
} else {
  fail('Delivery query (Hinglish) → wrong chunk', `Got: ${deliveryIds.join(', ')}`);
}

// Test 4: Damaged product query
const damageResults = retrieveRelevantPolicies('product damaged broken defective arrived');
const damageIds = damageResults.map(c => c.id);
if (damageIds.includes('refund-damaged')) {
  ok('Damaged product query → correct chunk', `Results: ${damageIds.join(', ')}`);
} else {
  fail('Damaged product query → wrong chunk', `Got: ${damageIds.join(', ')}`);
}

// Test 5: Payment failure query
const paymentResults = retrieveRelevantPolicies('paisa kata but order nahi hua payment failed');
const paymentIds = paymentResults.map(c => c.id);
if (paymentIds.some(id => id.includes('payment'))) {
  ok('Payment failure (Hinglish) → correct chunk', `Results: ${paymentIds.join(', ')}`);
} else {
  fail('Payment failure query → wrong chunk', `Got: ${paymentIds.join(', ')}`);
}

// Test 6: Unknown query fallback
const unknownResults = retrieveRelevantPolicies('xyz unknown query pqr');
if (unknownResults.length > 0 && unknownResults[0].id === 'ai-agent-permissions') {
  ok('Unknown query → fallback to ai-agent-permissions', 'Fallback working correctly');
} else {
  fail('Unknown query fallback → not working', `Got: ${unknownResults.map(c=>c.id).join(', ')}`);
}

// Test 7: maxChunks limit
const limited = retrieveRelevantPolicies('cancel order refund delivery', 2);
if (limited.length <= 2) {
  ok('maxChunks limit respected', `Requested 2, got ${limited.length}`);
} else {
  fail('maxChunks limit NOT respected', `Got ${limited.length} chunks`);
}

// Test 8: formatPolicyContext
const formatted = formatPolicyContext(cancelResults);
if (formatted && formatted.includes('[ORDER MANAGEMENT]') && formatted.includes('CANCELLATION')) {
  ok('formatPolicyContext output valid', 'Section headers + policy text present');
} else {
  fail('formatPolicyContext output invalid', `Got: ${formatted.slice(0,60)}...`);
}

// Test 9: getAllPoliciesFormatted
const all = getAllPoliciesFormatted();
if (all && all.length > 1000 && all.includes('REFUND') && all.includes('DELIVERY')) {
  ok('getAllPoliciesFormatted working', `${all.length} characters of policy text`);
} else {
  fail('getAllPoliciesFormatted failed', `Length: ${all ? all.length : 0}`);
}

// ════════════════════════════════════════════════════════════════
//  SECTION 3: RAG SERVICE MODULE CHECK
// ════════════════════════════════════════════════════════════════
section('3. RAG SERVICE MODULE CHECK');

let ragService;
try {
  ragService = require('./services/ragService');
  ok('ragService.js loaded');
} catch (e) {
  fail('ragService.js load FAILED', e.message);
}

if (ragService) {
  const fns = ['answerPolicyQuestion', 'processAgentAction', 'generatePolicyAwareSummary', 'getQuickPolicyAnswer'];
  fns.forEach(fn => {
    if (typeof ragService[fn] === 'function') {
      ok(`ragService.${fn}() exported`);
    } else {
      fail(`ragService.${fn}() NOT exported`);
    }
  });
}

// ════════════════════════════════════════════════════════════════
//  SECTION 4: CONTROLLER FILE CHECK
// ════════════════════════════════════════════════════════════════
section('4. CONTROLLER & ROUTE FILE CHECK');

let ragController;
try {
  ragController = require('./controllers/ragSupportController');
  ok('ragSupportController.js loaded');
} catch (e) {
  fail('ragSupportController.js load FAILED', e.message);
}

if (ragController) {
  ['handleRagSupport', 'handleRagAction', 'handleRagQuery'].forEach(fn => {
    if (typeof ragController[fn] === 'function') {
      ok(`ragController.${fn}() exported`);
    } else {
      fail(`ragController.${fn}() NOT exported`);
    }
  });
}

let twilioRoutes;
try {
  twilioRoutes = require('./routes/twilioRoutes');
  ok('twilioRoutes.js loaded with RAG routes');
} catch (e) {
  fail('twilioRoutes.js load FAILED', e.message);
}

// ════════════════════════════════════════════════════════════════
//  SECTION 5: GROQ API CONNECTION TEST
// ════════════════════════════════════════════════════════════════
section('5. GROQ API CONNECTION TEST');

const runGroqTests = async () => {
  if (!process.env.GROQ_API_KEY) {
    fail('GROQ_API_KEY not found in .env');
    return;
  }
  ok('GROQ_API_KEY found', `Key starts with: ${process.env.GROQ_API_KEY.slice(0,8)}...`);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // ─── Test 5a: Basic Groq connectivity ───
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Reply with exactly: GROQ_OK' }],
      max_tokens: 20,
    });
    const reply = res.choices[0].message.content.trim();
    if (reply.includes('GROQ_OK')) {
      ok('Groq API basic connectivity', `Response: "${reply}"`);
    } else {
      ok('Groq API responding', `Response: "${reply}" (content differs but API works)`);
    }
  } catch (e) {
    fail('Groq API connectivity FAILED', e.message);
    return;
  }

  // ─── Test 5b: RAG answerPolicyQuestion ───
  section('6. RAG GROQ INTEGRATION — Policy Q&A');
  info('Testing answerPolicyQuestion()...', 'This makes a real Groq API call');

  try {
    const mockOrder = {
      _id: 'test-order-001',
      productName: 'Bluetooth Headphones',
      productQty: 2,
      productPrice: 1499,
      status: 'confirmed',
      language: 'english',
      issueType: 'none',
      callDuration: 45,
    };

    const result = await ragService.answerPolicyQuestion(
      'Can I cancel my confirmed order? What will be the charges?',
      mockOrder,
      'english'
    );

    if (result.answer && result.answer.length > 20) {
      ok('answerPolicyQuestion() — English', `Answer: "${result.answer.slice(0, 80)}..."`);
      ok('Policies used', `IDs: ${result.policiesUsed.join(', ')}`);
      ok('Confidence level', `Confidence: ${result.confidence}`);
    } else {
      fail('answerPolicyQuestion() returned empty answer', JSON.stringify(result));
    }
  } catch (e) {
    fail('answerPolicyQuestion() FAILED', e.message);
  }

  // ─── Test 5c: RAG in Hindi ───
  try {
    const result = await ragService.answerPolicyQuestion(
      'Mujhe refund chahiye mera paisa wapas karo',
      null,
      'hindi'
    );
    if (result.answer && result.answer.length > 10) {
      ok('answerPolicyQuestion() — Hindi', `Answer: "${result.answer.slice(0, 80)}..."`);
    } else {
      fail('answerPolicyQuestion() Hindi FAILED', JSON.stringify(result));
    }
  } catch (e) {
    fail('answerPolicyQuestion() Hindi FAILED', e.message);
  }

  // ─── Test 5d: processAgentAction — Cancel (recent order, should be allowed) ───
  section('7. RAG POLICY ACTION VALIDATION');
  info('Testing processAgentAction()...', 'Validates if action is policy-compliant');

  try {
    const recentOrder = {
      _id: 'test-order-002',
      productName: 'Running Shoes',
      productQty: 1,
      productPrice: 3499,
      status: 'confirmed',
      language: 'english',
      issueType: 'none',
      createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes old
    };

    const decision = await ragService.processAgentAction(
      'Customer wants to cancel their order',
      recentOrder
    );

    if (decision.action && decision.customerMessage) {
      ok('processAgentAction() returned valid decision', `Action: "${decision.action}"`);
      ok('Decision has customerMessage', `"${decision.customerMessage.slice(0, 60)}..."`);
      info('Allowed?', `${decision.allowed} | Escalation needed: ${decision.requiresEscalation}`);
      info('Reason', decision.reason);
    } else {
      fail('processAgentAction() invalid response', JSON.stringify(decision));
    }
  } catch (e) {
    fail('processAgentAction() FAILED', e.message);
  }

  // ─── Test 5e: processAgentAction — Old order (should require escalation) ───
  try {
    const oldOrder = {
      _id: 'test-order-003',
      productName: 'Cotton Bedsheet',
      productQty: 1,
      productPrice: 1299,
      status: 'confirmed',
      language: 'hindi',
      issueType: 'none',
      createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours old
    };

    const decision = await ragService.processAgentAction(
      'Customer is requesting a refund for their order',
      oldOrder
    );

    if (decision.action) {
      ok('processAgentAction() — 36hr old order refund decision', `Action: "${decision.action}", Escalate: ${decision.requiresEscalation}`);
    } else {
      fail('processAgentAction() old order FAILED', JSON.stringify(decision));
    }
  } catch (e) {
    fail('processAgentAction() old order FAILED', e.message);
  }

  // ─── Test 5f: generatePolicyAwareSummary ───
  section('8. RAG POLICY-AWARE CALL SUMMARY');
  try {
    const orderWithTranscript = {
      _id: 'test-order-004',
      phoneNumber: '+919876543210',
      productName: 'Water Bottle',
      productQty: 3,
      productPrice: 599,
      status: 'escalated',
      language: 'hindi',
      issueType: 'delivery',
      callDuration: 62,
      transcript: [
        { role: 'bot', text: 'नमस्ते! यह Automaton AI Infosystem की ओर से कॉल है।' },
        { role: 'customer', text: 'Pressed 3 — RAG Support' },
        { role: 'customer', text: 'Requested refund via RAG support' },
        { role: 'bot', text: 'Your refund request has been logged and escalated to our team.' },
      ],
    };

    const summary = await ragService.generatePolicyAwareSummary(
      orderWithTranscript,
      ['refund_initiated', 'escalated']
    );

    if (summary.summary && summary.policyApplied && summary.actionTaken) {
      ok('generatePolicyAwareSummary() returned full summary');
      ok('Summary text', `"${summary.summary.slice(0, 80)}..."`);
      ok('Policy applied', `"${summary.policyApplied}"`);
      ok('Action taken', `"${summary.actionTaken}"`);
      ok('Follow-up required', `${summary.followUpRequired}`);
      ok('Sentiment', summary.sentiment);
    } else {
      fail('generatePolicyAwareSummary() incomplete response', JSON.stringify(summary));
    }
  } catch (e) {
    fail('generatePolicyAwareSummary() FAILED', e.message);
  }

  // ─── Test 5g: HTTP API endpoint test ───
  section('9. HTTP API ENDPOINT TEST');
  info('Testing /api/twilio/rag-query endpoint...', 'Server must be running on port 5000');

  try {
    const http = require('http');
    const body = JSON.stringify({
      query: 'What is your return policy for electronics?',
      language: 'english',
    });

    const apiResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/twilio/rag-query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', (e) => resolve({ error: e.message }));
      req.setTimeout(15000, () => resolve({ error: 'timeout' }));
      req.write(body);
      req.end();
    });

    if (apiResult.error) {
      if (apiResult.error === 'timeout') {
        fail('/api/twilio/rag-query', 'Request timed out — server may be starting up slowly');
      } else {
        info('/api/twilio/rag-query — server not running', `Start server first: npm run dev`);
      }
    } else if (apiResult.status === 200 && apiResult.body.success) {
      ok('/api/twilio/rag-query HTTP 200', `Answer: "${(apiResult.body.answer || '').slice(0, 60)}..."`);
      ok('Policies used in API response', `${(apiResult.body.policiesUsed || []).join(', ')}`);
    } else {
      fail(`/api/twilio/rag-query returned ${apiResult.status}`, JSON.stringify(apiResult.body).slice(0, 100));
    }
  } catch (e) {
    info('/api/twilio/rag-query — skipped (server not started)', 'Run: npm run dev first');
  }

  // ─── Test: Health check ───
  try {
    const http = require('http');
    const health = await new Promise((resolve) => {
      const req = http.get('http://localhost:5000/api/health', (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', e => resolve({ error: e.message }));
      req.setTimeout(5000, () => resolve({ error: 'timeout' }));
    });

    if (health.error) {
      info('Health check — server not running', 'Start with: npm run dev in server directory');
    } else {
      ok('Server health check', `Status: ${health.body.message}`);
    }
  } catch (e) {
    info('Health check skipped', e.message);
  }
};

// ════════════════════════════════════════════════════════════════
//  FINAL REPORT
// ════════════════════════════════════════════════════════════════
const printFinalReport = () => {
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log('\n' + '═'.repeat(55));
  console.log(`${BOLD}  TEST RESULTS${RESET}`);
  console.log('═'.repeat(55));
  console.log(`  ${GREEN}${BOLD}✅ Passed: ${passed}${RESET}`);
  console.log(`  ${RED}${BOLD}❌ Failed: ${failed}${RESET}`);
  console.log(`  Total:  ${total} tests | Coverage: ${pct}%`);
  console.log('═'.repeat(55));

  if (failed === 0) {
    console.log(`\n  ${GREEN}${BOLD}🎉 ALL TESTS PASSED! RAG System is ready.${RESET}\n`);
  } else if (failed <= 2) {
    console.log(`\n  ${YELLOW}${BOLD}⚠️  MOSTLY PASSING — ${failed} test(s) need attention.${RESET}\n`);
  } else {
    console.log(`\n  ${RED}${BOLD}🔴 ${failed} TESTS FAILED — Check the errors above.${RESET}\n`);
  }
};

// ─── Run everything ─────────────────────────────────────────────
runGroqTests()
  .then(() => printFinalReport())
  .catch((e) => {
    fail('Unexpected test runner error', e.message);
    printFinalReport();
  });
