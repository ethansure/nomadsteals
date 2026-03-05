// GET/POST /api/subscribe/unsubscribe?token=xxx - Unsubscribe user

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe, getSubscriptionByUnsubscribeToken } from '@/lib/subscriptions';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nomadsteals.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/newsletter?error=missing-token`);
    }
    
    // Check if subscription exists
    const subscription = await getSubscriptionByUnsubscribeToken(token);
    if (!subscription) {
      return NextResponse.redirect(`${BASE_URL}/newsletter?error=already-unsubscribed`);
    }
    
    // Unsubscribe
    const success = await unsubscribe(token);
    
    if (!success) {
      return NextResponse.redirect(`${BASE_URL}/newsletter?error=unsubscribe-failed`);
    }
    
    // Redirect to unsubscribed confirmation
    return NextResponse.redirect(`${BASE_URL}/newsletter/unsubscribed`);
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.redirect(`${BASE_URL}/newsletter?error=server-error`);
  }
}

// POST for API-style unsubscribe
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');
    
    // Also check body for token
    if (!token) {
      const body = await request.json().catch(() => ({}));
      token = body.token;
    }
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 400 }
      );
    }
    
    const success = await unsubscribe(token);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    console.error('[Unsubscribe POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
