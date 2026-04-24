# Advanced AI Voice Agent Implementation Plan

This document outlines the architecture and implementation steps to add the requested advanced features to the `voice-order-bot` system.

## 1. Inbound Customer Calling & Routing
**Goal:** Allow customers to call the AI agent directly.
**Implementation:**
- Create a new Twilio webhook route: `POST /api/twilio/inbound`.
- This route receives incoming calls, identifies the caller's phone number (`From`), and connects them to the WebSocket `ConversationManager`.
- Configure Twilio Console to point your phone number's "A CALL COMES IN" webhook to this new route.

## 2. Customer Memory & Language Selection
**Goal:** Remember previous users' languages; ask new users for their preferred language.
**Implementation:**
- Create a `Customer` MongoDB model to store `phoneNumber`, `customerId`, and `preferredLanguage`.
- **Logic Flow:**
  - When a call comes in, look up the `From` phone number in the `Customer` database.
  - **If Known:** Pass their `preferredLanguage` to the `ConversationManager`. The AI starts speaking in their language immediately.
  - **If Unknown:** Pass `language: 'unknown'` to the `ConversationManager`. The Groq AI System Prompt will be instructed to say: *"Welcome! Which language would you prefer to continue in? English, Hindi, Marathi, or Kannada?"* and wait for a Yes/No confirmation from the user.

## 3. Customer Authentication (New Numbers)
**Goal:** Link a new phone number to an existing order via Customer ID.
**Implementation:**
- If the phone number is new, the AI's System Prompt will be instructed to ask: *"I see you're calling from a new number. Could you please tell me your Customer ID so I can locate your order?"*
- Once the user says their ID, the LLM will extract it. We can use Groq **Function Calling / Tools** to run a backend function `link_customer_id(phone, id)` to update the database dynamically during the call.

## 4. Multi-Call Concurrency
**Goal:** Handle multiple calls simultaneously from both ends.
**Implementation:**
- **Already Supported!** Node.js and Socket.io/WebSockets are natively asynchronous. Every time Twilio connects a new stream (inbound or outbound), the server spawns a new `ConversationManager` instance. You can handle dozens of calls simultaneously as long as your API rate limits (Twilio/Groq/Deepgram) allow it.

## 5. Automatic Outbound Calling
**Goal:** Call the user automatically when an order is placed.
**Implementation:**
- Create a new route `POST /api/orders` to accept new orders.
- Upon saving the order, trigger the existing Twilio Outbound call function.
- This handles the "both ends" requirement: The server listens for webhooks to make outbound calls instantly, while simultaneously listening for inbound webhooks from customers.

## 6. RAG (Retrieval-Augmented Generation) & n8n
**Goal:** Solve complex problems using knowledge bases and automation workflows.
**Implementation:**
- **RAG:** Integrate Pinecone (Vector Database). If the user asks a policy question, the AI uses a `search_knowledge_base` tool to fetch text from Pinecone and read it out loud.
- **n8n:** We can set up an API endpoint in n8n. If the AI needs to trigger a complex workflow (e.g., "escalate to human and send Slack message"), the AI calls an `escalate_ticket` tool in Node.js, which sends an HTTP POST request to your n8n webhook.
