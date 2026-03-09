// Server-side data access (for server components)
// Reads from storage only - scraping is done by cron job

import { getDeals, getDealById, getDealsForCity, getStats, getDealsMetadata, getFilteredDeals, getSimilarHistoricalDeals } from './deals-store';
import { Deal } from '../types';

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

// Server-side: Get all deals
export async function getServerDeals(options: {
  limit?: number;
  offset?: number;
  type?: string;
  destination?: string;
} = {}): Promise<ServerDealsResponse> {
  try {
    // Read from storage only - scraping done by cron
    const { deals, total } = await getFilteredDeals({
      type: options.type,
      destination: options.destination,
      limit: options.limit || 20,
      offset: options.offset || 0,
    });
    
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    
    return {
      success: true,
      deals,
      pagination: {
        total,
        limit: options.limit || 20,
        offset: options.offset || 0,
        hasMore: (options.offset || 0) + deals.length < total,
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

// Server-side: Get stats
export async function getServerStats(): Promise<ServerStatsResponse> {
  try {
    const stats = await getStats();
    const metadata = await getDealsMetadata();
    
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
