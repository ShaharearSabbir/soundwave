<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context

## Overview
Soundwave is a music streaming app using the YouTube IFrame API for audio playback. Built with Next.js (App Router), TypeScript, and Tailwind CSS v4.

## Key Architecture Decisions
- **AudioProvider + MediaPlayer** at layout level (in `AppShell`) so the player persists across client-side page navigation using `<Link>` from `next/link`. Regular `<a>` tags destroy the player.
- **YouTube IFrame API**: hidden div with `id="yt-player"` required as the player container. `window.YT.Player` must be loaded before `createPlayer` runs.
- **Dexie (IndexedDB)** with three tables: `savedTracks`, `playlists`, `trackCache`. Version 2 migration added `trackCache`.
- **`trackCache`** stores playlist track metadata separately from `savedTracks` — prevents auto-favoriting when adding to playlists. `cacheTrackMeta()` upserts by `videoId`, `getTrackMeta()` checks `savedTracks` first, then `trackCache`.
- **Playlist-changed custom event** (`window.dispatchEvent(new CustomEvent('playlist-changed'))`) decouples add/remove actions from UI refresh. LibraryPage listens and auto-refreshes.

## Routing & Pages
- `/` — HomePage (recommendations, search, genre cards)
- `/library` — LibraryPage (saved tracks, playlist management)
- `/api/search` — searches YouTube via youtubei.js
- `/api/stream` — streams audio via youtubei.js
- `/api/recommendations` — fetches trending/popular tracks

## Component Structure
- `AppShell` — wraps children with `AudioProvider` + `MediaPlayer` at the layout level
- `NavBar` — sidebar navigation with genre search, uses `Link` for client-side nav
- `SearchBar` — search input with loading state
- `MusicGrid` — Home page track display with grid/list view toggle (default: list)
- `TrackCard` — grid card with thumbnail, title, artist, duration, heart, 3-dot menu (queue, playlist picker, create playlist)
- `TrackListItem` — list row variant with same actions, used by default
- `MediaPlayer` — persistent bottom player, responsive (desktop: full controls; mobile: compact)
- `HomePage` — recommendations, genre cards, search results
- `LibraryPage` — saved tracks tab, playlists tab with sidebar (desktop) or stacked (mobile) layout

## View Toggle
- Default view mode is `'list'` everywhere (MusicGrid, LibraryPage saved tracks, LibraryPage playlist tracks)
- Toggle button switches between `TrackListItem` (list) and `TrackCard` (grid)

## Player Behavior
- `play(track)` — loads and plays a track, pushes current track to `playHistory`
- `nextTrack()` — dequeues from queue, pushes current track to `playHistory`
- `prevTrack()` — if >3s into track, restarts; otherwise pops from `playHistory`
- `playHistory` — capped at 50 entries, tracks what was played for prev navigation
- When clicking a track in a playlist: plays that track and queues all remaining tracks in playlist order via `handlePlaylistTrack`
- `addToQueue()` — appends to the "next up" queue

## Playlist Features
- Desktop: sidebar playlist list (1/3 width) + detail panel (2/3 width), first playlist auto-selected
- Mobile: grid of playlist cards, tapping opens detail view with "Back" button
- "Play all" button plays first track and queues the rest
- Sidebar items have a play button on hover
- Remove from playlist via the 3-dot menu (not a separate X button)
- The "Add to playlist" dropdown filters out playlists that already contain the track

## Styling Conventions
- Dark theme: `#0f0f1a` backgrounds, `#363650` borders
- Accent: `primary-500` (`#8b5cf6` violet) via Tailwind
- `bg-[#16162a]/50` with border for track list containers
- `rounded-xl` with `border border-[#363650]/20` for cards and containers
- No `overflow-hidden` on list containers (to avoid clipping dropdowns)
- Heart and 3-dot menu buttons always visible (no hover-only opacity)

## Important Gotchas
- Next.js v16 has breaking changes — check `node_modules/next/dist/docs/` before writing code
- `'use client'` required for any component using hooks or browser APIs
- youtubei.js runs server-side in API routes only
- The YouTube IFrame API script is loaded dynamically via `loadYouTubeAPI()` in audio-context.tsx
- `loadTrack()` uses `loadIdRef` to cancel stale loads
- Creating a playlist via dropdown returns the full `Playlist` object, not just the id — use `pl.id!`