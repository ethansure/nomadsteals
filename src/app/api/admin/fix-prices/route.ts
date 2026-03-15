// GET /api/admin/fix-prices - Fix corrupt currentPrice values by parsing from title
// One-time migration endpoint

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

// Extract price from title like "$174 USD" or "$620 RT" or "€328" or "£435"
function extractPriceFromTitle(title: string): number | null {
  // Match various currency formats
  const priceMatch = title.match(/[$€£](\d{2,4})(?:\s*(USD|CAD|EUR|GBP))?/i);
  if (priceMatch) {
    const price = parseInt(priceMatch[1], 10);
    let currency = 'USD';
    
    // Determine currency
    if (title.includes('€')) currency = 'EUR';
    else if (title.includes('£')) currency = 'GBP';
    else if (title.includes('CAD')) currency = 'CAD';
    else if (priceMatch[2]) currency = priceMatch[2].toUpperCase();
    
    // Convert to USD
    const toUsdRate: Record<string, number> = { USD: 1, CAD: 0.74, EUR: 1.08, GBP: 1.27 };
    return Math.round(price * (toUsdRate[currency] || 1));
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all deals
    const { rows: deals } = await sql`
      SELECT id, title, current_price FROM deals
    `;
    
    const fixes: Array<{ id: string; title: string; oldPrice: number; newPrice: number }> = [];
    
    for (const deal of deals) {
      const titlePrice = extractPriceFromTitle(deal.title);
      
      if (titlePrice && Math.abs(titlePrice - deal.current_price) > 10) {
        // Price mismatch > $10, needs fixing
        fixes.push({
          id: deal.id,
          title: deal.title,
          oldPrice: deal.current_price,
          newPrice: titlePrice,
        });
        
        // Update the deal
        await sql`
          UPDATE deals 
          SET current_price = ${titlePrice},
              updated_at = NOW()
          WHERE id = ${deal.id}
        `;
      }
    }
    
    // Invalidate KV cache
    if (process.env.KV_REST_API_URL) {
      try {
        const { kv } = await import('@vercel/kv');
        await kv.del('deals:top50', 'deals:stats');
      } catch (e) {
        console.log('KV cache clear failed (non-critical):', e);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixes.length} deals with corrupt prices`,
      fixes,
    });
  } catch (error) {
    console.error('[FixPrices] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
