import vm from 'node:vm';
import { Innertube, Platform } from 'youtubei.js';

function createJSEvaluator() {
  return (code: unknown, env: Record<string, string>) => {
    const data = code as { output?: string };
    if (!data.output) return env;
    const context: Record<string, unknown> = {
      window: {}, location: {}, document: {},
      navigator: { userAgent: 'Mozilla/5.0' },
      setTimeout, clearTimeout,
      Array, Object, String, Number, Boolean, Math, Date, RegExp,
      Map, Set, Promise, JSON, console, Buffer,
      global: {}, globalThis: {}, self: {},
    };
    context.global = context;
    context.globalThis = context;
    context.self = context;
    vm.createContext(context);
    try {
      const wrapped = `(function(){${data.output}})()`;
      return vm.runInContext(wrapped, context, { timeout: 5000 }) || env;
    } catch {
      return env;
    }
  };
}

let ytInstance: Awaited<ReturnType<typeof Innertube.create>> | null = null;

async function getYT() {
  if (!ytInstance) {
    Platform.shim.eval = createJSEvaluator();
    ytInstance = await Innertube.create();
  }
  return ytInstance;
}

export interface TrackItem {
  title: string;
  videoId: string;
  creator: string;
  duration: string;
  thumbnail: string;
}

export interface StreamInfo {
  title: string;
  creator: string;
  duration: string;
  videoId: string;
  thumbnail: string;
  audioUrl: string | null;
  mimeType?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function searchVideos(query: string): Promise<TrackItem[]> {
  const yt = await getYT();
  const results = await yt.search(query);

  const items: TrackItem[] = [];

  for (const r of results.videos || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = r as any;
    const vid = result.id;
    if (!vid || typeof vid !== 'string') continue;

    const thumbnails = result.thumbnails || [];
    const title = result.title
      ? (typeof result.title === 'object' ? result.title.text || String(result.title) : String(result.title))
      : 'Unknown';
    const author = result.author?.name || result.channel?.name || 'Unknown';
    const durSecs = result.duration?.seconds || 0;

    items.push({
      title,
      videoId: vid,
      creator: author,
      duration: durSecs ? formatDuration(durSecs) : '0:00',
      thumbnail: thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    });
  }

  return items;
}

export async function getRecommendations(): Promise<{ items: TrackItem[]; query: string }> {
  const queries = [
    'lofi hip hop mix', 'chill beats to relax',
    'deep focus music', 'jazz hip hop',
    'ambient study', 'calm piano',
    'peaceful guitar', 'synthwave mix',
  ];
  const query = queries[Math.floor(Math.random() * queries.length)];
  const items = await searchVideos(query);
  return { items, query };
}

export async function getStreamInfo(videoId: string): Promise<StreamInfo> {
  const yt = await getYT();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const info = (await yt.getInfo(videoId)) as any;

  const details = info.basic_info;
  const thumbnails = info.video_details?.thumbnails || [];
  const allFormats = [
    ...(info.streaming_data?.formats || []),
    ...(info.streaming_data?.adaptive_formats || []),
  ];

  const isAudioMime = (mime: string | undefined): boolean =>
    !!mime && mime.startsWith('audio/');

  let audioUrl: string | null = null;
  let mimeType: string | undefined;

  for (const f of allFormats) {
    if (f.has_audio && !f.has_video && f.url && isAudioMime(f.mime_type)) {
      audioUrl = f.url;
      mimeType = f.mime_type;
      break;
    }
  }

  if (!audioUrl) {
    for (const f of allFormats) {
      if (f.has_audio && !f.has_video && isAudioMime(f.mime_type) && (f.signature_cipher || f.cipher)) {
        try {
          const url = await f.decipher(yt.session.player);
          if (url && typeof url === 'string' && url.startsWith('http')) {
            audioUrl = url;
            mimeType = f.mime_type;
            break;
          }
        } catch {
          continue;
        }
      }
    }
  }

  if (!audioUrl) {
    for (const f of allFormats) {
      if (f.has_audio && !f.has_video) {
        const url = f.url || (f.signature_cipher || f.cipher
          ? await f.decipher(yt.session.player).catch(() => null)
          : null);
        if (url && typeof url === 'string' && url.startsWith('http')) {
          audioUrl = url;
          mimeType = f.mime_type;
          break;
        }
      }
    }
  }

  if (!audioUrl) {
    for (const f of allFormats) {
      if (f.has_audio) {
        const url = f.url || (f.signature_cipher || f.cipher
          ? await f.decipher(yt.session.player).catch(() => null)
          : null);
        if (url && typeof url === 'string' && url.startsWith('http')) {
          audioUrl = url;
          mimeType = f.mime_type;
          break;
        }
      }
    }
  }

  return {
    title: details?.title || 'Unknown',
    creator: details?.author || 'Unknown',
    duration: details?.duration ? formatDuration(details.duration) : '0:00',
    videoId,
    thumbnail: thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    audioUrl,
    mimeType,
  };
}
