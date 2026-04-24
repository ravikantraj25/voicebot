/**
 * Smart Retry Badge
 * Shows intelligent retry time suggestions based on call patterns
 * Entirely client-side logic — no external API needed
 */
import React from 'react';
import { Clock } from 'lucide-react';

const getRetryAdvice = (order) => {
  const now = new Date();
  const callTime = new Date(order.createdAt);
  const hour = callTime.getHours();

  // Call was briefly connected then hung up (< 5s) → likely busy
  if (order.callDuration > 0 && order.callDuration < 5) {
    if (hour < 17) {
      return { time: 'Today 6:30 PM', reason: 'Customer was busy' };
    }
    return { time: 'Tomorrow 9:00 AM', reason: 'Customer was busy' };
  }

  // Call never connected during daytime → try evening
  if (order.status === 'failed' || order.status === 'no-response') {
    if (hour >= 9 && hour < 17) {
      return { time: 'Today 7:00 PM', reason: 'Try after work hours' };
    }
    if (hour >= 17) {
      return { time: 'Tomorrow 10:00 AM', reason: 'Try morning hours' };
    }
    return { time: 'Today 2:00 PM', reason: 'Try afternoon' };
  }

  // Customer rejected → suggest next morning when they may reconsider
  if (order.status === 'rejected') {
    return { time: 'Tomorrow 9:00 AM', reason: 'May reconsider after reflection' };
  }

  return null;
};

const SmartRetryBadge = ({ order }) => {
  const advice = getRetryAdvice(order);
  if (!advice) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-1" title={advice.reason}>
      <Clock size={10} />
      <span>Best retry: {advice.time}</span>
    </div>
  );
};

export default SmartRetryBadge;
export { getRetryAdvice };
