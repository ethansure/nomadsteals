// Hybrid Storage Layer
// Uses KV for hot data (fast reads) and Postgres for cold storage (all data)
//
// Read flow:
// 1. Try KV cache first (hot deals, stats)
// 2. If cache miss, read from Postgres
// 3. Update KV cache for next read
//
// Write flow:
// 1. Write to Postgres (source of truth)
// 2. Update KV cache (hot deals pool)

import { Deal, DealStatus } from '../types';
import {
  getHotDealsFromKV,
  setHotDealsInKV,
  getStatsFromKV,
  setStatsInKV,
  warmUpCache,
  isKVConfigured,
  getLastUpdatedFromKV,
} from './kv-cache';
import {
  getDealsFromPostgres,
  getHotDealsFromPostgres,
  getDealByIdFromPostgres,
  saveDealsToPostgres,
  getStatsFromPostgres,
  markStaleDealsInPostgres,
  archiveExpiredDealsInPostgres,
  initializePostgres,
  isPostgresConfigured,
} from './postgres';

// Fallback to Blob storage if neither KV nor Postgres is configured
import {
  getDealsFromBlob,
  saveDealsToBlob,
  getStatsFromBlob,
  archiveExpiredDealsInBlob,
  markStaleDealsInactiveInBlob,
} from '../api/blob-store';

// Hot deals pool size
const HOT_DEALS_LIMIT = 50;

// Determine which storage backend to use
function getStorageBackend(): 'hybrid' | 'postgres' | 'blob' {
  if (isPostgresConfigured() && isKVConfigured()) return 'hybrid';
  if (isPostgresConfigured()) return 'postgres';
  return 'blob';
}

// ============================================
// READ OPERATIONS
// ============================================

// Get hot deals (KV first, then Postgres)
export async function getDeals(): Promise<Deal[]> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    // Try KV cache first
    if (isKVConfigured()) {
      const cachedDeals = await getHotDealsFromKV();
      if (cachedDeals && cachedDeals.length > 0) {
        return cachedDeals;
      }
    }

    // Cache miss - fetch from Postgres
    const deals = await getHotDealsFromPostgres(HOT_DEALS_LIMIT);
    
    // Update cache for next time
    if (deals.length > 0 && isKVConfigured()) {
      await setHotDealsInKV(deals);
    }
    
    return deals;
  }
  
  // Fallback to Blob
  return getDealsFromBlob();
}

// Get filtered deals (always from Postgres for complex queries)
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
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    return getDealsFromPostgres({
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      destination: filters.destination,
      origin: filters.origin,
      minValueScore: filters.minValueScore,
      isHotDeal: filters.isHotDeal,
      includeInactive: filters.includeInactive,
    });
  }
  
  // Fallback to in-memory filtering with Blob data
  let deals = await getDealsFromBlob();
  
  if (filters.destination) {
    const dest = filters.destination.toLowerCase();
    deals = deals.filter(d => 
      d.destinationCity?.toLowerCase().includes(dest) ||
      d.destinationCode?.toLowerCase() === dest
    );
  }
  
  if (filters.origin) {
    const orig = filters.origin.toLowerCase();
    deals = deals.filter(d => 
      d.originCity?.toLowerCase().includes(orig) ||
      d.originCode?.toLowerCase() === orig
    );
  }
  
  if (filters.isHotDeal) {
    deals = deals.filter(d => d.isHotDeal);
  }
  
  const total = deals.length;
  const offset = filters.offset || 0;
  const limit = filters.limit || 20;
  deals = deals.slice(offset, offset + limit);
  
  return { deals, total };
}

// Get single deal by ID
export async function getDealById(id: string): Promise<Deal | null> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    return getDealByIdFromPostgres(id);
  }
  
  // Fallback to Blob
  const deals = await getDealsFromBlob();
  return deals.find(d => d.id === id) || null;
}

// Get stats (KV first, then Postgres)
export async function getStats(): Promise<{
  totalDeals: number;
  avgSavings: number;
  hotDeals: number;
  archivedDeals: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
}> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    // Try KV cache first
    if (isKVConfigured()) {
      const cachedStats = await getStatsFromKV();
      if (cachedStats) {
        return {
          totalDeals: cachedStats.totalDeals,
          avgSavings: cachedStats.avgSavings,
          hotDeals: cachedStats.hotDeals,
          archivedDeals: 0, // TODO: track in Postgres
          updatedAt: cachedStats.updatedAt,
          sourceBreakdown: cachedStats.sourceBreakdown,
        };
      }
    }

    // Cache miss - fetch from Postgres
    const stats = await getStatsFromPostgres();
    
    // Update cache
    if (isKVConfigured()) {
      await setStatsInKV(stats);
    }
    
    return {
      totalDeals: stats.totalDeals,
      avgSavings: stats.avgSavings,
      hotDeals: stats.hotDeals,
      archivedDeals: 0,
      updatedAt: new Date().toISOString(),
      sourceBreakdown: stats.sourceBreakdown,
    };
  }
  
  // Fallback to Blob
  const blobStats = await getStatsFromBlob();
  return blobStats || {
    totalDeals: 0,
    avgSavings: 0,
    hotDeals: 0,
    archivedDeals: 0,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: {},
  };
}

