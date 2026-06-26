'use client';

import { useState } from 'react';
import TrackCard from './TrackCard';
import TrackListItem from './TrackListItem';
import type { TrackInfo } from '@/lib/audio-context';

interface MusicGridProps {
  tracks: TrackInfo[];
  title?: string;
  loading?: boolean;
  error?: string;
}

export default function MusicGrid({ tracks, title, loading, error }: MusicGridProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const toggleView = () => setViewMode((v) => (v === 'list' ? 'grid' : 'list'));

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
        </div>
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1e1e2e] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-[#363650] flex-shrink-0" />
                <div className="w-10 h-10 rounded bg-[#363650] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#363650] rounded w-1/3" />
                  <div className="h-2 bg-[#363650] rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-[#1e1e2e] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#363650]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#363650] rounded w-3/4" />
                  <div className="h-2 bg-[#363650] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
        </div>
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
        </div>
        <div className="bg-[#1e1e2e] rounded-xl p-6 text-center">
          <p className="text-gray-400">No tracks found. Try a different search.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
        <button
          onClick={toggleView}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#2a2a3e] hover:bg-[#363650] text-gray-400 hover:text-white rounded-lg transition-colors"
          title={viewMode === 'list' ? 'Grid view' : 'List view'}
        >
          {viewMode === 'list' ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 5h16M4 12h16M4 19h16" />
            </svg>
          )}
          {viewMode === 'list' ? 'Grid' : 'List'}
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-[#16162a]/50 rounded-xl border border-[#363650]/20">
          {tracks.map((track) => (
            <TrackListItem key={track.videoId} track={track} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tracks.map((track) => (
            <TrackCard key={track.videoId} track={track} />
          ))}
        </div>
      )}
    </section>
  );
}
