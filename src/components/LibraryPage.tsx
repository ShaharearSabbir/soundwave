'use client';

import { useState, useEffect } from 'react';
import NavBar from './NavBar';
import TrackCard from './TrackCard';
import TrackListItem from './TrackListItem';
import { getSavedTracks, getPlaylists, createPlaylist, deletePlaylist, removeTrackFromPlaylist, getTrackMeta, type SavedTrack, type Playlist, type TrackMeta } from '@/lib/db';
import { useAudio, type TrackInfo } from '@/lib/audio-context';

export default function LibraryPage() {
  const { play, addToQueue } = useAudio();
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<TrackMeta[]>([]);
  const [tab, setTab] = useState<'tracks' | 'playlists'>('tracks');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
      resolvePlaylistTracks(pl);
    }
  };

  const resolvePlaylistTracks = async (playlist: Playlist) => {
    const metas = await Promise.all(
      playlist.trackIds.map((id) => getTrackMeta(id))
    );
    setPlaylistTracks(metas.filter(Boolean) as TrackMeta[]);
  };

  const playPlaylist = async (playlist: Playlist) => {
    const metas = await Promise.all(
      playlist.trackIds.map((id) => getTrackMeta(id))
    );
    const tracks = metas.filter(Boolean) as TrackMeta[];
    if (tracks.length > 0) {
      play(tracks[0]);
      tracks.slice(1).forEach((t) => addToQueue(t));
    }
  };

  const viewPlaylistTracks = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    resolvePlaylistTracks(playlist);
  };

  useEffect(() => {
    if (tab === 'playlists' && playlists.length > 0 && !selectedPlaylist) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      viewPlaylistTracks(playlists[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, playlists]);

  const trackToInfo = (track: TrackMeta): TrackInfo => ({
    videoId: track.videoId,
    title: track.title,
    creator: track.creator,
    duration: track.duration,
    thumbnail: track.thumbnail,
  });

  const handlePlaylistTrack = (clicked: TrackInfo) => {
    const idx = playlistTracks.findIndex((t) => t.videoId === clicked.videoId);
    play(clicked);
    if (idx !== -1) {
      playlistTracks.slice(idx + 1).forEach((t) => addToQueue(trackToInfo(t)));
    }
  };

  return (
    <>
      <NavBar />
      <div className="lg:ml-60 min-h-screen pb-28 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-[#363650]/20">
          <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Library</h1>
            </div>
            <button
              onClick={() => setViewMode((v) => (v === 'list' ? 'grid' : 'list'))}
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
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6">

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
                  ) : viewMode === 'list' ? (
                    <div className="bg-[#16162a]/50 rounded-xl border border-[#363650]/20">
                      {savedTracks.map((track) => (
                        <TrackListItem key={track.videoId} track={trackToInfo(track)} />
                      ))}
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
                <>
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
                    <>
                      <div className="hidden lg:flex gap-6">
                        <div className="w-1/3 flex-shrink-0">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Playlists</h3>
                            <button
                              onClick={() => setShowCreatePlaylist(true)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M12 4v16m8-8H4" />
                              </svg>
                              New
                            </button>
                          </div>

                          {showCreatePlaylist && (
                            <div className="mb-3 p-3 bg-[#1e1e2e]/50 rounded-xl border border-[#363650]/30 flex flex-col gap-2">
                              <input
                                type="text"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                placeholder="Playlist name"
                                className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#363650] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleCreatePlaylist}
                                  disabled={!newPlaylistName.trim()}
                                  className="flex-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                                >
                                  Create
                                </button>
                                <button
                                  onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); }}
                                  className="px-3 py-2 bg-[#363650] text-gray-300 rounded-lg text-sm hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                            {playlists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => viewPlaylistTracks(pl)}
                                className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                                  selectedPlaylist?.id === pl.id
                                    ? 'bg-primary-500/20 text-primary-300'
                                    : 'text-gray-300 hover:bg-[#363650]/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); playPlaylist(pl); }}
                                    className="flex-shrink-0 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    title="Play all"
                                  >
                                    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                  <span className="truncate">{pl.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-xs text-gray-500">{pl.trackIds.length}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(pl.id!); }}
                                    className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {selectedPlaylist ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-white">{selectedPlaylist.name}</h3>
                                  <p className="text-xs text-gray-400">{selectedPlaylist.trackIds.length} tracks</p>
                                </div>
                                {playlistTracks.length > 0 && (
                                  <button
                                    onClick={() => playPlaylist(selectedPlaylist)}
                                    className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Play all
                                  </button>
                                )}
                              </div>
                              {playlistTracks.length === 0 ? (
                                <div className="bg-[#1e1e2e]/50 rounded-xl p-12 text-center border border-dashed border-[#363650]/30">
                                  <p className="text-gray-500 text-sm">Empty playlist. Add tracks from the home page.</p>
                                </div>
                              ) : viewMode === 'list' ? (
                                <div className="bg-[#16162a]/50 rounded-xl border border-[#363650]/20">
                                  {playlistTracks.map((track) => {
                                    const addedTo = playlists.filter(p => p.trackIds.includes(track.videoId)).map(p => p.id!);
                                    return (
                                      <div key={track.videoId}>
                                        <TrackListItem track={trackToInfo(track)} onPlay={handlePlaylistTrack} onRemoveFromPlaylist={handleRemoveFromPlaylist} addedPlaylistIds={addedTo} />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {playlistTracks.map((track) => {
                                    const addedTo = playlists.filter(p => p.trackIds.includes(track.videoId)).map(p => p.id!);
                                    return (
                                      <div key={track.videoId}>
                                        <TrackCard track={trackToInfo(track)} onPlay={handlePlaylistTrack} onRemoveFromPlaylist={handleRemoveFromPlaylist} addedPlaylistIds={addedTo} />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-[#1e1e2e]/50 rounded-xl p-12 text-center border border-dashed border-[#363650]/30">
                              <p className="text-gray-500 text-sm">Select a playlist to view its tracks</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:hidden">
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

                        {showCreatePlaylist && (
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
                              <div className="flex items-center gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-white">{selectedPlaylist.name}</h3>
                                  <p className="text-xs text-gray-400">{selectedPlaylist.trackIds.length} tracks</p>
                                </div>
                                {playlistTracks.length > 0 && (
                                  <button
                                    onClick={() => playPlaylist(selectedPlaylist)}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Play all
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedPlaylist(null)}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                              >
                                Back
                              </button>
                            </div>
                            {playlistTracks.length === 0 ? (
                              <p className="text-gray-500 text-sm text-center py-6">Empty playlist. Add tracks from the home page.</p>
                            ) : viewMode === 'list' ? (
                              <div className="bg-[#16162a]/50 rounded-xl border border-[#363650]/20">
                                {playlistTracks.map((track) => {
                                  const addedTo = playlists.filter(p => p.trackIds.includes(track.videoId)).map(p => p.id!);
                                  return (
                                    <div key={track.videoId}>
                                      <TrackListItem track={trackToInfo(track)} onPlay={handlePlaylistTrack} onRemoveFromPlaylist={handleRemoveFromPlaylist} addedPlaylistIds={addedTo} />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {playlistTracks.map((track) => {
                                  const addedTo = playlists.filter(p => p.trackIds.includes(track.videoId)).map(p => p.id!);
                                  return (
                                    <div key={track.videoId}>
                                      <TrackCard track={trackToInfo(track)} onPlay={handlePlaylistTrack} onRemoveFromPlaylist={handleRemoveFromPlaylist} addedPlaylistIds={addedTo} />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {!selectedPlaylist && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
