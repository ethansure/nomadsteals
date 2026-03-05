// Skiplagged Deals Scraper
// Scrapes trending cheap flights from Skiplagged

import * as cheerio from 'cheerio';
import { ScrapedDeal } from './types';

const BASE_URL = 'https://skiplagged.com/deals';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// City to airport code mapping
const CITY_CODES: Record<string, string> = {
  'new york': 'JFK', 'los angeles': 'LAX', 'chicago': 'ORD', 'san francisco': 'SFO',
  'miami': 'MIA', 'boston': 'BOS', 'seattle': 'SEA', 'dallas': 'DFW', 'denver': 'DEN',
  'atlanta': 'ATL', 'houston': 'IAH', 'phoenix': 'PHX', 'philadelphia': 'PHL',
  'washington': 'IAD', 'orlando': 'MCO', 'minneapolis': 'MSP', 'detroit': 'DTW',
  'tampa': 'TPA', 'portland': 'PDX', 'kansas city': 'MCI', 'salt lake city': 'SLC',
  'newark': 'EWR', 'san diego': 'SAN', 'austin': 'AUS', 'nashville': 'BNA',
  'new orleans': 'MSY', 'las vegas': 'LAS', 'charlotte': 'CLT', 'pittsburgh': 'PIT',
  'raleigh': 'RDU', 'indianapolis': 'IND', 'cleveland': 'CLE', 'st louis': 'STL',
  'london': 'LHR', 'paris': 'CDG', 'rome': 'FCO', 'barcelona': 'BCN', 'amsterdam': 'AMS',
  'frankfurt': 'FRA', 'madrid': 'MAD', 'lisbon': 'LIS', 'athens': 'ATH', 'dublin': 'DUB',
  'tokyo': 'NRT', 'bangkok': 'BKK', 'singapore': 'SIN', 'hong kong': 'HKG', 'seoul': 'ICN',
  'cancun': 'CUN', 'san juan': 'SJU', 'honolulu': 'HNL', 'kona': 'KOA', 'maui': 'OGG',
  'sydney': 'SYD', 'dubai': 'DXB', 'mexico city': 'MEX', 'toronto': 'YYZ',
  'vancouver': 'YVR', 'montreal': 'YUL', 'london uk': 'LHR', 'paris france': 'CDG',
};

// Average prices for value calculation
const AVG_PRICES: Record<string, number> = {
  'DEFAULT': 400,
  'domestic': 280,
  'canada': 350,
  'mexico': 380,
  'caribbean': 450,
  'europe': 750,
  'asia': 900,
  'south-america': 700,
};

// City images
const CITY_IMAGES: Record<string, string> = {
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
  'las vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800',
  'miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
  'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
  'san francisco': 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800',
  'denver': 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=800',
  'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800',
  'chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800',
  'boston': 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=800',
  'portland': 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800',
  'default': 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
};

function getAirportCode(city: string): string | undefined {
  const normalized = city.toLowerCase().replace(/[,.].*$/, '').trim();
  
  if (CITY_CODES[normalized]) return CITY_CODES[normalized];
  
  // Check if already airport code
  if (/^[A-Z]{3}$/i.test(city.trim())) {
    return city.trim().toUpperCase();
  }
  
  for (const [name, code] of Object.entries(CITY_CODES)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return code;
    }
  }
  
  return undefined;
}

function getImageUrl(destination: string): string {
  const normalized = destination.toLowerCase().replace(/[,.].*$/, '').trim();
  for (const [city, url] of Object.entries(CITY_IMAGES)) {
    if (normalized.includes(city)) return url;
  }
  return CITY_IMAGES['default'];
}

