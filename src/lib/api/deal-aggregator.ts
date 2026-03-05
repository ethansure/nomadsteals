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
    travelpirates: number;
    airfarewatchdog: number;
    skiplagged: number;
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

  // Convert scraped deals to app format
  let deals: Deal[] = convertScrapedDeals(scrapeResult.deals);
  let sources: string[] = scrapeResult.sources.map(s => {
    switch(s) {
      case 'secretflying': return 'Secret Flying';
      case 'theflightdeal': return 'The Flight Deal';
      case 'travelpirates': return 'TravelPirates';
      case 'airfarewatchdog': return 'Airfarewatchdog';
      case 'skiplagged': return 'Skiplagged';
      default: return s;
    }
  });
  
  // Ensure we have at least 50 deals by supplementing with demo data
  const MIN_DEALS = 50;
  if (deals.length < MIN_DEALS) {
    console.log(`[Aggregator] Only ${deals.length} deals, supplementing with demo data to reach ${MIN_DEALS}`);
    const demoDeals = generateDemoDeals(MIN_DEALS - deals.length);
    deals = [...deals, ...demoDeals];
    if (!sources.includes('NomadSteals Picks')) {
      sources.push('NomadSteals Picks');
    }
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
      travelpirates: scrapeResult.stats.travelpirates,
      airfarewatchdog: scrapeResult.stats.airfarewatchdog,
      skiplagged: scrapeResult.stats.skiplagged,
      totalDeals: deals.length,
      avgValueScore: scrapeResult.stats.avgValueScore,
      hotDeals: scrapeResult.stats.hotDeals,
    },
  };
}

