// The Flight Deal RSS Feed Scraper
// Scrapes deal data from https://www.theflightdeal.com/feed/

import * as cheerio from 'cheerio';
import { ScrapedDeal } from './types';

const RSS_URL = 'https://www.theflightdeal.com/feed/';

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
  'new delhi': 'DEL', 'mumbai': 'BOM', 'taipei': 'TPE', 'bali': 'DPS', 'fairbanks': 'FAI',
  'alaska': 'FAI', 'sweden': 'ARN', 'india': 'DEL',
};

// Average prices for value calculation
const AVG_PRICES: Record<string, number> = {
  'DEFAULT': 600,
  'JFK-LHR': 800, 'LAX-NRT': 1100, 'JFK-CDG': 850, 'SFO-BKK': 950,
  'MIA-FCO': 880, 'BOS-DUB': 650, 'SEA-SIN': 1050, 'DFW-AMS': 850,
  'JFK-CUN': 420, 'LAX-HNL': 480, 'JFK-BCN': 720, 'ORD-LHR': 780,
  'SFO-ICN': 980, 'MIA-MAD': 780, 'ORD-FRA': 730, 'JFK-DXB': 1150,
  'LAX-SYD': 1450, 'BOS-ATH': 850, 'SEA-HKG': 920, 'DFW-SJU': 380,
  'SFO-ARN': 900, 'LAX-DEL': 1200, 'PDX-DEL': 1250, 'PHX-FAI': 550,
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
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
  'stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
  'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
  'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
  'athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
  'new delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
  'india': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800',
  'sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800',
  'alaska': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
  'fairbanks': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
  'default': 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
};

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
  imageUrl?: string;
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

    // Extract image from description
    const description = $item.find('description').text();
    const imgMatch = description.match(/src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : undefined;

    items.push({
      title: $item.find('title').text(),
      link: $item.find('link').text(),
      description: description.replace(/<[^>]+>/g, ' ').trim(),
      pubDate: $item.find('pubDate').text(),
      categories,
      imageUrl,
    });
  });

  return items;
}

