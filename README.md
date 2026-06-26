# Soundwave

Live: [soundwave.shaharear.top](https://soundwave.shaharear.top/)
Repo: [github.com/ShaharearSabbir/soundwave](https://github.com/ShaharearSabbir/soundwave)

A music streaming app that uses the YouTube IFrame API to play audio. Browse recommendations, search for music, save tracks to your library, and organize them into playlists.

## Features

- **Search & Browse** — Search YouTube or pick from genre cards (Lofi, Chill, Focus, etc.)
- **Library** — Save tracks with the heart icon, view them in grid or list layout
- **Playlists** — Create playlists, add/remove tracks, play entire playlists
- **Player** — Persistent audio player that survives page navigation (Next.js client-side routing)
  - Play, pause, next/prev with play history
  - Volume slider, progress bar, loop toggle
  - Queue management — add tracks to queue, view and remove queued items
- **Responsive** — Desktop sidebar layout, mobile compact player
- **View toggle** — Switch between grid and list view for any track listing

## Tech Stack

- **Framework** — Next.js (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4
- **Audio** — YouTube IFrame API (hidden player)
- **Storage** — Dexie (IndexedDB) for local library, playlists, and track cache
- **Backend** — Next.js API routes (`/api/search`, `/api/stream`, `/api/recommendations`) using youtubei.js

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

GNU General Public License v3.0