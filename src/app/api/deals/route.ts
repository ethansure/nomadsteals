// GET /api/deals - List all deals with optional filters
// Scrapes fresh data if no cached deals exist (serverless-friendly)

import { NextRequest, NextResponse } from 'next/server';
import { getFilteredDeals, getStats, getDealsMetadata, getDeals, saveDeals } from '@/lib/api/deals-store';
import { aggregateDeals } from '@/lib/api/deal-aggregator';

// Force dynamic rendering (don't cache at build time)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Check if we have cached deals
    let existingDeals = await getDeals();
    
    // If no deals exist, scrape fresh data
    if (existingDeals.length === 0) {
      console.log('[API] No cached deals, scraping fresh data...');
      const result = await aggregateDeals({ maxDealsPerSource: 25 });
      console.log(`[API] Scraped ${result.deals.length} deals`);
    }
    
    const filters = {
      type: searchParams.get('type') || undefined,
      destination: searchParams.get('destination') || undefined,
      origin: searchParams.get('origin') || undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minValueScore: searchParams.get('minValueScore') ? parseInt(searchParams.get('minValueScore')!) : undefined,
      isHotDeal: searchParams.get('hot') === 'true' ? true : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };
    
    const { deals, total } = await getFilteredDeals(filters);
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    
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
        lastUpdated: metadata?.lastUpdated || stats.updatedAt,
        sources: metadata?.fetchedSources || [],
        stats: {
          totalDeals: stats.totalDeals,
          avgSavings: stats.avgSavings,
          hotDeals: stats.hotDeals,
        },
      },
    });
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
