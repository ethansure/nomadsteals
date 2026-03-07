// Vercel Blob Storage for persistent deal storage
// This replaces the ephemeral file-based storage

import { put, list, del } from '@vercel/blob';
import { Deal, DealStatus } from '../types';

const DEALS_BLOB_NAME = 'deals.json';
const ARCHIVED_BLOB_NAME = 'archived-deals.json';
const STATS_BLOB_NAME = 'stats.json';

interface DealsData {
  deals: Deal[];
  lastUpdated: string;
  fetchedSources: string[];
}

interface StatsData {
  totalDeals: number;
  avgSavings: number;
  hotDeals: number;
  archivedDeals: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
}

// In-memory cache for the current request
let memoryCache: DealsData | null = null;

// Check if Blob storage is configured
function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Get deals from Blob storage
export async function getDealsFromBlob(): Promise<Deal[]> {
  if (!isBlobConfigured()) {
    console.log('[BlobStore] BLOB_READ_WRITE_TOKEN not configured, returning empty');
    return [];
  }

  try {
    // Check memory cache first
    if (memoryCache?.deals) {
      return memoryCache.deals.filter(d => d.status !== 'expired' && d.status !== 'archived');
    }

    // List blobs to find our deals file
    const { blobs } = await list({ prefix: DEALS_BLOB_NAME });
    
    if (blobs.length === 0) {
      console.log('[BlobStore] No deals blob found');
      return [];
    }

    // Fetch the blob content
    const response = await fetch(blobs[0].url);
    const data: DealsData = await response.json();
    
    // Update memory cache
    memoryCache = data;
    
    console.log(`[BlobStore] Loaded ${data.deals.length} deals from blob`);
    return data.deals.filter(d => d.status !== 'expired' && d.status !== 'archived');
  } catch (error) {
    console.error('[BlobStore] Error reading deals:', error);
    return [];
  }
}

// Get all deals including archived
export async function getAllDealsFromBlob(): Promise<Deal[]> {
  const activeDeals = await getDealsFromBlob();
  const archivedDeals = await getArchivedDealsFromBlob();
  return [...activeDeals, ...archivedDeals];
}

// Get archived deals from Blob
export async function getArchivedDealsFromBlob(): Promise<Deal[]> {
  if (!isBlobConfigured()) return [];

  try {
    const { blobs } = await list({ prefix: ARCHIVED_BLOB_NAME });
    
    if (blobs.length === 0) return [];

    const response = await fetch(blobs[0].url);
    const data = await response.json();
    
    return data.deals || [];
  } catch (error) {
    console.error('[BlobStore] Error reading archived deals:', error);
    return [];
  }
}

// Save deals to Blob storage (APPEND mode with deduplication)
export async function saveDealsToBlob(newDeals: Deal[], sources: string[]): Promise<void> {
  if (!isBlobConfigured()) {
    console.log('[BlobStore] BLOB_READ_WRITE_TOKEN not configured, skipping save');
    return;
  }

  const now = new Date().toISOString();
  
  try {
    // Get existing deals
    let existingDeals: Deal[] = [];
    try {
      const { blobs } = await list({ prefix: DEALS_BLOB_NAME });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url);
        const data: DealsData = await response.json();
        existingDeals = data.deals || [];
      }
    } catch {
      console.log('[BlobStore] No existing deals, starting fresh');
    }

    // Build signature map for deduplication
    const signatureMap = new Map<string, Deal>();
    
    // Add existing deals
    for (const deal of existingDeals) {
      const signature = deal.dealSignature || createDealSignature(deal);
      signatureMap.set(signature, deal);
    }
    
    // Process new deals
    for (const deal of newDeals) {
      const signature = createDealSignature(deal);
      const existing = signatureMap.get(signature);
      
      if (existing) {
        // Update existing deal
        signatureMap.set(signature, {
          ...existing,
          lastSeenAt: now,
          isActive: true,
          currentPrice: deal.currentPrice,
          originalPrice: deal.originalPrice,
          savingsPercent: deal.savingsPercent,
          valueScore: deal.valueScore,
          updatedAt: now,
        });
      } else {
        // New deal
        signatureMap.set(signature, {
          ...deal,
          dealSignature: signature,
          scrapedAt: now,
          firstSeenAt: now,
          lastSeenAt: now,
          isActive: true,
          status: 'active' as DealStatus,
        });
      }
    }
    
    // Convert to array and sort
    const allDeals = Array.from(signatureMap.values())
      .sort((a, b) => b.valueScore - a.valueScore);
    
    const data: DealsData = {
      deals: allDeals,
      lastUpdated: now,
      fetchedSources: sources,
    };

    // Delete old blob if exists
    try {
      const { blobs } = await list({ prefix: DEALS_BLOB_NAME });
      for (const blob of blobs) {
        await del(blob.url);
      }
    } catch {
      // Ignore deletion errors
    }

    // Save new blob
    await put(DEALS_BLOB_NAME, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    });

    // Update memory cache
    memoryCache = data;

    // Also save stats
    await saveStatsToBlob(allDeals);

    console.log(`[BlobStore] Saved ${allDeals.length} deals (${newDeals.length} new, ${existingDeals.length} existing)`);
  } catch (error) {
    console.error('[BlobStore] Error saving deals:', error);
    throw error;
  }
}