// Get metadata
export async function getDealsMetadata(): Promise<{ lastUpdated: string; fetchedSources: string[] } | null> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' && isKVConfigured()) {
    const lastUpdated = await getLastUpdatedFromKV();
    if (lastUpdated) {
      return { lastUpdated, fetchedSources: [] };
    }
  }
  
  // Return current time as fallback
  return { lastUpdated: new Date().toISOString(), fetchedSources: [] };
}

// ============================================
// WRITE OPERATIONS
// ============================================

// Save deals (Postgres + update KV cache)
export async function saveDeals(deals: Deal[], sources: string[]): Promise<void> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    // 1. Save to Postgres (source of truth)
    await saveDealsToPostgres(deals);
    
    // 2. Update KV cache with hot deals
    if (isKVConfigured()) {
      const hotDeals = await getHotDealsFromPostgres(HOT_DEALS_LIMIT);
      const stats = await getStatsFromPostgres();
      await warmUpCache(hotDeals, stats);
    }
    
    console.log(`[HybridStore] Saved ${deals.length} deals to Postgres, updated KV cache`);
    return;
  }
  
  // Fallback to Blob
  await saveDealsToBlob(deals, sources);
}

// Mark stale deals as inactive
export async function markStaleDealsInactive(): Promise<number> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    const count = await markStaleDealsInPostgres();
    
    // Update KV cache
    if (count > 0 && isKVConfigured()) {
      const hotDeals = await getHotDealsFromPostgres(HOT_DEALS_LIMIT);
      const stats = await getStatsFromPostgres();
      await warmUpCache(hotDeals, stats);
    }
    
    return count;
  }
  
  // Fallback to Blob
  return markStaleDealsInactiveInBlob();
}

// Archive expired deals
export async function removeExpiredDeals(): Promise<number> {
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    const count = await archiveExpiredDealsInPostgres();
    
    // Update KV cache
    if (count > 0 && isKVConfigured()) {
      const hotDeals = await getHotDealsFromPostgres(HOT_DEALS_LIMIT);
      const stats = await getStatsFromPostgres();
      await warmUpCache(hotDeals, stats);
    }
    
    return count;
  }
  
  // Fallback to Blob
  return archiveExpiredDealsInBlob();
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize storage
export async function initializeStorage(): Promise<boolean> {
  const backend = getStorageBackend();
  console.log(`[HybridStore] Using storage backend: ${backend}`);
  
  if (backend === 'hybrid' || backend === 'postgres') {
    return initializePostgres();
  }
  
  return true; // Blob doesn't need initialization
}

// Update price history (placeholder for now)
export async function updatePriceHistory(deals: Deal[]): Promise<void> {
  // TODO: Implement price history tracking in Postgres
  console.log(`[HybridStore] Would update price history for ${deals.length} deals`);
}

// ============================================
// HISTORY / ARCHIVED DEALS
// ============================================

// Get historical deals
export async function getHistoricalDeals(filters: {
  destination?: string;
  origin?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  // For now, return empty - historical deals will be in Postgres
  // with status = 'archived' or 'expired'
  const backend = getStorageBackend();
  
  if (backend === 'hybrid' || backend === 'postgres') {
    return getDealsFromPostgres({
      ...filters,
      includeInactive: true,
    });
  }
  
  return { deals: [], total: 0 };
}

// Get similar historical deals
export async function getSimilarHistoricalDeals(
  originCode?: string,
  destinationCode?: string,
  destinationCity?: string,
  limit: number = 5
): Promise<Deal[]> {
  const { deals } = await getFilteredDeals({
    destination: destinationCode || destinationCity,
    origin: originCode,
    limit,
    includeInactive: true,
  });
  return deals;
}

// Get deals for a city
export async function getDealsForCity(citySlug: string, includeArchived: boolean = false): Promise<Deal[]> {
  const { deals } = await getFilteredDeals({
    destination: citySlug,
    includeInactive: includeArchived,
    limit: 50,
  });
  return deals;
}
