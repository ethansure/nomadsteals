// GET /api/admin/fix-titles - Normalize titles to match USD currentPrice
// Fixes deals where title has non-USD currency but currentPrice is already USD

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

// Check if title has non-USD currency symbol
function hasNonUsdCurrency(title: string): boolean {
  return title.includes('€') || title.includes('£') || title.includes('CAD');
}

// Replace currency price in title with USD price
function normalizeTitlePrice(title: string, usdPrice: number): string {
  // Replace €328, £435, $356 CAD patterns with $usdPrice
  return title.replace(/[$€£](\d{2,4})(?:\s*(USD|CAD|EUR|GBP))?/i, `$${usdPrice}`);
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all deals with non-USD currency in title
    const { rows: deals } = await sql`
      SELECT id, title, current_price FROM deals
      WHERE title LIKE '%€%' OR title LIKE '%£%' OR title LIKE '%CAD%'
    `;
    
    const fixes: Array<{ id: string; oldTitle: string; newTitle: string; price: number }> = [];
    
    for (const deal of deals) {
      if (!hasNonUsdCurrency(deal.title)) continue;
      
      const newTitle = normalizeTitlePrice(deal.title, deal.current_price);
      
      if (newTitle !== deal.title) {
        fixes.push({
          id: deal.id,
          oldTitle: deal.title,
          newTitle: newTitle,
          price: deal.current_price,
        });
        
        // Update the deal title
        await sql`
          UPDATE deals 
          SET title = ${newTitle},
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
      message: `Normalized ${fixes.length} deal titles to USD`,
      totalChecked: deals.length,
      fixes,
    });
  } catch (error) {
    console.error('[FixTitles] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
