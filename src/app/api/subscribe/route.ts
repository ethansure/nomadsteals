// POST /api/subscribe - Create new subscription
// GET /api/subscribe - Get subscription by token (for preferences page)

import { NextRequest, NextResponse } from 'next/server';
import { 
  createSubscription, 
  getSubscriptionByEmail,
  getSubscriptionByUnsubscribeToken,
  SubscriptionPreferences,
  DEFAULT_PREFERENCES 
} from '@/lib/subscriptions';
import { sendVerificationEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, preferences } = body as { 
      email: string; 
      preferences?: Partial<SubscriptionPreferences>;
    };
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email required' },
        { status: 400 }
      );
    }
    
    // Check if already subscribed
    const existing = await getSubscriptionByEmail(email);
    if (existing) {
      if (existing.verified) {
        return NextResponse.json(
          { success: false, error: 'Email already subscribed' },
          { status: 400 }
        );
      } else {
        // Resend verification email
        if (existing.verificationToken) {
          await sendVerificationEmail(email, existing.verificationToken);
        }
        return NextResponse.json({
          success: true,
          message: 'Verification email resent. Please check your inbox.',
        });
      }
    }
    
    // Create new subscription
    const subscription = await createSubscription({
      email,
      preferences: preferences || {},
    });
    
    // Send verification email
    if (subscription.verificationToken) {
      await sendVerificationEmail(email, subscription.verificationToken);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Please check your email to verify your subscription.',
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

// GET subscription preferences by unsubscribe token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 400 }
      );
    }
    
    const subscription = await getSubscriptionByUnsubscribeToken(token);
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Return preferences (without sensitive data)
    return NextResponse.json({
      success: true,
      email: subscription.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      preferences: subscription.preferences,
      verified: subscription.verified,
      createdAt: subscription.createdAt,
    });
  } catch (error) {
    console.error('[Subscribe GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

// PUT - Update preferences
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { preferences } = body as { preferences: Partial<SubscriptionPreferences> };
    
    const subscription = await getSubscriptionByUnsubscribeToken(token);
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Import updateSubscription dynamically to avoid circular deps
    const { updateSubscription } = await import('@/lib/subscriptions/store');
    const updated = await updateSubscription(token, { preferences });
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updated.preferences,
    });
  } catch (error) {
    console.error('[Subscribe PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
