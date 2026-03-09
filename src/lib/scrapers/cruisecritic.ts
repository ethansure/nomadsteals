// CruiseCritic Cruise Deals Scraper
// Scrapes deal data from https://www.cruisecritic.com/cruise-deals

import * as cheerio from 'cheerio';
import { ScrapedDeal, ScraperSource } from './types';

const DEALS_URL = 'https://www.cruisecritic.com/cruise-deals';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Additional headers to bypass Cloudflare
const BROWSER_HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

// Cruise line logos/images
const CRUISE_LINE_IMAGES: Record<string, string> = {
  'carnival': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
  'royal caribbean': 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800',
  'norwegian': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
  'princess': 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=800',
  'holland america': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  'celebrity': 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=800',
  'msc': 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800',
  'viking': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
  'disney': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
  'default': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
};

// Destination images
const DESTINATION_IMAGES: Record<string, string> = {
  'caribbean': 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=800',
  'alaska': 'https://images.unsplash.com/photo-1531176175280-1c97b0ff2b0f?w=800',
  'mediterranean': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800',
  'europe': 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800',
  'bahamas': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
  'mexico': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800',
  'hawaii': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
  'bermuda': 'https://images.unsplash.com/photo-1580541631950-7282082b53ce?w=800',
  'canada': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800',
  'canada & new england': 'https://images.unsplash.com/photo-1494791368093-85217fbbf8de?w=800',
  'new england': 'https://images.unsplash.com/photo-1494791368093-85217fbbf8de?w=800',
  'pacific': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'pacific coastal': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'british columbia': 'https://images.unsplash.com/photo-1531176175280-1c97b0ff2b0f?w=800',
  'norway': 'https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=800',
  'default': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
};

// Average cruise prices by destination for value calculation (per 7-night cruise)
const AVG_CRUISE_PRICES: Record<string, number> = {
  'caribbean': 1200,
  'alaska': 1800,
  'mediterranean': 2500,
  'europe': 2200,
  'bahamas': 800,
  'mexico': 900,
  'hawaii': 2000,
  'bermuda': 1100,
  'canada': 1600,
  'canada & new england': 1600,
  'pacific': 1000,
  'pacific coastal': 1000,
  'british columbia': 1400,
  'norway': 2800,
  'default': 1500,
};

interface CruiseDeal {
  title: string;
  price: number;
  originalPrice?: number;
  destination: string;
  cruiseLine: string;
  nights?: number;
  departurePort?: string;
  travelDates?: string;
  url: string;
  isLastMinute: boolean;
  isLuxury: boolean;
  rank?: number;
}

