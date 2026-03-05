// Airfarewatchdog Scraper
// Scrapes deal data from https://www.airfarewatchdog.com/cheap-flights/

import * as cheerio from 'cheerio';
import { ScrapedDeal } from './types';

const BASE_URL = 'https://www.airfarewatchdog.com/cheap-flights/';
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
  'london': 'LHR', 'paris': 'CDG', 'rome': 'FCO', 'barcelona': 'BCN', 'amsterdam': 'AMS',
  'frankfurt': 'FRA', 'madrid': 'MAD', 'lisbon': 'LIS', 'athens': 'ATH', 'dublin': 'DUB',
  'tokyo': 'NRT', 'bangkok': 'BKK', 'singapore': 'SIN', 'hong kong': 'HKG', 'seoul': 'ICN',
  'cancun': 'CUN', 'san juan': 'SJU', 'honolulu': 'HNL', 'kona': 'KOA', 'maui': 'OGG',
  'sydney': 'SYD', 'dubai': 'DXB', 'stockholm': 'ARN', 'copenhagen': 'CPH', 'oslo': 'OSL',
  'milan': 'MXP', 'vienna': 'VIE', 'munich': 'MUC', 'zurich': 'ZRH', 'brussels': 'BRU',
  'hawaii': 'HNL', 'tel aviv': 'TLV', 'istanbul': 'IST', 'mexico city': 'MEX',
  'guadalajara': 'GDL', 'puerto vallarta': 'PVR', 'cabo': 'SJD', 'lima': 'LIM',
  'bogota': 'BOG', 'medellin': 'MDE', 'sao paulo': 'GRU', 'buenos aires': 'EZE',
};

// Average prices for value calculation
const AVG_PRICES: Record<string, number> = {
  'DEFAULT': 450,
  'JFK-LAX': 320, 'JFK-SFO': 350, 'JFK-MIA': 220, 'ORD-LAX': 280,
  'JFK-LHR': 800, 'LAX-NRT': 950, 'JFK-CDG': 850, 'SFO-BKK': 900,
  'MIA-FCO': 850, 'BOS-DUB': 550, 'SEA-SIN': 1000, 'DFW-AMS': 800,
  'JFK-CUN': 380, 'LAX-HNL': 450, 'JFK-BCN': 700, 'ORD-LHR': 750,
  'domestic': 280,
  'mexico': 350,
  'caribbean': 400,
  'europe': 700,
  'asia': 950,
};

// City images
const CITY_IMAGES: Record<string, string> = {
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
  'honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
  'miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800',
  'las vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
  'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
  'san francisco': 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
  'default': 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
};

function getAirportCode(city: string): string | undefined {
  const normalized = city.toLowerCase().replace(/[,.].*$/, '').trim();
  
  // Direct match
  if (CITY_CODES[normalized]) return CITY_CODES[normalized];
  
  // Check if it's already an airport code (3 letters)
  if (/^[A-Z]{3}$/i.test(city.trim())) {
    return city.trim().toUpperCase();
  }
  
  // Partial match
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
  const priceMatch = text.match(/\$(\d{1,4}(?:,\d{3})*)/);
  if (priceMatch) {
    return parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }
  return null;
}

function calculateValueScore(price: number, originCode?: string, destCode?: string): { valueScore: number; avgPrice: number } {
  const routeKey = originCode && destCode ? `${originCode}-${destCode}` : 'DEFAULT';
  let avgPrice = AVG_PRICES[routeKey] || AVG_PRICES['DEFAULT'];
  
  // Determine region-based average if specific route not found
  if (!AVG_PRICES[routeKey]) {
    const europeCodes = ['LHR', 'CDG', 'FCO', 'BCN', 'AMS', 'FRA', 'MAD', 'LIS', 'ATH', 'DUB', 'ARN', 'CPH', 'MXP', 'VIE', 'MUC', 'ZRH', 'BRU'];
    const asiaCodes = ['NRT', 'BKK', 'SIN', 'HKG', 'ICN', 'TPE', 'DPS'];
    const caribbeanCodes = ['CUN', 'SJU', 'PUJ', 'MBJ'];
    const mexicoCodes = ['MEX', 'GDL', 'PVR', 'SJD'];
    
    if (destCode && europeCodes.includes(destCode)) {
      avgPrice = AVG_PRICES['europe'];
    } else if (destCode && asiaCodes.includes(destCode)) {
      avgPrice = AVG_PRICES['asia'];
    } else if (destCode && caribbeanCodes.includes(destCode)) {
      avgPrice = AVG_PRICES['caribbean'];
    } else if (destCode && mexicoCodes.includes(destCode)) {
      avgPrice = AVG_PRICES['mexico'];
    } else if (originCode && destCode && ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'DFW', 'SEA', 'BOS', 'DEN', 'ATL'].includes(originCode) && 
               ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'DFW', 'SEA', 'BOS', 'DEN', 'ATL', 'LAS', 'SAN', 'PHX'].includes(destCode)) {
      avgPrice = AVG_PRICES['domestic'];
    }
  }
  
  const savings = ((avgPrice - price) / avgPrice) * 100;
  const valueScore = Math.min(100, Math.max(40, 50 + savings * 0.9));
  
  return { valueScore: Math.round(valueScore), avgPrice };
}

