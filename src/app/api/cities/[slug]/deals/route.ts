// GET /api/cities/[slug]/deals - Get deals for a specific city

import { NextRequest, NextResponse } from 'next/server';
import { getDealsForCity } from '@/lib/api/deals-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const deals = await getDealsForCity(slug);
    
    return NextResponse.json({
      success: true,
      city: slug,
      deals,
      total: deals.length,
    });
  } catch (error) {
    console.error('Error fetching city deals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch city deals' },
      { status: 500 }
    );
  }
}
