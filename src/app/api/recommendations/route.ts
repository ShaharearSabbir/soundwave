import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/youtube';

export async function GET() {
  try {
    const { items, query } = await getRecommendations();
    return NextResponse.json({ items, query });
  } catch (err) {
    console.error('Recommendations error:', err);
    return NextResponse.json({ error: 'Failed to fetch recommendations', items: [] }, { status: 500 });
  }
}
