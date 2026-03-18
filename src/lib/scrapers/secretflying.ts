// SecretFlying RSS Feed Scraper
// Scrapes deal data from https://www.secretflying.com/feed/

import * as cheerio from 'cheerio';
import { ScrapedDeal } from './types';

const RSS_URL = 'https://www.secretflying.com/feed/';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// City to airport code mapping
const CITY_CODES: Record<string, string> = {
  'new york': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD', 'san francisco': 'SFO',
  'miami': 'MIA', 'boston': 'BOS', 'seattle': 'SEA', 'dallas': 'DFW', 'denver': 'DEN',
  'atlanta': 'ATL', 'houston': 'IAH', 'phoenix': 'PHX', 'philadelphia': 'PHL',
  'washington': 'IAD', 'orlando': 'MCO', 'minneapolis': 'MSP', 'detroit': 'DTW',
  'tampa': 'TPA', 'portland': 'PDX', 'kansas city': 'MCI', 'salt lake city': 'SLC',
  'london': 'LHR', 'paris': 'CDG', 'rome': 'FCO', 'barcelona': 'BCN', 'amsterdam': 'AMS',
  'frankfurt': 'FRA', 'madrid': 'MAD', 'lisbon': 'LIS', 'athens': 'ATH', 'dublin': 'DUB',
  'tokyo': 'NRT', 'bangkok': 'BKK', 'singapore': 'SIN', 'hong kong': 'HKG', 'seoul': 'ICN',
  'cancun': 'CUN', 'san juan': 'SJU', 'honolulu': 'HNL', 'kona': 'KOA', 'maui': 'OGG',
  'sydney': 'SYD', 'dubai': 'DXB', 'stockholm': 'ARN', 'copenhagen': 'CPH', 'oslo': 'OSL',
  'milan': 'MXP', 'vienna': 'VIE', 'munich': 'MUC', 'zurich': 'ZRH', 'brussels': 'BRU',
  'hawaii': 'HNL', 'tel aviv': 'TLV', 'istanbul': 'IST', 'mexico city': 'MEX',
  'new delhi': 'DEL', 'mumbai': 'BOM', 'taipei': 'TPE', 'bali': 'DPS',
};

// Average prices for value calculation
const AVG_PRICES: Record<string, number> = {
  'DEFAULT': 600,
  'JFK-LHR': 800, 'LAX-NRT': 1100, 'JFK-CDG': 850, 'SFO-BKK': 950,
  'MIA-FCO': 880, 'BOS-DUB': 650, 'SEA-SIN': 1050, 'DFW-AMS': 850,
  'JFK-CUN': 420, 'LAX-HNL': 480, 'JFK-BCN': 720, 'ORD-LHR': 780,
  'SFO-ICN': 980, 'MIA-MAD': 780, 'ORD-FRA': 730, 'JFK-DXB': 1150,
  'LAX-SYD': 1450, 'BOS-ATH': 850, 'SEA-HKG': 920, 'DFW-SJU': 380,
};

// City images for display
const CITY_IMAGES: Record<string, string> = {
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
  'dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
  'honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
  'hawaii': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
  'stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
  'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
  'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
  'athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
  'new delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'default': 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
};

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
  content: string;
}

// Parse the RSS feed
function parseRssFeed(xml: string): RssItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items: RssItem[] = [];

  $('item').each((_, element) => {
    const $item = $(element);
    const categories: string[] = [];
    $item.find('category').each((_, cat) => {
      categories.push($(cat).text());
    });

    items.push({
      title: $item.find('title').text(),
      link: $item.find('link').text(),
      description: $item.find('description').text(),
      pubDate: $item.find('pubDate').text(),
      categories,
      content: $item.find('content\\:encoded').text(),
    });
  });

  return items;
}

