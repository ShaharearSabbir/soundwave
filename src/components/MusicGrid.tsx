'use client';

import TrackCard from './TrackCard';
import type { TrackInfo } from '@/lib/audio-context';

interface MusicGridProps {
  tracks: TrackInfo[];
  title?: string;
  loading?: boolean;
  error?: string;
}

export default function MusicGrid({ tracks, title, loading, error }: MusicGridProps) {
  if (loading) {
    return (
      <section>
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
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
      </section>
    );
  }

  if (error) {
    return (
      <section>
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (tracks.length === 0) {
    return (
      <section>
        {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
        <div className="bg-[#1e1e2e] rounded-xl p-6 text-center">
          <p className="text-gray-400">No tracks found. Try a different search.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.videoId} track={track} />
        ))}
      </div>
    </section>
  );
}
