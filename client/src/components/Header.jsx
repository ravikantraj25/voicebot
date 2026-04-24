/**
 * Header Component — Enhanced
 * Shows active call count with pulsing LIVE badge
 */
import React from 'react';
import { Phone, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = ({ isConnected, activeCallCount = 0 }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 overflow-hidden">
              <img src="/automaton-logo.jpg" alt="Automaton AI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text leading-tight">
                Automaton AI
              </h1>
              <p className="text-[11px] text-surface-400 leading-tight">
                Voice Order Confirmation System
              </p>
            </div>
          </div>

          {/* Right Side: Live Badge + Connection Status */}
          <div className="flex items-center gap-3">
            {/* Active Calls LIVE badge */}
            {activeCallCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-xs font-bold text-red-400">
                  LIVE
                </span>
                <span className="text-[10px] text-red-400/70">
                  {activeCallCount} call{activeCallCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              }`}
            >
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl border border-surface-700/50 text-surface-400 hover:text-brand-500 hover:bg-surface-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
