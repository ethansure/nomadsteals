// Hybrid Storage for NomadSteals
// Combines Postgres (primary) + Redis (cache) for optimal performance
//
// Read path:
//   1. Check Redis cache (hot deals, stats)
//   2. On miss → fetch from Postgres → cache in Redis
//
// Write path:
//   1. Write to Postgres (source of truth)
//   2. Invalidate/update Redis cache

import { Deal, DealStatus } from '../types';
import * as postgres from './postgres';
import * as redis from './redis';

// Initialize the hybrid store
export async function init(): Promise<void> {
  // Initialize Postgres schema if needed
  if (postgres.isConfigured()) {
    await postgres.initSchema();
    console.log('[HybridStore] Postgres initialized');
  }

  if (redis.isConfigured()) {
    console.log('[HybridStore] Redis configured');
  }
}

// Get active deals (cache-first)
export async function getDeals(): Promise<Deal[]> {
  // Try Redis cache first
  if (redis.isConfigured()) {
    const cached = await redis.getHotDeals();
    if (cached && cached.length > 0) {
      console.log(`[HybridStore] Cache hit: ${cached.length} deals from Redis`);
      return cached;
    }
  }

  // Fetch from Postgres
  if (postgres.isConfigured()) {
    const deals = await postgres.getDeals();
    console.log(`[HybridStore] Fetched ${deals.length} deals from Postgres`);

    // Cache in Redis
    if (redis.isConfigured() && deals.length > 0) {
      await redis.setHotDeals(deals);
    }

    return deals;
  }

  console.log('[HybridStore] No storage configured');
  return [];
}

// Get all deals including archived (direct from Postgres)
export async function getAllDeals(): Promise<Deal[]> {
  if (postgres.isConfigured()) {
    return postgres.getAllDeals();
  }
  return [];
}

// Get filtered deals with pagination
export async function getFilteredDeals(filters: {
  type?: string;
  destination?: string;
  origin?: string;
  maxPrice?: number;
  minValueScore?: number;
  isHotDeal?: boolean;
  status?: DealStatus | 'all';
  days?: number;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  if (postgres.isConfigured()) {
    return postgres.getFilteredDeals(filters);
  }
  return { deals: [], total: 0 };
}

// Save deals (write to Postgres, invalidate cache)
export async function saveDeals(deals: Deal[], sources: string[]): Promise<void> {
  console.log(`[HybridStore] saveDeals called with ${deals.length} deals`);
  const now = new Date().toISOString();

  // Add timestamps to deals
  const processedDeals = deals.map(deal => ({
    ...deal,
    scrapedAt: deal.scrapedAt || now,
    firstSeenAt: deal.firstSeenAt || now,
    lastSeenAt: now,
    isActive: true,
    status: (deal.status || 'active') as DealStatus,
  }));

  console.log(`[HybridStore] Postgres configured: ${postgres.isConfigured()}`);
  
  // Write to Postgres
  if (postgres.isConfigured()) {
    console.log(`[HybridStore] Calling postgres.upsertDeals with ${processedDeals.length} deals`);
    const count = await postgres.upsertDeals(processedDeals);
    console.log(`[HybridStore] Upserted ${count} deals to Postgres`);

    // Update stats
    await postgres.updateStatsTable();
  } else {
    console.log(`[HybridStore] Postgres NOT configured, skipping upsert`);
  }

  // Invalidate Redis cache so next read gets fresh data
  if (redis.isConfigured()) {
    await redis.invalidateAll();
    await redis.setLastUpdated(now);
    console.log('[HybridStore] Redis cache invalidated');
  }
}

// Get stats (cache-first)
export async function getStats(): Promise<{
  totalDeals: number;
  avgSavings: number;
  hotDeals: number;
  archivedDeals: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
}> {
  // Try Redis cache first
  if (redis.isConfigured()) {
    const cached = await redis.getStats();
    if (cached) {
      return cached;
    }
  }

  // Fetch from Postgres
  if (postgres.isConfigured()) {
    const stats = await postgres.getStats();
    
    // Cache in Redis
    if (redis.isConfigured()) {
      await redis.setStats(stats);
    }

    return stats;
  }

  return {
    totalDeals: 0,
    avgSavings: 0,
    hotDeals: 0,
    archivedDeals: 0,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: {},
  };
}

// Mark stale deals as inactive
export async function markStaleDealsInactive(hoursThreshold: number = 24): Promise<number> {
  if (postgres.isConfigured()) {
    const count = await postgres.markStaleDealsInactive(hoursThreshold);
    
    // Invalidate cache
    if (redis.isConfigured() && count > 0) {
      await redis.invalidateAll();
    }

    return count;
  }
  return 0;
}

// Archive expired deals
export async function removeExpiredDeals(): Promise<number> {
  if (postgres.isConfigured()) {
    const count = await postgres.archiveExpiredDeals();

    // Invalidate cache
    if (redis.isConfigured() && count > 0) {
      await redis.invalidateAll();
    }

    return count;
  }
  return 0;
}

// Check if hybrid storage is configured
export async function isConfigured(): Promise<boolean> {
  return postgres.isConfigured();
}
