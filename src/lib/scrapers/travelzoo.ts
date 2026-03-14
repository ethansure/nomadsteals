// Travelzoo Hotel & Getaway Deals Scraper
// RSS Feed: https://www.travelzoo.com/feed

import { ScrapedDeal, ScrapeResult } from './types';

interface TravelzooEntry {
  id: string;
  title: string;
  summary: string;
  link: string;
  published: string;
}

function parsePrice(title: string): { price: number; originalPrice: number } {
  // Match patterns like "$999", "$229", "$1987"
  const priceMatch = title.match(/\$(\d+(?:,\d{3})*)/);
  const price = priceMatch ? parseInt(priceMatch[1].replace(',', '')) : 0;
  
  // Try to find original price in "reg. $X" or "save X%"
  const regMatch = title.match(/reg\.?\s*\$(\d+(?:,\d{3})*)/i);
  const saveMatch = title.match(/save\s*(\d+)%/i);
  
  let originalPrice = price;
  if (regMatch) {
    originalPrice = parseInt(regMatch[1].replace(',', ''));
  } else if (saveMatch) {
    const savingsPercent = parseInt(saveMatch[1]);
    originalPrice = Math.round(price / (1 - savingsPercent / 100));
  } else {
    // Estimate 30% savings if not specified
    originalPrice = Math.round(price * 1.3);
  }
  
  return { price, originalPrice };
}

function parseDestination(title: string, summary: string): { destination: string; destinationCode: string } {
  // Common destination patterns
  const destinations: Record<string, string> = {
    'cabo': 'SJD',
    'los cabos': 'SJD',
    'cancun': 'CUN',
    'st. lucia': 'UVF',
    'st lucia': 'UVF',
    'jamaica': 'MBJ',
    'punta cana': 'PUJ',
    'hawaii': 'HNL',
    'maui': 'OGG',
    'bahamas': 'NAS',
    'aruba': 'AUA',
    'turks': 'PLS',
    'costa rica': 'SJO',
    'puerto rico': 'SJU',
    'vegas': 'LAS',
    'las vegas': 'LAS',
    'orlando': 'MCO',
    'miami': 'MIA',
    'new york': 'JFK',
    'paris': 'CDG',
    'london': 'LHR',
    'rome': 'FCO',
    'barcelona': 'BCN',
    'greece': 'ATH',
    'santorini': 'JTR',
    'bali': 'DPS',
    'maldives': 'MLE',
    'thailand': 'BKK',
    'mexico': 'MEX',
    'peru': 'LIM',
    'galapagos': 'GPS',
    'ecuador': 'UIO',
  };
  
  const text = (title + ' ' + summary).toLowerCase();
  
  for (const [keyword, code] of Object.entries(destinations)) {
    if (text.includes(keyword)) {
      // Capitalize destination name
      const destination = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { destination, destinationCode: code };
    }
  }
  
  // Extract location from title if no match
  const locationMatch = title.match(/--\s*(.+?)(?:\s+w\/|\s+escape|\s+getaway|\s+oceanview|\s+beachfront|\s+resort|,|\$)/i);
  if (locationMatch) {
    return { destination: locationMatch[1].trim(), destinationCode: '' };
  }
  
  return { destination: 'Various', destinationCode: '' };
}

function calculateValueScore(price: number, originalPrice: number, summary: string): number {
  const savingsPercent = ((originalPrice - price) / originalPrice) * 100;
  
  let score = 50; // Base score
  
  // Savings bonus
  if (savingsPercent >= 50) score += 30;
  else if (savingsPercent >= 40) score += 25;
  else if (savingsPercent >= 30) score += 20;
  else if (savingsPercent >= 20) score += 10;
  
  // Luxury indicators
  const luxuryKeywords = ['all-inclusive', 'all drinks', 'breakfast included', 'spa', 'suite', 'oceanfront', 'oceanview', 'beachfront'];
  for (const keyword of luxuryKeywords) {
    if (summary.toLowerCase().includes(keyword)) {
      score += 3;
    }
  }
  
  // Price point bonus (good value at different tiers)
  if (price < 150) score += 5;
  else if (price < 300) score += 3;
  
  return Math.min(100, Math.max(0, score));
}

