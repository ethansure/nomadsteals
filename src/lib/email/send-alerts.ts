// Send Deal Alerts to Subscribers

import { Deal } from '@/lib/types';
import { 
  Subscription,
  getVerifiedSubscriptions, 
  matchDealsToSubscribers,
  markDealSent,
  cleanupSentDealIds,
  getInstantAlertSubscribers,
  getDailyDigestSubscribers,
  getWeeklyDigestSubscribers,
  dealMatchesPreferences,
} from '@/lib/subscriptions';
import { sendEmail } from './resend';
import { dealAlertEmailHtml, dailyDigestEmailHtml, weeklyDigestEmailHtml } from './templates';

export interface AlertSendResult {
  sent: number;
  failed: number;
  skipped: number;
  details: {
    email: string;
    dealCount: number;
    success: boolean;
    error?: string;
  }[];
}

// Send instant alerts for hot deals
export async function sendInstantAlerts(hotDeals: Deal[]): Promise<AlertSendResult> {
  const result: AlertSendResult = { sent: 0, failed: 0, skipped: 0, details: [] };
  
  if (hotDeals.length === 0) {
    console.log('[Alerts] No hot deals to send instant alerts for');
    return result;
  }
  
  const subscriptions = await getVerifiedSubscriptions();
  const instantSubscribers = getInstantAlertSubscribers(subscriptions);
  
  console.log(`[Alerts] Processing ${hotDeals.length} hot deals for ${instantSubscribers.length} instant subscribers`);
  
  for (const subscription of instantSubscribers) {
    // Find matching deals not yet sent
    const matchingDeals = hotDeals.filter(deal => 
      !subscription.sentDealIds.includes(deal.id) &&
      dealMatchesPreferences(deal, subscription.preferences)
    );
    
    if (matchingDeals.length === 0) {
      result.skipped++;
      continue;
    }
    
    // Send one email per hot deal (for instant alerts)
    for (const deal of matchingDeals.slice(0, 3)) { // Max 3 instant alerts at a time
      try {
        const html = dealAlertEmailHtml(deal, subscription.unsubscribeToken);
        const success = await sendEmail({
          to: subscription.email,
          subject: `🔥 Hot Deal: ${deal.title}`,
          html,
        });
        
        if (success) {
          await markDealSent(subscription.id, deal.id);
          result.sent++;
          result.details.push({ 
            email: subscription.email, 
            dealCount: 1, 
            success: true 
          });
        } else {
          result.failed++;
          result.details.push({ 
            email: subscription.email, 
            dealCount: 1, 
            success: false,
            error: 'Send failed' 
          });
        }
      } catch (error) {
        result.failed++;
        result.details.push({ 
          email: subscription.email, 
          dealCount: 1, 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }
  
  return result;
}

// Send daily digest emails
export async function sendDailyDigest(allDeals: Deal[]): Promise<AlertSendResult> {
  const result: AlertSendResult = { sent: 0, failed: 0, skipped: 0, details: [] };
  
  const subscriptions = await getVerifiedSubscriptions();
  const dailySubscribers = getDailyDigestSubscribers(subscriptions);
  
  console.log(`[Alerts] Processing daily digest for ${dailySubscribers.length} subscribers`);
  
  for (const subscription of dailySubscribers) {
    // Find matching deals not yet sent
    const matchingDeals = allDeals.filter(deal => 
      !subscription.sentDealIds.includes(deal.id) &&
      dealMatchesPreferences(deal, subscription.preferences)
    );
    
    if (matchingDeals.length === 0) {
      result.skipped++;
      continue;
    }
    
    // Sort by value score
    matchingDeals.sort((a, b) => b.valueScore - a.valueScore);
    
    try {
      const html = dailyDigestEmailHtml(matchingDeals, subscription.unsubscribeToken);
      const success = await sendEmail({
        to: subscription.email,
        subject: `✈️ ${matchingDeals.length} new deals match your preferences!`,
        html,
      });
      
      if (success) {
        // Mark all included deals as sent
        for (const deal of matchingDeals.slice(0, 5)) {
          await markDealSent(subscription.id, deal.id);
        }
        result.sent++;
        result.details.push({ 
          email: subscription.email, 
          dealCount: matchingDeals.length, 
          success: true 
        });
      } else {
        result.failed++;
        result.details.push({ 
          email: subscription.email, 
          dealCount: matchingDeals.length, 
          success: false,
          error: 'Send failed' 
        });
      }
    } catch (error) {
      result.failed++;
      result.details.push({ 
        email: subscription.email, 
        dealCount: matchingDeals.length, 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return result;
}

// Send weekly digest emails
export async function sendWeeklyDigest(allDeals: Deal[]): Promise<AlertSendResult> {
  const result: AlertSendResult = { sent: 0, failed: 0, skipped: 0, details: [] };
  
  const subscriptions = await getVerifiedSubscriptions();
  const weeklySubscribers = getWeeklyDigestSubscribers(subscriptions);
  
  console.log(`[Alerts] Processing weekly digest for ${weeklySubscribers.length} subscribers`);
  
  for (const subscription of weeklySubscribers) {
    // Find matching deals (include more for weekly)
    const matchingDeals = allDeals.filter(deal => 
      dealMatchesPreferences(deal, subscription.preferences)
    );
    
    if (matchingDeals.length === 0) {
      result.skipped++;
      continue;
    }
    
    // Sort by value score
    matchingDeals.sort((a, b) => b.valueScore - a.valueScore);
    
    try {
      const html = weeklyDigestEmailHtml(matchingDeals, subscription.unsubscribeToken);
      const success = await sendEmail({
        to: subscription.email,
        subject: `📬 Your weekly deals: ${matchingDeals.length} finds this week!`,
        html,
      });
      
      if (success) {
        // Mark top deals as sent
        for (const deal of matchingDeals.slice(0, 10)) {
          await markDealSent(subscription.id, deal.id);
        }
        result.sent++;
        result.details.push({ 
          email: subscription.email, 
          dealCount: matchingDeals.length, 
          success: true 
        });
      } else {
        result.failed++;
        result.details.push({ 
          email: subscription.email, 
          dealCount: matchingDeals.length, 
          success: false,
          error: 'Send failed' 
        });
      }
    } catch (error) {
      result.failed++;
      result.details.push({ 
        email: subscription.email, 
        dealCount: matchingDeals.length, 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return result;
}

// Main function to process all alerts after a deal refresh
export async function processAlerts(deals: Deal[]): Promise<{
  instant: AlertSendResult;
  daily: AlertSendResult;
}> {
  // Clean up old sent deal IDs
  await cleanupSentDealIds();
  
  // Hot deals for instant alerts
  const hotDeals = deals.filter(d => d.isHotDeal || d.valueScore >= 90);
  
  // Send instant alerts for hot deals
  const instantResult = await sendInstantAlerts(hotDeals);
  
  // Send daily digests (runs on cron schedule)
  const dailyResult = await sendDailyDigest(deals);
  
  return {
    instant: instantResult,
    daily: dailyResult,
  };
}

// Check if it's time for weekly digest (Sunday)
export function isWeeklyDigestDay(): boolean {
  return new Date().getDay() === 0; // Sunday
}
