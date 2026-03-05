// GET /api/subscribe/verify?token=xxx - Verify email address

import { NextRequest, NextResponse } from 'next/server';
import { verifySubscription, getSubscriptionByVerificationToken } from '@/lib/subscriptions';
import { sendWelcomeEmail } from '@/lib/email/resend';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nomadsteals.vercel.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/newsletter?error=missing-token`);
    }
    
    // Check if token exists
    const existing = await getSubscriptionByVerificationToken(token);
    if (!existing) {
      return NextResponse.redirect(`${BASE_URL}/newsletter?error=invalid-token`);
    }
    
    // Verify the subscription
    const subscription = await verifySubscription(token);
    
    if (!subscription) {
      return NextResponse.redirect(`${BASE_URL}/newsletter?error=verification-failed`);
    }
    
    // Send welcome email
    await sendWelcomeEmail(subscription.email, subscription.unsubscribeToken);
    
    // Redirect to success page
    return NextResponse.redirect(
      `${BASE_URL}/newsletter/verified?email=${encodeURIComponent(subscription.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'))}&token=${subscription.unsubscribeToken}`
    );
  } catch (error) {
    console.error('[Verify] Error:', error);
    return NextResponse.redirect(`${BASE_URL}/newsletter?error=server-error`);
  }
}
