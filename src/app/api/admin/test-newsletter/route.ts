// POST /api/admin/test-newsletter - Send test newsletter to specific email
// For testing purposes only

import { NextRequest, NextResponse } from 'next/server';
import { getDeals } from '@/lib/api/deals-store';
import { sendEmail } from '@/lib/email/resend';
import { generateDailyNewsletterHtml } from '@/lib/email/daily-newsletter';

export async function POST(request: NextRequest) {
  try {
    const { email, secret } = await request.json();
    
    // Simple secret check (use CRON_SECRET or allow in dev)
    const adminSecret = process.env.CRON_SECRET || 'test';
    if (secret !== adminSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    // Get deals
    const allDeals = await getDeals();
    const deals = allDeals
      .filter(d => d.isHotDeal || d.valueScore >= 70)
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 5);
    
    if (deals.length === 0) {
      return NextResponse.json({ error: 'No deals available' }, { status: 400 });
    }
    
    // Generate and send email
    const html = generateDailyNewsletterHtml({
      deals,
      recipientEmail: email,
      unsubscribeToken: 'test-token',
    });
    
    const success = await sendEmail({
      to: email,
      subject: `✈️ ${deals.length} Hot Travel Deals - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      html,
    });
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test newsletter sent to ${email}`,
        dealsCount: deals.length,
      });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test Newsletter] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
