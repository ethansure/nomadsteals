// Deals Storage Service
// Uses in-memory cache with fallback to demo data
// Note: Vercel serverless has read-only filesystem, so we can't persist to files

import { Deal } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

// In-memory cache (persists within serverless function lifetime)
let memoryCache: {
  deals: Deal[];
  lastUpdated: string;
  fetchedSources: string[];
  stats: StatsData;
} | null = null;

// Try file-based storage (works locally, fails gracefully on Vercel)
const DATA_DIR = path.join(process.cwd(), 'data');
const DEALS_FILE = path.join(DATA_DIR, 'deals.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const PRICE_HISTORY_FILE = path.join(DATA_DIR, 'price-history.json');

interface DealsData {
  deals: Deal[];
  lastUpdated: string;
  fetchedSources: string[];
}

interface StatsData {
  totalDeals: number;
  avgSavings: number;
  hotDeals: number;
  updatedAt: string;
  sourceBreakdown: Record<string, number>;
}

interface PriceHistoryData {
  routes: Record<string, {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    dataPoints: number;
    lastUpdated: string;
  }>;
}

// Check if we're in a writeable environment
async function isWriteable(): Promise<boolean> {
  try {
    await fs.access(DATA_DIR);
    return true;
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
}

// Read deals from storage (memory first, then file)
export async function getDeals(): Promise<Deal[]> {
  // Check memory cache first
  if (memoryCache?.deals && memoryCache.deals.length > 0) {
    return memoryCache.deals;
  }

  // Try file storage
  try {
    if (await isWriteable()) {
      const data = await fs.readFile(DEALS_FILE, 'utf-8');
      const parsed: DealsData = JSON.parse(data);
      // Update memory cache
      memoryCache = {
        deals: parsed.deals,
        lastUpdated: parsed.lastUpdated,
        fetchedSources: parsed.fetchedSources,
        stats: calculateStats(parsed.deals),
      };
      return parsed.deals;
    }
  } catch {
    // File doesn't exist or not readable
  }

  // Return empty array - aggregator will generate deals
  return [];
}

// Write deals to storage (memory + file if possible)
export async function saveDeals(deals: Deal[], sources: string[]): Promise<void> {
  const data: DealsData = {
    deals,
    lastUpdated: new Date().toISOString(),
    fetchedSources: sources,
  };

  // Always update memory cache
  memoryCache = {
    deals,
    lastUpdated: data.lastUpdated,
    fetchedSources: sources,
    stats: calculateStats(deals),
  };

  // Try to write to file (works locally)
  try {
    if (await isWriteable()) {
      await fs.writeFile(DEALS_FILE, JSON.stringify(data, null, 2));
      await fs.writeFile(STATS_FILE, JSON.stringify(memoryCache.stats, null, 2));
    }
  } catch (error) {
    // Ignore file write errors (expected on Vercel)
    console.log('[DealsStore] File write skipped (read-only filesystem)');
  }
}

// Calculate stats from deals
function calculateStats(deals: Deal[]): StatsData {
  return {
    totalDeals: deals.length,
    avgSavings: deals.length > 0 
      ? Math.round(deals.reduce((acc, d) => acc + d.savingsPercent, 0) / deals.length)
      : 0,
    hotDeals: deals.filter(d => d.isHotDeal).length,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: deals.reduce((acc, d) => {
      acc[d.source] = (acc[d.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

// Get deals metadata
export async function getDealsMetadata(): Promise<{ lastUpdated: string; fetchedSources: string[] } | null> {
  if (memoryCache) {
    return {
      lastUpdated: memoryCache.lastUpdated,
      fetchedSources: memoryCache.fetchedSources,
    };
  }

  try {
    if (await isWriteable()) {
      const data = await fs.readFile(DEALS_FILE, 'utf-8');
      const parsed: DealsData = JSON.parse(data);
      return {
        lastUpdated: parsed.lastUpdated,
        fetchedSources: parsed.fetchedSources,
      };
    }
  } catch {
    // File not available
  }

  return null;
}

// Filter deals
export async function getFilteredDeals(filters: {
  type?: string;
  destination?: string;
  origin?: string;
  maxPrice?: number;
  minValueScore?: number;
  isHotDeal?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  let deals = await getDeals();
  
  // Apply filters
  if (filters.type) {
    deals = deals.filter(d => d.type === filters.type);
  }
  
  if (filters.destination) {
    const dest = filters.destination.toLowerCase();
    deals = deals.filter(d => 
      d.destinationCity.toLowerCase().includes(dest) ||
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
  
  if (filters.maxPrice) {
    deals = deals.filter(d => d.currentPrice <= filters.maxPrice!);
  }
  
  if (filters.minValueScore) {
    deals = deals.filter(d => d.valueScore >= filters.minValueScore!);
  }
  
  if (filters.isHotDeal) {
    deals = deals.filter(d => d.isHotDeal);
  }
  
  const total = deals.length;
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 20;
  deals = deals.slice(offset, offset + limit);
  
  return { deals, total };
}

// Get single deal by ID
export async function getDealById(id: string): Promise<Deal | null> {
  const deals = await getDeals();
  return deals.find(d => d.id === id) || null;
}

// Get deals for a specific city
export async function getDealsForCity(citySlug: string): Promise<Deal[]> {
  const deals = await getDeals();
  const slug = citySlug.toLowerCase().replace(/-/g, ' ');
  
  return deals.filter(d => 
    d.destinationCity.toLowerCase() === slug ||
    d.destinationCity.toLowerCase().replace(/\s+/g, '-') === citySlug ||
    d.destinationCode?.toLowerCase() === citySlug
  );
}

// Get statistics
export async function getStats(): Promise<StatsData> {
  if (memoryCache?.stats) {
    return memoryCache.stats;
  }

  try {
    if (await isWriteable()) {
      const data = await fs.readFile(STATS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // File not available
  }

  return {
    totalDeals: 0,
    avgSavings: 0,
    hotDeals: 0,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: {},
  };
}

// Price history management
export async function getAveragePrices(): Promise<Map<string, number>> {
  try {
    if (await isWriteable()) {
      const data = await fs.readFile(PRICE_HISTORY_FILE, 'utf-8');
      const parsed: PriceHistoryData = JSON.parse(data);
      const map = new Map<string, number>();
      
      for (const [route, info] of Object.entries(parsed.routes)) {
        map.set(route, info.averagePrice);
      }
      
      return map;
    }
  } catch {
    // File not available
  }

  return getDefaultAveragePrices();
}

// Update price history with new deals
export async function updatePriceHistory(deals: Deal[]): Promise<void> {
  // Skip on read-only filesystem
  if (!(await isWriteable())) {
    return;
  }

  let history: PriceHistoryData;
  try {
    const data = await fs.readFile(PRICE_HISTORY_FILE, 'utf-8');
    history = JSON.parse(data);
  } catch {
    history = { routes: {} };
  }
  
  for (const deal of deals) {
    if (!deal.originCode || !deal.destinationCode) continue;
    
    const routeKey = `${deal.originCode}-${deal.destinationCode}`;
    const existing = history.routes[routeKey];
    
    if (existing) {
      const newAvg = (existing.averagePrice * existing.dataPoints + deal.currentPrice) / (existing.dataPoints + 1);
      history.routes[routeKey] = {
        averagePrice: Math.round(newAvg),
        minPrice: Math.min(existing.minPrice, deal.currentPrice),
        maxPrice: Math.max(existing.maxPrice, deal.currentPrice),
        dataPoints: existing.dataPoints + 1,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      history.routes[routeKey] = {
        averagePrice: deal.currentPrice,
        minPrice: deal.currentPrice,
        maxPrice: deal.currentPrice,
        dataPoints: 1,
        lastUpdated: new Date().toISOString(),
      };
    }
  }
  
  try {
    await fs.writeFile(PRICE_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch {
    // Ignore write errors
  }
}

// Default average prices for common routes
function getDefaultAveragePrices(): Map<string, number> {
  return new Map([
    ['JFK-LHR', 800], ['JFK-CDG', 850], ['JFK-FCO', 900], ['JFK-BCN', 750],
    ['JFK-AMS', 700], ['LAX-LHR', 900], ['LAX-CDG', 950], ['ORD-LHR', 750],
    ['SFO-LHR', 850], ['MIA-FCO', 800], ['BOS-LHR', 650], ['BOS-DUB', 500],
    ['JFK-NRT', 1200], ['LAX-NRT', 1000], ['SFO-NRT', 950], ['SFO-HKG', 900],
    ['SFO-BKK', 850], ['SEA-NRT', 900], ['SEA-ICN', 850],
    ['JFK-CUN', 400], ['LAX-CUN', 350], ['MIA-CUN', 300], ['JFK-SJU', 300],
    ['LAX-SYD', 1500], ['SFO-SYD', 1400], ['LAX-HNL', 500], ['SFO-HNL', 450],
    ['DEFAULT', 600],
  ]);
}

// Merge new deals with existing
export async function mergeDeals(newDeals: Deal[]): Promise<Deal[]> {
  const existingDeals = await getDeals();
  
  const existingMap = new Map<string, Deal>();
  for (const deal of existingDeals) {
    const key = createDealKey(deal);
    existingMap.set(key, deal);
  }
  
  for (const deal of newDeals) {
    const key = createDealKey(deal);
    existingMap.set(key, deal);
  }
  
  return Array.from(existingMap.values())
    .sort((a, b) => b.valueScore - a.valueScore);
}

function createDealKey(deal: Deal): string {
  return `${deal.originCode || ''}-${deal.destinationCode}-${deal.currentPrice}-${deal.source}`;
}

// Remove expired deals
export async function removeExpiredDeals(): Promise<number> {
  const deals = await getDeals();
  const now = new Date();
  
  const validDeals = deals.filter(deal => {
    const bookByDate = new Date(deal.bookByDate);
    return bookByDate >= now;
  });
  
  const removedCount = deals.length - validDeals.length;
  
  if (removedCount > 0) {
    await saveDeals(validDeals, ['cleanup']);
  }
  
  return removedCount;
}