// Save stats to Blob
async function saveStatsToBlob(deals: Deal[]): Promise<void> {
  const activeDeals = deals.filter(d => d.status !== 'expired' && d.status !== 'archived');
  const archivedDeals = await getArchivedDealsFromBlob();
  
  const stats: StatsData = {
    totalDeals: activeDeals.length,
    avgSavings: activeDeals.length > 0 
      ? Math.round(activeDeals.reduce((acc, d) => acc + d.savingsPercent, 0) / activeDeals.length)
      : 0,
    hotDeals: activeDeals.filter(d => d.isHotDeal).length,
    archivedDeals: archivedDeals.length,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: activeDeals.reduce((acc, d) => {
      acc[d.source] = (acc[d.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  try {
    const { blobs } = await list({ prefix: STATS_BLOB_NAME });
    for (const blob of blobs) {
      await del(blob.url);
    }
  } catch {
    // Ignore
  }

  await put(STATS_BLOB_NAME, JSON.stringify(stats), {
    access: 'public',
    contentType: 'application/json',
  });
}

// Get stats from Blob
export async function getStatsFromBlob(): Promise<StatsData | null> {
  if (!isBlobConfigured()) return null;

  try {
    const { blobs } = await list({ prefix: STATS_BLOB_NAME });
    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch (error) {
    console.error('[BlobStore] Error reading stats:', error);
    return null;
  }
}

// Create unique signature for deal deduplication
function createDealSignature(deal: Deal): string {
  if (deal.bookingUrl && !deal.bookingUrl.includes('google.com/travel')) {
    return `url:${deal.bookingUrl}`;
  }
  return `route:${deal.originCode || deal.originCity || ''}-${deal.destinationCode || deal.destinationCity}-${deal.currentPrice}-${deal.source}`;
}

// Archive expired deals
export async function archiveExpiredDealsInBlob(): Promise<number> {
  if (!isBlobConfigured()) return 0;

  try {
    const deals = await getDealsFromBlob();
    const now = new Date();
    let archivedDeals = await getArchivedDealsFromBlob();
    
    const activeDeals: Deal[] = [];
    const newlyExpired: Deal[] = [];
    
    for (const deal of deals) {
      const bookByDate = new Date(deal.bookByDate);
      if (bookByDate < now) {
        newlyExpired.push({
          ...deal,
          status: 'expired' as DealStatus,
          expiredAt: now.toISOString(),
          archivedAt: now.toISOString(),
        });
      } else {
        activeDeals.push(deal);
      }
    }
    
    if (newlyExpired.length > 0) {
      archivedDeals = [...newlyExpired, ...archivedDeals].slice(0, 500);
      
      // Save archived
      try {
        const { blobs } = await list({ prefix: ARCHIVED_BLOB_NAME });
        for (const blob of blobs) {
          await del(blob.url);
        }
      } catch {
        // Ignore
      }
      
      await put(ARCHIVED_BLOB_NAME, JSON.stringify({ deals: archivedDeals, lastUpdated: now.toISOString() }), {
        access: 'public',
        contentType: 'application/json',
      });
      
      // Update active deals
      await saveDealsToBlob(activeDeals, ['archive-cleanup']);
      
      console.log(`[BlobStore] Archived ${newlyExpired.length} expired deals`);
    }
    
    return newlyExpired.length;
  } catch (error) {
    console.error('[BlobStore] Error archiving deals:', error);
    return 0;
  }
}

// Mark stale deals as inactive
export async function markStaleDealsInactiveInBlob(): Promise<number> {
  if (!isBlobConfigured()) return 0;

  try {
    const { blobs } = await list({ prefix: DEALS_BLOB_NAME });
    if (blobs.length === 0) return 0;

    const response = await fetch(blobs[0].url);
    const data: DealsData = await response.json();
    
    const now = new Date();
    const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
    let markedCount = 0;
    
    const updatedDeals = data.deals.map(deal => {
      if (deal.isActive !== false && deal.lastSeenAt) {
        const lastSeen = new Date(deal.lastSeenAt);
        if (now.getTime() - lastSeen.getTime() > staleThreshold) {
          markedCount++;
          return { ...deal, isActive: false };
        }
      }
      return deal;
    });
    
    if (markedCount > 0) {
      const newData: DealsData = {
        ...data,
        deals: updatedDeals,
        lastUpdated: now.toISOString(),
      };
      
      try {
        for (const blob of blobs) {
          await del(blob.url);
        }
      } catch {
        // Ignore
      }
      
      await put(DEALS_BLOB_NAME, JSON.stringify(newData), {
        access: 'public',
        contentType: 'application/json',
      });
      
      console.log(`[BlobStore] Marked ${markedCount} stale deals as inactive`);
    }
    
    return markedCount;
  } catch (error) {
    console.error('[BlobStore] Error marking stale deals:', error);
    return 0;
  }
}
