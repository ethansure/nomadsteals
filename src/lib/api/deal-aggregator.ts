// Deal Aggregator Service
// Combines deals from Kiwi Tequila and Amadeus APIs

import { Deal } from '../types';
import { findCheapFlightsFrom, findDealsToDestination, kiwiFlightToDeal, type KiwiFlight } from './kiwi';
import { findBestDeals, amadeusDealToDeal, LOCATION_NAMES, type AmadeusFlightDestination } from './amadeus';
import { getAveragePrices, saveDeals, mergeDeals, updatePriceHistory } from './deals-store';

// Popular origin cities in the US
const US_ORIGINS = ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'BOS', 'SEA', 'DFW', 'ATL', 'DEN'];

// Popular destinations worldwide
const POPULAR_DESTINATIONS = [
  // Europe
  'LHR', 'CDG', 'FCO', 'BCN', 'AMS', 'FRA', 'MAD', 'LIS', 'ATH', 'DUB',
  // Asia
  'NRT', 'BKK', 'SIN', 'HKG', 'ICN',
  // Caribbean/Mexico  
  'CUN', 'SJU', 'MBJ',
  // Other
  'SYD', 'DXB', 'HNL',
];

export interface AggregatorResult {
  deals: Deal[];
  sources: string[];
  fetchedAt: string;
  errors: string[];
  stats: {
    kiwiDeals: number;
    amadeusDeals: number;
    totalDeals: number;
    avgValueScore: number;
    hotDeals: number;
  };
}

// Main aggregation function - fetches from all sources
export async function aggregateDeals(options: {
  maxDealsPerSource?: number;
  origins?: string[];
  destinations?: string[];
} = {}): Promise<AggregatorResult> {
  const {
    maxDealsPerSource = 30,
    origins = US_ORIGINS.slice(0, 5), // Limit to 5 origins to conserve API calls
    destinations = POPULAR_DESTINATIONS.slice(0, 10),
  } = options;

  const errors: string[] = [];
  const sources: string[] = [];
  let allDeals: Deal[] = [];
  
  // Get average prices for value calculation
  const avgPrices = await getAveragePrices();
  
  console.log(`[Aggregator] Starting deal aggregation from ${origins.length} origins`);

  // Fetch from Kiwi Tequila API
  if (process.env.KIWI_API_KEY) {
    try {
      console.log('[Aggregator] Fetching from Kiwi Tequila...');
      const kiwiDeals = await fetchKiwiDeals(origins, avgPrices, maxDealsPerSource);
      allDeals = allDeals.concat(kiwiDeals);
      sources.push('Kiwi.com');
      console.log(`[Aggregator] Got ${kiwiDeals.length} deals from Kiwi`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Kiwi API error: ${errMsg}`);
      console.error('[Aggregator] Kiwi error:', errMsg);
    }
  } else {
    console.log('[Aggregator] Skipping Kiwi - no API key');
  }

  // Fetch from Amadeus API
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    try {
      console.log('[Aggregator] Fetching from Amadeus...');
      const amadeusDeals = await fetchAmadeusDeals(origins, avgPrices, maxDealsPerSource);
      allDeals = allDeals.concat(amadeusDeals);
      sources.push('Amadeus');
      console.log(`[Aggregator] Got ${amadeusDeals.length} deals from Amadeus`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Amadeus API error: ${errMsg}`);
      console.error('[Aggregator] Amadeus error:', errMsg);
    }
  } else {
    console.log('[Aggregator] Skipping Amadeus - no API credentials');
  }

  // If no API keys configured, use demo data
  if (sources.length === 0) {
    console.log('[Aggregator] No API keys configured, generating demo deals');
    allDeals = generateDemoDeals();
    sources.push('Demo Data');
  }

  // Sort by value score and remove duplicates
  allDeals = deduplicateDeals(allDeals);
  allDeals.sort((a, b) => b.valueScore - a.valueScore);

  // Calculate stats
  const stats = {
    kiwiDeals: allDeals.filter(d => d.source === 'Kiwi.com').length,
    amadeusDeals: allDeals.filter(d => d.source === 'Amadeus').length,
    totalDeals: allDeals.length,
    avgValueScore: Math.round(allDeals.reduce((acc, d) => acc + d.valueScore, 0) / allDeals.length) || 0,
    hotDeals: allDeals.filter(d => d.isHotDeal).length,
  };

  // Save to storage
  await saveDeals(allDeals, sources);
  
  // Update price history for better future calculations
  await updatePriceHistory(allDeals);

  console.log(`[Aggregator] Completed: ${allDeals.length} total deals from ${sources.join(', ')}`);

  return {
    deals: allDeals,
    sources,
    fetchedAt: new Date().toISOString(),
    errors,
    stats,
  };
}