function extractRoute(title: string): { origin: string; destination: string } | null {
  // Pattern: "City to City" or "City - City"
  let match = title.match(/^([A-Za-z\s\.]+?)\s+(?:to|-|–|→)\s+([A-Za-z\s\.]+?)(?:\s+[-–]|\s+\$|\s+from|$)/i);
  if (match) {
    return { origin: match[1].trim(), destination: match[2].trim() };
  }
  
  // Pattern with airport codes: "LAX to JFK"
  match = title.match(/([A-Z]{3})\s+(?:to|-|–|→)\s+([A-Z]{3})/i);
  if (match) {
    return { origin: match[1].toUpperCase(), destination: match[2].toUpperCase() };
  }
  
  return null;
}

function extractAirline(text: string): string | undefined {
  const airlines = [
    'United', 'Delta', 'American', 'Southwest', 'JetBlue', 'Alaska', 'Spirit', 'Frontier',
    'Hawaiian', 'Sun Country', 'Allegiant', 'British Airways', 'Lufthansa', 'Air France',
    'KLM', 'Virgin Atlantic', 'Aer Lingus', 'Icelandair', 'Norwegian', 'TAP', 'Iberia',
    'Emirates', 'Qatar', 'Etihad', 'Singapore Airlines', 'Cathay Pacific', 'ANA', 'JAL',
  ];
  
  const textLower = text.toLowerCase();
  for (const airline of airlines) {
    if (textLower.includes(airline.toLowerCase())) {
      return airline;
    }
  }
  
  return undefined;
}

function generateTags(origin: string, destination: string, price: number): string[] {
  const tags: string[] = [];
  const text = `${origin} ${destination}`.toLowerCase();
  
  // US domestic
  const usCities = ['new york', 'los angeles', 'chicago', 'san francisco', 'miami', 'boston', 'seattle', 'dallas', 'denver', 'atlanta', 'las vegas', 'phoenix', 'san diego'];
  if (usCities.some(c => text.includes(c)) && usCities.filter(c => text.includes(c)).length >= 2) {
    tags.push('domestic');
  }
  
  if (['london', 'paris', 'rome', 'barcelona', 'amsterdam', 'dublin', 'lisbon'].some(c => text.includes(c))) {
    tags.push('europe');
  }
  if (['tokyo', 'bangkok', 'singapore', 'seoul', 'bali'].some(c => text.includes(c))) {
    tags.push('asia');
  }
  if (['cancun', 'puerto rico', 'jamaica', 'caribbean'].some(c => text.includes(c))) {
    tags.push('caribbean', 'beach');
  }
  if (['hawaii', 'honolulu', 'maui', 'kona'].some(c => text.includes(c))) {
    tags.push('hawaii', 'beach');
  }
  
  if (price < 200) tags.push('budget');
  if (price < 100) tags.push('super-cheap');
  
  return tags;
}

export async function scrapeAirfarewatchdog(maxDeals: number = 30): Promise<ScrapedDeal[]> {
  console.log('[Airfarewatchdog] Fetching deals page...');

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
    
    // Airfarewatchdog uses various card structures
    $('article, .deal, .fare, [class*="deal"], [class*="fare"]').each((_, element) => {
      if (deals.length >= maxDeals) return false;
      
      const $el = $(element);
      const title = $el.find('h2, h3, h4, .title, .headline').first().text().trim();
      const link = $el.find('a').first().attr('href') || '';
      const priceText = $el.find('.price, [class*="price"]').text();
      const description = $el.find('.description, .excerpt, .summary, p').first().text().trim();
      
      if (!title || title.length < 5) return;
      
      const price = extractPrice(title) || extractPrice(priceText);
      if (!price || price < 30 || price > 5000) return;
      
      const route = extractRoute(title);
      if (!route) return;
      
      const originCode = getAirportCode(route.origin);
      const destCode = getAirportCode(route.destination);
      const { valueScore, avgPrice } = calculateValueScore(price, originCode, destCode);
      const savingsPercent = Math.max(0, Math.round(((avgPrice - price) / avgPrice) * 100));
      const airline = extractAirline(title + ' ' + description);
      
      const fullUrl = link.startsWith('http') ? link : `https://www.airfarewatchdog.com${link}`;
      
      deals.push({
        id: `afw-${Buffer.from(fullUrl).toString('base64').slice(0, 12)}`,
        source: 'airfarewatchdog',
        title: title.includes('$') ? title : `${title} - $${price}`,
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
        isRoundtrip: title.toLowerCase().includes('rt') || title.toLowerCase().includes('roundtrip') || !title.toLowerCase().includes('one-way'),
        airline,
        valueScore,
        savingsPercent,
        isHotDeal: valueScore >= 82 || savingsPercent >= 45,
        description: description.slice(0, 200),
        tags: generateTags(route.origin, route.destination, price),
      });
    });
    
    console.log(`[Airfarewatchdog] Extracted ${deals.length} valid deals`);
    return deals;
  } catch (error) {
    console.error('[Airfarewatchdog] Error:', error);
    throw error;
  }
}
