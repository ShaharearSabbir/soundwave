'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface TrackInfo {
  videoId: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail: string;
}

interface AudioContextType {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLooping: boolean;
  queue: TrackInfo[];
  play: (track: TrackInfo) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleLoop: () => void;
  addToQueue: (track: TrackInfo) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

declare global {
  interface Window {
    YT: {
      Player: new (id: string, config: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (vol: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

let apiLoaded = false;

function loadYouTubeAPI() {
  if (apiLoaded) return;
  apiLoaded = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const first = document.getElementsByTagName('script')[0];
  first?.parentNode?.insertBefore(tag, first);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadIdRef = useRef(0);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [queue, setQueue] = useState<TrackInfo[]>([]);

  const isLoopingRef = useRef(false);
  const volumeRef = useRef(0.7);
  const currentTrackRef = useRef<TrackInfo | null>(null);
  const scheduledNextRef = useRef<TrackInfo | null>(null);
  const nextTrackRef = useRef<() => void>(() => {});

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const createPlayer = useCallback(() => {
    if (playerRef.current || !containerRef.current || !window.YT) return;

    const el = document.createElement('div');
    containerRef.current.appendChild(el);
    const id = `yt-player-${Math.random().toString(36).slice(2, 8)}`;
    el.id = id;

    const player = new window.YT.Player(id, {
      height: '0',
      width: '0',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          playerRef.current = player;
          player.setVolume(Math.round(volumeRef.current * 100));

          if (scheduledNextRef.current) {
            const track = scheduledNextRef.current;
            scheduledNextRef.current = null;
            player.loadVideoById(track.videoId);
          }
        },
        onStateChange: (e: { data: number }) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (e.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (e.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            if (!isLoopingRef.current) {
              nextTrackRef.current();
            } else {
              player.playVideo();
            }
          } else if (e.data === window.YT.PlayerState.CUED) {
            player.playVideo();
          }
        },
        onError: () => {
          console.error('YouTube player error');
        },
      },
    });
  }, []);

  useEffect(() => {
    loadYouTubeAPI();

    if (window.YT) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }
  }, [createPlayer]);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      try {
        setCurrentTime(p.getCurrentTime());
        const dur = p.getDuration();
        if (dur > 0 && dur !== duration) setDuration(dur);
      } catch {}
    }, 250);

    return () => clearInterval(interval);
  }, [duration]);

  const loadTrack = useCallback((track: TrackInfo) => {
    const thisLoadId = ++loadIdRef.current;
    setCurrentTime(0);
    setDuration(0);

    const doLoad = () => {
      if (thisLoadId !== loadIdRef.current) return;
      const p = playerRef.current;
      if (!p) {
        scheduledNextRef.current = track;
        return;
      }
      p.loadVideoById(track.videoId);
      p.setVolume(Math.round(volumeRef.current * 100));
      setCurrentTrack(track);
    };

    doLoad();
  }, []);

  const play = useCallback((track: TrackInfo) => {
    loadTrack(track);
  }, [loadTrack]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const state = p.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) {
      p.pauseVideo();
    } else {
      p.playVideo();
    }
  }, []);

  const seek = useCallback((time: number) => {
    playerRef.current?.seekTo(time, true);
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    playerRef.current?.setVolume(Math.round(vol * 100));
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((v) => !v);
  }, []);

  const addToQueue = useCallback((track: TrackInfo) => {
    setQueue((q) => [...q, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((q) => q.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const nextTrack = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) return q;
      const next = q[0];
      const rest = q.slice(1);
      setTimeout(() => loadTrack(next), 0);
      return rest;
    });
  }, [loadTrack]);

  useEffect(() => {
    nextTrackRef.current = nextTrack;
  }, [nextTrack]);

  const prevTrack = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.getCurrentTime() > 3) {
        p.seekTo(0, true);
        setCurrentTime(0);
      }
    } catch {}
  }, []);

  const value: AudioContextType = {
    currentTrack, isPlaying, volume, currentTime, duration, isLooping, queue,
    play, togglePlay, seek, setVolume, toggleLoop,
    addToQueue, removeFromQueue, clearQueue, nextTrack, prevTrack,
  };

  return (
    <AudioCtx.Provider value={value}>
      <div ref={containerRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
