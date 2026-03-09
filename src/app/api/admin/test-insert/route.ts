// Test endpoint - try inserting a single deal directly
import { NextResponse } from 'next/server';
import * as postgres from '@/lib/db/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  const testDeal = {
    id: `test-${Date.now()}`,
    type: 'flight' as const,
    title: 'Test Deal - Please Delete',
    description: 'This is a test deal for debugging',
    originalPrice: 500,
    currentPrice: 299,
    currency: 'USD',
    savingsPercent: 40,
    valueScore: 75,
    originCity: 'New York',
    originCode: 'JFK',
    destinationCity: 'London',
    destinationCode: 'LHR',
    bookByDate: '2026-04-01',
    travelWindow: 'Apr - Jun 2026',
    airline: 'Test Airline',
    bookingUrl: 'https://example.com/test-deal',
    imageUrl: 'https://example.com/image.jpg',
    source: 'Test Source',
    includes: ['Roundtrip'],
    restrictions: ['Non-refundable'],
    tags: ['test'],
    isHotDeal: true,
    isExpiringSoon: false,
    isHistoricLow: false,
    isActive: true,
    status: 'active' as const,
    postedAt: new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    views: 0,
    saves: 0,
    updatedAt: new Date().toISOString(),
  };

  try {
    const isConfigured = postgres.isConfigured();
    console.log('[TestInsert] Postgres configured:', isConfigured);
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Postgres not configured',
        envVars: {
          POSTGRES_URL: !!process.env.POSTGRES_URL,
          DATABASE_URL: !!process.env.DATABASE_URL,
        },
      });
    }

    console.log('[TestInsert] Attempting to upsert test deal...');
    const count = await postgres.upsertDeals([testDeal]);
    console.log('[TestInsert] Upsert result:', count);

    // Verify by reading back
    const stats = await postgres.getStats();
    
    return NextResponse.json({
      success: true,
      message: `Upserted ${count} deal(s)`,
      testDealId: testDeal.id,
      stats: {
        totalDeals: stats.totalDeals,
        activeDeals: stats.activeDeals,
      },
    });
  } catch (error) {
    console.error('[TestInsert] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
