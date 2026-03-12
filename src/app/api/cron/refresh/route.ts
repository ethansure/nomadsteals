// GET /api/cron/refresh - Vercel Cron job endpoint
// This runs daily at 6 AM UTC to refresh deals and send email alerts

import { NextRequest, NextResponse } from 'next/server';
import { aggregateDeals } from '@/lib/api/deal-aggregator';
import { removeExpiredDeals, markStaleDealsInactive } from '@/lib/api/deals-store';

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
    
    // First, archive expired deals
    const removedCount = await removeExpiredDeals();
    console.log(`[Cron] Archived ${removedCount} expired deals`);
    
    // Mark stale deals as inactive (not seen in last 24h)
    const staleCount = await markStaleDealsInactive();
    console.log(`[Cron] Marked ${staleCount} stale deals as inactive`);
    
    // Then, fetch new deals (will append/update, not overwrite)
    const result = await aggregateDeals({
      maxDealsPerSource: 40,
    });
    
    // Process INSTANT email alerts only (daily/weekly handled by newsletter cron)
    let emailStats = { instant: { sent: 0, failed: 0, skipped: 0 } };
    
    try {
      // Only send instant alerts for hot deals during hourly refresh
      // Daily and weekly newsletters are sent by /api/cron/newsletter at scheduled times
      const hotDeals = result.deals.filter(d => d.isHotDeal || d.valueScore >= 90);
      
      if (hotDeals.length > 0) {
        console.log(`[Cron] Processing instant alerts for ${hotDeals.length} hot deals...`);
        const { sendInstantAlerts } = await import('@/lib/email/send-alerts');
        const instantResult = await sendInstantAlerts(hotDeals);
        emailStats.instant = { sent: instantResult.sent, failed: instantResult.failed, skipped: instantResult.skipped };
        console.log(`[Cron] Instant alerts: ${emailStats.instant.sent} sent`);
      }
    } catch (emailError) {
      console.error('[Cron] Error processing instant alerts:', emailError);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Cron] Completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Daily refresh completed',
      stats: {
        ...result.stats,
        archivedExpired: removedCount,
        markedStale: staleCount,
        durationMs: duration,
      },
      emailStats,
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
