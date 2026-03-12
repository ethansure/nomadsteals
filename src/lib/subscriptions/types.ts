// Subscription Types for NomadSteals

import { DealType } from '@/lib/types';

export type EmailFrequency = 'instant' | 'daily' | 'weekly';

export interface SubscriptionPreferences {
  // Origin preferences
  originCities: string[];      // e.g., ['San Francisco', 'Los Angeles']
  originRegions: string[];     // e.g., ['us-west']
  anyOrigin: boolean;          // true = don't filter by origin
  
  // Destination preferences  
  destinationCities: string[];  // e.g., ['Tokyo', 'Paris']
  destinationRegions: string[]; // e.g., ['asia-east', 'europe-west']
  anyDestination: boolean;
  
  // Deal type
  dealTypes: DealType[];
  
  // Price limits
  maxPrice?: number;           // e.g., 500
  
  // Frequency
  frequency: EmailFrequency;
  
  // Quality filter
  minValueScore?: number;      // e.g., 80 (only hot deals)
  hotDealsOnly: boolean;
}

export interface Subscription {
  id: string;
  email: string;
  createdAt: string;           // ISO date string
  updatedAt: string;
  preferences: SubscriptionPreferences;
  verified: boolean;
  verificationToken?: string;
  unsubscribeToken: string;
  lastEmailSent?: string;      // ISO date string
  sentDealIds: string[];       // Track deals we've already sent to avoid duplicates
}

export interface SubscriptionCreateInput {
  email: string;
  preferences: Partial<SubscriptionPreferences>;
}

export interface SubscriptionUpdateInput {
  preferences: Partial<SubscriptionPreferences>;
}

// Default preferences for new subscriptions
export const DEFAULT_PREFERENCES: SubscriptionPreferences = {
  originCities: [],
  originRegions: [],
  anyOrigin: true,
  destinationCities: [],
  destinationRegions: [],
  anyDestination: true,
  dealTypes: ['flight', 'hotel', 'package', 'cruise'],
  maxPrice: undefined,
  frequency: 'daily',
  minValueScore: undefined,
  hotDealsOnly: false,
};
