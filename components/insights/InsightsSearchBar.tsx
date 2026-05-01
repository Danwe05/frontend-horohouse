'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'Buying property in Douala',
  'Market trends 2026',
  'Investment tips Africa',
  'Fraud prevention',
  'Student housing',
  'Rental guide Yaoundé',
];

interface InsightsSearchBarProps {
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (q: string) => void;
}

export default function InsightsSearchBar({
  className = '',
  placeholder = 'Search market trends, guides…',
  defaultValue = '',
  onSearch,
}: InsightsSearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/insights?q=${encodeURIComponent(trimmed)}`);
    }
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit(query);
    if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input container */}
      <div
        className={`flex items-center bg-white border rounded-full px-5 py-3 gap-3 transition-all duration-200 ${
          focused
            ? 'border-[#222222] shadow-[0_2px_16px_rgba(0,0,0,0.1)]'
            : 'border-[#DDDDDD] hover:border-[#B0B0B0]'
        }`}
      >
        <Search className="w-4 h-4 text-[#717171] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-[#222222] placeholder:text-[#717171] outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="p-1 rounded-full hover:bg-[#F7F7F7] transition-colors"
          >
            <X className="w-3.5 h-3.5 text-[#717171]" />
          </button>
        )}
        {query && (
          <button
            onClick={() => handleSubmit(query)}
            className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {focused && !query && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EBEBEB] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-4 z-50"
          >
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#717171] mb-3">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => { setQuery(s); handleSubmit(s); }}
                  className="px-3.5 py-1.5 rounded-full border border-[#DDDDDD] text-[13px] text-[#222222] hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}