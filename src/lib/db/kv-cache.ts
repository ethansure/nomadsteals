// Vercel KV caching layer for hot deals
import { kv } from '@vercel/kv';
import { Deal } from '../types';

// Cache keys
const KEYS = {
  HOT_DEALS: 'deals:hot',
  STATS: 'deals:stats',
  DEALS_BY_DEST: (code: string) => `deals:dest:${code.toLowerCase()}`,
  LAST_UPDATED: 'deals:updated',
};

// Cache TTL (5 minutes)
const CACHE_TTL = 300;

// Check if KV is configured
export function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Get hot deals from cache
export async function getHotDealsFromKV(): Promise<Deal[] | null> {
  if (!isKVConfigured()) return null;

  try {
    const deals = await kv.get<Deal[]>(KEYS.HOT_DEALS);
    if (deals) {
      console.log(`[KV] Cache hit: ${deals.length} hot deals`);
    }
    return deals;
  } catch (error) {
    console.error('[KV] Error getting hot deals:', error);
    return null;
  }
}

// Set hot deals in cache
export async function setHotDealsInKV(deals: Deal[]): Promise<boolean> {
  if (!isKVConfigured()) return false;

  try {
    await kv.set(KEYS.HOT_DEALS, deals, { ex: CACHE_TTL });
    await kv.set(KEYS.LAST_UPDATED, new Date().toISOString(), { ex: CACHE_TTL });
    console.log(`[KV] Cached ${deals.length} hot deals`);
    return true;
  } catch (error) {
    console.error('[KV] Error setting hot deals:', error);
    return false;
  }
}

// Get stats from cache
export async function getStatsFromKV(): Promise<{
  totalDeals: number;
  activeDeals: number;
  hotDeals: number;
  avgSavings: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
} | null> {
  if (!isKVConfigured()) return null;

  try {
    const stats = await kv.get(KEYS.STATS);
    return stats as any;
  } catch (error) {
    console.error('[KV] Error getting stats:', error);
    return null;
  }
}

// Set stats in cache
export async function setStatsInKV(stats: {
  totalDeals: number;
  activeDeals: number;
  hotDeals: number;
  avgSavings: number;
  sourceBreakdown: Record<string, number>;
}): Promise<boolean> {
  if (!isKVConfigured()) return false;

  try {
    await kv.set(KEYS.STATS, {
      ...stats,
      updatedAt: new Date().toISOString(),
    }, { ex: CACHE_TTL });
    console.log('[KV] Cached stats');
    return true;
  } catch (error) {
    console.error('[KV] Error setting stats:', error);
    return false;
  }
}

// Get deals by destination from cache
export async function getDealsByDestFromKV(destCode: string): Promise<Deal[] | null> {
  if (!isKVConfigured()) return null;

  try {
    return await kv.get<Deal[]>(KEYS.DEALS_BY_DEST(destCode));
  } catch (error) {
    console.error('[KV] Error getting deals by destination:', error);
    return null;
  }
}

// Set deals by destination in cache
export async function setDealsByDestInKV(destCode: string, deals: Deal[]): Promise<boolean> {
  if (!isKVConfigured()) return false;

  try {
    await kv.set(KEYS.DEALS_BY_DEST(destCode), deals, { ex: CACHE_TTL });
    return true;
  } catch (error) {
    console.error('[KV] Error setting deals by destination:', error);
    return false;
  }
}

// Invalidate all cache
export async function invalidateAllCache(): Promise<boolean> {
  if (!isKVConfigured()) return false;

  try {
    await kv.del(KEYS.HOT_DEALS);
    await kv.del(KEYS.STATS);
    await kv.del(KEYS.LAST_UPDATED);
    console.log('[KV] Cache invalidated');
    return true;
  } catch (error) {
    console.error('[KV] Error invalidating cache:', error);
    return false;
  }
}

// Get last updated time
export async function getLastUpdatedFromKV(): Promise<string | null> {
  if (!isKVConfigured()) return null;

  try {
    return await kv.get<string>(KEYS.LAST_UPDATED);
  } catch (error) {
    console.error('[KV] Error getting last updated:', error);
    return null;
  }
}

// Warm up cache with hot deals and stats
export async function warmUpCache(
  hotDeals: Deal[],
  stats: {
    totalDeals: number;
    activeDeals: number;
    hotDeals: number;
    avgSavings: number;
    sourceBreakdown: Record<string, number>;
  }
): Promise<boolean> {
  if (!isKVConfigured()) return false;

  try {
    await Promise.all([
      setHotDealsInKV(hotDeals),
      setStatsInKV(stats),
    ]);
    console.log('[KV] Cache warmed up');
    return true;
  } catch (error) {
    console.error('[KV] Error warming up cache:', error);
    return false;
  }
}