// Extract price from title like "Kansas City to Kona, Hawaii for only $428 roundtrip"
// Also handles €, £, CAD, etc.
function extractPrice(title: string): { price: number; currency: string } | null {
  // Match various currency formats: $428, €328, £435, $356 CAD, etc.
  const priceMatch = title.match(/[$€£](\d{2,4})(?:\s*(USD|CAD|EUR|GBP))?/i);
  if (priceMatch) {
    const price = parseInt(priceMatch[1], 10);
    let currency = 'USD';
    
    // Determine currency from symbol or suffix
    if (title.includes('€')) currency = 'EUR';
    else if (title.includes('£')) currency = 'GBP';
    else if (title.includes('CAD')) currency = 'CAD';
    else if (priceMatch[2]) currency = priceMatch[2].toUpperCase();
    
    return { price, currency };
  }
  return null;
}

// Extract origin and destination from title
function extractRoute(title: string): { origin: string; destination: string } | null {
  // Pattern 1: "Non-stop from Kansas City to Kona, Hawaii for only..."
  // Pattern 2: "Kansas City to Kona, Hawaii for only..."
  // Pattern 3: "Madrid, Spain to New York, USA for only..."
  
  // Try "from X to Y" pattern first
  let routeMatch = title.match(/from\s+([^-]+?)\s+to\s+([^-]+?)(?:\s+for|\s*[-–(]|$)/i);
  
  // If not found, try "X to Y" pattern (at start of string)
  if (!routeMatch) {
    routeMatch = title.match(/^([^-]+?)\s+to\s+([^-]+?)(?:\s+for|\s*[-–(]|$)/i);
  }
  
  if (routeMatch) {
    // Clean up "Non-stop" prefix if present in origin
    let origin = routeMatch[1].trim().replace(/^Non-stop\s*/i, '');
    let destination = routeMatch[2].trim().replace(/,\s*$/, '');
    
    return { origin, destination };
  }
  return null;
}

// Get airport code for a city
function getAirportCode(city: string): string | undefined {
  const normalized = city.toLowerCase().replace(/[,.].*$/, '').trim();
  return CITY_CODES[normalized];
}

// Get image URL for a destination
function getImageUrl(destination: string): string {
  const normalized = destination.toLowerCase().replace(/[,.].*$/, '').trim();
  return CITY_IMAGES[normalized] || CITY_IMAGES['default'];
}

// Extract airline from categories or content
function extractAirline(categories: string[], content: string): string | undefined {
  const airlines = [
    'United Airlines', 'Delta', 'American Airlines', 'Southwest',
    'JetBlue', 'Alaska Airlines', 'Spirit', 'Frontier',
    'British Airways', 'Lufthansa', 'Air France', 'Emirates',
    'Qatar Airways', 'Singapore Airlines', 'Cathay Pacific',
    'ANA', 'JAL', 'Korean Air', 'Air Canada', 'WestJet',
  ];

  // Check categories first
  for (const cat of categories) {
    if (airlines.some(a => cat.includes(a))) {
      return cat;
    }
  }

  // Check content
  for (const airline of airlines) {
    if (content.includes(airline)) {
      return airline;
    }
  }

  return undefined;
}

// Calculate value score based on price vs average
function calculateValueScore(price: number, originCode?: string, destCode?: string): number {
  const routeKey = originCode && destCode ? `${originCode}-${destCode}` : 'DEFAULT';
  const avgPrice = AVG_PRICES[routeKey] || AVG_PRICES['DEFAULT'];
  
  const savings = ((avgPrice - price) / avgPrice) * 100;
  // Value score: base 50 + savings percentage * 0.8, capped at 100
  const score = Math.min(100, Math.max(40, 50 + savings * 0.8));
  return Math.round(score);
}

// Generate a unique hash from a string (simple but effective)
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string and pad to ensure consistent length
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Convert RSS item to ScrapedDeal
function rssItemToDeal(item: RssItem): ScrapedDeal | null {
  const priceInfo = extractPrice(item.title);
  if (!priceInfo) return null;

  const route = extractRoute(item.title);
  if (!route) return null;

  const { price, currency } = priceInfo;
  
  // Convert to USD for comparison (rough estimates)
  const toUsdRate: Record<string, number> = { USD: 1, CAD: 0.74, EUR: 1.08, GBP: 1.27 };
  const priceUsd = Math.round(price * (toUsdRate[currency] || 1));

  const originCode = getAirportCode(route.origin);
  const destCode = getAirportCode(route.destination);
  
  const valueScore = calculateValueScore(priceUsd, originCode, destCode);
  const avgPrice = AVG_PRICES[originCode && destCode ? `${originCode}-${destCode}` : 'DEFAULT'] || AVG_PRICES['DEFAULT'];
  const savingsPercent = Math.round(((avgPrice - priceUsd) / avgPrice) * 100);

  const pubDate = new Date(item.pubDate);
  const bookByDate = new Date();
  bookByDate.setDate(bookByDate.getDate() + 14); // Assume 2 weeks validity

  // Normalize title: replace original currency price with USD price if converted
  let normalizedTitle = item.title;
  if (currency !== 'USD') {
    // Replace the original currency price with USD price
    // e.g., "€328" → "$354" or "£435" → "$552"
    // Note: Use $$${priceUsd} because $ is a special char in replace (backreference)
    normalizedTitle = item.title.replace(/[$€£](\d{2,4})(?:\s*(USD|CAD|EUR|GBP))?/i, `$$${priceUsd}`);
  }

  return {
    // Use hash of full URL for unique ID to avoid collisions from similar URL suffixes
    id: `sf-${hashString(item.link)}`,
    source: 'secretflying',
    title: normalizedTitle,
    origin: route.origin,
    originCode,
    destination: route.destination,
    destinationCode: destCode,
    price: priceUsd,  // Store USD-converted price for consistency
    originalPrice: avgPrice,
    currency: 'USD',  // Always store in USD after conversion
    originalUrl: item.link,
    imageUrl: getImageUrl(route.destination),
    postedAt: pubDate,
    scrapedAt: new Date(),
    isRoundtrip: item.title.toLowerCase().includes('roundtrip') || item.title.toLowerCase().includes('vice versa'),
    airline: extractAirline(item.categories, item.content),
    valueScore,
    savingsPercent: Math.max(0, savingsPercent),
    isHotDeal: valueScore >= 80 || savingsPercent >= 40,
    description: item.description,
    tags: generateTags(route.destination, item.categories),
  };
}

// Generate tags from destination and categories
function generateTags(destination: string, categories: string[]): string[] {
  const tags: string[] = [];
  const dest = destination.toLowerCase();

  // Geographic tags
  const europeanCities = ['london', 'paris', 'rome', 'barcelona', 'amsterdam', 'dublin', 'lisbon', 'athens', 'madrid', 'frankfurt', 'stockholm', 'copenhagen', 'oslo', 'milan', 'vienna', 'munich', 'zurich', 'brussels'];
  const asianCities = ['tokyo', 'bangkok', 'singapore', 'seoul', 'hong kong', 'taipei', 'bali', 'new delhi', 'mumbai'];
  const caribbeanCities = ['cancun', 'san juan', 'jamaica', 'aruba', 'bahamas'];
  const pacificCities = ['honolulu', 'maui', 'kona', 'hawaii', 'sydney', 'auckland'];

  if (europeanCities.some(c => dest.includes(c))) tags.push('europe');
  if (asianCities.some(c => dest.includes(c))) tags.push('asia');
  if (caribbeanCities.some(c => dest.includes(c))) tags.push('caribbean', 'beach');
  if (pacificCities.some(c => dest.includes(c))) tags.push('pacific');
  if (dest.includes('hawaii')) tags.push('beach', 'tropical');

  // From categories
  if (categories.some(c => c.toLowerCase().includes('error fare'))) tags.push('error-fare');
  if (categories.some(c => c.toLowerCase().includes('business'))) tags.push('business-class');

  return tags;
}

// Main scraper function
export async function scrapeSecretFlying(maxDeals: number = 30): Promise<ScrapedDeal[]> {
  console.log('[SecretFlying] Fetching RSS feed...');

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const items = parseRssFeed(xml);
    console.log(`[SecretFlying] Parsed ${items.length} RSS items`);

    const deals: ScrapedDeal[] = [];
    for (const item of items) {
      const deal = rssItemToDeal(item);
      if (deal) {
        deals.push(deal);
        if (deals.length >= maxDeals) break;
      }
    }

    console.log(`[SecretFlying] Extracted ${deals.length} valid deals`);
    return deals;
  } catch (error) {
    console.error('[SecretFlying] Error:', error);
    throw error;
  }
}
