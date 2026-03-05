// Scraper aggregator - combines deals from all sources

import { scrapeSecretFlying } from './secretflying';
import { scrapeTheFlightDeal } from './theflightdeal';
import { ScrapedDeal, ScrapeResult, ScraperSource } from './types';
import { Deal } from '../types';

export type { ScrapedDeal, ScrapeResult, ScraperSource } from './types';

// Delay helper
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface ScrapeAllResult {
  deals: ScrapedDeal[];
  sources: ScraperSource[];
  fetchedAt: Date;
  errors: string[];
  stats: {
    secretflying: number;
    theflightdeal: number;
    totalDeals: number;
    avgValueScore: number;
    hotDeals: number;
  };
}

// Scrape all sources and aggregate deals
export async function scrapeAllSources(options: {
  maxDealsPerSource?: number;
  delayBetweenSources?: number;
} = {}): Promise<ScrapeAllResult> {
  const {
    maxDealsPerSource = 30,
    delayBetweenSources = 1500, // 1.5 seconds between sources
  } = options;

  const errors: string[] = [];
  const sources: ScraperSource[] = [];
  const allDeals: ScrapedDeal[] = [];

  console.log('[Scraper] Starting deal scrape from all sources...');

  // Scrape SecretFlying
  try {
    const sfDeals = await scrapeSecretFlying(maxDealsPerSource);
    allDeals.push(...sfDeals);
    sources.push('secretflying');
    console.log(`[Scraper] SecretFlying: ${sfDeals.length} deals`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    errors.push(`SecretFlying: ${errMsg}`);
    console.error('[Scraper] SecretFlying failed:', errMsg);
  }

  // Delay between sources
  await sleep(delayBetweenSources);

  // Scrape The Flight Deal
  try {
    const tfdDeals = await scrapeTheFlightDeal(maxDealsPerSource);
    allDeals.push(...tfdDeals);
    sources.push('theflightdeal');
    console.log(`[Scraper] TheFlightDeal: ${tfdDeals.length} deals`);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    errors.push(`TheFlightDeal: ${errMsg}`);
    console.error('[Scraper] TheFlightDeal failed:', errMsg);
  }

  // Deduplicate deals
  const deduped = deduplicateDeals(allDeals);
  console.log(`[Scraper] After dedup: ${deduped.length} deals (from ${allDeals.length})`);

  // Sort by value score
  deduped.sort((a, b) => b.valueScore - a.valueScore);

  // Calculate stats
  const stats = {
    secretflying: deduped.filter(d => d.source === 'secretflying').length,
    theflightdeal: deduped.filter(d => d.source === 'theflightdeal').length,
    totalDeals: deduped.length,
    avgValueScore: deduped.length > 0 
      ? Math.round(deduped.reduce((acc, d) => acc + d.valueScore, 0) / deduped.length) 
      : 0,
    hotDeals: deduped.filter(d => d.isHotDeal).length,
  };

  console.log(`[Scraper] Complete: ${deduped.length} deals, ${stats.hotDeals} hot deals`);

  return {
    deals: deduped,
    sources,
    fetchedAt: new Date(),
    errors,
    stats,
  };
}

// Remove duplicate deals (same route, similar price)
function deduplicateDeals(deals: ScrapedDeal[]): ScrapedDeal[] {
  const seen = new Map<string, ScrapedDeal>();

  for (const deal of deals) {
    // Create a key based on route and price range
    const originKey = deal.originCode || deal.origin.toLowerCase().slice(0, 10);
    const destKey = deal.destinationCode || deal.destination.toLowerCase().slice(0, 10);
    const priceRange = Math.floor(deal.price / 50) * 50; // Group by $50 ranges
    const key = `${originKey}-${destKey}-${priceRange}`;

    if (!seen.has(key)) {
      seen.set(key, deal);
    } else {
      // Keep the deal with higher value score
      const existing = seen.get(key)!;
      if (deal.valueScore > existing.valueScore) {
        seen.set(key, deal);
      }
    }
  }

  return Array.from(seen.values());
}

// Convert ScrapedDeal to the app's Deal format
export function scrapedDealToAppDeal(scraped: ScrapedDeal): Deal {
  const now = new Date();
  const bookByDate = new Date();
  bookByDate.setDate(bookByDate.getDate() + 14);

  const departureDate = new Date();
  departureDate.setDate(departureDate.getDate() + 30 + Math.floor(Math.random() * 60));

  const returnDate = new Date(departureDate);
  returnDate.setDate(returnDate.getDate() + 5 + Math.floor(Math.random() * 7));

  // Format source name nicely
  const sourceNames: Record<ScraperSource, string> = {
    'secretflying': 'Secret Flying',
    'theflightdeal': 'The Flight Deal',
    'travelpirates': 'TravelPirates',
  };

  return {
    id: scraped.id,
    type: 'flight',
    title: scraped.title,
    description: scraped.description || `Great deal on flights to ${scraped.destination}! Save ${scraped.savingsPercent}% compared to average prices.`,
    originalPrice: scraped.originalPrice,
    currentPrice: scraped.price,
    currency: scraped.currency,
    savingsPercent: scraped.savingsPercent,
    valueScore: scraped.valueScore,
    originCity: scraped.origin,
    originCode: scraped.originCode,
    destinationCity: scraped.destination,
    destinationCode: scraped.destinationCode,
    departureDate: departureDate.toISOString().split('T')[0],
    returnDate: returnDate.toISOString().split('T')[0],
    bookByDate: bookByDate.toISOString().split('T')[0],
    travelWindow: formatTravelWindow(departureDate),
    airline: scraped.airline,
    includes: scraped.isRoundtrip 
      ? ['Roundtrip Flight', 'Personal Item', 'Taxes & Fees'] 
      : ['One-way Flight', 'Personal Item', 'Taxes & Fees'],
    restrictions: ['Subject to availability', 'Non-refundable'],
    imageUrl: scraped.imageUrl || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
    bookingUrl: scraped.originalUrl,
    source: sourceNames[scraped.source],
    postedAt: scraped.postedAt.toISOString(),
    updatedAt: now.toISOString(),
    views: Math.floor(Math.random() * 5000) + 500,
    saves: Math.floor(Math.random() * 500) + 50,
    tags: scraped.tags,
    isHotDeal: scraped.isHotDeal,
    isExpiringSoon: false,
    isHistoricLow: scraped.savingsPercent >= 35,
  };
}

function formatTravelWindow(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[date.getMonth()];
  const endMonth = months[(date.getMonth() + 2) % 12];
  return `${startMonth} - ${endMonth} ${date.getFullYear()}`;
}

// Convert all scraped deals to app deals
export function convertScrapedDeals(scrapedDeals: ScrapedDeal[]): Deal[] {
  return scrapedDeals.map(scrapedDealToAppDeal);
}
