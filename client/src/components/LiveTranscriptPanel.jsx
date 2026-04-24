import React, { useEffect, useRef, useState } from 'react';
import { Bot, User, Radio } from 'lucide-react';
import AudioWaveform from './AudioWaveform';
import EmotionMeter from './EmotionMeter';

export default function LiveTranscriptPanel({ transcripts = [], isLive = false, language, emotionData, isBotThinking }) {
  const scrollRef = useRef(null);
  
  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, isBotThinking]);

  if (!isLive && transcripts.length === 0) return null;

  return (
    <div className="w-full bg-[#1e2336] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* LEFT: Live Conversation Area */}
      <div className="flex-1 flex flex-col h-full border-r border-white/5">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Live Call Transcript</h3>
              <p className="text-xs text-slate-400 capitalize">Language: {language || 'Auto-detecting...'}</p>
            </div>
          </div>

          {/* LIVE pulsing badge */}
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-red-500 tracking-wider">LIVE</span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {transcripts.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                  msg.role === 'customer' ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                }`}>
                  {msg.role === 'customer' ? <User size={14} /> : <Bot size={14} />}
                </div>
                
                {/* Bubble */}
                <div className={`px-4 py-3 text-sm rounded-2xl ${
                  msg.role === 'customer' 
                    ? 'bg-[#2a3045] text-slate-200 rounded-tr-sm border border-slate-700/50' 
                    : 'bg-indigo-500/10 text-indigo-100 rounded-tl-sm border border-indigo-500/20'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking Indicator */}
          {isBotThinking && (
            <div className="flex justify-start animate-in fade-in">
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                  <Bot size={14} />
                </div>
                <div className="px-4 py-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-indigo-400 ml-2">Aria is reasoning...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Visualizers Sidebar */}
      <div className="w-full md:w-64 bg-black/10 p-6 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-white/5 space-y-12">
        
        {/* Waveforms */}
        <div className="w-full flex flex-col gap-6">
          <AudioWaveform isSpeaking={isLive && !isBotThinking} color="#10b981" label="Customer Mic" />
          <AudioWaveform isSpeaking={isLive && isBotThinking} color="#8b5cf6" label="Aria Synthesis" />
        </div>

        {/* Hume AI Emotion Gauge */}
        <div className="w-full">
          <EmotionMeter emotionData={emotionData} />
        </div>

      </div>
    </div>
  );
}
