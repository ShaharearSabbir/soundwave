import { NextRequest, NextResponse } from 'next/server';
import { getStreamInfo } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('id');
  if (!videoId) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
  }

  try {
    const details = await getStreamInfo(videoId);
    return NextResponse.json(details);
  } catch (err) {
    console.error('Stream error:', err);
    return NextResponse.json({ error: 'Failed to get stream info' }, { status: 500 });
  }
}
