// GET /api/cron/newsletter - Send daily newsletter to subscribers
// Called by Vercel Cron at 8am PST daily

import { NextRequest, NextResponse } from 'next/server';
import { sendDailyNewsletter } from '@/lib/email/daily-newsletter';
import { getDeals } from '@/lib/api/deals-store';

// Verify cron secret to prevent unauthorized calls
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If no secret configured, allow (for development)
  if (!cronSecret) return true;
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Newsletter Cron] Starting daily newsletter...');
  
  try {
    // Get today's hot deals (sorted by value score)
    const allDeals = await getDeals();
    const deals = allDeals
      .filter(d => d.isHotDeal || d.valueScore >= 70)
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 20);
    
    if (deals.length === 0) {
      console.log('[Newsletter Cron] No deals available to send');
      return NextResponse.json({
        success: true,
        message: 'No deals available to send',
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    console.log(`[Newsletter Cron] Found ${deals.length} deals to send`);

    // Send newsletter to all verified subscribers
    const result = await sendDailyNewsletter(deals);

    console.log(`[Newsletter Cron] Complete: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`);

    return NextResponse.json({
      success: true,
      message: 'Daily newsletter sent',
      ...result,
      dealsCount: deals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Newsletter Cron] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send newsletter' 
      },
      { status: 500 }
    );
  }
}