// Extract prices from The Flight Deal title format
// "Scandinavian Airlines: San Francisco – Stockholm, Sweden. $535 (Basic Economy) / $635 (Regular Economy)"
function extractPrices(title: string): { basicPrice: number; regularPrice: number } | null {
  // Match both basic and regular economy prices
  const basicMatch = title.match(/\$(\d{3,4})\s*\(Basic/);
  const regularMatch = title.match(/\$(\d{3,4})\s*\(Regular/);
  
  if (basicMatch) {
    const basicPrice = parseInt(basicMatch[1], 10);
    const regularPrice = regularMatch ? parseInt(regularMatch[1], 10) : basicPrice;
    return { basicPrice, regularPrice };
  }
  
  // Fallback: just get any price
  const anyPriceMatch = title.match(/\$(\d{3,4})/);
  if (anyPriceMatch) {
    const price = parseInt(anyPriceMatch[1], 10);
    return { basicPrice: price, regularPrice: price };
  }
  
  return null;
}

// Extract route from The Flight Deal title format
// "Airline: San Francisco – Stockholm, Sweden. $535..."
function extractRoute(title: string): { airline: string; origin: string; destination: string } | null {
  // Pattern: "Airline: Origin – Destination. $price..."
  const match = title.match(/^([^:]+):\s*([^–-]+)\s*[–-]\s*([^.$]+)/);
  if (match) {
    return {
      airline: match[1].trim(),
      origin: match[2].trim(),
      destination: match[3].trim().replace(/\s*\.\s*$/, ''),
    };
  }
  return null;
}

// Get airport code for a city
function getAirportCode(city: string): string | undefined {
  const normalized = city.toLowerCase()
    .replace(/[,.].*$/, '')
    .replace(/\s*(usa|canada|uk|germany|france|spain|italy|sweden|india|alaska).*$/i, '')
    .trim();
  return CITY_CODES[normalized];
}

// Get image URL for a destination
function getImageUrl(destination: string, rssImageUrl?: string): string {
  // If RSS has an image, use it (but make sure it's not a tracking pixel)
  if (rssImageUrl && rssImageUrl.includes('theflightdeal.com/wp-content') && !rssImageUrl.includes('pixel')) {
    return rssImageUrl;
  }
  
  const normalized = destination.toLowerCase().replace(/[,.].*$/, '').trim();
  for (const [key, url] of Object.entries(CITY_IMAGES)) {
    if (normalized.includes(key)) {
      return url;
    }
  }
  return CITY_IMAGES['default'];
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

// Generate tags from destination and airline
function generateTags(destination: string, airline: string): string[] {
  const tags: string[] = [];
  const dest = destination.toLowerCase();

  // Geographic tags
  const europeanCountries = ['sweden', 'germany', 'france', 'spain', 'italy', 'uk', 'ireland', 'portugal', 'greece', 'austria', 'switzerland', 'netherlands', 'belgium', 'norway', 'denmark'];
  const asianCountries = ['japan', 'thailand', 'singapore', 'korea', 'china', 'taiwan', 'indonesia', 'india', 'vietnam', 'philippines'];
  
  if (europeanCountries.some(c => dest.includes(c)) || ['stockholm', 'london', 'paris', 'rome', 'barcelona', 'amsterdam', 'dublin', 'lisbon', 'athens', 'madrid', 'frankfurt', 'munich', 'vienna'].some(c => dest.includes(c))) {
    tags.push('europe');
  }
  if (asianCountries.some(c => dest.includes(c)) || ['tokyo', 'bangkok', 'singapore', 'seoul', 'hong kong', 'taipei', 'bali', 'delhi', 'mumbai'].some(c => dest.includes(c))) {
    tags.push('asia');
  }
  if (dest.includes('alaska')) tags.push('adventure', 'nature');
  if (dest.includes('india')) tags.push('cultural');

  // Premium airline tags
  const premiumAirlines = ['singapore airlines', 'qatar airways', 'emirates', 'cathay pacific', 'ana', 'jal'];
  if (premiumAirlines.some(a => airline.toLowerCase().includes(a))) {
    tags.push('premium-airline');
  }

  return tags;
}

// Convert RSS item to ScrapedDeal
function rssItemToDeal(item: RssItem): ScrapedDeal | null {
  const prices = extractPrices(item.title);
  if (!prices) return null;

  const route = extractRoute(item.title);
  if (!route) return null;

  const originCode = getAirportCode(route.origin);
  const destCode = getAirportCode(route.destination);
  
  // Use regular economy price for main display
  const price = prices.basicPrice;
  const valueScore = calculateValueScore(price, originCode, destCode);
  const avgPrice = AVG_PRICES[originCode && destCode ? `${originCode}-${destCode}` : 'DEFAULT'] || AVG_PRICES['DEFAULT'];
  const savingsPercent = Math.round(((avgPrice - price) / avgPrice) * 100);

  const pubDate = new Date(item.pubDate);
  const bookByDate = new Date();
  bookByDate.setDate(bookByDate.getDate() + 7); // TheFlightDeal often has shorter validity

  // Create a cleaner title
  const cleanTitle = `${route.origin} to ${route.destination} - $${price} RT`;

  return {
    id: `tfd-${Buffer.from(item.link).toString('base64').slice(0, 12)}`,
    source: 'theflightdeal',
    title: cleanTitle,
    origin: route.origin,
    originCode,
    destination: route.destination,
    destinationCode: destCode,
    price,
    originalPrice: avgPrice,
    currency: 'USD',
    originalUrl: item.link,
    imageUrl: getImageUrl(route.destination, item.imageUrl),
    postedAt: pubDate,
    scrapedAt: new Date(),
    isRoundtrip: true, // TheFlightDeal always posts roundtrip fares
    airline: route.airline,
    valueScore,
    savingsPercent: Math.max(0, savingsPercent),
    isHotDeal: valueScore >= 80 || savingsPercent >= 40,
    description: `${route.airline} flight deal. Basic Economy: $${prices.basicPrice}, Regular Economy: $${prices.regularPrice}. ${item.description.slice(0, 200)}...`,
    tags: generateTags(route.destination, route.airline),
  };
}

// Main scraper function
export async function scrapeTheFlightDeal(maxDeals: number = 30): Promise<ScrapedDeal[]> {
  console.log('[TheFlightDeal] Fetching RSS feed...');

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
    console.log(`[TheFlightDeal] Parsed ${items.length} RSS items`);

    const deals: ScrapedDeal[] = [];
    for (const item of items) {
      const deal = rssItemToDeal(item);
      if (deal) {
        deals.push(deal);
        if (deals.length >= maxDeals) break;
      }
    }

    console.log(`[TheFlightDeal] Extracted ${deals.length} valid deals`);
    return deals;
  } catch (error) {
    console.error('[TheFlightDeal] Error:', error);
    throw error;
  }
}
