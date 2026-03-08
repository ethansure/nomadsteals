// Redis client for NomadSteals
// Uses @upstash/redis with REDIS_URL

import { Redis } from '@upstash/redis';
import { Deal } from '../types';

// Redis cache keys
const KEYS = {
  HOT_DEALS: 'deals:hot',
  STATS: 'deals:stats',
  DEALS_BY_DEST: (code: string) => `deals:dest:${code.toLowerCase()}`,
  LAST_UPDATED: 'deals:updated',
};

// TTL in seconds
const TTL = {
  HOT_DEALS: 300, // 5 minutes
  STATS: 300,
  DEALS_BY_DEST: 300,
};

// Singleton Redis client
let redis: Redis | null = null;

function getClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL || process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url) return null;

  try {
    // Upstash Redis URL format: rediss://default:TOKEN@HOST:PORT
    // Or REST API format with separate token
    if (url.startsWith('https://') && token) {
      redis = new Redis({ url, token });
    } else if (url.startsWith('redis')) {
      redis = Redis.fromEnv();
    } else {
      return null;
    }
    return redis;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
}

// Check if Redis is configured
export function isConfigured(): boolean {
  return getClient() !== null;
}

// Get hot deals from cache
export async function getHotDeals(): Promise<Deal[] | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const data = await client.get<Deal[]>(KEYS.HOT_DEALS);
    return data || null;
  } catch (error) {
    console.error('[Redis] getHotDeals error:', error);
    return null;
  }
}

// Cache hot deals
export async function setHotDeals(deals: Deal[]): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(KEYS.HOT_DEALS, deals, { ex: TTL.HOT_DEALS });
  } catch (error) {
    console.error('[Redis] setHotDeals error:', error);
  }
}

// Get cached stats
export async function getStats(): Promise<{
  totalDeals: number;
  avgSavings: number;
  hotDeals: number;
  archivedDeals: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
} | null> {
  const client = getClient();
  if (!client) return null;

  try {
    return await client.get(KEYS.STATS);
  } catch (error) {
    console.error('[Redis] getStats error:', error);
    return null;
  }
}

// Cache stats
export async function setStats(stats: {
  totalDeals: number;
  avgSavings: number;
  hotDeals: number;
  archivedDeals: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(KEYS.STATS, stats, { ex: TTL.STATS });
  } catch (error) {
    console.error('[Redis] setStats error:', error);
  }
}

// Get deals by destination
export async function getDealsByDestination(destCode: string): Promise<Deal[] | null> {
  const client = getClient();
  if (!client) return null;

  try {
    return await client.get<Deal[]>(KEYS.DEALS_BY_DEST(destCode));
  } catch (error) {
    console.error('[Redis] getDealsByDestination error:', error);
    return null;
  }
}

// Cache deals by destination
export async function setDealsByDestination(destCode: string, deals: Deal[]): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(KEYS.DEALS_BY_DEST(destCode), deals, { ex: TTL.DEALS_BY_DEST });
  } catch (error) {
    console.error('[Redis] setDealsByDestination error:', error);
  }
}

// Get last updated timestamp
export async function getLastUpdated(): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    return await client.get<string>(KEYS.LAST_UPDATED);
  } catch (error) {
    console.error('[Redis] getLastUpdated error:', error);
    return null;
  }
}

// Set last updated timestamp
export async function setLastUpdated(timestamp: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(KEYS.LAST_UPDATED, timestamp);
  } catch (error) {
    console.error('[Redis] setLastUpdated error:', error);
  }
}

// Invalidate all caches
export async function invalidateAll(): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await Promise.all([
      client.del(KEYS.HOT_DEALS),
      client.del(KEYS.STATS),
    ]);
  } catch (error) {
    console.error('[Redis] invalidateAll error:', error);
  }
}
