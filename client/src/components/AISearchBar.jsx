/**
 * AI Search Bar Component
 * Natural language search powered by Groq
 * "show failed Kannada calls today" → filters the table
 */
import React, { useState } from 'react';
import { Sparkles, Search, X, Loader2 } from 'lucide-react';
import { searchOrders } from '../services/api';

const AISearchBar = ({ onSearchResults, onClear }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resultInfo, setResultInfo] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const result = await searchOrders(query.trim());
      setResultInfo({
        description: result.description,
        count: result.count,
        query: result.query,
      });
      onSearchResults(result.data, result.description);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResultInfo(null);
    onClear();
  };

  return (
    <div className="glass-card p-4 animate-in opacity-0">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Sparkles
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Ask anything… e.g. "show failed Kannada calls today"'
              className="input-field pl-12 pr-4 py-3 text-sm"
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="btn-primary px-4 py-3 flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>

      {/* Search Result Tag */}
      {resultInfo && (
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500/15 text-brand-300 border border-brand-500/20">
            <Sparkles size={12} />
            {resultInfo.description}
          </span>
          <button
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-surface-700 text-surface-400 transition-colors"
            title="Clear search"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AISearchBar;