function extractPrice(text: string): number | null {
  const match = text.match(/\$(\d{1,4}(?:,\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

function getRegionAvgPrice(destCode?: string): number {
  if (!destCode) return AVG_PRICES['DEFAULT'];
  
  const europeCodes = ['LHR', 'CDG', 'FCO', 'BCN', 'AMS', 'FRA', 'MAD', 'LIS', 'ATH', 'DUB', 'ARN', 'CPH', 'MXP', 'VIE', 'MUC', 'ZRH', 'BRU'];
  const asiaCodes = ['NRT', 'BKK', 'SIN', 'HKG', 'ICN', 'TPE', 'DPS'];
  const caribbeanCodes = ['CUN', 'SJU', 'PUJ', 'MBJ'];
  const mexicoCodes = ['MEX', 'GDL', 'PVR', 'SJD'];
  const canadaCodes = ['YYZ', 'YVR', 'YUL', 'YYC'];
  const usCodes = ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'DFW', 'SEA', 'BOS', 'DEN', 'ATL', 'LAS', 'SAN', 'PHX', 'MSP', 'DTW', 'PHL', 'IAD', 'MCO', 'TPA', 'PDX', 'HNL'];
  
  if (europeCodes.includes(destCode)) return AVG_PRICES['europe'];
  if (asiaCodes.includes(destCode)) return AVG_PRICES['asia'];
  if (caribbeanCodes.includes(destCode)) return AVG_PRICES['caribbean'];
  if (mexicoCodes.includes(destCode)) return AVG_PRICES['mexico'];
  if (canadaCodes.includes(destCode)) return AVG_PRICES['canada'];
  if (usCodes.includes(destCode)) return AVG_PRICES['domestic'];
  
  return AVG_PRICES['DEFAULT'];
}

function calculateValueScore(price: number, destCode?: string): { valueScore: number; avgPrice: number } {
  const avgPrice = getRegionAvgPrice(destCode);
  const savings = ((avgPrice - price) / avgPrice) * 100;
  const valueScore = Math.min(100, Math.max(40, 50 + savings * 0.9));
  return { valueScore: Math.round(valueScore), avgPrice };
}

function extractRoute(text: string): { origin: string; destination: string } | null {
  // Pattern: "City to City" or "City → City" or "City - City"
  let match = text.match(/([A-Za-z\s\.]+?)\s+(?:to|→|-|–)\s+([A-Za-z\s\.]+?)(?:\s*[-–$]|\s+from|\s+starting|$)/i);
  if (match) {
    return { origin: match[1].trim(), destination: match[2].trim() };
  }
  
  // Pattern with airport codes
  match = text.match(/([A-Z]{3})\s*(?:to|→|-|–)\s*([A-Z]{3})/i);
  if (match) {
    return { origin: match[1].toUpperCase(), destination: match[2].toUpperCase() };
  }
  
  return null;
}

function generateTags(origin: string, destination: string, price: number): string[] {
  const tags: string[] = ['skiplagged'];
  const text = `${origin} ${destination}`.toLowerCase();
  
  const usCities = ['new york', 'los angeles', 'chicago', 'san francisco', 'miami', 'boston', 'seattle', 'dallas', 'denver', 'atlanta', 'las vegas', 'phoenix'];
  if (usCities.filter(c => text.includes(c)).length >= 2 || (text.includes('jfk') || text.includes('lax') || text.includes('ord'))) {
    tags.push('domestic');
  }
  
  if (['london', 'paris', 'rome', 'barcelona', 'amsterdam', 'dublin'].some(c => text.includes(c))) {
    tags.push('europe');
  }
  if (['tokyo', 'bangkok', 'singapore', 'seoul'].some(c => text.includes(c))) {
    tags.push('asia');
  }
  if (['cancun', 'caribbean', 'jamaica'].some(c => text.includes(c))) {
    tags.push('caribbean', 'beach');
  }
  
  if (price < 150) tags.push('budget');
  if (price < 80) tags.push('super-cheap');
  
  return tags;
}

export async function scrapeSkiplagged(maxDeals: number = 30): Promise<ScrapedDeal[]> {
  console.log('[Skiplagged] Fetching deals...');

  try {
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const deals: ScrapedDeal[] = [];
    
    // Skiplagged may use various structures
    $('article, .deal, .flight, [class*="deal"], [class*="route"]').each((_, element) => {
      if (deals.length >= maxDeals) return false;
      
      const $el = $(element);
      const title = $el.find('h2, h3, h4, .title, .route').first().text().trim();
      const link = $el.find('a').first().attr('href') || '';
      const priceText = $el.find('.price, [class*="price"]').text();
      
      if (!title || title.length < 3) return;
      
      const price = extractPrice(title) || extractPrice(priceText);
      if (!price || price < 20 || price > 3000) return;
      
      const route = extractRoute(title);
      if (!route) return;
      
      const originCode = getAirportCode(route.origin);
      const destCode = getAirportCode(route.destination);
      const { valueScore, avgPrice } = calculateValueScore(price, destCode);
      const savingsPercent = Math.max(0, Math.round(((avgPrice - price) / avgPrice) * 100));
      
      const fullUrl = link.startsWith('http') ? link : `https://skiplagged.com${link}`;
      
      deals.push({
        id: `skip-${Buffer.from(`${route.origin}-${route.destination}-${price}`).toString('base64').slice(0, 12)}`,
        source: 'skiplagged',
        title: `${route.origin} to ${route.destination} - $${price}`,
        origin: route.origin,
        originCode,
        destination: route.destination,
        destinationCode: destCode,
        price,
        originalPrice: avgPrice,
        currency: 'USD',
        originalUrl: fullUrl,
        imageUrl: getImageUrl(route.destination),
        postedAt: new Date(),
        scrapedAt: new Date(),
        isRoundtrip: false, // Skiplagged typically shows one-way
        valueScore,
        savingsPercent,
        isHotDeal: valueScore >= 82 || savingsPercent >= 50,
        description: `Hidden city flight deal from ${route.origin} to ${route.destination}`,
        tags: generateTags(route.origin, route.destination, price),
      });
    });
    
    console.log(`[Skiplagged] Extracted ${deals.length} valid deals`);
    return deals;
  } catch (error) {
    console.error('[Skiplagged] Error:', error);
    throw error;
  }
}
