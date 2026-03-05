// GET /api/cron/refresh - Vercel Cron job endpoint
// This runs daily at 6 AM UTC to refresh deals

import { NextRequest, NextResponse } from 'next/server';
import { aggregateDeals } from '@/lib/api/deal-aggregator';
import { removeExpiredDeals } from '@/lib/api/deals-store';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for the cron job

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In production, require the cron secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('[Cron] Unauthorized request attempted');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    console.log('[Cron] Starting daily deal refresh...');
    const startTime = Date.now();
    
    // First, remove expired deals
    const removedCount = await removeExpiredDeals();
    console.log(`[Cron] Removed ${removedCount} expired deals`);
    
    // Then, fetch new deals
    const result = await aggregateDeals({
      maxDealsPerSource: 40,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Daily refresh completed',
      stats: {
        ...result.stats,
        removedExpired: removedCount,
        durationMs: duration,
      },
      sources: result.sources,
      errors: result.errors,
      fetchedAt: result.fetchedAt,
    });
  } catch (error) {
    console.error('[Cron] Error during daily refresh:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh deals',
      },
      { status: 500 }
    );
  }
}
