// Deal Aggregator Service
// Scrapes deals from SecretFlying and TheFlightDeal

import { Deal } from '../types';
import { scrapeAllSources, convertScrapedDeals, ScrapedDeal } from '../scrapers';
import { saveDeals, updatePriceHistory } from './deals-store';

export interface AggregatorResult {
  deals: Deal[];
  sources: string[];
  fetchedAt: string;
  errors: string[];
  stats: {
    secretflying: number;
    theflightdeal: number;
    totalDeals: number;
    avgValueScore: number;
    hotDeals: number;
  };
}

// Main aggregation function - scrapes from all sources
export async function aggregateDeals(options: {
  maxDealsPerSource?: number;
} = {}): Promise<AggregatorResult> {
  const {
    maxDealsPerSource = 30,
  } = options;

  console.log('[Aggregator] Starting deal aggregation via web scraping...');

  // Scrape all sources
  const scrapeResult = await scrapeAllSources({
    maxDealsPerSource,
    delayBetweenSources: 1500,
  });

  // If scraping got no deals, fall back to demo data
  let deals: Deal[];
  let sources: string[];

  if (scrapeResult.deals.length === 0) {
    console.log('[Aggregator] No scraped deals, falling back to demo data');
    deals = generateDemoDeals();
    sources = ['Demo Data'];
  } else {
    // Convert scraped deals to app format
    deals = convertScrapedDeals(scrapeResult.deals);
    sources = scrapeResult.sources.map(s => {
      switch(s) {
        case 'secretflying': return 'Secret Flying';
        case 'theflightdeal': return 'The Flight Deal';
        case 'travelpirates': return 'TravelPirates';
        default: return s;
      }
    });
  }

  // Sort by value score
  deals.sort((a, b) => b.valueScore - a.valueScore);

  // Save to storage
  await saveDeals(deals, sources);

  // Update price history
  await updatePriceHistory(deals);

  console.log(`[Aggregator] Completed: ${deals.length} total deals from ${sources.join(', ')}`);

  return {
    deals,
    sources,
    fetchedAt: new Date().toISOString(),
    errors: scrapeResult.errors,
    stats: {
      secretflying: scrapeResult.stats.secretflying,
      theflightdeal: scrapeResult.stats.theflightdeal,
      totalDeals: deals.length,
      avgValueScore: scrapeResult.stats.avgValueScore,
      hotDeals: scrapeResult.stats.hotDeals,
    },
  };
}

// Generate demo deals when scraping fails
function generateDemoDeals(): Deal[] {
  const now = new Date();
  const deals: Deal[] = [];

  const routes = [
    { from: 'New York', fromCode: 'JFK', to: 'Paris', toCode: 'CDG', basePrice: 450, avgPrice: 850 },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Tokyo', toCode: 'NRT', basePrice: 650, avgPrice: 1100 },
    { from: 'Chicago', fromCode: 'ORD', to: 'London', toCode: 'LHR', basePrice: 420, avgPrice: 780 },
    { from: 'San Francisco', fromCode: 'SFO', to: 'Bangkok', toCode: 'BKK', basePrice: 580, avgPrice: 950 },
    { from: 'Miami', fromCode: 'MIA', to: 'Rome', toCode: 'FCO', basePrice: 490, avgPrice: 880 },
    { from: 'Boston', fromCode: 'BOS', to: 'Dublin', toCode: 'DUB', basePrice: 380, avgPrice: 650 },
    { from: 'Seattle', fromCode: 'SEA', to: 'Singapore', toCode: 'SIN', basePrice: 620, avgPrice: 1050 },
    { from: 'Dallas', fromCode: 'DFW', to: 'Amsterdam', toCode: 'AMS', basePrice: 510, avgPrice: 850 },
    { from: 'Atlanta', fromCode: 'ATL', to: 'Barcelona', toCode: 'BCN', basePrice: 440, avgPrice: 720 },
    { from: 'Denver', fromCode: 'DEN', to: 'Lisbon', toCode: 'LIS', basePrice: 480, avgPrice: 790 },
  ];

  const cityImages: Record<string, string> = {
    'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    'Dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800',
    'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
    'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
  };

  const airlines = ['United Airlines', 'Delta', 'American Airlines', 'British Airways', 'Lufthansa', 'Air France'];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const priceVariation = 1 + (Math.random() * 0.2 - 0.1);
    const price = Math.round(route.basePrice * priceVariation);
    const savingsPercent = Math.round(((route.avgPrice - price) / route.avgPrice) * 100);
    const valueScore = Math.min(100, Math.max(50, savingsPercent * 1.5 + 30));

    const departureDate = new Date(now);
    departureDate.setDate(departureDate.getDate() + 30 + Math.floor(Math.random() * 60));

    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 5 + Math.floor(Math.random() * 7));

    const bookByDate = new Date(now);
    bookByDate.setDate(bookByDate.getDate() + 7 + Math.floor(Math.random() * 14));

    const deal: Deal = {
      id: `demo-${i + 1}`,
      type: 'flight',
      title: `${route.from} to ${route.to} - $${price} RT`,
      description: `Great deal on flights to ${route.to}! Save ${savingsPercent}% compared to average prices.`,
      originalPrice: route.avgPrice,
      currentPrice: price,
      currency: 'USD',
      savingsPercent,
      valueScore: Math.round(valueScore),
      originCity: route.from,
      originCode: route.fromCode,
      destinationCity: route.to,
      destinationCode: route.toCode,
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      bookByDate: bookByDate.toISOString().split('T')[0],
      travelWindow: formatTravelWindow(departureDate),
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      includes: ['Roundtrip Flight', 'Personal Item', 'Taxes & Fees'],
      restrictions: ['Non-refundable', 'Subject to availability'],
      imageUrl: cityImages[route.to] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${route.fromCode}+to+${route.toCode}`,
      source: 'Demo Data',
      postedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      views: Math.floor(Math.random() * 5000) + 500,
      saves: Math.floor(Math.random() * 500) + 50,
      tags: generateDemoTags(route.to, valueScore),
      isHotDeal: valueScore >= 85 || savingsPercent >= 45,
      isExpiringSoon: (bookByDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000,
      isHistoricLow: savingsPercent >= 40,
    };

    deals.push(deal);
  }

  return deals.sort((a, b) => b.valueScore - a.valueScore);
}

function formatTravelWindow(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[date.getMonth()];
  const endMonth = months[(date.getMonth() + 2) % 12];
  return `${startMonth} - ${endMonth} ${date.getFullYear()}`;
}

function generateDemoTags(destination: string, valueScore: number): string[] {
  const tags: string[] = [];
  const europeanCities = ['Paris', 'London', 'Rome', 'Barcelona', 'Amsterdam', 'Dublin', 'Lisbon'];
  const asianCities = ['Tokyo', 'Bangkok', 'Singapore'];

  if (europeanCities.includes(destination)) tags.push('europe');
  if (asianCities.includes(destination)) tags.push('asia');
  if (valueScore >= 90) tags.push('incredible-deal');
  if (valueScore >= 80) tags.push('great-value');

  return tags;
}

export { generateDemoDeals };
