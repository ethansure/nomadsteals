#!/usr/bin/env npx ts-node
// Daily Refresh Script for NomadSteals
// Runs scrapers, validates deals, and filters uncertain data
// Usage: npx ts-node scripts/daily-refresh.ts

import { scrapeAllSources, convertScrapedDeals } from '../src/lib/scrapers';
import { promises as fs } from 'fs';
import path from 'path';

interface ValidatedDeal {
  id: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  savingsPercent: number;
  valueScore: number;
  originCity: string;
  originCode?: string;
  destinationCity: string;
  destinationCode?: string;
  bookingUrl: string;
  source: string;
  airline?: string;
  imageUrl?: string;
  isHotDeal: boolean;
  isVerified: boolean;
  validationErrors: string[];
  [key: string]: unknown;
}

// Validate a single deal
function validateDeal(deal: ValidatedDeal): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!deal.title || deal.title.length < 10) {
    errors.push('Title too short or missing');
  }
  if (!deal.currentPrice || deal.currentPrice <= 0) {
    errors.push('Invalid price');
  }
  if (!deal.originCity) {
    errors.push('Missing origin city');
  }
  if (!deal.destinationCity) {
    errors.push('Missing destination city');
  }

  // Booking URL validation
  if (!deal.bookingUrl) {
    errors.push('Missing booking URL');
  } else {
    try {
      const url = new URL(deal.bookingUrl);
      // Don't accept generic Google Flights search links as valid deal links
      if (url.hostname === 'www.google.com' && url.pathname.includes('/travel/flights')) {
        errors.push('Generic Google Flights link - not a specific deal');
      }
    } catch {
      errors.push('Invalid booking URL format');
    }
  }

  // Source validation - only accept deals from known sources
  const validSources = ['The Flight Deal', 'Secret Flying', 'TravelPirates', 'Airfarewatchdog', 'Skiplagged'];
  if (!validSources.includes(deal.source)) {
    errors.push(`Unknown source: ${deal.source}`);
  }

  // Price sanity check
  if (deal.currentPrice > deal.originalPrice) {
    errors.push('Current price higher than original');
  }
  if (deal.savingsPercent < 0 || deal.savingsPercent > 95) {
    errors.push('Invalid savings percentage');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Verify booking URL is accessible (basic check)
async function verifyUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NomadSteals/1.0)',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 301 || response.status === 302;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 NomadSteals Daily Refresh');
  console.log('============================');
  console.log(`Time: ${new Date().toISOString()}\n`);

  const dataDir = path.join(process.cwd(), 'data');
  const dealsFile = path.join(dataDir, 'deals.json');
  const statsFile = path.join(dataDir, 'stats.json');
  const logFile = path.join(dataDir, 'refresh-log.json');

  // Ensure data directory exists
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  // Step 1: Scrape all sources
  console.log('📡 Step 1: Scraping deal sources...');
  const scrapeResult = await scrapeAllSources({
    maxDealsPerSource: 40,
    delayBetweenSources: 2000,
  });

  console.log(`   Found ${scrapeResult.deals.length} raw deals`);
  console.log(`   Sources: ${scrapeResult.sources.join(', ')}`);
  if (scrapeResult.errors.length > 0) {
    console.log(`   ⚠️ Errors: ${scrapeResult.errors.join(', ')}`);
  }

  // Step 2: Convert to app format
  console.log('\n🔄 Step 2: Converting deals...');
  const convertedDeals = convertScrapedDeals(scrapeResult.deals);
  console.log(`   Converted ${convertedDeals.length} deals`);

  // Step 3: Validate each deal
  console.log('\n✅ Step 3: Validating deals...');
  const validDeals: ValidatedDeal[] = [];
  const invalidDeals: { deal: ValidatedDeal; errors: string[] }[] = [];

  for (const deal of convertedDeals as ValidatedDeal[]) {
    const validation = validateDeal(deal);
    if (validation.valid) {
      deal.isVerified = true;
      deal.validationErrors = [];
      validDeals.push(deal);
    } else {
      deal.isVerified = false;
      deal.validationErrors = validation.errors;
      invalidDeals.push({ deal, errors: validation.errors });
    }
  }

  console.log(`   ✅ Valid: ${validDeals.length}`);
  console.log(`   ❌ Invalid: ${invalidDeals.length}`);

  // Step 4: Verify URLs for top deals (sample check)
  console.log('\n🔗 Step 4: Verifying booking URLs (sampling top 10)...');
  const topDeals = validDeals.slice(0, 10);
  let verifiedCount = 0;
  
  for (const deal of topDeals) {
    const isValid = await verifyUrl(deal.bookingUrl);
    if (isValid) {
      verifiedCount++;
    } else {
      console.log(`   ⚠️ URL check failed: ${deal.bookingUrl}`);
    }
  }
  console.log(`   URL verification: ${verifiedCount}/${topDeals.length} accessible`);

  // Step 5: Sort by value score
  validDeals.sort((a, b) => b.valueScore - a.valueScore);

  // Step 6: Save results
  console.log('\n💾 Step 5: Saving validated deals...');
  
  const dealsData = {
    deals: validDeals,
    lastUpdated: new Date().toISOString(),
    fetchedSources: scrapeResult.sources.map(s => {
      const names: Record<string, string> = {
        'secretflying': 'Secret Flying',
        'theflightdeal': 'The Flight Deal',
        'travelpirates': 'TravelPirates',
        'airfarewatchdog': 'Airfarewatchdog',
        'skiplagged': 'Skiplagged',
      };
      return names[s] || s;
    }),
    validation: {
      totalScraped: convertedDeals.length,
      totalValid: validDeals.length,
      totalInvalid: invalidDeals.length,
      invalidReasons: invalidDeals.map(d => ({
        title: d.deal.title,
        errors: d.errors,
      })),
    },
  };

  const statsData = {
    totalDeals: validDeals.length,
    avgSavings: validDeals.length > 0 
      ? Math.round(validDeals.reduce((acc, d) => acc + d.savingsPercent, 0) / validDeals.length)
      : 0,
    hotDeals: validDeals.filter(d => d.isHotDeal).length,
    updatedAt: new Date().toISOString(),
    sourceBreakdown: {
      'Secret Flying': validDeals.filter(d => d.source === 'Secret Flying').length,
      'The Flight Deal': validDeals.filter(d => d.source === 'The Flight Deal').length,
      'TravelPirates': validDeals.filter(d => d.source === 'TravelPirates').length,
      'Airfarewatchdog': validDeals.filter(d => d.source === 'Airfarewatchdog').length,
      'Skiplagged': validDeals.filter(d => d.source === 'Skiplagged').length,
    },
  };

  const logData = {
    timestamp: new Date().toISOString(),
    success: validDeals.length > 0,
    stats: {
      scraped: convertedDeals.length,
      valid: validDeals.length,
      invalid: invalidDeals.length,
      sources: scrapeResult.sources,
      errors: scrapeResult.errors,
    },
  };

  await fs.writeFile(dealsFile, JSON.stringify(dealsData, null, 2));
  await fs.writeFile(statsFile, JSON.stringify(statsData, null, 2));
  await fs.writeFile(logFile, JSON.stringify(logData, null, 2));

  console.log(`   Saved ${validDeals.length} deals to ${dealsFile}`);

  // Summary
  console.log('\n============================');
  console.log('📊 SUMMARY');
  console.log('============================');
  console.log(`Total deals: ${validDeals.length}`);
  console.log(`Hot deals: ${statsData.hotDeals}`);
  console.log(`Avg savings: ${statsData.avgSavings}%`);
  console.log(`Sources:`);
  Object.entries(statsData.sourceBreakdown).forEach(([source, count]) => {
    if (count > 0) console.log(`  - ${source}: ${count}`);
  });
  
  if (scrapeResult.errors.length > 0) {
    console.log(`\n⚠️ Scraping errors:`);
    scrapeResult.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n✅ Daily refresh complete!');
}

main().catch(console.error);
