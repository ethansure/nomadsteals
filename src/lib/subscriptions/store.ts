// Subscription Storage - JSON file based for MVP
// Can be upgraded to Vercel KV / Upstash Redis later

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  Subscription, 
  SubscriptionCreateInput, 
  SubscriptionUpdateInput,
  DEFAULT_PREFERENCES 
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure data directory and file exist
async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  try {
    await fs.access(SUBSCRIPTIONS_FILE);
  } catch {
    await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify([], null, 2));
  }
}

// Read all subscriptions
export async function getAllSubscriptions(): Promise<Subscription[]> {
  await ensureDataFile();
  const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Write all subscriptions
async function saveAllSubscriptions(subscriptions: Subscription[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
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
  const subscriptions = await getAllSubscriptions();
  const index = subscriptions.findIndex(s => s.unsubscribeToken === token);
  
  if (index === -1) return false;
  
  subscriptions.splice(index, 1);
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
