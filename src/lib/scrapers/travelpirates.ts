// TravelPirates Scraper
// Scrapes deal data from https://www.travelpirates.com/

import * as cheerio from 'cheerio';
import { ScrapedDeal } from './types';

const BASE_URL = 'https://www.travelpirates.com/deals';
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
  'punta cana': 'PUJ', 'cabo': 'SJD', 'puerto vallarta': 'PVR', 'costa rica': 'SJO',
};

// Average prices for value calculation
const AVG_PRICES: Record<string, number> = {
  'DEFAULT': 600,
  'domestic': 350,
  'caribbean': 450,
  'europe': 800,
  'asia': 1000,
  'south-america': 750,
  'africa': 1100,
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
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
  'punta cana': 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=800',
  'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'costa rica': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800',
  'default': 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
};

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

// Extract price from text
function extractPrice(text: string): number | null {
  const priceMatch = text.match(/\$(\d{1,4}(?:,\d{3})*)/);
  if (priceMatch) {
    return parseInt(priceMatch[1].replace(/,/g, ''), 10);
  }
  
  // Try Euro prices
  const euroMatch = text.match(/€(\d{1,4}(?:,\d{3})*)/);
  if (euroMatch) {
    // Convert EUR to USD roughly
    return Math.round(parseInt(euroMatch[1].replace(/,/g, ''), 10) * 1.1);
  }
  
  return null;
}

// Calculate value score
function calculateValueScore(price: number, destination: string): { valueScore: number; avgPrice: number } {
  const dest = destination.toLowerCase();
  let avgPrice = AVG_PRICES['DEFAULT'];
  
  // Determine region
  if (dest.includes('europe') || ['london', 'paris', 'rome', 'barcelona', 'amsterdam', 'dublin', 'lisbon', 'athens', 'madrid', 'frankfurt', 'stockholm', 'copenhagen', 'oslo', 'milan', 'vienna', 'munich', 'zurich', 'brussels'].some(c => dest.includes(c))) {
    avgPrice = AVG_PRICES['europe'];
  } else if (['tokyo', 'bangkok', 'singapore', 'seoul', 'hong kong', 'bali', 'taipei', 'vietnam', 'thailand', 'japan', 'china', 'india'].some(c => dest.includes(c))) {
    avgPrice = AVG_PRICES['asia'];
  } else if (['cancun', 'punta cana', 'aruba', 'jamaica', 'bahamas', 'turks', 'caicos', 'barbados', 'st lucia', 'caribbean'].some(c => dest.includes(c))) {
    avgPrice = AVG_PRICES['caribbean'];
  } else if (['brazil', 'argentina', 'peru', 'colombia', 'chile', 'south america'].some(c => dest.includes(c))) {
    avgPrice = AVG_PRICES['south-america'];
  }
  
  const savings = ((avgPrice - price) / avgPrice) * 100;
  const valueScore = Math.min(100, Math.max(40, 50 + savings * 0.8));
  
  return { valueScore: Math.round(valueScore), avgPrice };
}

// Generate tags based on destination
function generateTags(destination: string, title: string): string[] {
  const tags: string[] = [];
  const text = `${destination} ${title}`.toLowerCase();
  
  if (['london', 'paris', 'rome', 'barcelona', 'amsterdam', 'dublin', 'lisbon', 'athens', 'madrid', 'frankfurt', 'stockholm'].some(c => text.includes(c))) {
    tags.push('europe');
  }
  if (['tokyo', 'bangkok', 'singapore', 'seoul', 'bali', 'vietnam', 'thailand', 'japan', 'asia'].some(c => text.includes(c))) {
    tags.push('asia');
  }
  if (['cancun', 'punta cana', 'aruba', 'jamaica', 'caribbean', 'beach'].some(c => text.includes(c))) {
    tags.push('caribbean', 'beach');
  }
  if (text.includes('all inclusive') || text.includes('all-inclusive')) {
    tags.push('all-inclusive');
  }
  if (text.includes('resort') || text.includes('hotel')) {
    tags.push('package');
  }
  if (text.includes('error fare')) {
    tags.push('error-fare');
  }
  
  return tags;
}

// Parse route from title (e.g. "New York to Paris" or "Flights to Rome")
function extractRoute(title: string, description: string): { origin: string; destination: string } | null {
  // Try "from X to Y" pattern
  let match = title.match(/from\s+([^-]+?)\s+to\s+([^-–]+?)(?:\s+for|\s*[-–(]|$)/i);
  if (match) {
    return { origin: match[1].trim(), destination: match[2].trim() };
  }
  
  // Try "X to Y" pattern
  match = title.match(/^([^-]+?)\s+to\s+([^-–]+?)(?:\s+for|\s*[-–(]|$)/i);
  if (match) {
    return { origin: match[1].trim(), destination: match[2].trim() };
  }
  
  // Try "Flights to X" pattern (assume US origin)
  match = title.match(/flights?\s+to\s+([^-–]+?)(?:\s+for|\s*[-–(]|$)/i);
  if (match) {
    return { origin: 'USA', destination: match[1].trim() };
  }
  
  // Extract destination from description
  const destMatch = description.match(/(?:fly|flights?|travel)\s+to\s+([^,\.]+)/i);
  if (destMatch) {
    return { origin: 'USA', destination: destMatch[1].trim() };
  }
  
  return null;
}

// Main scraper function
export async function scrapeTravelPirates(maxDeals: number = 30): Promise<ScrapedDeal[]> {
  console.log('[TravelPirates] Fetching deals page...');

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
    
    // TravelPirates uses article cards for deals
    $('article, .deal-card, .card, [data-deal]').each((_, element) => {
      if (deals.length >= maxDeals) return false;
      
      const $el = $(element);
      const title = $el.find('h2, h3, .title, .deal-title').first().text().trim();
      const link = $el.find('a').first().attr('href') || '';
      const description = $el.find('.description, .excerpt, p').first().text().trim();
      const priceText = $el.find('.price, .deal-price, [class*="price"]').text();
      
      if (!title || title.length < 10) return;
      
      const price = extractPrice(title) || extractPrice(priceText) || extractPrice(description);
      if (!price || price < 50 || price > 5000) return;
      
      const route = extractRoute(title, description);
      if (!route) return;
      
      const originCode = getAirportCode(route.origin);
      const destCode = getAirportCode(route.destination);
      const { valueScore, avgPrice } = calculateValueScore(price, route.destination);
      const savingsPercent = Math.max(0, Math.round(((avgPrice - price) / avgPrice) * 100));
      
      const fullUrl = link.startsWith('http') ? link : `https://www.travelpirates.com${link}`;
      
      deals.push({
        id: `tp-${Buffer.from(fullUrl).toString('base64').slice(0, 12)}`,
        source: 'travelpirates',
        title,
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
        isRoundtrip: title.toLowerCase().includes('roundtrip') || title.toLowerCase().includes('round trip') || !title.toLowerCase().includes('one way'),
        valueScore,
        savingsPercent,
        isHotDeal: valueScore >= 80 || savingsPercent >= 40,
        description: description.slice(0, 200),
        tags: generateTags(route.destination, title),
      });
    });
    
    console.log(`[TravelPirates] Extracted ${deals.length} valid deals`);
    return deals;
  } catch (error) {
    console.error('[TravelPirates] Error:', error);
    throw error;
  }
}
