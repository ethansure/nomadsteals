// Server-side data access (for server components)
// Reads from storage only - scraping is done by cron job
// Uses unstable_cache for edge caching of data fetches

import { unstable_cache } from 'next/cache';
import { getDeals, getDealById, getDealsForCity, getStats, getDealsMetadata, getFilteredDeals, getSimilarHistoricalDeals } from './deals-store';
import { Deal } from '../types';

// Cache duration: 5 minutes (matches ISR revalidation)
const CACHE_DURATION = 300;

export interface ServerDealsResponse {
  success: boolean;
  deals: Deal[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  meta: {
    lastUpdated: string;
    sources: string[];
    stats: {
      totalDeals: number;
      avgSavings: number;
      hotDeals: number;
    };
  };
}

export interface ServerStatsResponse {
  success: boolean;
  stats: {
    totalDeals: number;
    avgSavings: number;
    hotDeals: number;
    updatedAt: string;
    sources: string[];
  };
}

// Cached data fetcher for deals (edge-cached for 5 minutes)
const getCachedDeals = unstable_cache(
  async (limit: number, offset: number, type?: string, destination?: string) => {
    const { deals, total } = await getFilteredDeals({
      type,
      destination,
      limit,
      offset,
      days: 1, // Only show deals from last 24 hours
    });
    return { deals, total };
  },
  ['server-deals'],
  { revalidate: CACHE_DURATION, tags: ['deals'] }
);

// Cached stats fetcher
const getCachedStats = unstable_cache(
  async () => {
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    return { stats, metadata };
  },
  ['server-stats'],
  { revalidate: CACHE_DURATION, tags: ['stats'] }
);

// Server-side: Get all deals (with edge caching)
export async function getServerDeals(options: {
  limit?: number;
  offset?: number;
  type?: string;
  destination?: string;
} = {}): Promise<ServerDealsResponse> {
  try {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    
    // Use cached fetchers - avoids hitting Postgres on every request
    const [dealsResult, statsResult] = await Promise.all([
      getCachedDeals(limit, offset, options.type, options.destination),
      getCachedStats(),
    ]);
    
    const { deals, total } = dealsResult;
    const { stats, metadata } = statsResult;
    
    return {
      success: true,
      deals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + deals.length < total,
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
    };
  } catch (error) {
    console.error('Error in getServerDeals:', error);
    // Return empty on error - let the aggregator handle fallback
    return {
      success: false,
      deals: [],
      pagination: {
        total: 0,
        limit: options.limit || 20,
        offset: options.offset || 0,
        hasMore: false,
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        sources: [],
        stats: {
          totalDeals: 0,
          avgSavings: 0,
          hotDeals: 0,
        },
      },
    };
  }
}

// Server-side: Get single deal
export async function getServerDeal(id: string): Promise<{ success: boolean; deal: Deal | null }> {
  try {
    const deal = await getDealById(id);
    return { success: !!deal, deal: deal || null };
  } catch (error) {
    console.error('Error in getServerDeal:', error);
    return { success: false, deal: null };
  }
}

// Server-side: Get deals for a city
export async function getServerCityDeals(slug: string): Promise<{ success: boolean; deals: Deal[]; total: number }> {
  try {
    const deals = await getDealsForCity(slug);
    return { success: true, deals, total: deals.length };
  } catch (error) {
    console.error('Error in getServerCityDeals:', error);
    return { success: true, deals: [], total: 0 };
  }
}

// Server-side: Get stats (with edge caching)
export async function getServerStats(): Promise<ServerStatsResponse> {
  try {
    // Use cached stats fetcher
    const { stats, metadata } = await getCachedStats();
    
    return {
      success: true,
      stats: {
        totalDeals: stats.totalDeals,
        avgSavings: stats.avgSavings,
        hotDeals: stats.hotDeals,
        updatedAt: metadata?.lastUpdated || stats.updatedAt,
        sources: metadata?.fetchedSources || [],
      },
    };
  } catch (error) {
    console.error('Error in getServerStats:', error);
    return {
      success: true,
      stats: {
        totalDeals: 0,
        avgSavings: 42,
        hotDeals: 0,
        updatedAt: new Date().toISOString(),
        sources: [],
      },
    };
  }
}

// Server-side: Get similar historical deals for a route
export async function getServerHistoricalDeals(
  originCode?: string,
  destinationCode?: string,
  destinationCity?: string,
  limit: number = 5
): Promise<{ success: boolean; deals: Deal[] }> {
  try {
    const deals = await getSimilarHistoricalDeals(
      originCode,
      destinationCode,
      destinationCity,
      limit
    );
    return { success: true, deals };
  } catch (error) {
    console.error('Error in getServerHistoricalDeals:', error);
    return { success: true, deals: [] };
  }
}

// Helper function to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
