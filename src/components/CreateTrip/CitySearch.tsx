'use client';

import { useState, useEffect, useRef } from 'react';
import { CitySearchResult } from '@/types';

interface CitySearchProps {
  value: CitySearchResult | null;
  onChange: (city: CitySearchResult | null) => void;
}

export function CitySearch({ value, onChange }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleSelect = (city: CitySearchResult) => {
    onChange(city);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg">
        <div className="flex-1">
          <p className="font-medium">{value.name}</p>
          <p className="text-sm text-slate-400">{value.country}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-300"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search for a city..."
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-primary"
      />

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-slate-400 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-slate-400 text-sm">No cities found</div>
          ) : (
            results.map((city, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0"
              >
                <p className="font-medium">{city.name}</p>
                <p className="text-sm text-slate-400">{city.country}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
