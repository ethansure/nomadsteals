// GET /api/subscribe/verify?token=xxx - Verify email address

import { NextRequest, NextResponse } from 'next/server';
import { verifySubscription, getSubscriptionByVerificationToken } from '@/lib/subscriptions';
import { sendWelcomeEmail } from '@/lib/email/resend';

function getBaseUrl(request: NextRequest): string {
  // Use env var if set, otherwise derive from request
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  // Get origin from request headers
  const host = request.headers.get('host') || 'www.nomadsteals.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    console.log('[Verify] Token:', token?.substring(0, 8) + '...');
    
    if (!token) {
      return NextResponse.redirect(`${baseUrl}/newsletter?error=missing-token`);
    }
    
    // Check if token exists
    const existing = await getSubscriptionByVerificationToken(token);
    console.log('[Verify] Found subscription:', !!existing);
    
    if (!existing) {
      return NextResponse.redirect(`${baseUrl}/newsletter?error=invalid-token`);
    }
    
    // Verify the subscription
    const subscription = await verifySubscription(token);
    console.log('[Verify] Verified:', !!subscription);
    
    if (!subscription) {
      return NextResponse.redirect(`${baseUrl}/newsletter?error=verification-failed`);
    }
    
    // Send welcome email
    await sendWelcomeEmail(subscription.email, subscription.unsubscribeToken);
    
    // Redirect to success page
    const maskedEmail = subscription.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    return NextResponse.redirect(
      `${baseUrl}/newsletter/verified?email=${encodeURIComponent(maskedEmail)}&token=${subscription.unsubscribeToken}`
    );
  } catch (error) {
    console.error('[Verify] Error:', error);
    return NextResponse.redirect(`${baseUrl}/newsletter?error=server-error`);
  }
}