// Fetch deals from Kiwi Tequila
async function fetchKiwiDeals(
  origins: string[],
  avgPrices: Map<string, number>,
  maxDeals: number
): Promise<Deal[]> {
  const deals: Deal[] = [];
  
  for (const origin of origins.slice(0, 3)) { // Limit to 3 origins to avoid rate limits
    try {
      const flights = await findCheapFlightsFrom(origin, {
        daysAhead: 120,
        maxPrice: 800,
        limit: 10,
        minNights: 4,
        maxNights: 12,
      });
      
      for (const flight of flights) {
        const deal = kiwiFlightToDeal(flight, avgPrices);
        deals.push(deal as Deal);
      }
      
      // Rate limit between origins
      await sleep(500);
    } catch (error) {
      console.error(`Error fetching Kiwi deals from ${origin}:`, error);
    }
    
    if (deals.length >= maxDeals) break;
  }
  
  return deals.slice(0, maxDeals);
}

// Fetch deals from Amadeus
async function fetchAmadeusDeals(
  origins: string[],
  avgPrices: Map<string, number>,
  maxDeals: number
): Promise<Deal[]> {
  const deals: Deal[] = [];
  
  try {
    const inspirations = await findBestDeals(origins.slice(0, 3), {
      maxPrice: 600,
      duration: '4,10',
    });
    
    for (const inspiration of inspirations) {
      const deal = amadeusDealToDeal(inspiration, avgPrices, LOCATION_NAMES);
      deals.push(deal as Deal);
    }
  } catch (error) {
    console.error('Error fetching Amadeus deals:', error);
  }
  
  return deals.slice(0, maxDeals);
}

// Remove duplicate deals (same route, similar price)
function deduplicateDeals(deals: Deal[]): Deal[] {
  const seen = new Map<string, Deal>();
  
  for (const deal of deals) {
    const key = `${deal.originCode || 'any'}-${deal.destinationCode}-${Math.floor(deal.currentPrice / 50) * 50}`;
    
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

// Generate demo deals when no APIs are configured
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
    { from: 'New York', fromCode: 'JFK', to: 'Cancun', toCode: 'CUN', basePrice: 280, avgPrice: 420 },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Honolulu', toCode: 'HNL', basePrice: 320, avgPrice: 480 },
    { from: 'San Francisco', fromCode: 'SFO', to: 'Seoul', toCode: 'ICN', basePrice: 590, avgPrice: 980 },
    { from: 'Miami', fromCode: 'MIA', to: 'Madrid', toCode: 'MAD', basePrice: 460, avgPrice: 780 },
    { from: 'Chicago', fromCode: 'ORD', to: 'Frankfurt', toCode: 'FRA', basePrice: 440, avgPrice: 730 },
    { from: 'New York', fromCode: 'JFK', to: 'Dubai', toCode: 'DXB', basePrice: 680, avgPrice: 1150 },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Sydney', toCode: 'SYD', basePrice: 890, avgPrice: 1450 },
    { from: 'Boston', fromCode: 'BOS', to: 'Athens', toCode: 'ATH', basePrice: 520, avgPrice: 850 },
    { from: 'Seattle', fromCode: 'SEA', to: 'Hong Kong', toCode: 'HKG', basePrice: 560, avgPrice: 920 },
    { from: 'Dallas', fromCode: 'DFW', to: 'San Juan', toCode: 'SJU', basePrice: 240, avgPrice: 380 },
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
    'Cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
    'Honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
    'Seoul': 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800',
    'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
    'Frankfurt': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
    'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
    'San Juan': 'https://images.unsplash.com/photo-1579687196544-08ae57ab5966?w=800',
  };
  
  const airlines = ['United Airlines', 'Delta', 'American Airlines', 'British Airways', 'Lufthansa', 'Air France', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 'ANA'];
  
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    // Add some randomness to prices
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
      description: `Great deal on flights to ${route.to}! Save ${savingsPercent}% compared to average prices. Book now before prices increase.`,
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
      includes: ['Personal Item', 'Carry-on', price > 500 ? 'Checked Bag' : 'Seat Selection'].filter(Boolean),
      restrictions: ['Non-refundable', 'Subject to availability'],
      imageUrl: cityImages[route.to] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${route.fromCode}+to+${route.toCode}`,
      source: 'Demo Data',
      postedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      views: Math.floor(Math.random() * 10000) + 1000,
      saves: Math.floor(Math.random() * 1000) + 100,
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
  
  const europeanCities = ['Paris', 'London', 'Rome', 'Barcelona', 'Amsterdam', 'Dublin', 'Lisbon', 'Athens', 'Madrid', 'Frankfurt'];
  const asianCities = ['Tokyo', 'Bangkok', 'Singapore', 'Seoul', 'Hong Kong'];
  const caribbeanCities = ['Cancun', 'San Juan', 'Honolulu'];
  
  if (europeanCities.includes(destination)) tags.push('europe');
  if (asianCities.includes(destination)) tags.push('asia');
  if (caribbeanCities.includes(destination)) tags.push('caribbean', 'beach');
  if (['Dubai', 'Sydney'].includes(destination)) tags.push('luxury');
  
  if (valueScore >= 90) tags.push('incredible-deal');
  if (valueScore >= 80) tags.push('great-value');
  
  return tags;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { generateDemoDeals };
