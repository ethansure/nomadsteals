// GET /api/stats - Get deal statistics

import { NextResponse } from 'next/server';
import { getStats, getDealsMetadata } from '@/lib/api/deals-store';

// Cache stats for 2 minutes at edge
export const revalidate = 120;

export async function GET() {
  try {
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    
    const response = NextResponse.json({
      success: true,
      stats: {
        totalDeals: stats.totalDeals,
        avgSavings: stats.avgSavings,
        hotDeals: stats.hotDeals,
        updatedAt: metadata?.lastUpdated || stats.updatedAt,
        sources: metadata?.fetchedSources || [],
        sourceBreakdown: stats.sourceBreakdown,
      },
    });
    
    // Cache at edge for 2 minutes, stale-while-revalidate for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
