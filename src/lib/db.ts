import Dexie, { type Table } from 'dexie';

export interface SavedTrack {
  id?: number;
  title: string;
  creator: string;
  duration: string;
  videoId: string;
  thumbnail: string;
  dateAdded: Date;
}

export interface TrackMeta {
  videoId: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail: string;
}

export interface Playlist {
  id?: number;
  name: string;
  trackIds: string[];
}

class SoundwaveDB extends Dexie {
  savedTracks!: Table<SavedTrack, number>;
  playlists!: Table<Playlist, number>;
  trackCache!: Table<TrackMeta, string>;

  constructor() {
    super('soundwave');
    this.version(2).stores({
      savedTracks: '++id, videoId, title, dateAdded',
      playlists: '++id, name',
      trackCache: 'videoId',
    });
  }
}

export const db = new SoundwaveDB();

export async function cacheTrackMeta(track: TrackMeta) {
  await db.trackCache.put(track);
}

export async function getTrackMeta(videoId: string): Promise<TrackMeta | undefined> {
  const saved = await db.savedTracks.where('videoId').equals(videoId).first();
  if (saved) return saved;
  return db.trackCache.get(videoId);
}

export async function addSavedTrack(track: Omit<SavedTrack, 'id' | 'dateAdded'>) {
  const existing = await db.savedTracks.where('videoId').equals(track.videoId).first();
  if (existing) return existing;
  const id = await db.savedTracks.add({
    ...track,
    dateAdded: new Date(),
  });
  return { ...track, id, dateAdded: new Date() };
}

export async function removeSavedTrack(videoId: string) {
  await db.savedTracks.where('videoId').equals(videoId).delete();
}

export async function getSavedTracks() {
  return db.savedTracks.orderBy('dateAdded').reverse().toArray();
}

export async function isTrackSaved(videoId: string) {
  const track = await db.savedTracks.where('videoId').equals(videoId).first();
  return !!track;
}

export async function createPlaylist(name: string) {
  const id = await db.playlists.add({ name, trackIds: [] });
  return { id, name, trackIds: [] as string[] };
}

export async function getPlaylists() {
  return db.playlists.toArray();
}

export async function addTrackToPlaylist(playlistId: number, videoId: string) {
  const playlist = await db.playlists.get(playlistId);
  if (!playlist) throw new Error('Playlist not found');
  if (!playlist.trackIds.includes(videoId)) {
    playlist.trackIds.push(videoId);
    await db.playlists.update(playlistId, { trackIds: playlist.trackIds });
  }
  return playlist;
}

export async function removeTrackFromPlaylist(playlistId: number, videoId: string) {
  const playlist = await db.playlists.get(playlistId);
  if (!playlist) throw new Error('Playlist not found');
  playlist.trackIds = playlist.trackIds.filter((id) => id !== videoId);
  await db.playlists.update(playlistId, { trackIds: playlist.trackIds });
  return playlist;
}

export async function deletePlaylist(id: number) {
  await db.playlists.delete(id);
}
