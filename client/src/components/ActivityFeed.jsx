/**
 * Activity Feed Component
 * Real-time scrolling feed of recent call events
 * Shows the latest call activities with timestamps and status changes
 */
import React from 'react';
import {
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity,
} from 'lucide-react';

const STATUS_ICONS = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  confirmed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  failed: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'no-response': { icon: Phone, color: 'text-surface-400', bg: 'bg-surface-500/10' },
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const getStatusMessage = (order) => {
  switch (order.status) {
    case 'confirmed':
      return `Order confirmed by ${order.phoneNumber}`;
    case 'rejected':
      return `Order rejected by ${order.phoneNumber}`;
    case 'pending':
      return `Call initiated to ${order.phoneNumber}`;
    case 'failed':
      return `Call failed to ${order.phoneNumber}`;
    case 'no-response':
      return `No response from ${order.phoneNumber}`;
    default:
      return `Call to ${order.phoneNumber}`;
  }
};

const ActivityFeed = ({ orders, loading }) => {
  // Show only the latest 8 activities
  const recentOrders = (orders || []).slice(0, 8);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-in opacity-0 delay-300">
        <div className="h-6 w-32 bg-surface-800 rounded-lg shimmer mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-800/50 rounded-xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-in opacity-0 delay-300">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brand-400" />
        <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Recent Activity
        </h3>
        {recentOrders.length > 0 && (
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto" />
        )}
      </div>

      {recentOrders.length === 0 ? (
        <p className="text-sm text-surface-500 text-center py-6">
          No activity yet
        </p>
      ) : (
        <div className="space-y-1">
          {recentOrders.map((order, index) => {
            const config = STATUS_ICONS[order.status] || STATUS_ICONS.pending;
            const Icon = config.icon;

            return (
              <div
                key={order._id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-800/40 transition-colors duration-200 group"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}
                >
                  <Icon size={14} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-200 truncate">
                    {getStatusMessage(order)}
                  </p>
                  <p className="text-[10px] text-surface-500">
                    {order.language.charAt(0).toUpperCase() + order.language.slice(1)}
                    {order.retryCount > 0 && ` • Retry #${order.retryCount}`}
                  </p>
                </div>
                <span className="text-[10px] text-surface-500 shrink-0">
                  {getTimeAgo(order.updatedAt || order.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
