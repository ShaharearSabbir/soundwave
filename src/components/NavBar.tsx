'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GENRES = [
  { name: 'Lofi', query: 'lofi hip hop beats', icon: '🎧' },
  { name: 'Chill', query: 'chill music mix', icon: '🌊' },
  { name: 'Jazz', query: 'jazz hip hop', icon: '🎷' },
  { name: 'Electronic', query: 'electronic music mix', icon: '⚡' },
  { name: 'Focus', query: 'deep focus music', icon: '🎯' },
  { name: 'Ambient', query: 'ambient music', icon: '🌌' },
  { name: 'Synthwave', query: 'synthwave mix', icon: '🌆' },
  { name: 'Piano', query: 'calm piano music', icon: '🎹' },
  { name: 'R&B', query: 'rnb mix', icon: '🎤' },
  { name: 'Rock', query: 'rock classics', icon: '🎸' },
];

interface NavBarProps {
  onGenreSelect?: (query: string) => void;
}

export default function NavBar({ onGenreSelect }: NavBarProps) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (p: string) => path === p;

  const navLinks = [
    { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/library', label: 'Library', icon: 'M19 9l-7 5-7-5V5l7 5 7-5v4z M5 14v5h14v-5' },
  ];

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-[#2a2a3e] p-2 rounded-lg text-gray-300 hover:text-white"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {mobileOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#1e1e2e]/95 backdrop-blur-xl border-r border-[#363650]/30 z-40 flex flex-col transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-[#363650]/20">
          <svg className="w-7 h-7 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span className="text-lg font-bold text-white">Soundwave</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-gray-400 hover:text-white hover:bg-[#363650]/30'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d={link.icon} />
              </svg>
              {link.label}
            </Link>
          ))}

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Genres</p>
          </div>

          {GENRES.map((genre) => (
            <button
              key={genre.name}
              onClick={() => {
                setMobileOpen(false);
                onGenreSelect?.(genre.query);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#363650]/30 transition-colors text-left"
            >
              <span className="text-base flex-shrink-0">{genre.icon}</span>
              {genre.name}
            </button>
          ))}
        </nav>

        <div className="border-t border-[#363650]/20 px-5 py-3">
          <p className="text-xs text-gray-600">Soundwave v2.0</p>
        </div>
      </aside>
    </>
  );
}
