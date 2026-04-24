# 🛍️ Automation AI: Voice Order Confirmation System
**Powered by ADVIT™ AI Labs**

An industry-grade, multi-modal AI Agent designed to revolutionize e-commerce order confirmation. Automaton AI seamlessly handles automated outbound voice calls, intelligent negotiation, WhatsApp fallback, and real-time analytics, all managed through a premium command-center dashboard.

---

## 🌟 Key Features

### 1. 🤖 Conversational Voice AI
* **Instant Automation**: The moment a customer places an order on the storefront, the AI Agent instantly dials their phone number to confirm the purchase.
* **Intelligent Negotiation**: Powered by **Groq (Llama 3.3 70B)**, the agent doesn't just read a script. It can dynamically negotiate product quantities, verify complex addresses, and answer policy questions.
* **RAG-Powered Knowledge base**: The agent is injected with Retrieval-Augmented Generation (RAG) capabilities, allowing it to instantly reference the store's return, refund, and shipping policies mid-conversation.

### 2. 💬 Multi-Modal WhatsApp Fallback
* **Never Lose a Lead**: If a customer misses the call, rejects it, or the call fails, Automaton AI seamlessly transitions the conversation to WhatsApp.
* **Conversational Commerce**: The WhatsApp agent (also powered by Groq) continues the negotiation, confirming or modifying the order via text and syncing the result directly back to the database.

### 3. 📊 Real-Time Admin Command Center
* **Socket.io Synchronization**: The dashboard updates instantly without refreshing. Watch calls connect, stream, and complete in real-time.
* **AI Call Summaries & Sentiment**: Every call is automatically transcribed and analyzed. The dashboard displays a concise summary and a sentiment score (Positive/Neutral/Negative).
* **Inline Audio Playback**: Listen to call recordings directly from the dashboard.
* **Smart Retry System**: Failed calls are automatically flagged and can be re-queued with a single click.
* **Batch Operations**: Upload CSV files to trigger hundreds of outbound confirmation calls simultaneously.
* **Light / Dark Mode**: A flawless, dynamic theme engine built on Tailwind CSS that adjusts to your preference.

### 4. 🛒 Integrated Premium Storefront
* Includes a fully functional, animated React storefront with a shopping cart to instantly test the end-to-end pipeline.
* Place a mock order and watch your phone ring seconds later!

---

## 🏗️ Architecture & Tech Stack

### Frontend (Client)
* **Framework**: React.js (Vite)
* **Styling**: Tailwind CSS, Custom CSS Variables (Dynamic Theming)
* **Icons**: Lucide React, React Icons
* **Real-time**: Socket.io-client
* **State Management**: React Context API

### Backend (Server)
* **Runtime**: Node.js & Express.js
* **Database**: MongoDB (Mongoose)
* **Real-time Engine**: Socket.io
* **Telephony & Messaging**: Twilio (Programmable Voice & WhatsApp API)
* **AI Engine**: Groq SDK (Llama-3.3-70b-versatile)
* **Speech-to-Text / Text-to-Speech**: Deepgram & Sarvam AI pipelines.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* MongoDB URI
* Twilio Account (with Voice and WhatsApp sandbox enabled)
* Groq API Key

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/ravikantraj25/voicebot.git
cd voicebot
\`\`\`

### 2. Environment Setup
Create a \`.env\` file in the \`server\` directory:
\`\`\`env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_voice_number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
BASE_URL=your_ngrok_or_production_url
\`\`\`

### 3. Install Dependencies
**Backend:**
\`\`\`bash
cd server
npm install
\`\`\`

**Frontend:**
\`\`\`bash
cd ../client
npm install
\`\`\`

### 4. Run the Application
You need to start both the backend and frontend servers.

**Start Backend:**
\`\`\`bash
cd server
npm run dev
\`\`\`

**Start Frontend:**
\`\`\`bash
cd client
npm run dev
\`\`\`

> **Note for Local Testing:** If testing Twilio webhooks locally, you must use a tunneling service like [ngrok](https://ngrok.com/) to expose your \`localhost:5000\` to the internet and update your \`BASE_URL\` in the \`.env\` file.

---

## 📱 Using the Application

1. **The Storefront**: Navigate to \`http://localhost:3000/\`. Add a product to your cart and proceed to checkout. Enter your *actual phone number* (format: +1234567890).
2. **The Call**: Wait a few seconds. Twilio will call your phone. Answer and speak naturally to the AI! Try changing your order quantity or asking about the return policy.
3. **The Dashboard**: Navigate to \`http://localhost:3000/admin\`. Watch your active call populate in real-time. Once the call ends, view the AI-generated summary and sentiment analysis.
4. **WhatsApp Fallback**: Try placing an order and rejecting the phone call. Within seconds, you will receive a WhatsApp message from the AI asking to confirm your order via text.

---

## 🤝 Contribution
Developed by **ADVIT AI Labs** & **Automaton AI**. 
Feel free to open issues or submit pull requests for new features!
