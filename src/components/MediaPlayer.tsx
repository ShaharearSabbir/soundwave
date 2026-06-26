'use client';

import { useAudio } from '@/lib/audio-context';

export default function MediaPlayer() {
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    isLooping, togglePlay, seek, setVolume, toggleLoop,
    nextTrack, prevTrack,
  } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (t: number) => {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-[#2a2a3e]/95 backdrop-blur-xl border-t border-[#363650]/30 z-50">
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-[#424264] cursor-pointer lg:top-auto lg:bottom-full"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          seek(pct * duration);
        }}
      >
        <div className="h-full bg-primary-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-2 px-2 h-[60px] lg:px-4 lg:h-[72px] lg:gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-none lg:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-10 h-10 lg:w-11 lg:h-11 rounded-lg object-cover flex-shrink-0 shadow-lg"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight max-w-[120px] lg:max-w-none">{currentTrack.title}</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px] lg:max-w-none">{currentTrack.creator}</p>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 flex-col items-center gap-0.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={prevTrack} className="text-gray-400 hover:text-white transition-colors" title="Previous">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="bg-white text-black hover:scale-105 rounded-full p-2 transition-all shadow-lg"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button onClick={nextTrack} className="text-gray-400 hover:text-white transition-colors" title="Next">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
          <div className="w-full flex items-center gap-2 text-[11px] text-gray-500">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-1 group cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}>
              <div className="absolute inset-0 bg-[#424264] rounded-full" />
              <div className="absolute inset-y-0 left-0 bg-primary-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progress}% - 6px)` }} />
            </div>
            <span className="w-8">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1 accent-primary-400 cursor-pointer"
            />
          </div>
          <button
            onClick={togglePlay}
            className="lg:hidden bg-white text-black rounded-full p-2 shadow-lg"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
