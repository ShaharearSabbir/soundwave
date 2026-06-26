import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Soundwave',
  description: 'Discover and play music',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="text-white min-h-screen antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
