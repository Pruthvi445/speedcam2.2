'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, MapPin, Clock, Navigation, LocateFixed, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RECENT_SEARCHES_KEY = 'speedcam_recent_searches';

export function SearchBar({ 
  theme, 
  language, 
  myLoc, 
  onSelectLocation, 
  addLocalAlert, 
  getMessage 
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  // Fetch nearby locations (initial suggestions)
  const fetchNearby = useCallback(async () => {
    if (!myLoc || myLoc[0] === 0) return;
    const KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
    if (!KEY) return;

    try {
      // Get some nearby places using reverse geocoding or POI search
      // For simplicity, we'll use reverse geocoding around the user but with multiple results if possible
      // ORS geocode/reverse typically returns the closest match, but we can try to get a few variations
      const res = await fetch(`https://api.openrouteservice.org/geocode/reverse?api_key=${KEY}&point.lon=${myLoc[1]}&point.lat=${myLoc[0]}&size=5`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.features.map(f => ({
          id: f.properties.id || Math.random().toString(),
          name: f.properties.name || f.properties.label,
          label: f.properties.label,
          coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
          type: 'nearby'
        }));
        setNearbySuggestions(formatted);
      }
    } catch (e) {
      console.warn('Nearby fetch failed', e);
    }
  }, [myLoc]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;
      if (!KEY) {
        setIsLoading(false);
        return;
      }

      try {
        const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${KEY}&text=${encodeURIComponent(query)}&focus.point.lon=${myLoc[1]}&focus.point.lat=${myLoc[0]}&size=7`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const results = data.features.map(f => ({
            id: f.properties.id || Math.random().toString(),
            name: f.properties.name,
            label: f.properties.label,
            coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            type: 'search'
          }));
          setSuggestions(results);
        }
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [query, myLoc]);

  const handleSelect = (item) => {
    onSelectLocation(item.coords, item.label);
    
    // Save to recent searches
    const newRecent = [
      { ...item, type: 'recent' },
      ...recentSearches.filter(r => r.label !== item.label)
    ].slice(0, 5);
    
    setRecentSearches(newRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
    
    setQuery(item.label);
    setIsOpen(false);
  };

  const highlightMatch = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => (
          <span 
            key={i} 
            className={part.toLowerCase() === highlight.toLowerCase() ? 'text-cyan-400 font-black' : ''}
          >
            {part}
          </span>
        ))}
      </>
    );
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onSelectLocation(null, '');
  };

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      <div className="relative group">
        <Search 
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
            isOpen ? 'text-cyan-400' : (theme === 'night' ? 'text-cyan-500/70' : 'text-blue-500/70')
          }`} 
          size={16} 
        />
        
        <input
          className={`w-full border rounded-xl py-2.5 pl-10 pr-10 text-xs outline-none transition-all duration-300 placeholder:text-zinc-600 ${
            theme === 'night' 
              ? 'bg-black/70 border-white/10 focus:border-cyan-500/70 focus:bg-black/90 text-white' 
              : 'bg-white/90 border-zinc-200 focus:border-blue-500 text-zinc-900 shadow-lg'
          }`}
          style={{ backdropFilter: 'blur(12px)' }}
          placeholder={language === 'hindi' ? 'गंतव्य खोजें...' : 'Where to? Search destination...'}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 size={14} className="text-cyan-500 animate-spin" />
          )}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
                theme === 'night' ? 'text-cyan-500' : 'text-blue-500'
              }`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={`absolute top-full left-0 right-0 z-[1001] rounded-2xl border backdrop-blur-2xl shadow-2xl overflow-hidden ${
              theme === 'night' ? 'bg-black/95 border-white/10' : 'bg-white/95 border-zinc-200'
            }`}
          >
            <div className="max-h-[60vh] overflow-y-auto scrollbar-none">
              {/* Dynamic Suggestions */}
              {query.length >= 2 && suggestions.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Search Results</div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 transition-all ${
                        theme === 'night' ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
                      }`}
                    >
                      <MapPin size={16} className="mt-0.5 text-cyan-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">
                          {highlightMatch(item.name || item.label, query)}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {query.length < 2 && recentSearches.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-black flex items-center justify-between">
                    Recent Searches
                    <Clock size={12} />
                  </div>
                  {recentSearches.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 transition-all ${
                        theme === 'night' ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
                      }`}
                    >
                      <Clock size={16} className="mt-0.5 text-zinc-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Nearby Locations */}
              {query.length < 2 && nearbySuggestions.length > 0 && (
                <div className="p-2 space-y-1 border-t border-white/5">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-black flex items-center justify-between">
                    Suggested Nearby
                    <Navigation size={12} />
                  </div>
                  {nearbySuggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 transition-all ${
                        theme === 'night' ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
                      }`}
                    >
                      <LocateFixed size={16} className="mt-0.5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{item.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {query.length >= 2 && suggestions.length === 0 && !isLoading && (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-zinc-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Search size={20} className="text-zinc-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">No results found</div>
                    <div className="text-xs text-zinc-500">Try searching for a different location</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
