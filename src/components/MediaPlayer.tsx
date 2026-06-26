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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-[#2a2a3e]/95 backdrop-blur-xl border-t border-[#363650]/30 z-50">
      <div className="lg:hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#424264] cursor-pointer -translate-y-full" onClick={handleSeek}>
          <div className="h-full bg-primary-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-1.5 px-2 h-[60px]">
          <div className="flex items-center gap-2 min-w-0 flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate leading-tight max-w-[120px]">{currentTrack.title}</p>
            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{currentTrack.creator}</p>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleLoop} className={`p-1.5 transition-colors ${isLooping ? 'text-primary-400' : 'text-gray-400'}`} title="Loop">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
            <button onClick={prevTrack} className="p-1.5 text-gray-400" title="Previous">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button onClick={togglePlay} className="bg-white text-black rounded-full p-1.5 shadow-lg" title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button onClick={nextTrack} className="p-1.5 text-gray-400" title="Next">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-14 h-1 accent-primary-400 cursor-pointer" />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col">
        <div className="flex items-center gap-3 px-4 h-[72px]">
          <div className="flex items-center gap-3 min-w-0 w-56 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-lg"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">{currentTrack.title}</p>
              <p className="text-xs text-gray-400 truncate">{currentTrack.creator}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-0.5 max-w-2xl mx-auto">
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
              <div className="relative flex-1 h-1 group cursor-pointer" onClick={handleSeek}>
                <div className="absolute inset-0 bg-[#424264] rounded-full" />
                <div className="absolute inset-y-0 left-0 bg-primary-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progress}% - 6px)` }} />
              </div>
              <span className="w-8">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={toggleLoop}
              className={`transition-colors ${isLooping ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}
              title="Loop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-20 h-1 accent-primary-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
