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

export interface Playlist {
  id?: number;
  name: string;
  trackIds: string[];
}

class SoundwaveDB extends Dexie {
  savedTracks!: Table<SavedTrack, number>;
  playlists!: Table<Playlist, number>;

  constructor() {
    super('soundwave');
    this.version(1).stores({
      savedTracks: '++id, videoId, title, dateAdded',
      playlists: '++id, name',
    });
  }
}

export const db = new SoundwaveDB();

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
