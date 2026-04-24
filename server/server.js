/**
 * Voice Order Bot - Express Server with Socket.io
 * Main entry point for the backend application
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const callRoutes = require('./routes/callRoutes');
const twilioRoutes = require('./routes/twilioRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const shopRoutes = require('./routes/shopRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ─── Socket.io Setup ────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to routes/controllers
app.set('io', io);

// Track active calls
const activeCalls = new Map();
app.set('activeCalls', activeCalls);

io.on('connection', (socket) => {
  console.log('🔌 Dashboard connected:', socket.id);

  // Send current active calls on connect
  socket.emit('activeCalls', Array.from(activeCalls.values()));

  socket.on('disconnect', () => {
    console.log('🔌 Dashboard disconnected:', socket.id);
  });
});

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio webhooks

// ─── Request Logging (reduced noise) ────────────────────────
app.use((req, res, next) => {
  // Don't log polling requests
  if (!req.path.includes('/orders') || req.method !== 'GET') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/call', callRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shop', shopRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Automaton AI Voice Bot API is running',
    timestamp: new Date().toISOString(),
    activeCalls: activeCalls.size,
  });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Start Server ───────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`\n🚀 Automaton AI Voice Bot running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🔌 Socket.io: ws://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
