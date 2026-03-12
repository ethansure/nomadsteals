// POST /api/deals/[id]/view - Increment view count

import { NextRequest, NextResponse } from 'next/server';
import * as postgres from '@/lib/db/postgres';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!postgres.isConfigured()) {
      return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    const views = await postgres.incrementViews(id);

    return NextResponse.json({
      success: true,
      views,
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
