'use client';

import { useState, useEffect, useCallback } from 'react';
import MusicGrid from './MusicGrid';
import SearchBar from './SearchBar';
import NavBar from './NavBar';
import type { TrackInfo } from '@/lib/audio-context';

const GENRE_CARDS = [
  { name: 'Lofi Beats', query: 'lofi hip hop beats', color: 'from-violet-600 to-indigo-700', icon: '🎧' },
  { name: 'Chill Vibes', query: 'chill music mix', color: 'from-blue-600 to-cyan-700', icon: '🌊' },
  { name: 'Deep Focus', query: 'deep focus music', color: 'from-emerald-600 to-teal-700', icon: '🎯' },
  { name: 'Jazz & Hip Hop', query: 'jazz hip hop', color: 'from-amber-600 to-orange-700', icon: '🎷' },
  { name: 'Electronic', query: 'electronic music mix', color: 'from-pink-600 to-rose-700', icon: '⚡' },
  { name: 'Ambient', query: 'ambient music', color: 'from-sky-600 to-indigo-700', icon: '🌌' },
];

export default function HomePage() {
  const [tracks, setTracks] = useState<TrackInfo[]>([]);
  const [searchResults, setSearchResults] = useState<TrackInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTracks(data.items || []);
      }
    } catch {
      setError('Failed to load recommendations');
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch('/api/recommendations')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setTracks(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load recommendations');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setCurrentQuery(query);
    setActiveGenre('');
    setError('');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setSearchResults(null);
      } else {
        setSearchResults(data.items || []);
      }
    } catch {
      setError('Search failed');
      setSearchResults(null);
    }
    setSearchLoading(false);
  }, []);

  const handleGenreSelect = useCallback((query: string) => {
    handleSearch(query);
  }, [handleSearch]);

  const handleGenreClick = useCallback((query: string, name: string) => {
    setActiveGenre(name);
    handleSearch(query);
  }, [handleSearch]);

  const showHome = searchResults === null && !activeGenre;
  const displayTracks = searchResults !== null ? searchResults : tracks;
  const displayTitle = searchResults !== null
    ? `Results for "${currentQuery}"`
    : activeGenre
    ? activeGenre
    : 'Recommended for you';

  return (
    <>
      <NavBar onGenreSelect={handleGenreSelect} />
      <div className="lg:ml-60 min-h-screen pb-28 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-[#363650]/20">
          <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex-1 max-w-xl">
              <SearchBar onSearch={handleSearch} loading={searchLoading} />
            </div>
            {!showHome && (
              <button
                onClick={() => { setSearchResults(null); setActiveGenre(''); fetchRecommendations(); }}
                className="text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
              >
                Browse all
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6">
          {showHome && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-1">Good evening</h1>
                <p className="text-sm text-gray-400">Discover new music</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                {GENRE_CARDS.map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => handleGenreClick(genre.query, genre.name)}
                    className={`relative h-28 rounded-xl overflow-hidden bg-gradient-to-br ${genre.color} group cursor-pointer text-left hover:ring-2 ring-white/20 transition-all`}
                  >
                    <span className="absolute text-3xl right-2 bottom-2 opacity-30 group-hover:scale-110 group-hover:opacity-50 transition-all">
                      {genre.icon}
                    </span>
                    <span className="absolute bottom-2 left-3 text-sm font-semibold text-white drop-shadow-lg">
                      {genre.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          <MusicGrid
            tracks={displayTracks}
            title={displayTitle}
            loading={loading || searchLoading}
          />
        </main>
      </div>
    </>
  );
}
