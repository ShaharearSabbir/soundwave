import { NextRequest, NextResponse } from 'next/server';
import { searchVideos } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    const items = await searchVideos(query);
    return NextResponse.json({ items });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed', items: [] }, { status: 500 });
  }
}
