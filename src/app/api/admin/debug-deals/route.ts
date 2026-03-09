// Debug endpoint - show what the scraper produces
import { NextResponse } from 'next/server';
import { scrapeAllSources, convertScrapedDeals } from '@/lib/scrapers';
import * as postgres from '@/lib/db/postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    // Scrape just 2 deals from each source
    const scrapeResult = await scrapeAllSources({ maxDealsPerSource: 2 });
    const deals = convertScrapedDeals(scrapeResult.deals);

    // Try to insert each deal and track which fail
    const results: Array<{
      id: string;
      title: string;
      success: boolean;
      error?: string;
      // Sample of potentially problematic fields
      fields: {
        currentPrice: number | undefined;
        destinationCity: string | undefined;
        bookingUrl: string | undefined;
        descLength: number;
        titleLength: number;
      };
    }> = [];

    for (const deal of deals.slice(0, 5)) {
      try {
        const count = await postgres.upsertDeals([deal]);
        results.push({
          id: deal.id,
          title: deal.title.slice(0, 60),
          success: count > 0,
          fields: {
            currentPrice: deal.currentPrice,
            destinationCity: deal.destinationCity,
            bookingUrl: deal.bookingUrl?.slice(0, 50),
            descLength: deal.description?.length || 0,
            titleLength: deal.title?.length || 0,
          },
        });
      } catch (error) {
        results.push({
          id: deal.id,
          title: deal.title?.slice(0, 60) || '(no title)',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          fields: {
            currentPrice: deal.currentPrice,
            destinationCity: deal.destinationCity,
            bookingUrl: deal.bookingUrl?.slice(0, 50),
            descLength: deal.description?.length || 0,
            titleLength: deal.title?.length || 0,
          },
        });
      }
    }

    // Get final count
    const stats = await postgres.getStats();

    return NextResponse.json({
      scraped: scrapeResult.deals.length,
      converted: deals.length,
      tested: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      finalCount: stats.totalDeals,
      results,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
