// Subscription Storage - Using Vercel KV / Upstash Redis
// Serverless-compatible (no filesystem access)

import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import { 
  Subscription, 
  SubscriptionCreateInput, 
  SubscriptionUpdateInput,
  DEFAULT_PREFERENCES 
} from './types';

// Redis keys
const KEYS = {
  ALL_SUBS: 'subs:all',
  BY_EMAIL: (email: string) => `subs:email:${email.toLowerCase()}`,
  BY_VERIFY_TOKEN: (token: string) => `subs:verify:${token}`,
  BY_UNSUB_TOKEN: (token: string) => `subs:unsub:${token}`,
};

// Singleton Redis client
let redis: Redis | null = null;

function getClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL || process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url) {
    console.warn('[Subscriptions] Redis not configured');
    return null;
  }

  try {
    if (url.startsWith('https://') && token) {
      redis = new Redis({ url, token });
    } else if (url.startsWith('redis')) {
      redis = Redis.fromEnv();
    } else {
      return null;
    }
    return redis;
  } catch (error) {
    console.error('[Subscriptions] Failed to create Redis client:', error);
    return null;
  }
}

// Read all subscriptions
export async function getAllSubscriptions(): Promise<Subscription[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const data = await client.get<Subscription[]>(KEYS.ALL_SUBS);
    return data || [];
  } catch (error) {
    console.error('[Subscriptions] getAllSubscriptions error:', error);
    return [];
  }
}

// Write all subscriptions
async function saveAllSubscriptions(subscriptions: Subscription[]): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.set(KEYS.ALL_SUBS, subscriptions);
    
    // Update lookup indexes
    for (const sub of subscriptions) {
      await client.set(KEYS.BY_EMAIL(sub.email), sub.id);
      if (sub.verificationToken) {
        await client.set(KEYS.BY_VERIFY_TOKEN(sub.verificationToken), sub.id);
      }
      if (sub.unsubscribeToken) {
        await client.set(KEYS.BY_UNSUB_TOKEN(sub.unsubscribeToken), sub.id);
      }
    }
  } catch (error) {
    console.error('[Subscriptions] saveAllSubscriptions error:', error);
  }
}

// Get subscription by email
export async function getSubscriptionByEmail(email: string): Promise<Subscription | null> {
  const subscriptions = await getAllSubscriptions();
  return subscriptions.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get subscription by ID
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const subscriptions = await getAllSubscriptions();
  return subscriptions.find(s => s.id === id) || null;
}

// Get subscription by verification token
export async function getSubscriptionByVerificationToken(token: string): Promise<Subscription | null> {
  const subscriptions = await getAllSubscriptions();
  return subscriptions.find(s => s.verificationToken === token) || null;
}

// Get subscription by unsubscribe token
export async function getSubscriptionByUnsubscribeToken(token: string): Promise<Subscription | null> {
  const subscriptions = await getAllSubscriptions();
  return subscriptions.find(s => s.unsubscribeToken === token) || null;
}

// Create new subscription
export async function createSubscription(input: SubscriptionCreateInput): Promise<Subscription> {
  const client = getClient();
  if (!client) {
    throw new Error('Newsletter service not configured');
  }

  const subscriptions = await getAllSubscriptions();
  
  // Check if email already exists
  const existing = subscriptions.find(s => s.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error('Email already subscribed');
  }
  
  const now = new Date().toISOString();
  const subscription: Subscription = {
    id: uuidv4(),
    email: input.email.toLowerCase().trim(),
    createdAt: now,
    updatedAt: now,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...input.preferences,
    },
    verified: false,
    verificationToken: uuidv4(),
    unsubscribeToken: uuidv4(),
    sentDealIds: [],
  };
  
  subscriptions.push(subscription);
  await saveAllSubscriptions(subscriptions);
  
  return subscription;
}

// Verify subscription
export async function verifySubscription(token: string): Promise<Subscription | null> {
  const subscriptions = await getAllSubscriptions();
  const index = subscriptions.findIndex(s => s.verificationToken === token);
  
  if (index === -1) return null;
  
  subscriptions[index].verified = true;
  subscriptions[index].verificationToken = undefined;
  subscriptions[index].updatedAt = new Date().toISOString();
  
  await saveAllSubscriptions(subscriptions);
  return subscriptions[index];
}

// Update subscription preferences
export async function updateSubscription(
  unsubscribeToken: string, 
  input: SubscriptionUpdateInput
): Promise<Subscription | null> {
  const subscriptions = await getAllSubscriptions();
  const index = subscriptions.findIndex(s => s.unsubscribeToken === unsubscribeToken);
  
  if (index === -1) return null;
  
  subscriptions[index].preferences = {
    ...subscriptions[index].preferences,
    ...input.preferences,
  };
  subscriptions[index].updatedAt = new Date().toISOString();
  
  await saveAllSubscriptions(subscriptions);
  return subscriptions[index];
}

// Unsubscribe
export async function unsubscribe(token: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const subscriptions = await getAllSubscriptions();
  const sub = subscriptions.find(s => s.unsubscribeToken === token);
  
  if (!sub) return false;

  const index = subscriptions.indexOf(sub);
  subscriptions.splice(index, 1);
  
  // Clean up indexes
  await client.del(KEYS.BY_EMAIL(sub.email));
  await client.del(KEYS.BY_UNSUB_TOKEN(token));
  
  await saveAllSubscriptions(subscriptions);
  return true;
}

// Get verified subscriptions (for sending emails)
export async function getVerifiedSubscriptions(): Promise<Subscription[]> {
  const subscriptions = await getAllSubscriptions();
  return subscriptions.filter(s => s.verified);
}

// Mark deal as sent to subscriber
export async function markDealSent(subscriptionId: string, dealId: string): Promise<void> {
  const subscriptions = await getAllSubscriptions();
  const index = subscriptions.findIndex(s => s.id === subscriptionId);
  
  if (index === -1) return;
  
  if (!subscriptions[index].sentDealIds.includes(dealId)) {
    subscriptions[index].sentDealIds.push(dealId);
  }
  subscriptions[index].lastEmailSent = new Date().toISOString();
  
  await saveAllSubscriptions(subscriptions);
}

// Clear old sent deal IDs (keep last 500)
export async function cleanupSentDealIds(): Promise<void> {
  const subscriptions = await getAllSubscriptions();
  let updated = false;
  
  for (const sub of subscriptions) {
    if (sub.sentDealIds.length > 500) {
      sub.sentDealIds = sub.sentDealIds.slice(-500);
      updated = true;
    }
  }
  
  if (updated) {
    await saveAllSubscriptions(subscriptions);
  }
}
