/**
 * Order Table Component — Enhanced
 * Now shows product, sentiment, flagged, WhatsApp, recording, smart retry
 */
import React, { useState } from 'react';
import {
  RefreshCw, Trash2, Loader2, Phone, Clock,
  CheckCircle2, XCircle, AlertTriangle, MinusCircle,
  ListFilter, Flag, MessageSquare, AlertOctagon,
} from 'lucide-react';
import SmartRetryBadge from './SmartRetryBadge';
import RecordingPlayer from './RecordingPlayer';

// ─── Status Badge Styling ───────────────────────────────
const STATUS_CONFIG = {
  pending: { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', icon: Clock, label: 'Pending' },
  confirmed: { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: CheckCircle2, label: 'Confirmed' },
  rejected: { bg: 'bg-red-500/10 border-red-500/20 text-red-400', icon: XCircle, label: 'Rejected' },
  failed: { bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400', icon: AlertTriangle, label: 'Failed' },
  'no-response': { bg: 'bg-surface-500/10 border-surface-500/20 text-surface-400', icon: MinusCircle, label: 'No Response' },
  escalated: { bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400', icon: AlertOctagon, label: 'Escalated' },
};

const LANGUAGE_CONFIG = {
  english: { label: 'EN', flag: '🇺🇸', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  hindi: { label: 'HI', flag: '🇮🇳', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  kannada: { label: 'KN', flag: '🇮🇳', bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  marathi: { label: 'MR', flag: '🇮🇳', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
};

const SENTIMENT_EMOJI = {
  positive: { emoji: '😊', color: 'text-emerald-400' },
  neutral: { emoji: '😐', color: 'text-surface-400' },
  negative: { emoji: '😠', color: 'text-red-400' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`status-badge border ${config.bg}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const LanguageBadge = ({ language }) => {
  const config = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.english;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${config.bg}`}>
      {config.flag} {config.label}
    </span>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const SummaryTooltip = ({ summary }) => {
  const [show, setShow] = useState(false);
  if (!summary) return null;
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-[10px] text-brand-400 underline decoration-dotted cursor-help"
      >
        AI Summary
      </button>
      {show && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 rounded-xl bg-surface-800 border border-surface-600 text-xs text-surface-200 shadow-xl z-50">
          {summary}
        </div>
      )}
    </div>
  );
};

const OrderTable = ({ orders, loading, onRetry, onDelete, retryingId }) => {
  if (loading) {
    return (
      <div className="glass-card p-6 animate-in opacity-0 delay-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-surface-800 shimmer" />
          <div className="h-6 w-40 bg-surface-800 rounded-lg shimmer" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-800/50 rounded-xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-in opacity-0 delay-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center">
            <ListFilter size={20} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">Call Logs</h2>
            <p className="text-sm text-surface-400">{orders.length} records</p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Phone size={28} className="text-surface-500" />
          </div>
          <p className="text-surface-400 text-lg font-medium">No calls yet</p>
          <p className="text-surface-500 text-sm mt-1">Initiate your first call to see records</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-surface-700/50">
                <th className="text-left text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Phone</th>
                <th className="text-left text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Product</th>
                <th className="text-left text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Lang</th>
                <th className="text-left text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-center text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Info</th>
                <th className="text-left text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Time</th>
                <th className="text-right text-[10px] font-semibold text-surface-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/50">
              {orders.map((order) => (
                <tr key={order._id} className="group hover:bg-surface-800/30 transition-colors duration-200">
                  {/* Phone */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-surface-500" />
                      <span className="text-xs font-medium text-surface-200">{order.phoneNumber}</span>
                      {order.retryCount > 0 && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-surface-700 text-surface-400 font-medium">
                          ×{order.retryCount + 1}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3">
                    {order.productName ? (
                      <div>
                        <p className="text-xs text-surface-200 truncate max-w-[140px]">{order.productName}</p>
                        <p className="text-[10px] text-surface-500">{order.productQty}x · ₹{order.productPrice}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-surface-600">—</span>
                    )}
                  </td>

                  {/* Language */}
                  <td className="px-4 py-3">
                    <LanguageBadge language={order.language} />
                  </td>

                  {/* Status + Issue */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={order.status} />
                      {order.issueType && order.issueType !== 'none' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-0.5 w-fit">
                          {order.issueType === 'delivery' && '🚚'}
                          {order.issueType === 'payment' && '💳'}
                          {order.issueType === 'product' && '📦'}
                          {order.issueType === 'agent-transfer' && '🧑‍💼'}
                          {order.issueType.replace('-', ' ')}
                        </span>
                      )}
                      {/* Smart retry badge for failed/rejected */}
                      {['failed', 'no-response', 'rejected'].includes(order.status) && (
                        <SmartRetryBadge order={order} />
                      )}
                    </div>
                  </td>

                  {/* Info icons: Sentiment, Flag, WhatsApp, Recording */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Sentiment emoji */}
                      {order.sentiment && SENTIMENT_EMOJI[order.sentiment] && (
                        <span className={`text-sm ${SENTIMENT_EMOJI[order.sentiment].color}`} title={`Sentiment: ${order.sentiment}`}>
                          {SENTIMENT_EMOJI[order.sentiment].emoji}
                        </span>
                      )}
                      {/* Flagged */}
                      {order.flagged && (
                        <span title="Flagged by AI"><Flag size={12} className="text-red-400" /></span>
                      )}
                      {/* WhatsApp sent */}
                      {order.whatsappSent && (
                        <span title="WhatsApp fallback sent"><MessageSquare size={12} className="text-emerald-400" /></span>
                      )}
                      {/* Recording */}
                      <RecordingPlayer
                        recordingUrl={order.recordingUrl}
                        phoneNumber={order.phoneNumber}
                        duration={order.callDuration}
                      />
                    </div>
                    {/* AI Summary tooltip */}
                    {order.aiSummary && (
                      <div className="text-center mt-1">
                        <SummaryTooltip summary={order.aiSummary} />
                      </div>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-surface-400">{formatDate(order.createdAt)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRetry(order._id)}
                        disabled={retryingId === order._id}
                        className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 transition-all disabled:opacity-50"
                        title="Retry call"
                      >
                        {retryingId === order._id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      </button>
                      <button
                        onClick={() => onDelete(order._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                        title="Delete record"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
