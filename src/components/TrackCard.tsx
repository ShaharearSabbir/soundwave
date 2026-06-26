'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudio, type TrackInfo } from '@/lib/audio-context';
import { addSavedTrack as saveTrack, removeSavedTrack, isTrackSaved, addTrackToPlaylist, getPlaylists, createPlaylist, type Playlist } from '@/lib/db';

interface TrackCardProps {
  track: TrackInfo;
}

export default function TrackCard({ track }: TrackCardProps) {
  const { play, currentTrack, isPlaying, togglePlay, addToQueue } = useAudio();
  const [saved, setSaved] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addedMsg, setAddedMsg] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isTrackSaved(track.videoId).then(setSaved);
  }, [track.videoId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPlaylists(false);
      }
    };
    if (showPlaylists) {
      document.addEventListener('mousedown', handleClick);
      getPlaylists().then(setPlaylists);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPlaylists]);

  const isCurrentTrack = currentTrack?.videoId === track.videoId;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      play(track);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      await removeSavedTrack(track.videoId);
      setSaved(false);
    } else {
      await saveTrack({
        videoId: track.videoId,
        title: track.title,
        creator: track.creator,
        duration: track.duration,
        thumbnail: track.thumbnail,
      });
      setSaved(true);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
  };

  const handleAddToPlaylist = async (e: React.MouseEvent, playlistId: number, name: string) => {
    e.stopPropagation();
    await addTrackToPlaylist(playlistId, track.videoId);
    setAddedMsg(`Added to "${name}"`);
    setShowPlaylists(false);
    setTimeout(() => setAddedMsg(''), 2000);
  };

  const handleCreateAndAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const pl = await createPlaylist(track.title);
    await addTrackToPlaylist(pl.id!, track.videoId);
    setAddedMsg(`Created "${pl.name}"`);
    setShowPlaylists(false);
    setTimeout(() => setAddedMsg(''), 2000);
  };

  return (
    <div
      onClick={handlePlay}
      className={`group relative bg-[#1e1e2e]/50 border border-[#363650]/10 hover:border-[#363650]/30 rounded-xl overflow-hidden cursor-pointer transition-all hover:bg-[#1e1e2e]/80 ${
        isCurrentTrack ? 'ring-1 ring-primary-500/50' : ''
      }`}
    >
      <div className="relative aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.thumbnail}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-100 scale-75 ${
            isCurrentTrack && isPlaying ? '' : 'translate-y-1 group-hover:translate-y-0'
          }`}>
            {isCurrentTrack && isPlaying ? (
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{track.title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{track.creator}</p>
        {track.duration && (
          <p className="text-[11px] text-gray-500 mt-1">{track.duration}</p>
        )}
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleSave}
          className={`p-1.5 rounded-full transition-colors shadow-lg ${
            saved ? 'bg-primary-500 text-white' : 'bg-black/60 text-white hover:bg-primary-500'
          }`}
          title={saved ? 'Remove from library' : 'Save to library'}
        >
          <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button
          onClick={handleAddToQueue}
          className="p-1.5 rounded-full bg-black/60 text-white hover:bg-primary-500 transition-colors shadow-lg"
          title="Add to queue"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPlaylists(!showPlaylists); }}
            className="p-1.5 rounded-full bg-black/60 text-white hover:bg-primary-500 transition-colors shadow-lg"
            title="Add to playlist"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </button>
          {showPlaylists && (
            <div
              ref={popoverRef}
              className="absolute right-0 top-full mt-1 w-44 bg-[#1e1e2e] border border-[#363650]/50 rounded-xl shadow-2xl z-50 py-1 max-h-48 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {playlists.length === 0 ? (
                <button
                  onClick={handleCreateAndAdd}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#363650]/30 transition-colors"
                >
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Create playlist
                </button>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={(e) => handleAddToPlaylist(e, pl.id!, pl.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#363650]/30 transition-colors truncate"
                  >
                    <svg className="w-4 h-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    {pl.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {addedMsg && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-50">
          {addedMsg}
        </div>
      )}
    </div>
  );
}