// Parse price from string like "$1,409 pp" or "from $639"
function parsePrice(text: string): number | null {
  const match = text.match(/\$([0-9,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

// Extract nights from title like "7-Nt." or "7 Night"
function extractNights(title: string): number | null {
  const match = title.match(/(\d+)[\s-]?(?:Nt\.?|Night)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Get image URL for destination
function getDestinationImage(destination: string): string {
  const lower = destination.toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (lower.includes(key)) {
      return url;
    }
  }
  return DESTINATION_IMAGES['default'];
}

// Get average price for destination
function getAvgPrice(destination: string): number {
  const lower = destination.toLowerCase();
  for (const [key, price] of Object.entries(AVG_CRUISE_PRICES)) {
    if (lower.includes(key)) {
      return price;
    }
  }
  return AVG_CRUISE_PRICES['default'];
}

// Calculate value score
function calculateValueScore(price: number, destination: string, nights: number | null, isLuxury: boolean): number {
  const avgPrice = getAvgPrice(destination);
  const nightsMultiplier = nights ? nights / 7 : 1; // Normalize to 7-night cruise
  const adjustedAvg = avgPrice * nightsMultiplier;
  
  // Base savings calculation
  const savings = ((adjustedAvg - price) / adjustedAvg) * 100;
  
  // Start with base score
  let score = 50 + savings * 0.6;
  
  // Luxury cruises get a slight boost for their value proposition
  if (isLuxury) {
    score += 5;
  }
  
  // Clamp between 40-100
  return Math.round(Math.min(100, Math.max(40, score)));
}

// Generate tags for cruise deal
function generateTags(destination: string, cruiseLine: string, isLastMinute: boolean, isLuxury: boolean): string[] {
  const tags: string[] = ['cruise'];
  const destLower = destination.toLowerCase();
  
  // Destination tags
  if (destLower.includes('caribbean')) tags.push('caribbean', 'beach', 'tropical');
  if (destLower.includes('alaska') || destLower.includes('british columbia')) tags.push('alaska', 'wildlife', 'scenic', 'glaciers');
  if (destLower.includes('mediterranean') || destLower.includes('europe') || destLower.includes('iberian')) tags.push('europe', 'cultural');
  if (destLower.includes('bahamas')) tags.push('bahamas', 'beach');
  if (destLower.includes('mexico')) tags.push('mexico', 'beach');
  if (destLower.includes('hawaii')) tags.push('hawaii', 'tropical', 'beach');
  if (destLower.includes('norway') || destLower.includes('fjord') || destLower.includes('arctic')) tags.push('norway', 'fjords', 'scenic');
  if (destLower.includes('bermuda')) tags.push('bermuda', 'beach');
  if (destLower.includes('canada') || destLower.includes('new england') || destLower.includes('quebec')) tags.push('fall-foliage', 'scenic');
  if (destLower.includes('pacific coastal') || destLower.includes('wine country')) tags.push('pacific', 'scenic', 'wine');
  
  // Cruise line tags
  const lineLower = cruiseLine.toLowerCase();
  if (lineLower.includes('disney')) tags.push('family');
  if (lineLower.includes('viking') || lineLower.includes('regent') || lineLower.includes('silversea')) {
    tags.push('luxury', 'premium');
  }
  if (lineLower.includes('carnival') || lineLower.includes('norwegian')) tags.push('fun', 'entertainment');
  if (lineLower.includes('holland america')) tags.push('classic', 'premium');
  if (lineLower.includes('princess')) tags.push('premium');
  if (lineLower.includes('royal caribbean')) tags.push('family', 'entertainment');
  if (lineLower.includes('celebrity')) tags.push('premium', 'modern');
  
  // Deal type tags
  if (isLastMinute) tags.push('last-minute');
  if (isLuxury) tags.push('luxury');
  
  return [...new Set(tags)]; // Remove duplicates
}

// Main scraper function
export async function scrapeCruiseCritic(maxDeals: number = 25): Promise<ScrapedDeal[]> {
  console.log('[CruiseCritic] Fetching cruise deals...');

  try {
    const response = await fetch(DEALS_URL, {
      headers: BROWSER_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const deals: ScrapedDeal[] = [];
    const now = new Date();

    // Parse deal cards - CruiseCritic uses various selectors
    // Look for deal entries with price and destination info
    $('a[href*="/cruise-deals/"]').each((_, element) => {
      if (deals.length >= maxDeals) return;
      
      const $el = $(element);
      const href = $el.attr('href') || '';
      
      // Skip navigation links
      if (href === '/cruise-deals' || href.includes('destinations') || href.includes('cruise-lines') || href.includes('styles')) {
        return;
      }
      
      // Try to find price and title
      const text = $el.text();
      const price = parsePrice(text);
      
      if (!price || price < 100) return; // Skip invalid prices
      
      // Extract deal info from text
      const titleMatch = text.match(/\$[\d,]+\s*pp\s*[—–-]\s*(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : text.trim().substring(0, 100);
      
      if (!title || title.length < 10) return;
      
      // Look for destination in nearby elements or text
      const parentText = $el.parent().text();
      let destination = 'Caribbean'; // Default
      
      // More specific destinations first, then general ones
      const destinationPatterns: [RegExp, string][] = [
        [/Canada\s*&?\s*New\s*England|New\s*England/i, 'Canada & New England'],
        [/Pacific\s*Coastal/i, 'Pacific Coastal'],
        [/British\s*Columbia/i, 'Alaska'], // BC cruises are Alaska-like
        [/Mediterranean/i, 'Mediterranean'],
        [/Alaska/i, 'Alaska'],
        [/Caribbean/i, 'Caribbean'],
        [/Bahamas/i, 'Bahamas'],
        [/Mexico|Mexican\s*Riviera/i, 'Mexico'],
        [/Hawaii/i, 'Hawaii'],
        [/Bermuda/i, 'Bermuda'],
        [/Norway|Fjord/i, 'Norway'],
        [/Europe/i, 'Europe'],
      ];
      
      const combinedText = parentText + ' ' + title;
      for (const [pattern, dest] of destinationPatterns) {
        if (pattern.test(combinedText)) {
          destination = dest;
          break;
        }
      }
      
      // Look for cruise line
      let cruiseLine = 'Various';
      const cruiseLines = ['Holland America', 'Carnival', 'Royal Caribbean', 'Norwegian', 'Princess', 'Celebrity', 'MSC', 'Viking', 'Disney'];
      for (const line of cruiseLines) {
        if (parentText.includes(line) || text.includes(line)) {
          cruiseLine = line;
          break;
        }
      }
      
      const nights = extractNights(title);
      const isLastMinute = text.toLowerCase().includes('last-minute') || parentText.toLowerCase().includes('last-minute');
      const isLuxury = text.toLowerCase().includes('luxury') || parentText.toLowerCase().includes('luxury');
      
      const avgPrice = getAvgPrice(destination) * (nights ? nights / 7 : 1);
      const valueScore = calculateValueScore(price, destination, nights, isLuxury);
      const savingsPercent = Math.round(Math.max(0, ((avgPrice - price) / avgPrice) * 100));
      
      const bookByDate = new Date();
      bookByDate.setDate(bookByDate.getDate() + 14);
      
      // Create unique ID from URL
      const urlSlug = href.split('/').pop() || '';
      const id = `cc-${Buffer.from(href).toString('base64').replace(/[+/=]/g, '').slice(-16)}`;
      
      deals.push({
        id,
        source: 'cruisecritic' as ScraperSource,
        title: `${nights ? `${nights}-Night ` : ''}${destination} Cruise - ${cruiseLine}`,
        origin: 'Various US Ports',
        originCode: undefined,
        destination,
        destinationCode: undefined,
        price,
        originalPrice: Math.round(avgPrice),
        currency: 'USD',
        originalUrl: href.startsWith('http') ? href : `https://www.cruisecritic.com${href}`,
        imageUrl: getDestinationImage(destination),
        postedAt: now,
        scrapedAt: now,
        isRoundtrip: true, // Cruises are always roundtrip
        airline: cruiseLine, // Using airline field for cruise line
        valueScore,
        savingsPercent,
        isHotDeal: valueScore >= 75 || savingsPercent >= 30 || isLastMinute,
        description: title,
        tags: generateTags(destination, cruiseLine, isLastMinute, isLuxury),
      });
    });

    // If we didn't get enough deals from links, try parsing text patterns
    if (deals.length < 5) {
      console.log('[CruiseCritic] Trying alternative parsing...');
      
      // Look for price patterns in page text
      const pageText = $('body').text();
      const pricePattern = /\$(\d{1,2},?\d{3})\s*pp\s*[—–-]\s*([^$\n]{10,80})/g;
      let match;
      
      while ((match = pricePattern.exec(pageText)) !== null && deals.length < maxDeals) {
        const price = parseInt(match[1].replace(',', ''), 10);
        const title = match[2].trim();
        
        if (price < 100 || price > 10000) continue;
        
        // Determine destination from title using same patterns
        let destination = 'Caribbean';
        const destinationPatterns: [RegExp, string][] = [
          [/Canada\s*&?\s*New\s*England|New\s*England|Quebec|Québec/i, 'Canada & New England'],
          [/Pacific\s*Coastal|Wine\s*Country/i, 'Pacific Coastal'],
          [/British\s*Columbia/i, 'Alaska'],
          [/Mediterranean/i, 'Mediterranean'],
          [/Alaska|Glacier|Denali/i, 'Alaska'],
          [/Caribbean/i, 'Caribbean'],
          [/Bahamas/i, 'Bahamas'],
          [/Mexico|Mexican\s*Riviera/i, 'Mexico'],
          [/Hawaii/i, 'Hawaii'],
          [/Bermuda/i, 'Bermuda'],
          [/Norway|Fjord|Arctic/i, 'Norway'],
          [/Europe|Iberian/i, 'Europe'],
        ];
        
        for (const [pattern, dest] of destinationPatterns) {
          if (pattern.test(title)) {
            destination = dest;
            break;
          }
        }
        
        const nights = extractNights(title);
        const avgPrice = getAvgPrice(destination) * (nights ? nights / 7 : 1);
        const valueScore = calculateValueScore(price, destination, nights, false);
        const savingsPercent = Math.round(Math.max(0, ((avgPrice - price) / avgPrice) * 100));
        
        const id = `cc-${Buffer.from(title).toString('base64').replace(/[+/=]/g, '').slice(-16)}`;
        
        // Check for duplicate
        if (deals.some(d => d.id === id)) continue;
        
        deals.push({
          id,
          source: 'cruisecritic' as ScraperSource,
          title: title.substring(0, 80),
          origin: 'Various US Ports',
          originCode: undefined,
          destination,
          destinationCode: undefined,
          price,
          originalPrice: Math.round(avgPrice),
          currency: 'USD',
          originalUrl: DEALS_URL,
          imageUrl: getDestinationImage(destination),
          postedAt: now,
          scrapedAt: now,
          isRoundtrip: true,
          airline: undefined,
          valueScore,
          savingsPercent,
          isHotDeal: valueScore >= 75 || savingsPercent >= 30,
          description: title,
          tags: generateTags(destination, '', false, false),
        });
      }
    }

    console.log(`[CruiseCritic] Extracted ${deals.length} cruise deals`);
    return deals;
  } catch (error) {
    console.error('[CruiseCritic] Error:', error);
    throw error;
  }
}
