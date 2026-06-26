'use client';

import { useState, useEffect } from 'react';
import NavBar from './NavBar';
import TrackCard from './TrackCard';
import { getSavedTracks, getPlaylists, createPlaylist, deletePlaylist, removeTrackFromPlaylist, type SavedTrack, type Playlist } from '@/lib/db';
import type { TrackInfo } from '@/lib/audio-context';

export default function LibraryPage() {
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SavedTrack[]>([]);
  const [tab, setTab] = useState<'tracks' | 'playlists'>('tracks');

  const loadData = async () => {
    setLoading(true);
    const [tracks, pls] = await Promise.all([getSavedTracks(), getPlaylists()]);
    setSavedTracks(tracks);
    setPlaylists(pls);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    const handler = () => loadData();
    window.addEventListener('playlist-changed', handler);
    return () => window.removeEventListener('playlist-changed', handler);
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
    loadData();
  };

  const handleDeletePlaylist = async (id: number) => {
    await deletePlaylist(id);
    if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
    loadData();
  };

  const handleRemoveFromPlaylist = async (videoId: string) => {
    if (!selectedPlaylist?.id) return;
    await removeTrackFromPlaylist(selectedPlaylist.id, videoId);
    window.dispatchEvent(new CustomEvent('playlist-changed'));
    const pls = await getPlaylists();
    setPlaylists(pls);
    const pl = pls.find((p) => p.id === selectedPlaylist.id);
    if (pl) {
      setSelectedPlaylist(pl);
      const allTracks = await getSavedTracks();
      setPlaylistTracks(allTracks.filter((t) => pl.trackIds.includes(t.videoId)));
    }
  };

  const viewPlaylistTracks = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    const allTracks = await getSavedTracks();
    setPlaylistTracks(allTracks.filter((t) => playlist.trackIds.includes(t.videoId)));
  };

  const trackToInfo = (track: SavedTrack): TrackInfo => ({
    videoId: track.videoId,
    title: track.title,
    creator: track.creator,
    duration: track.duration,
    thumbnail: track.thumbnail,
  });

  return (
    <>
      <NavBar />
      <div className="lg:ml-60 min-h-screen pb-28">
        <header className="sticky top-0 z-30 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-[#363650]/20">
          <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Library</h1>
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="max-w-6xl mx-auto">

          <div className="flex gap-4 mb-6 border-b border-[#363650]/30">
            <button
              onClick={() => { setTab('tracks'); setSelectedPlaylist(null); }}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                tab === 'tracks' ? 'text-primary-400 border-primary-400' : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Tracks ({savedTracks.length})
            </button>
            <button
              onClick={() => setTab('playlists')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                tab === 'playlists' ? 'text-primary-400 border-primary-400' : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Playlists ({playlists.length})
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#1e1e2e] rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[#363650]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#363650] rounded w-3/4" />
                    <div className="h-2 bg-[#363650] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {tab === 'tracks' && (
                <>
                  {savedTracks.length === 0 ? (
                    <div className="bg-[#1e1e2e]/50 rounded-xl p-10 text-center border border-[#363650]/20">
                      <svg className="w-14 h-14 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
                        <path d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                      <p className="text-gray-400 text-sm mb-1">No saved tracks yet</p>
                      <p className="text-gray-600 text-xs">Click the heart icon on any track to save it</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {savedTracks.map((track) => (
                        <TrackCard key={track.id} track={trackToInfo(track)} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {tab === 'playlists' && (
                <>{playlists.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400">Organize your music into playlists</p>
                    <button
                      onClick={() => setShowCreatePlaylist(true)}
                      className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" />
                      </svg>
                      New Playlist
                    </button>
                  </div>
                )}

                  {showCreatePlaylist && playlists.length > 0 && (
                    <div className="mb-5 p-4 bg-[#1e1e2e]/50 rounded-xl border border-[#363650]/30 flex gap-2">
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Playlist name"
                        className="flex-1 px-3 py-2 bg-[#2a2a3e] border border-[#363650] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                        autoFocus
                      />
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={!newPlaylistName.trim()}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); }}
                        className="px-4 py-2 bg-[#363650] text-gray-300 rounded-lg text-sm hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {selectedPlaylist && (
                    <div className="mb-6 p-4 bg-[#1e1e2e]/50 rounded-xl border border-[#363650]/30">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{selectedPlaylist.name}</h3>
                          <p className="text-xs text-gray-400">{selectedPlaylist.trackIds.length} tracks</p>
                        </div>
                        <button
                          onClick={() => setSelectedPlaylist(null)}
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Back
                        </button>
                      </div>
                      {playlistTracks.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-6">Empty playlist. Save tracks to add them.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {playlistTracks.map((track) => (
                            <div key={track.id} className="relative group">
                              <TrackCard track={trackToInfo(track)} />
                              <button
                                onClick={() => handleRemoveFromPlaylist(track.videoId)}
                                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5 text-xs transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {playlists.length === 0 && !showCreatePlaylist ? (
                    <button
                      onClick={() => setShowCreatePlaylist(true)}
                      className="w-full bg-[#1e1e2e]/50 hover:bg-[#1e1e2e]/80 border-2 border-dashed border-[#363650]/40 hover:border-primary-500/50 rounded-xl p-12 text-center transition-all group cursor-pointer"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a3e] group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
                        <svg className="w-8 h-8 text-gray-500 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-gray-300 text-lg font-medium mb-1">Create your first playlist</p>
                      <p className="text-gray-500 text-sm">Organize your saved tracks into custom playlists</p>
                    </button>
                  ) : playlists.length === 0 && showCreatePlaylist ? (
                    <div className="mb-5 p-4 bg-[#1e1e2e]/50 rounded-xl border border-[#363650]/30 flex gap-2">
                      <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Playlist name"
                        className="flex-1 px-3 py-2 bg-[#2a2a3e] border border-[#363650] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                        autoFocus
                      />
                      <button
                        onClick={handleCreatePlaylist}
                        disabled={!newPlaylistName.trim()}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); }}
                        className="px-4 py-2 bg-[#363650] text-gray-300 rounded-lg text-sm hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {playlists.map((pl) => (
                        <div
                          key={pl.id}
                          onClick={() => viewPlaylistTracks(pl)}
                          className="bg-[#1e1e2e]/50 border border-[#363650]/20 hover:border-primary-500/50 rounded-xl p-4 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/30 to-primary-600/30 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{pl.name}</p>
                                <p className="text-xs text-gray-500">{pl.trackIds.length} tracks</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(pl.id!); }}
                              className="text-gray-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          </div>
        </main>
      </div>
    </>
  );
}
