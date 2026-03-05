// GET /api/deals/history - Get ALL historical deals (no freshness filter)
// This returns deals regardless of when they were scraped
// Useful for price analysis and historical records

import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalDeals, getSimilarHistoricalDeals, getStats, getFilteredDeals } from '@/lib/api/deals-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Check if requesting similar deals for a specific route
    const similarTo = searchParams.get('similarTo');
    if (similarTo) {
      const parts = similarTo.split('-');
      const originCode = parts[0];
      const destinationCode = parts[1];
      const limit = parseInt(searchParams.get('limit') || '5');
      
      const similarDeals = await getSimilarHistoricalDeals(
        originCode,
        destinationCode,
        undefined,
        limit
      );
      
      return NextResponse.json({
        success: true,
        deals: similarDeals,
        total: similarDeals.length,
      });
    }
    
    // Check if requesting ALL deals (including old active ones)
    const allActive = searchParams.get('allActive') === 'true';
    if (allActive) {
      // Get ALL deals with days=0 (no freshness filter)
      const { deals, total } = await getFilteredDeals({
        destination: searchParams.get('destination') || searchParams.get('to') || undefined,
        origin: searchParams.get('origin') || searchParams.get('from') || undefined,
        days: 0, // No freshness limit
        includeInactive: searchParams.get('includeInactive') === 'true',
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      });
      
      const stats = await getStats();
      
      return NextResponse.json({
        success: true,
        deals,
        pagination: {
          total,
          limit: parseInt(searchParams.get('limit') || '100'),
          offset: parseInt(searchParams.get('offset') || '0'),
          hasMore: (parseInt(searchParams.get('offset') || '0')) + deals.length < total,
        },
        meta: {
          totalDeals: stats.totalDeals,
          totalArchived: stats.archivedDeals || 0,
          note: 'All deals regardless of scrape date',
        },
      });
    }
    
    // Standard history query (archived/expired deals)
    const filters = {
      destination: searchParams.get('destination') || searchParams.get('to') || undefined,
      origin: searchParams.get('origin') || searchParams.get('from') || undefined,
      dateFrom: searchParams.get('dateFrom') || searchParams.get('from_date') || undefined,
      dateTo: searchParams.get('dateTo') || searchParams.get('to_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };
    
    const { deals, total } = await getHistoricalDeals(filters);
    const stats = await getStats();
    
    return NextResponse.json({
      success: true,
      deals,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + deals.length < total,
      },
      meta: {
        totalArchived: stats.archivedDeals || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching deal history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deal history' },
      { status: 500 }
    );
  }
}