function isHotelDeal(entry: TravelzooEntry): boolean {
  const url = entry.link.toLowerCase();
  const title = entry.title.toLowerCase();
  const summary = entry.summary.toLowerCase();
  
  // URL patterns for hotel/getaway deals
  const hotelUrlPatterns = [
    '/local-deals/',
    '/getaway/',
    '/hotel/',
  ];
  
  // Exclude non-hotel content
  const excludePatterns = [
    '/entertainment/',
    '/cruises/',
    '/direct/cruises/',
    'river cruise',
    'cruise through',
    'expedition vessel',
  ];
  
  // Check exclusions first
  for (const pattern of excludePatterns) {
    if (url.includes(pattern) || title.includes(pattern) || summary.includes(pattern)) {
      return false;
    }
  }
  
  // Check for hotel patterns
  for (const pattern of hotelUrlPatterns) {
    if (url.includes(pattern)) {
      return true;
    }
  }
  
  // Content-based detection
  const hotelKeywords = ['hotel', 'resort', 'cottage', 'villa', 'suite', 'oceanview', 'beachfront', 'nights', 'stay'];
  for (const keyword of hotelKeywords) {
    if (title.includes(keyword) || summary.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

export async function scrapeTravelzoo(): Promise<ScrapeResult> {
  const deals: ScrapedDeal[] = [];
  const fetchedAt = new Date();
  
  try {
    const response = await fetch('https://www.travelzoo.com/feed/', {
      headers: {
        'User-Agent': 'NomadSteals/1.0 (travel deal aggregator)',
        'Accept': 'application/atom+xml, application/xml, text/xml',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Travelzoo feed returned ${response.status}`);
    }
    
    const xml = await response.text();
    
    // Parse Atom feed entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      
      const getId = (xml: string) => xml.match(/<id>([^<]+)<\/id>/)?.[1] || '';
      const getTitle = (xml: string) => {
        const match = xml.match(/<title[^>]*>([^<]+)<\/title>/);
        return match ? match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
      };
      const getSummary = (xml: string) => {
        const match = xml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
        return match ? match[1].replace(/<br>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '') : '';
      };
      const getLink = (xml: string) => xml.match(/<link[^>]*href="([^"]+)"/)?.[1] || '';
      const getPublished = (xml: string) => xml.match(/<published>([^<]+)<\/published>/)?.[1] || '';
      
      const entry: TravelzooEntry = {
        id: getId(entryXml),
        title: getTitle(entryXml),
        summary: getSummary(entryXml),
        link: getLink(entryXml),
        published: getPublished(entryXml),
      };
      
      // Filter for hotel/getaway deals only
      if (!isHotelDeal(entry)) {
        continue;
      }
      
      const { price, originalPrice } = parsePrice(entry.title);
      if (price === 0) continue; // Skip if we can't parse price
      
      const { destination, destinationCode } = parseDestination(entry.title, entry.summary);
      const savingsPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
      const valueScore = calculateValueScore(price, originalPrice, entry.summary);
      
      // Create unique ID from URL
      const urlParts = entry.link.split('/');
      const dealId = `travelzoo-${urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || Date.now()}`;
      
      deals.push({
        id: dealId,
        source: 'travelzoo' as any,
        title: entry.title,
        origin: 'Various US Cities',
        originCode: '',
        destination,
        destinationCode,
        price,
        originalPrice,
        currency: 'USD',
        originalUrl: entry.link,
        imageUrl: undefined, // Travelzoo feed doesn't include images
        postedAt: new Date(entry.published),
        scrapedAt: fetchedAt,
        isRoundtrip: false, // Hotels don't have roundtrip
        airline: undefined,
        valueScore,
        savingsPercent,
        isHotDeal: savingsPercent >= 40 || valueScore >= 75,
        description: entry.summary.substring(0, 500),
        tags: ['hotel', 'resort', destination.toLowerCase()],
      });
    }
    
    console.log(`[Travelzoo] Scraped ${deals.length} hotel deals`);
    
    return {
      deals,
      source: 'travelzoo' as any,
      fetchedAt,
    };
  } catch (error) {
    console.error('[Travelzoo] Scrape error:', error);
    return {
      deals: [],
      source: 'travelzoo' as any,
      fetchedAt,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default scrapeTravelzoo;
