// Migration API - POST to migrate, GET for status, PUT for debug
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { migrateFromBlob, getMigrationStatus } from '@/lib/db/migrate';
import * as postgres from '@/lib/db/postgres';
import { scrapeAllSources, convertScrapedDeals } from '@/lib/scrapers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET - Check migration status
export async function GET() {
  try {
    const status = await getMigrationStatus();
    return NextResponse.json({
      success: true,
      status,
      envVars: {
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        DATABASE_URL: !!process.env.DATABASE_URL,
        NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
        NEON_POSTGRES_URL: !!process.env.NEON_POSTGRES_URL,
        REDIS_URL: !!process.env.REDIS_URL,
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

// POST - Run migration or reset
// ?reset=true to drop and recreate tables
// ?debug=true to test individual deal inserts
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';
    const debug = searchParams.get('debug') === 'true';
    
    if (reset) {
      await postgres.resetSchema();
      return NextResponse.json({
        success: true,
        message: 'Schema reset complete. Run scraper to populate data.',
      });
    }
    
    // Debug mode: scrape and test each deal individually
    if (debug) {
      const scrapeResult = await scrapeAllSources({ maxDealsPerSource: 3 });
      const deals = convertScrapedDeals(scrapeResult.deals);
      
      const results: Array<{
        id: string;
        title: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const deal of deals.slice(0, 6)) {
        try {
          const count = await postgres.upsertDeals([deal]);
          results.push({
            id: deal.id,
            title: deal.title.slice(0, 50),
            success: count > 0,
          });
        } catch (error) {
          results.push({
            id: deal.id,
            title: deal.title?.slice(0, 50) || '(no title)',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const stats = await postgres.getStats();
      return NextResponse.json({
        scraped: scrapeResult.deals.length,
        tested: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        finalCount: stats.totalDeals,
        results,
      });
    }
    
    const result = await migrateFromBlob();
    return NextResponse.json({
      success: result.errors.length === 0,
      result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
