/**
 * Analytics Cards Component — Enhanced
 * Shows 8 cards: Total, Confirmed, Rejected, Pending, Failed,
 * Success Rate, Sentiment, WhatsApp Fallbacks
 */
import React from 'react';
import {
  Phone, CheckCircle2, XCircle, Clock, AlertTriangle,
  TrendingUp, SmilePlus, MessageSquare,
} from 'lucide-react';

const AnalyticsCards = ({ analytics, loading }) => {
  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 animate-in opacity-0">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="stat-card shimmer h-24" />
        ))}
      </div>
    );
  }

  // Determine dominant sentiment
  const sentimentMax = Math.max(analytics.positive || 0, analytics.neutral || 0, analytics.negative || 0);
  const dominantSentiment =
    sentimentMax === 0
      ? { emoji: '—', label: 'No data', color: 'text-surface-400' }
      : sentimentMax === (analytics.positive || 0)
      ? { emoji: '😊', label: 'Positive', color: 'text-emerald-400' }
      : sentimentMax === (analytics.negative || 0)
      ? { emoji: '😠', label: 'Negative', color: 'text-red-400' }
      : { emoji: '😐', label: 'Neutral', color: 'text-surface-300' };

  const cards = [
    {
      label: 'Total Calls',
      value: analytics.total,
      icon: Phone,
      gradient: 'from-brand-500/20 to-purple-500/20',
      border: 'border-brand-500/20',
      text: 'text-brand-400',
    },
    {
      label: 'Confirmed',
      value: analytics.confirmed,
      icon: CheckCircle2,
      gradient: 'from-emerald-500/20 to-green-500/20',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
    },
    {
      label: 'Rejected',
      value: analytics.rejected,
      icon: XCircle,
      gradient: 'from-red-500/20 to-pink-500/20',
      border: 'border-red-500/20',
      text: 'text-red-400',
    },
    {
      label: 'Pending',
      value: analytics.pending,
      icon: Clock,
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
    },
    {
      label: 'Failed',
      value: analytics.failed,
      icon: AlertTriangle,
      gradient: 'from-orange-500/20 to-red-500/20',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
    },
    {
      label: 'Success Rate',
      value: `${analytics.successRate}%`,
      icon: TrendingUp,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
    },
    {
      label: 'Sentiment',
      value: dominantSentiment.emoji,
      icon: SmilePlus,
      gradient: 'from-violet-500/20 to-fuchsia-500/20',
      border: 'border-violet-500/20',
      text: dominantSentiment.color,
      subtitle: dominantSentiment.label,
    },
    {
      label: 'WhatsApp',
      value: analytics.whatsappSent || 0,
      icon: MessageSquare,
      gradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/20',
      text: 'text-green-400',
      subtitle: 'Fallbacks sent',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`stat-card animate-in opacity-0`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} border ${card.border} flex items-center justify-center`}
              >
                <Icon size={14} className={card.text} />
              </div>
            </div>
            <div>
              <p className={`text-xl font-bold ${card.text}`}>{card.value}</p>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">
                {card.label}
              </p>
              {card.subtitle && (
                <p className="text-[9px] text-surface-600">{card.subtitle}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;
