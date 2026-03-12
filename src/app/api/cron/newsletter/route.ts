// GET /api/cron/newsletter - Send newsletter to subscribers based on frequency
// Called by Vercel Cron:
//   - Daily at 8am PST for 'daily' subscribers
//   - Weekly on Mondays at 8am PST for 'weekly' subscribers
// Use ?frequency=daily or ?frequency=weekly to specify

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

  // Get frequency from query param (default: daily)
  const { searchParams } = new URL(request.url);
  const frequency = (searchParams.get('frequency') || 'daily') as 'instant' | 'daily' | 'weekly';
  
  // Validate frequency
  if (!['instant', 'daily', 'weekly'].includes(frequency)) {
    return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
  }

  console.log(`[Newsletter Cron] Starting ${frequency} newsletter...`);
  
  try {
    // Get deals (sorted by value score)
    const allDeals = await getDeals();
    
    // For weekly, get more deals; for daily/instant, get top deals
    const dealLimit = frequency === 'weekly' ? 30 : 20;
    const deals = allDeals
      .filter(d => d.isHotDeal || d.valueScore >= 70)
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, dealLimit);
    
    if (deals.length === 0) {
      console.log(`[Newsletter Cron] No deals available to send`);
      return NextResponse.json({
        success: true,
        message: 'No deals available to send',
        frequency,
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    console.log(`[Newsletter Cron] Found ${deals.length} deals for ${frequency} subscribers`);

    // Send newsletter to subscribers with matching frequency preference
    const result = await sendDailyNewsletter(deals, frequency);

    console.log(`[Newsletter Cron] ${frequency} complete: sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`);

    return NextResponse.json({
      success: true,
      message: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} newsletter sent`,
      frequency,
      ...result,
      dealsCount: deals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[Newsletter Cron] ${frequency} Error:`, error);
    return NextResponse.json(
      { 
        success: false, 
        frequency,
        error: error instanceof Error ? error.message : 'Failed to send newsletter' 
      },
      { status: 500 }
    );
  }
}
