# 🚀 Automaton AI Voice Bot (Enterprise Edition)

A production-ready, real-time Conversational Voice AI Agent designed for eCommerce order confirmations. This system completely replaces traditional "Press 1 for Yes, Press 2 for No" IVR systems with a fully conversational, highly intelligent AI that speaks native Indian languages, processes emotions in real-time, and operates with sub-second latency.

---

## 🌟 Key Features

1. **Real-time Conversational AI:** Streams raw audio via WebSockets to Groq (Llama 3.3) for instant, natural conversations.
2. **Native Indian Languages:** Uses **Sarvam AI** for hyper-realistic Hindi, Kannada, and Marathi text-to-speech and speech-to-text.
3. **Ultra-fast English Transcription:** Uses **Deepgram** for sub-second English audio transcription.
4. **Real-Time Emotion Meter:** Uses **Hume AI** to analyze the caller's vocal prosody and updates a dynamic dashboard gauge (Happy, Hesitant, Frustrated, etc.).
5. **Live Dashboard Visualizers:** Features a live chat-bubble transcript panel and canvas-based audio waveforms that bounce when the customer or AI speaks.
6. **Admin Voice Commands:** A floating microphone button allows admins to control the dashboard entirely by voice (e.g., "Call all pending Kannada orders").
7. **Omnichannel Fallback:** Automatically sends a WhatsApp message with order details if a call goes unanswered.
8. **AI Call Summaries:** Groq automatically reads the full transcript after every call to generate a short summary, sentiment score, and flagged issue warnings.
9. **Natural Language Search:** Admins can filter dashboard data by typing conversational queries (e.g., "Show me failed calls from today").
10. **Socket.io Real-time UI:** The entire dashboard updates instantly without page refreshes.

---

## 📂 Project Structure & File Explanations

### Backend (`/server`)
The backend is an Express Node.js application responsible for orchestrating WebSockets, API endpoints, and 6 different external AI services.

*   **`server.js`**
    The main entry point. Sets up the Express HTTP server, configures the `Socket.io` server for dashboard updates, and creates the raw `ws` WebSocket server to handle incoming Twilio Media Streams.
*   **`seed.js`**
    A utility script to populate the MongoDB database with realistic mock eCommerce orders to test the system.

**`/services` (The Core Engine)**
*   **`ConversationManager.js`**
    *The Brain.* This class is instantiated for every active call. It manages the real-time WebSocket connection to Twilio, buffers the incoming audio, pipes it to Deepgram/Sarvam/Hume, sends the text to Groq LLM, and streams the AI's audio response back to the user.
*   **`deepgramService.js`**
    Connects to Deepgram's API. Used for ultra-fast transcription of English phone calls and for parsing the audio from the Admin Voice Command button.
*   **`sarvamService.js`**
    Connects to Sarvam AI. Uses the `saarika:v2` model to transcribe Indian languages and the `bulbul:v1` model to generate the native-sounding Indian language audio responses.
*   **`humeService.js`**
    Connects to Hume's Empathic Voice API. Analyzes audio chunks to detect human emotion (prosody) and maps it to 5 simplified states for the dashboard.
*   **`groqService.js`**
    Connects to Groq. Uses Llama 3.3 70B to generate post-call summaries, extract sentiment, and parse natural language queries for the dashboard search bar.
*   **`twilioService.js`**
    Handles the traditional Twilio REST API calls. Used to initiate the outbound phone calls and send the WhatsApp fallback/confirmation messages.

**`/controllers`**
*   **`callController.js`**
    Handles REST API requests from the frontend to start calls, retry calls, do batch calls, and process the Admin Voice Commands via `multer` audio uploads.
*   **`twilioController.js`**
    Handles the Webhook endpoints that Twilio pings when a call connects. Instead of returning TwiML to play a static message, this controller returns `<Connect><Stream>` to hand off the call to our WebSocket server.
*   **`orderController.js`**
    Handles CRUD operations for the Orders database and calculates the statistics for the dashboard Analytics Cards.

**`/models`**
*   **`Order.js`**
    The Mongoose schema defining how an order, its product details, the call transcript arrays, and AI summaries are stored in MongoDB.

---

### Frontend (`/client`)
The frontend is a React application built with Vite and Tailwind CSS. It uses a premium "Sunset" glassmorphism aesthetic.

**`/pages`**
*   **`Dashboard.jsx`**
    The central hub. It maintains the Socket.io connection to the server, holds the global state for active calls, and renders all the visualizer components based on real-time events.

**`/components` (The Visualizers)**
*   **`LiveTranscriptPanel.jsx`**
    Appears only during active calls. Renders the chat bubbles word-by-word, handles auto-scrolling, and displays the "Aria is reasoning..." animations.
*   **`EmotionMeter.jsx`**
    An animated SVG circular gauge that receives real-time scores from Hume AI and shifts its colors and icons based on the customer's mood.
*   **`AudioWaveform.jsx`**
    Uses HTML5 Canvas to render bouncing frequency bars that animate whenever the Customer or the AI is speaking.
*   **`AdminVoiceCommand.jsx`**
    The floating microphone button in the bottom right. Records the admin's voice using the browser's `MediaRecorder` API and sends it to the backend to control the dashboard.
*   **`AISearchBar.jsx`**
    The top search bar that passes natural language queries to Groq to filter the data table.
*   **`OrderTable.jsx` & `AnalyticsCards.jsx`**
    Displays the database records, AI summary tooltips, WhatsApp status badges, and aggregate statistics.

**`/services`**
*   **`api.js`**
    The frontend HTTP client that wraps `fetch` to easily communicate with the backend REST endpoints.

---

## ⚙️ Environment Variables Setup

You must create a `.env` file inside the `/server` folder with the following keys:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_twilio_number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Database & Server
MONGODB_URI=your_mongodb_connection_string
PORT=5000
BASE_URL=https://your-ngrok-url.ngrok-free.app # Crucial for WebSockets

# AI Engine Keys
GROQ_API_KEY=your_groq_key             # Llama 3.3 Reasoning
SARVAM_API_KEY=your_sarvam_key         # Indian Language Speech
DEEPGRAM_API_KEY=your_deepgram_key     # English Fast Speech
HUME_API_KEY=your_hume_key             # Emotion Tracking
HUME_SECRET_KEY=your_hume_secret
```

---

## 🚀 How to Run Locally

1. **Start ngrok:** Twilio requires a public URL to send webhooks and connect to WebSockets.
   `ngrok http 5000`
   *(Update `BASE_URL` in your `.env` with the generated ngrok URL).*

2. **Start the Backend:**
   ```bash
   cd server
   npm install
   node seed.js # (Optional) Populate mock data
   npm run dev
   ```

3. **Start the Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

Open `http://localhost:5173` to view the dashboard and start automating your calls!
