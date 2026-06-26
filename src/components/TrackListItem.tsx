'use client';

import { useState, useEffect, useRef } from 'react';
import { useAudio, type TrackInfo } from '@/lib/audio-context';
import { addSavedTrack as saveTrack, removeSavedTrack, isTrackSaved, addTrackToPlaylist, getPlaylists, createPlaylist, cacheTrackMeta, type Playlist } from '@/lib/db';

interface TrackListItemProps {
  track: TrackInfo;
  onPlay?: (track: TrackInfo) => void;
  onRemoveFromPlaylist?: (videoId: string) => void;
  addedPlaylistIds?: number[];
}

export default function TrackListItem({ track, onPlay, onRemoveFromPlaylist, addedPlaylistIds }: TrackListItemProps) {
  const { play, currentTrack, isPlaying, togglePlay, addToQueue } = useAudio();
  const [saved, setSaved] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dialogInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isTrackSaved(track.videoId).then(setSaved);
  }, [track.videoId]);

  useEffect(() => {
    if (showDropdown) {
      const handleClick = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClick);
      getPlaylists().then(setPlaylists);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (showCreateDialog) dialogInputRef.current?.focus();
  }, [showCreateDialog]);

  const isCurrentTrack = currentTrack?.videoId === track.videoId;

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else if (onPlay) {
      onPlay(track);
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

  const handleAddToPlaylist = async (playlistId: number) => {
    await cacheTrackMeta(track);
    await addTrackToPlaylist(playlistId, track.videoId);
    window.dispatchEvent(new CustomEvent('playlist-changed'));
    setShowDropdown(false);
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    const pl = await createPlaylist(newPlaylistName.trim());
    await cacheTrackMeta(track);
    await addTrackToPlaylist(pl.id!, track.videoId);
    window.dispatchEvent(new CustomEvent('playlist-changed'));
    setNewPlaylistName('');
    setShowCreateDialog(false);
    setShowDropdown(false);
  };

  return (
    <div
      onClick={handlePlay}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isCurrentTrack
          ? 'bg-primary-500/10 text-primary-300'
          : 'hover:bg-[#1e1e2e] text-gray-300 hover:text-white'
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); handlePlay(); }}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow"
        title={isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
      >
        {isCurrentTrack && isPlaying ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-[#2a2a3e]">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-primary-300' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-gray-500 truncate">{track.creator}</p>
      </div>

      <span className="text-xs text-gray-500 flex-shrink-0 w-10 text-right">{track.duration}</span>

      <button
        onClick={handleSave}
        className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
          saved ? 'text-primary-400' : 'text-gray-500 hover:text-white'
        }`}
        title={saved ? 'Remove from saved' : 'Save to library'}
      >
        <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
          className="flex-shrink-0 p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-[#2a2a3e] transition-colors"
          title="More"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 bottom-full mb-1 w-48 bg-[#1e1e2e] border border-[#363650] rounded-xl shadow-xl z-50 py-1">
            <button
              onClick={handleAddToQueue}
              className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a3e] hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
              Add to queue
            </button>

            <div className="border-t border-[#363650]/50 my-1" />

            {onRemoveFromPlaylist && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveFromPlaylist(track.videoId); setShowDropdown(false); }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#2a2a3e] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove from playlist
              </button>
            )}

            <div className="border-t border-[#363650]/50 my-1" />

            <div className="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wider">Add to playlist</div>

            {playlists.filter((pl) => !addedPlaylistIds || !addedPlaylistIds.includes(pl.id!)).length > 0 && playlists.filter((pl) => !addedPlaylistIds || !addedPlaylistIds.includes(pl.id!)).map((pl) => (
              <button
                key={pl.id}
                onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(pl.id!); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a3e] hover:text-white transition-colors truncate"
              >
                {pl.name}
              </button>
            ))}

            {showCreateDialog ? (
              <div className="px-3 py-2 border-t border-[#363650]/50" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={dialogInputRef}
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className="w-full px-2 py-1.5 mb-2 bg-[#2a2a3e] border border-[#363650] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!newPlaylistName.trim()}
                    className="flex-1 px-2 py-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
                  >
                    Create & Add
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowCreateDialog(false); setNewPlaylistName(''); }}
                    className="px-2 py-1 bg-[#363650] text-gray-300 rounded-lg text-xs hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setShowCreateDialog(true); }}
                className="w-full px-3 py-2 text-left text-sm text-primary-400 hover:bg-[#2a2a3e] transition-colors flex items-center gap-2 border-t border-[#363650]/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Create new playlist
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
