# 🤖 Automaton AI Infosystem — Voice Order Confirmation Bot

> **Hackathon Project** — An enterprise-grade multilingual voice bot that automates order confirmation through intelligent office calls, powered by Twilio, Groq AI, and real-time Socket.io.

---

## 🎯 Problem Statement

**Voice Assistance Bot for Automaton AI Infosystem Office Call Order Acceptance**

Develop a multilingual voice assistance bot for customer order acceptance through automated office calls, supporting **English, Hindi, Kannada, and Marathi**.

---

## ✨ Features

### Core Features
| Feature | Description |
|---------|-------------|
| 📞 **Multilingual Voice Calls** | Automated calls in English, Hindi, Kannada & Marathi |
| 🛒 **Real Product Details** | Bot reads actual product name, quantity & price during calls |
| 🎯 **Multi-Level IVR** | Press 1 (Confirm), Press 2 (Reject), Press 3 (Support Menu) |
| 🛠️ **Customer Support Menu** | Delivery, Payment, Product issues & Agent transfer |
| 📊 **Real-time Dashboard** | Live analytics with Socket.io WebSocket updates |

### AI-Powered Features
| Feature | Technology |
|---------|------------|
| 🔍 **Natural Language Search** | Type "show failed Kannada calls" → AI filters results |
| 🧠 **AI Call Summaries** | Groq Llama 3.3 70B generates post-call summaries |
| 😊 **Sentiment Analysis** | AI detects positive/neutral/negative customer sentiment |
| 🚩 **Smart Flagging** | Auto-flags calls where customers complained or escalated |

### Enterprise Features
| Feature | Description |
|---------|-------------|
| 🎙️ **Call Recording** | Every call recorded & playable in the dashboard |
| 📱 **WhatsApp Fallback** | Auto-sends WhatsApp if call goes unanswered |
| 📦 **Batch Calling (CSV)** | Upload CSV to call multiple customers at once |
| 📥 **CSV Export** | Download call reports with all data |
| ⏰ **Smart Retry Predictor** | AI suggests best time to retry failed calls |
| 📈 **Interactive Charts** | Custom SVG donut chart for call distribution |
| 🔴 **Live Call Indicator** | Pulsing LIVE badge when calls are active |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Voice** | Twilio Voice SDK |
| **AI/LLM** | Groq (Llama 3.3 70B Versatile) |
| **Real-time** | Socket.io WebSockets |
| **Messaging** | Twilio WhatsApp Sandbox |
| **Tunneling** | ngrok (for Twilio webhooks) |

---

## 📁 Project Structure

```
voice-order-bot/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AISearchBar.jsx       # 🔍 NL search (Groq)
│   │   │   ├── ActivityFeed.jsx      # ⚡ Real-time event feed
│   │   │   ├── AnalyticsCards.jsx    # 📊 8 metric cards
│   │   │   ├── AnalyticsChart.jsx    # 📈 SVG donut chart
│   │   │   ├── BatchUpload.jsx       # 📦 CSV batch calling
│   │   │   ├── CallForm.jsx          # 📞 Call form + products
│   │   │   ├── CallScriptPreview.jsx # 🔊 Interactive flow preview
│   │   │   ├── Header.jsx            # 🔴 Header + LIVE badge
│   │   │   ├── OrderTable.jsx        # 📋 Enhanced call logs
│   │   │   ├── RecordingPlayer.jsx   # 🎙️ Audio playback modal
│   │   │   └── SmartRetryBadge.jsx   # ⏰ Retry time predictor
│   │   ├── hooks/
│   │   │   └── useSocket.js          # 🔌 Socket.io hook
│   │   ├── pages/
│   │   │   └── Dashboard.jsx         # 🏠 Main dashboard
│   │   └── services/
│   │       └── api.js                # 📡 HTTP + API client
│   └── index.html
│
├── server/                    # Node.js Backend
│   ├── config/
│   │   └── db.js                     # MongoDB connection
│   ├── controllers/
│   │   ├── callController.js         # Call initiation + AI summaries
│   │   ├── orderController.js        # Orders + NL search + analytics
│   │   └── twilioController.js       # Multi-level IVR + recording
│   ├── models/
│   │   └── Order.js                  # Enhanced schema (product, sentiment, etc.)
│   ├── routes/
│   │   ├── callRoutes.js
│   │   ├── orderRoutes.js
│   │   └── twilioRoutes.js
│   ├── services/
│   │   ├── groqService.js            # 🧠 Groq AI (summary + search)
│   │   ├── messageService.js         # 🗣️ Multilingual voice messages
│   │   └── twilioService.js          # 📞 Twilio + WhatsApp
│   ├── seed.js                       # 🌱 Database seeder
│   └── server.js                     # 🚀 Express + Socket.io
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Twilio account (free trial)
- Groq API key (free at groq.com)
- ngrok (for Twilio webhooks)

### 1. Clone & Install
```bash
# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### 2. Configure Environment
Create `server/.env`:
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
MONGODB_URI=your_mongodb_uri
PORT=5000
BASE_URL=https://your-ngrok-url.ngrok-free.dev
GROQ_API_KEY=your_groq_key
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 3. Seed Database
```bash
cd server
node seed.js
```

### 4. Start ngrok
```bash
ngrok http 5000
```
Update `BASE_URL` in `.env` with the ngrok URL.

### 5. Run
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Dashboard: **http://localhost:3000**
API: **http://localhost:5000/api**

---

## 🎮 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/call` | Initiate call with product details |
| POST | `/api/call/retry/:id` | Retry a failed call |
| POST | `/api/call/batch` | Batch call from CSV |
| POST | `/api/call/summary/:id` | Generate AI summary |
| GET | `/api/orders` | Get all call logs |
| GET | `/api/orders/analytics` | Get analytics dashboard data |
| POST | `/api/orders/search` | AI natural language search |
| GET | `/api/orders/export` | Download CSV report |
| DELETE | `/api/orders/:id` | Delete a record |
| POST | `/api/twilio/voice` | TwiML main menu |
| POST | `/api/twilio/response` | Process DTMF input |
| POST | `/api/twilio/support` | Support sub-menu |
| POST | `/api/twilio/status` | Call status callback |
| POST | `/api/twilio/recording` | Recording ready callback |
| GET | `/api/health` | Health check |

---

## 🎯 Live Demo Flow

1. Open dashboard → Shows **Connected** + 8 analytics cards
2. Select product → Pick "Wireless Bluetooth Headphones — ₹1499"
3. Enter phone → Start call
4. Customer answers → Hears product details in selected language
5. Customer presses 1 → Order confirmed
6. Dashboard updates **instantly** via Socket.io
7. **AI Summary** appears as toast notification
8. Type in search → `"show confirmed Hindi calls"` → Table filters
9. Click **Play** button → Listen to actual call recording
10. If no answer → **WhatsApp fallback** sent automatically

---

## 👥 Team

**Automaton AI Infosystem** — Hackathon Submission

---

## 📄 License

MIT License — Built for demonstration purposes.
