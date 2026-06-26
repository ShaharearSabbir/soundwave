'use client';

import { AudioProvider } from '@/lib/audio-context';
import MediaPlayer from './MediaPlayer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      {children}
      <MediaPlayer />
    </AudioProvider>
  );
}
