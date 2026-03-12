// Daily Newsletter Email
// Sends hot deals to verified subscribers

import { sendEmail, BASE_URL } from './resend';
import { getVerifiedSubscriptions, markDealSent } from '../subscriptions/store';
import { Deal } from '../types';

interface DealEmailData {
  deals: Deal[];
  recipientEmail: string;
  unsubscribeToken: string;
}

function generateDealHtml(deal: Deal): string {
  const dealUrl = `${BASE_URL}/deals/${deal.id}`;
  const savings = deal.originalPrice - deal.currentPrice;
  
  return `
    <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e5e7eb;">
      <div style="display: flex; gap: 16px;">
        <img src="${deal.imageUrl}" alt="${deal.destinationCity}" style="width: 120px; height: 90px; object-fit: cover; border-radius: 8px;" />
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            ${deal.isHotDeal ? '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">🔥 HOT</span>' : ''}
            <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Score: ${deal.valueScore}</span>
          </div>
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #1f2937;">
            <a href="${dealUrl}" style="color: #1f2937; text-decoration: none;">${deal.title}</a>
          </h3>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 24px; font-weight: 700; color: #1f2937;">$${deal.currentPrice}</span>
            <span style="font-size: 14px; color: #9ca3af; text-decoration: line-through;">$${deal.originalPrice}</span>
            <span style="font-size: 14px; color: #10b981; font-weight: 600;">Save $${savings}</span>
          </div>
        </div>
      </div>
      <a href="${dealUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #FF6B6B 0%, #FFA07A 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
        View Deal →
      </a>
    </div>
  `;
}

export function generateDailyNewsletterHtml({ deals, recipientEmail, unsubscribeToken }: DealEmailData): string {
  const preferencesUrl = `${BASE_URL}/newsletter/preferences?token=${unsubscribeToken}`;
  const unsubscribeUrl = `${BASE_URL}/api/subscribe/unsubscribe?token=${unsubscribeToken}`;
  const viewAllUrl = `${BASE_URL}/deals`;
  
  const dealsHtml = deals.map(generateDealHtml).join('');
  const hotDealsCount = deals.filter(d => d.isHotDeal).length;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #FFD93D 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✈️ NomadSteals</h1>
          <p style="color: white; margin: 8px 0 0; opacity: 0.9;">Your Daily Travel Deals</p>
        </div>
        
        <!-- Content -->
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 20px;">
            🔥 ${deals.length} Hot Deals Today!
          </h2>
          <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">
            ${hotDealsCount > 0 ? `Including ${hotDealsCount} exceptional value ${hotDealsCount === 1 ? 'deal' : 'deals'} you won't want to miss.` : 'Hand-picked deals with exceptional value scores.'}
          </p>
          
          <!-- Deals -->
          ${dealsHtml}
          
          <!-- View All CTA -->
          <a href="${viewAllUrl}" style="display: block; text-align: center; background: #1f2937; color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin-top: 24px;">
            View All Deals on NomadSteals →
          </a>
          
          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px;">
              You're receiving this because you subscribed to NomadSteals.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              <a href="${preferencesUrl}" style="color: #6b7280;">Update preferences</a> • 
              <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
            </p>
          </div>
        </div>
        
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 16px 0 0;">
          © ${new Date().getFullYear()} NomadSteals • Travel deals, delivered daily 🌴
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendDailyNewsletter(
  deals: Deal[], 
  frequency: 'instant' | 'daily' | 'weekly' = 'daily'
): Promise<{ sent: number; failed: number; skipped: number }> {
  const allSubscribers = await getVerifiedSubscriptions();
  
  // Filter subscribers by their selected frequency
  const subscribers = allSubscribers.filter(sub => sub.preferences.frequency === frequency);
  
  console.log(`[Newsletter] Sending ${frequency} newsletter to ${subscribers.length}/${allSubscribers.length} subscribers`);
  
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const subscriber of subscribers) {
    // Filter deals that haven't been sent to this subscriber
    const newDeals = deals.filter(d => !subscriber.sentDealIds.includes(d.id));
    
    if (newDeals.length === 0) {
      skipped++;
      continue;
    }
    
    // Get top deals (max 5)
    const topDeals = newDeals
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 5);
    
    const html = generateDailyNewsletterHtml({
      deals: topDeals,
      recipientEmail: subscriber.email,
      unsubscribeToken: subscriber.unsubscribeToken,
    });
    
    const success = await sendEmail({
      to: subscriber.email,
      subject: `✈️ ${topDeals.length} Hot Travel Deals - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      html,
    });
    
    if (success) {
      sent++;
      // Mark deals as sent
      for (const deal of topDeals) {
        await markDealSent(subscriber.id, deal.id);
      }
    } else {
      failed++;
    }
  }
  
  return { sent, failed, skipped };
}
