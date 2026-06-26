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
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState('');
  const [addedMsg, setAddedMsg] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dialogInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isTrackSaved(track.videoId).then(setSaved);
  }, [track.videoId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
      getPlaylists().then(setPlaylists);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  useEffect(() => {
    if (showCreateDialog) dialogInputRef.current?.focus();
  }, [showCreateDialog]);

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
    setShowDropdown(false);
  };

  const handleAddToPlaylist = async (e: React.MouseEvent, playlistId: number, name: string) => {
    e.stopPropagation();
    await addTrackToPlaylist(playlistId, track.videoId);
    setAddedMsg(`Added to "${name}"`);
    setShowDropdown(false);
    setTimeout(() => setAddedMsg(''), 2000);
  };

  const openCreateDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCreateDialog(true);
    setShowDropdown(false);
    setNewName('');
  };

  const handleCreateAndAdd = async () => {
    const name = newName.trim() || track.title;
    const pl = await createPlaylist(name);
    await addTrackToPlaylist(pl.id!, track.videoId);
    setAddedMsg(`Created "${name}"`);
    setShowCreateDialog(false);
    setNewName('');
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
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
            className="p-1.5 rounded-full bg-black/60 text-white hover:bg-primary-500 transition-colors shadow-lg"
            title="More"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-1 w-48 bg-[#1e1e2e] border border-[#363650]/50 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleAddToQueue}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-[#363650]/30 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Add to queue
              </button>
              <div className="h-px bg-[#363650]/40 mx-3" />
              {playlists.length === 0 ? (
                <button
                  onClick={openCreateDialog}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-[#363650]/30 transition-colors"
                >
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Create playlist
                </button>
              ) : (
                <>
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Playlists</p>
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={(e) => handleAddToPlaylist(e, pl.id!, pl.name)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-[#363650]/30 transition-colors truncate"
                    >
                      <svg className="w-4 h-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      {pl.name}
                    </button>
                  ))}
                  <div className="h-px bg-[#363650]/40 mx-3" />
                  <button
                    onClick={openCreateDialog}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-[#363650]/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                    New playlist
                  </button>
                </>
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

      {showCreateDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
          onClick={() => { setShowCreateDialog(false); setNewName(''); }}
        >
          <div
            className="bg-[#1e1e2e] border border-[#363650]/50 rounded-xl shadow-2xl p-5 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-sm mb-3">Create playlist</h3>
            <input
              ref={dialogInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Playlist name"
              className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#363650] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCreateDialog(false); setNewName(''); }}
                className="px-4 py-2 bg-[#363650] text-gray-300 rounded-lg text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAndAdd}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
              >
                Create & add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