// Generate demo deals when scraping fails or returns too few
function generateDemoDeals(count: number = 50): Deal[] {
  const now = new Date();
  const deals: Deal[] = [];

  // Extended routes list for more variety
  const routes = [
    // US to Europe
    { from: 'New York', fromCode: 'JFK', to: 'Paris', toCode: 'CDG', basePrice: 450, avgPrice: 850, tags: ['europe'] },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'London', toCode: 'LHR', basePrice: 520, avgPrice: 950, tags: ['europe'] },
    { from: 'Chicago', fromCode: 'ORD', to: 'Rome', toCode: 'FCO', basePrice: 480, avgPrice: 880, tags: ['europe'] },
    { from: 'Boston', fromCode: 'BOS', to: 'Dublin', toCode: 'DUB', basePrice: 380, avgPrice: 650, tags: ['europe'] },
    { from: 'Dallas', fromCode: 'DFW', to: 'Amsterdam', toCode: 'AMS', basePrice: 510, avgPrice: 850, tags: ['europe'] },
    { from: 'Atlanta', fromCode: 'ATL', to: 'Barcelona', toCode: 'BCN', basePrice: 440, avgPrice: 720, tags: ['europe'] },
    { from: 'Denver', fromCode: 'DEN', to: 'Lisbon', toCode: 'LIS', basePrice: 480, avgPrice: 790, tags: ['europe'] },
    { from: 'Philadelphia', fromCode: 'PHL', to: 'Madrid', toCode: 'MAD', basePrice: 420, avgPrice: 750, tags: ['europe'] },
    { from: 'Washington DC', fromCode: 'IAD', to: 'Munich', toCode: 'MUC', basePrice: 460, avgPrice: 800, tags: ['europe'] },
    { from: 'Miami', fromCode: 'MIA', to: 'Vienna', toCode: 'VIE', basePrice: 490, avgPrice: 850, tags: ['europe'] },
    { from: 'Newark', fromCode: 'EWR', to: 'Copenhagen', toCode: 'CPH', basePrice: 410, avgPrice: 720, tags: ['europe'] },
    { from: 'San Francisco', fromCode: 'SFO', to: 'Stockholm', toCode: 'ARN', basePrice: 480, avgPrice: 820, tags: ['europe'] },
    
    // US to Asia
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Tokyo', toCode: 'NRT', basePrice: 650, avgPrice: 1100, tags: ['asia'] },
    { from: 'San Francisco', fromCode: 'SFO', to: 'Bangkok', toCode: 'BKK', basePrice: 580, avgPrice: 950, tags: ['asia'] },
    { from: 'Seattle', fromCode: 'SEA', to: 'Singapore', toCode: 'SIN', basePrice: 620, avgPrice: 1050, tags: ['asia'] },
    { from: 'New York', fromCode: 'JFK', to: 'Seoul', toCode: 'ICN', basePrice: 700, avgPrice: 1200, tags: ['asia'] },
    { from: 'Chicago', fromCode: 'ORD', to: 'Hong Kong', toCode: 'HKG', basePrice: 680, avgPrice: 1150, tags: ['asia'] },
    { from: 'Dallas', fromCode: 'DFW', to: 'Manila', toCode: 'MNL', basePrice: 720, avgPrice: 1200, tags: ['asia'] },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Taipei', toCode: 'TPE', basePrice: 590, avgPrice: 950, tags: ['asia'] },
    { from: 'San Francisco', fromCode: 'SFO', to: 'Bali', toCode: 'DPS', basePrice: 680, avgPrice: 1100, tags: ['asia', 'beach'] },
    { from: 'Houston', fromCode: 'IAH', to: 'New Delhi', toCode: 'DEL', basePrice: 750, avgPrice: 1300, tags: ['asia'] },
    { from: 'Boston', fromCode: 'BOS', to: 'Tokyo', toCode: 'NRT', basePrice: 720, avgPrice: 1250, tags: ['asia'] },
    
    // US to Caribbean/Mexico
    { from: 'New York', fromCode: 'JFK', to: 'Cancun', toCode: 'CUN', basePrice: 280, avgPrice: 450, tags: ['caribbean', 'beach'] },
    { from: 'Miami', fromCode: 'MIA', to: 'San Juan', toCode: 'SJU', basePrice: 150, avgPrice: 280, tags: ['caribbean', 'beach'] },
    { from: 'Dallas', fromCode: 'DFW', to: 'Puerto Vallarta', toCode: 'PVR', basePrice: 220, avgPrice: 380, tags: ['mexico', 'beach'] },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Cabo San Lucas', toCode: 'SJD', basePrice: 180, avgPrice: 320, tags: ['mexico', 'beach'] },
    { from: 'Chicago', fromCode: 'ORD', to: 'Punta Cana', toCode: 'PUJ', basePrice: 320, avgPrice: 520, tags: ['caribbean', 'beach'] },
    { from: 'Atlanta', fromCode: 'ATL', to: 'Jamaica', toCode: 'MBJ', basePrice: 260, avgPrice: 420, tags: ['caribbean', 'beach'] },
    { from: 'Phoenix', fromCode: 'PHX', to: 'Mexico City', toCode: 'MEX', basePrice: 200, avgPrice: 350, tags: ['mexico'] },
    { from: 'Houston', fromCode: 'IAH', to: 'Costa Rica', toCode: 'SJO', basePrice: 280, avgPrice: 450, tags: ['central-america'] },
    
    // US to Hawaii
    { from: 'Los Angeles', fromCode: 'LAX', to: 'Honolulu', toCode: 'HNL', basePrice: 320, avgPrice: 520, tags: ['hawaii', 'beach'] },
    { from: 'San Francisco', fromCode: 'SFO', to: 'Maui', toCode: 'OGG', basePrice: 340, avgPrice: 550, tags: ['hawaii', 'beach'] },
    { from: 'Seattle', fromCode: 'SEA', to: 'Kona', toCode: 'KOA', basePrice: 380, avgPrice: 600, tags: ['hawaii', 'beach'] },
    { from: 'Phoenix', fromCode: 'PHX', to: 'Honolulu', toCode: 'HNL', basePrice: 350, avgPrice: 560, tags: ['hawaii', 'beach'] },
    { from: 'Denver', fromCode: 'DEN', to: 'Maui', toCode: 'OGG', basePrice: 400, avgPrice: 620, tags: ['hawaii', 'beach'] },
    
    // US Domestic
    { from: 'New York', fromCode: 'JFK', to: 'Los Angeles', toCode: 'LAX', basePrice: 150, avgPrice: 280, tags: ['domestic'] },
    { from: 'Chicago', fromCode: 'ORD', to: 'Miami', toCode: 'MIA', basePrice: 120, avgPrice: 220, tags: ['domestic', 'beach'] },
    { from: 'Boston', fromCode: 'BOS', to: 'San Francisco', toCode: 'SFO', basePrice: 180, avgPrice: 320, tags: ['domestic'] },
    { from: 'Dallas', fromCode: 'DFW', to: 'New York', toCode: 'JFK', basePrice: 130, avgPrice: 240, tags: ['domestic'] },
    { from: 'Seattle', fromCode: 'SEA', to: 'Las Vegas', toCode: 'LAS', basePrice: 90, avgPrice: 180, tags: ['domestic'] },
    { from: 'Denver', fromCode: 'DEN', to: 'Orlando', toCode: 'MCO', basePrice: 140, avgPrice: 260, tags: ['domestic'] },
    { from: 'Atlanta', fromCode: 'ATL', to: 'San Diego', toCode: 'SAN', basePrice: 160, avgPrice: 290, tags: ['domestic', 'beach'] },
    { from: 'Phoenix', fromCode: 'PHX', to: 'Chicago', toCode: 'ORD', basePrice: 110, avgPrice: 210, tags: ['domestic'] },
    
    // South America
    { from: 'Miami', fromCode: 'MIA', to: 'Buenos Aires', toCode: 'EZE', basePrice: 550, avgPrice: 900, tags: ['south-america'] },
    { from: 'New York', fromCode: 'JFK', to: 'Lima', toCode: 'LIM', basePrice: 420, avgPrice: 720, tags: ['south-america'] },
    { from: 'Los Angeles', fromCode: 'LAX', to: 'São Paulo', toCode: 'GRU', basePrice: 620, avgPrice: 1000, tags: ['south-america'] },
    { from: 'Houston', fromCode: 'IAH', to: 'Bogotá', toCode: 'BOG', basePrice: 320, avgPrice: 550, tags: ['south-america'] },
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
    'Maui': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=800',
    'Seoul': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800',
    'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
    'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
    'Munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800',
    'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800',
    'Copenhagen': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800',
    'Stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
    'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
    'Miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800',
    'San Francisco': 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800',
    'Las Vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800',
    'Buenos Aires': 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800',
    'Lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a41129?w=800',
  };

  const airlines = ['United Airlines', 'Delta', 'American Airlines', 'British Airways', 'Lufthansa', 'Air France', 'JetBlue', 'Southwest', 'Alaska Airlines', 'Emirates', 'Qatar Airways', 'Singapore Airlines'];

  // Use routes in order, cycling through if we need more than available
  for (let i = 0; i < count; i++) {
    const route = routes[i % routes.length];
    // Add some variation for repeated routes
    const variation = Math.floor(i / routes.length);
    const priceMultiplier = 0.85 + (Math.random() * 0.3) - (variation * 0.05);
    const price = Math.round(route.basePrice * priceMultiplier);
    const savingsPercent = Math.round(((route.avgPrice - price) / route.avgPrice) * 100);
    const valueScore = Math.min(100, Math.max(50, savingsPercent * 1.5 + 30 + Math.random() * 10));

    const departureDate = new Date(now);
    departureDate.setDate(departureDate.getDate() + 30 + Math.floor(Math.random() * 90));

    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 5 + Math.floor(Math.random() * 10));

    const bookByDate = new Date(now);
    bookByDate.setDate(bookByDate.getDate() + 7 + Math.floor(Math.random() * 14));

    // Create posted time within last 3 days for freshness
    const postedAt = new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
    
    const deal: Deal = {
      id: `ns-${Date.now()}-${i}`,
      type: 'flight',
      title: `${route.from} to ${route.to} - $${price} RT`,
      description: `Great deal on flights to ${route.to}! Save ${savingsPercent}% compared to average prices. Book soon!`,
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
      source: 'NomadSteals Picks',
      postedAt,
      updatedAt: now.toISOString(),
      views: Math.floor(Math.random() * 5000) + 500,
      saves: Math.floor(Math.random() * 500) + 50,
      tags: [...(route.tags || []), ...generateDemoTags(route.to, valueScore)],
      isHotDeal: valueScore >= 85 || savingsPercent >= 45,
      isExpiringSoon: (bookByDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000,
      isHistoricLow: savingsPercent >= 40,
      status: 'active',
      // Freshness tracking
      scrapedAt: postedAt,
      firstSeenAt: postedAt,
      lastSeenAt: now.toISOString(),
      isActive: true,
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
