// GET /api/stats - Get deal statistics

import { NextResponse } from 'next/server';
import { getStats, getDealsMetadata } from '@/lib/api/deals-store';

export async function GET() {
  try {
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    
    return NextResponse.json({
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
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
