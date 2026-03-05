// GET /api/cron/refresh - Vercel Cron job endpoint
// This runs daily at 6 AM UTC to refresh deals and send email alerts

import { NextRequest, NextResponse } from 'next/server';
import { aggregateDeals } from '@/lib/api/deal-aggregator';
import { removeExpiredDeals } from '@/lib/api/deals-store';
import { processAlerts, sendWeeklyDigest, isWeeklyDigestDay } from '@/lib/email/send-alerts';

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
    
    // Process email alerts for subscribers
    let emailStats = { instant: { sent: 0, failed: 0, skipped: 0 }, daily: { sent: 0, failed: 0, skipped: 0 }, weekly: { sent: 0, failed: 0, skipped: 0 } };
    
    try {
      console.log('[Cron] Processing email alerts...');
      const alertResults = await processAlerts(result.deals);
      emailStats.instant = { sent: alertResults.instant.sent, failed: alertResults.instant.failed, skipped: alertResults.instant.skipped };
      emailStats.daily = { sent: alertResults.daily.sent, failed: alertResults.daily.failed, skipped: alertResults.daily.skipped };
      
      // Send weekly digest on Sundays
      if (isWeeklyDigestDay()) {
        console.log('[Cron] Sending weekly digests...');
        const weeklyResult = await sendWeeklyDigest(result.deals);
        emailStats.weekly = { sent: weeklyResult.sent, failed: weeklyResult.failed, skipped: weeklyResult.skipped };
      }
      
      console.log(`[Cron] Email alerts - Instant: ${emailStats.instant.sent} sent, Daily: ${emailStats.daily.sent} sent, Weekly: ${emailStats.weekly.sent} sent`);
    } catch (emailError) {
      console.error('[Cron] Error processing email alerts:', emailError);
    }
    
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
