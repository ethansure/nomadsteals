// GET /api/deals - List all deals with optional filters
// Scrapes fresh data if no cached deals exist (serverless-friendly)

import { NextRequest, NextResponse } from 'next/server';
import { getFilteredDeals, getStats, getDealsMetadata } from '@/lib/api/deals-store';
import { aggregateDeals } from '@/lib/api/deal-aggregator';
import { getCitiesInRegion } from '@/lib/regions';

// Force dynamic rendering (don't cache at build time)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // NOTE: No auto-scraping here! Scraping only via cron (/api/cron/refresh)
    // This endpoint only reads from database/cache
    
    const statusParam = searchParams.get('status');
    const validStatuses = ['active', 'expired', 'archived', 'all'] as const;
    type ValidStatus = typeof validStatuses[number];
    const status: ValidStatus | undefined = validStatuses.includes(statusParam as ValidStatus) 
      ? (statusParam as ValidStatus) 
      : undefined;
    
    // Parse days parameter for freshness filter (default: 7 days)
    // Use days=0 to get all deals regardless of age
    const daysParam = searchParams.get('days');
    const days = daysParam !== null ? parseInt(daysParam) : undefined;
    
    const filters = {
      type: searchParams.get('type') || undefined,
      destination: searchParams.get('destination') || searchParams.get('to') || undefined,
      origin: searchParams.get('origin') || searchParams.get('from') || undefined,
      destinationRegion: searchParams.get('destinationRegion') || searchParams.get('toRegion') || undefined,
      originRegion: searchParams.get('originRegion') || searchParams.get('fromRegion') || undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minValueScore: searchParams.get('minValueScore') ? parseInt(searchParams.get('minValueScore')!) : undefined,
      isHotDeal: searchParams.get('hot') === 'true' ? true : undefined,
      status,
      days, // freshness filter (default: 7 days, use 0 to disable)
      includeInactive: searchParams.get('includeInactive') === 'true',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };
    
    let { deals, total } = await getFilteredDeals(filters);
    
    // Apply region filters (post-filter since deals-store doesn't know about regions)
    if (filters.originRegion) {
      const regionCities = getCitiesInRegion(filters.originRegion);
      if (regionCities.length > 0) {
        deals = deals.filter(deal => {
          if (!deal.originCity && !deal.originCode) return false;
          const originLower = (deal.originCity || '').toLowerCase();
          const originCode = (deal.originCode || '').toUpperCase();
          return regionCities.some(city => 
            city.toLowerCase() === originLower || 
            city.toUpperCase() === originCode
          );
        });
      }
    }
    
    if (filters.destinationRegion) {
      const regionCities = getCitiesInRegion(filters.destinationRegion);
      if (regionCities.length > 0) {
        deals = deals.filter(deal => {
          const destLower = (deal.destinationCity || '').toLowerCase();
          const destCode = (deal.destinationCode || '').toUpperCase();
          return regionCities.some(city => 
            city.toLowerCase() === destLower || 
            city.toUpperCase() === destCode
          );
        });
      }
    }
    
    // Recalculate total after region filtering
    if (filters.originRegion || filters.destinationRegion) {
      total = deals.length;
    }
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    
    const response = NextResponse.json({
      success: true,
      deals,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + deals.length < total,
      },
      meta: {
        lastUpdated: metadata?.lastUpdated || stats.updatedAt,
        sources: metadata?.fetchedSources || [],
        stats: {
          totalDeals: stats.totalDeals,
          avgSavings: stats.avgSavings,
          hotDeals: stats.hotDeals,
        },
      },
    });
    
    // Add cache headers for CDN caching
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// Manual refresh endpoint (protected by secret)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Verify authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[API] Manual refresh triggered');
    
    const result = await aggregateDeals({
      maxDealsPerSource: 30,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Deals refreshed successfully',
      stats: result.stats,
      sources: result.sources,
      errors: result.errors,
      fetchedAt: result.fetchedAt,
    });
  } catch (error) {
    console.error('Error refreshing deals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh deals' },
      { status: 500 }
    );
  }
}
