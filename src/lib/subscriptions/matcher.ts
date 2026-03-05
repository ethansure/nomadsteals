// Deal Matcher - Matches deals to subscriber preferences

import { Deal } from '@/lib/types';
import { Subscription, SubscriptionPreferences } from './types';
import { cityInRegion } from '@/lib/regions';

export interface MatchResult {
  subscription: Subscription;
  matchingDeals: Deal[];
}

// Check if a deal matches a subscription's preferences
export function dealMatchesPreferences(deal: Deal, prefs: SubscriptionPreferences): boolean {
  // Check deal type
  if (prefs.dealTypes.length > 0 && !prefs.dealTypes.includes(deal.type)) {
    return false;
  }
  
  // Check max price
  if (prefs.maxPrice && deal.currentPrice > prefs.maxPrice) {
    return false;
  }
  
  // Check min value score
  if (prefs.minValueScore && deal.valueScore < prefs.minValueScore) {
    return false;
  }
  
  // Check hot deals only
  if (prefs.hotDealsOnly && !deal.isHotDeal) {
    return false;
  }
  
  // Check origin (if not "any origin")
  if (!prefs.anyOrigin && deal.originCity) {
    const originMatches = 
      prefs.originCities.some(city => 
        deal.originCity?.toLowerCase().includes(city.toLowerCase()) ||
        deal.originCode?.toLowerCase() === city.toLowerCase()
      ) ||
      prefs.originRegions.some(region => 
        deal.originCity ? cityInRegion(deal.originCity, region) : false
      );
    
    if (!originMatches) {
      return false;
    }
  }
  
  // Check destination (if not "any destination")
  if (!prefs.anyDestination && deal.destinationCity) {
    const destMatches = 
      prefs.destinationCities.some(city => 
        deal.destinationCity.toLowerCase().includes(city.toLowerCase()) ||
        deal.destinationCode?.toLowerCase() === city.toLowerCase()
      ) ||
      prefs.destinationRegions.some(region => 
        cityInRegion(deal.destinationCity, region)
      );
    
    if (!destMatches) {
      return false;
    }
  }
  
  return true;
}

// Match deals to all subscribers
export function matchDealsToSubscribers(
  deals: Deal[], 
  subscriptions: Subscription[]
): MatchResult[] {
  const results: MatchResult[] = [];
  
  for (const subscription of subscriptions) {
    // Skip unverified subscriptions
    if (!subscription.verified) continue;
    
    // Find deals that match preferences AND haven't been sent before
    const matchingDeals = deals.filter(deal => 
      !subscription.sentDealIds.includes(deal.id) &&
      dealMatchesPreferences(deal, subscription.preferences)
    );
    
    if (matchingDeals.length > 0) {
      results.push({
        subscription,
        matchingDeals,
      });
    }
  }
  
  return results;
}

// Get instant alert subscribers (send immediately for hot deals)
export function getInstantAlertSubscribers(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter(
    s => s.verified && s.preferences.frequency === 'instant'
  );
}

// Get daily digest subscribers
export function getDailyDigestSubscribers(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter(
    s => s.verified && s.preferences.frequency === 'daily'
  );
}

// Get weekly digest subscribers
export function getWeeklyDigestSubscribers(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter(
    s => s.verified && s.preferences.frequency === 'weekly'
  );
}
