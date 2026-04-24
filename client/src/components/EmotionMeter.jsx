import React from 'react';
import { Smile, Frown, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function EmotionMeter({ emotionData }) {
  const { emotion = 'neutral', intensity = 10 } = emotionData || {};

  // Define styling and icons based on Hume AI's mapped emotions
  const emotionConfig = {
    happy: { color: 'text-emerald-500', bg: 'bg-emerald-500/20', stroke: '#10b981', icon: Smile, label: 'Happy' },
    confident: { color: 'text-blue-500', bg: 'bg-blue-500/20', stroke: '#3b82f6', icon: CheckCircle2, label: 'Confident' },
    hesitant: { color: 'text-amber-500', bg: 'bg-amber-500/20', stroke: '#f59e0b', icon: HelpCircle, label: 'Hesitant' },
    frustrated: { color: 'text-rose-500', bg: 'bg-rose-500/20', stroke: '#f43f5e', icon: Frown, label: 'Frustrated' },
    neutral: { color: 'text-slate-400', bg: 'bg-slate-400/20', stroke: '#94a3b8', icon: AlertCircle, label: 'Neutral' },
  };

  const config = emotionConfig[emotion.toLowerCase()] || emotionConfig.neutral;
  const Icon = config.icon;

  // SVG Circle calculations for the progress ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (intensity / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl transition-all duration-500">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Live Emotion</h3>
      
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Background Track */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-700/30"
          />
          {/* Animated Progress Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={config.stroke}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-in-out"
          />
        </svg>

        {/* Center Icon */}
        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${config.bg} transition-colors duration-500`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className={`text-lg font-bold ${config.color} transition-colors duration-500`}>{config.label}</p>
        <p className="text-xs text-slate-500 mt-1">{intensity}% Intensity</p>
      </div>
    </div>
  );
}
