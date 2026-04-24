/**
 * Dashboard Page — Enhanced
 * Integrates Socket.io real-time updates, AI search, product details,
 * recording playback, smart retry, and all analytics
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { io } from 'socket.io-client';
import Header from '../components/Header';
import AnalyticsCards from '../components/AnalyticsCards';
import AnalyticsChart from '../components/AnalyticsChart';
import AISearchBar from '../components/AISearchBar';
import LiveTranscriptPanel from '../components/LiveTranscriptPanel';
import AdminVoiceCommand from '../components/AdminVoiceCommand';
import CallForm from '../components/CallForm';
import CallScriptPreview from '../components/CallScriptPreview';
import BatchUpload from '../components/BatchUpload';
import OrderTable from '../components/OrderTable';
import ActivityFeed from '../components/ActivityFeed';
import {
  initiateCall,
  retryCall,
  getOrders,
  getAnalytics,
  deleteOrder,
  batchCall,
  exportCSV,
  healthCheck,
} from '../services/api';

const SOCKET_URL = 'http://localhost:5000';

const toastStyle = {
  background: '#1e293b',
  color: '#e2e8f0',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  borderRadius: '12px',
};
const errorToastStyle = { ...toastStyle, border: '1px solid rgba(239, 68, 68, 0.3)' };

const Dashboard = () => {
  // ─── State ──────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [displayOrders, setDisplayOrders] = useState([]); // For search filtering
  const [analytics, setAnalytics] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [activeCallCount, setActiveCallCount] = useState(0);
  const [searchActive, setSearchActive] = useState(false);

  // Live Call State
  const [isLive, setIsLive] = useState(false);
  const [liveLanguage, setLiveLanguage] = useState('');
  const [liveTranscripts, setLiveTranscripts] = useState([]);
  const [emotionData, setEmotionData] = useState({ emotion: 'neutral', intensity: 10 });
  const [isBotThinking, setIsBotThinking] = useState(false);

  const socketRef = useRef(null);

  // ─── Data Fetching ─────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        getOrders(),
        getAnalytics(),
      ]);
      setOrders(ordersRes.data || []);
      if (!searchActive) {
        setDisplayOrders(ordersRes.data || []);
      }
      setAnalytics(analyticsRes.data || null);
      setIsConnected(true);
    } catch (error) {
      console.error('Fetch error:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchActive]);

  // ─── Socket.io Setup ──────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket.io connected');
    });

    socket.on('orderUpdated', () => {
      // Refresh data when server pushes update
      fetchData();
    });

    socket.on('callStarted', (data) => {
      setActiveCallCount((prev) => prev + 1);
      toast.success(`📞 Call started: ${data.phoneNumber}`, { style: toastStyle, duration: 3000 });
    });

    socket.on('callEnded', (data) => {
      setActiveCallCount((prev) => Math.max(0, prev - 1));
      const emoji = data.status === 'confirmed' ? '✅' : data.status === 'rejected' ? '❌' : '📱';
      toast.success(`${emoji} Call ended: ${data.status}`, { style: toastStyle, duration: 4000 });
    });

    socket.on('summaryReady', (data) => {
      const emoji = data.sentiment === 'positive' ? '😊' : data.sentiment === 'negative' ? '😠' : '😐';
      toast.success(`${emoji} AI Summary: ${data.summary.slice(0, 60)}...`, {
        style: toastStyle,
        duration: 5000,
      });
    });

    // ─── Live Streaming Events ───────────────────
    socket.on('liveCallStarted', (data) => {
      setIsLive(true);
      setLiveLanguage(data.language);
      setLiveTranscripts([]);
      setEmotionData({ emotion: 'neutral', intensity: 10 });
    });

    socket.on('newTranscript', (data) => {
      setIsBotThinking(false);
      setLiveTranscripts((prev) => [...prev, { role: data.role, text: data.text }]);
    });

    socket.on('botThinking', () => {
      setIsBotThinking(true);
    });

    socket.on('emotionUpdated', (data) => {
      setEmotionData(data);
    });

    socket.on('activeCalls', (calls) => {
      setActiveCallCount(calls.length);
      if (calls.length === 0) setIsLive(false);
    });

    return () => socket.disconnect();
  }, [fetchData]);

  // ─── Initial Load + Fallback Polling ──────────────
  useEffect(() => {
    healthCheck()
      .then(() => {
        setIsConnected(true);
        fetchData();
      })
      .catch(() => {
        setIsConnected(false);
        setIsLoading(false);
      });

    // Fallback polling every 10 seconds (reduced from 5s since Socket.io handles real-time)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Handlers ──────────────────────────────────────

  const handleStartCall = async ({ phoneNumber, language, productName, productQty, productPrice }) => {
    setIsCallLoading(true);
    setSelectedLanguage(language);

    try {
      await initiateCall(phoneNumber, language, productName, productQty, productPrice);
      toast.success(`📞 Calling ${phoneNumber}...`, { duration: 3000, style: toastStyle });
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to initiate call', { duration: 5000, style: errorToastStyle });
    } finally {
      setIsCallLoading(false);
    }
  };

  const handleRetry = async (orderId) => {
    setRetryingId(orderId);
    try {
      await retryCall(orderId);
      toast.success('🔄 Retry call initiated', { style: toastStyle });
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to retry call', { style: errorToastStyle });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await deleteOrder(orderId);
      toast.success('🗑️ Record deleted', { style: toastStyle });
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete', { style: errorToastStyle });
    }
  };

  const handleBatchCall = async (contacts) => {
    setIsCallLoading(true);
    try {
      const result = await batchCall(contacts);
      toast.success(`📦 ${result.message}`, { duration: 5000, style: toastStyle });
      await fetchData();
    } catch (error) {
      toast.error(error.message || 'Batch call failed', { style: errorToastStyle });
    } finally {
      setIsCallLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportCSV();
      toast.success('📥 Report downloaded!', { style: toastStyle });
    } catch (error) {
      toast.error('Failed to export CSV', { style: errorToastStyle });
    }
  };

  // AI Search handlers
  const handleSearchResults = (results, description) => {
    setDisplayOrders(results);
    setSearchActive(true);
    toast.success(`🔍 ${description}`, { style: toastStyle });
  };

  const handleSearchClear = () => {
    setDisplayOrders(orders);
    setSearchActive(false);
  };

  const handleVoiceIntent = async (intent) => {
    if (intent.action === 'refresh') {
      await fetchData();
      toast.success('Dashboard refreshed via voice');
    } else if (intent.action === 'filter_failed') {
      const failed = orders.filter(o => o.status === 'failed' || o.status === 'rejected' || o.status === 'no-response');
      setDisplayOrders(failed);
      setSearchActive(true);
    } else if (intent.action === 'call_language' && intent.language) {
      // Find pending orders for that language and batch call them
      const pendingForLang = orders.filter(o => o.status === 'pending' && o.language === intent.language);
      if (pendingForLang.length > 0) {
        handleBatchCall(pendingForLang);
      } else {
        toast.error(`No pending ${intent.language} orders found`);
      }
    } else if (intent.action === 'search' && intent.searchQuery) {
      // Simulate typing in the AI search bar
      handleSearchResults(
        orders.filter(o => JSON.stringify(o).toLowerCase().includes(intent.searchQuery.toLowerCase())), 
        `Voice Search: ${intent.searchQuery}`
      );
    }
  };

  // ─── Render ────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header isConnected={isConnected} activeCallCount={activeCallCount} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* AI Search Bar */}
          <section>
            <AISearchBar onSearchResults={handleSearchResults} onClear={handleSearchClear} />
          </section>

          {/* Live Transcript Panel */}
          <LiveTranscriptPanel 
            transcripts={liveTranscripts}
            isLive={isLive}
            language={liveLanguage}
            emotionData={emotionData}
            isBotThinking={isBotThinking}
          />

          {/* Analytics Cards */}
          <section>
            <AnalyticsCards analytics={analytics} loading={isLoading} />
          </section>

          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Call Form + Actions */}
            <div className="lg:col-span-3 space-y-4">
              <CallForm
                onSubmit={handleStartCall}
                isLoading={isCallLoading}
                onLanguageChange={setSelectedLanguage}
              />
              <div className="grid grid-cols-2 gap-3">
                <CallScriptPreview language={selectedLanguage} />
                <BatchUpload onBatchCall={handleBatchCall} isLoading={isCallLoading} />
              </div>
            </div>

            {/* Column 2: Chart + Activity Feed */}
            <div className="lg:col-span-3 space-y-4">
              <AnalyticsChart analytics={analytics} loading={isLoading} />
              <ActivityFeed orders={orders} loading={isLoading} />
            </div>

            {/* Column 3: Order Table (spans 6 cols) */}
            <div className="lg:col-span-6">
              <div className="flex items-center justify-end mb-3 gap-2">
                {searchActive && (
                  <span className="text-xs text-brand-400">
                    Showing {displayOrders.length} of {orders.length} results
                  </span>
                )}
                {orders.length > 0 && (
                  <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5">
                    <Download size={14} />
                    Export CSV
                  </button>
                )}
              </div>
              <OrderTable
                orders={displayOrders}
                loading={isLoading}
                onRetry={handleRetry}
                onDelete={handleDelete}
                retryingId={retryingId}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-surface-500">
            <p>Automaton AI Infosystem © {new Date().getFullYear()}</p>
            <p className="text-xs">Powered by Twilio · Groq · MongoDB · Socket.io</p>
          </div>
        </div>
      </footer>

      {/* Admin Floating Voice Command */}
      <AdminVoiceCommand onCommandExecuted={handleVoiceIntent} />
    </div>
  );
};

export default Dashboard;
