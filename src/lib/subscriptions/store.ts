// Subscription Storage - Using Postgres (permanent storage)
// Same database as deals - no additional services needed

import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { 
  Subscription, 
  SubscriptionCreateInput, 
  SubscriptionUpdateInput,
  DEFAULT_PREFERENCES 
} from './types';

// Check if Postgres is configured
function isConfigured(): boolean {
  return !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

// Initialize subscriptions table
export async function initSubscriptionsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      verification_token VARCHAR(255),
      unsubscribe_token VARCHAR(255) NOT NULL,
      preferences JSONB DEFAULT '{}',
      sent_deal_ids JSONB DEFAULT '[]',
      last_email_sent TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_subs_email ON subscriptions(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subs_verify_token ON subscriptions(verification_token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subs_unsub_token ON subscriptions(unsubscribe_token)`;
  console.log('[Subscriptions] Table initialized');
}

// Convert DB row to Subscription object
function rowToSubscription(row: Record<string, unknown>): Subscription {
  const prefs = row.preferences as Record<string, unknown> | null;
  return {
    id: row.id as string,
    email: row.email as string,
    verified: row.verified as boolean,
    verificationToken: row.verification_token as string | undefined,
    unsubscribeToken: row.unsubscribe_token as string,
    preferences: { ...DEFAULT_PREFERENCES, ...prefs },
    sentDealIds: (row.sent_deal_ids as string[]) || [],
    lastEmailSent: row.last_email_sent as string | undefined,
    createdAt: (row.created_at as Date)?.toISOString() || new Date().toISOString(),
    updatedAt: (row.updated_at as Date)?.toISOString() || new Date().toISOString(),
  };
}

// Read all subscriptions
export async function getAllSubscriptions(): Promise<Subscription[]> {
  if (!isConfigured()) return [];
  
  try {
    const result = await sql`SELECT * FROM subscriptions ORDER BY created_at DESC`;
    return result.rows.map(rowToSubscription);
  } catch (error) {
    // Table might not exist yet
    console.error('[Subscriptions] getAllSubscriptions error:', error);
    return [];
  }
}

// Get subscription by email
export async function getSubscriptionByEmail(email: string): Promise<Subscription | null> {
  if (!isConfigured()) return null;
  
  try {
    const result = await sql`
      SELECT * FROM subscriptions WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `;
    return result.rows[0] ? rowToSubscription(result.rows[0]) : null;
  } catch {
    return null;
  }
}

// Get subscription by ID
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  if (!isConfigured()) return null;
  
  try {
    const result = await sql`SELECT * FROM subscriptions WHERE id = ${id} LIMIT 1`;
    return result.rows[0] ? rowToSubscription(result.rows[0]) : null;
  } catch {
    return null;
  }
}

// Get subscription by verification token
export async function getSubscriptionByVerificationToken(token: string): Promise<Subscription | null> {
  if (!isConfigured()) return null;
  
  try {
    const result = await sql`
      SELECT * FROM subscriptions WHERE verification_token = ${token} LIMIT 1
    `;
    return result.rows[0] ? rowToSubscription(result.rows[0]) : null;
  } catch {
    return null;
  }
}

// Get subscription by unsubscribe token
export async function getSubscriptionByUnsubscribeToken(token: string): Promise<Subscription | null> {
  if (!isConfigured()) return null;
  
  try {
    const result = await sql`
      SELECT * FROM subscriptions WHERE unsubscribe_token = ${token} LIMIT 1
    `;
    return result.rows[0] ? rowToSubscription(result.rows[0]) : null;
  } catch {
    return null;
  }
}

// Create new subscription
export async function createSubscription(input: SubscriptionCreateInput): Promise<Subscription> {
  if (!isConfigured()) {
    throw new Error('Database not configured');
  }

  // Ensure table exists
  await initSubscriptionsTable();
  
  const id = uuidv4();
  const email = input.email.toLowerCase().trim();
  const verificationToken = uuidv4();
  const unsubscribeToken = uuidv4();
  const preferences = { ...DEFAULT_PREFERENCES, ...input.preferences };
  
  try {
    await sql`
      INSERT INTO subscriptions (id, email, verification_token, unsubscribe_token, preferences)
      VALUES (${id}, ${email}, ${verificationToken}, ${unsubscribeToken}, ${JSON.stringify(preferences)})
    `;
    
    return {
      id,
      email,
      verified: false,
      verificationToken,
      unsubscribeToken,
      preferences,
      sentDealIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      throw new Error('Email already subscribed');
    }
    throw error;
  }
}

// Verify subscription
export async function verifySubscription(token: string): Promise<Subscription | null> {
  if (!isConfigured()) return null;
  
  try {
    const result = await sql`
      UPDATE subscriptions 
      SET verified = TRUE, verification_token = NULL, updated_at = NOW()
      WHERE verification_token = ${token}
      RETURNING *
    `;
    return result.rows[0] ? rowToSubscription(result.rows[0]) : null;
  } catch {
    return null;
  }
}

// Update subscription preferences
export async function updateSubscription(
  unsubscribeToken: string, 
  input: SubscriptionUpdateInput
): Promise<Subscription | null> {
  if (!isConfigured()) return null;
  
  try {
    // Get current subscription
    const current = await getSubscriptionByUnsubscribeToken(unsubscribeToken);
    if (!current) return null;
    
    const newPreferences = { ...current.preferences, ...input.preferences };
    
    const result = await sql`
      UPDATE subscriptions 
      SET preferences = ${JSON.stringify(newPreferences)}, updated_at = NOW()
      WHERE unsubscribe_token = ${unsubscribeToken}
      RETURNING *
    `;
    return result.rows[0] ? rowToSubscription(result.rows[0]) : null;
  } catch {
    return null;
  }
}

// Unsubscribe
export async function unsubscribe(token: string): Promise<boolean> {
  if (!isConfigured()) return false;
  
  try {
    const result = await sql`
      DELETE FROM subscriptions WHERE unsubscribe_token = ${token}
    `;
    return (result.rowCount || 0) > 0;
  } catch {
    return false;
  }
}

// Get verified subscriptions (for sending emails)
export async function getVerifiedSubscriptions(): Promise<Subscription[]> {
  if (!isConfigured()) return [];
  
  try {
    const result = await sql`
      SELECT * FROM subscriptions WHERE verified = TRUE ORDER BY created_at DESC
    `;
    return result.rows.map(rowToSubscription);
  } catch {
    return [];
  }
}

// Mark deal as sent to subscriber
export async function markDealSent(subscriptionId: string, dealId: string): Promise<void> {
  if (!isConfigured()) return;
  
  try {
    // Get current sent_deal_ids and append
    const result = await sql`SELECT sent_deal_ids FROM subscriptions WHERE id = ${subscriptionId}`;
    const currentIds = (result.rows[0]?.sent_deal_ids as string[]) || [];
    
    if (!currentIds.includes(dealId)) {
      const newIds = [...currentIds.slice(-499), dealId]; // Keep last 500
      await sql`
        UPDATE subscriptions 
        SET sent_deal_ids = ${JSON.stringify(newIds)}, last_email_sent = NOW(), updated_at = NOW()
        WHERE id = ${subscriptionId}
      `;
    }
  } catch (error) {
    console.error('[Subscriptions] markDealSent error:', error);
  }
}

// Clear old sent deal IDs (keep last 500) - now handled in markDealSent
export async function cleanupSentDealIds(): Promise<void> {
  // No-op - cleanup is done inline in markDealSent
}
