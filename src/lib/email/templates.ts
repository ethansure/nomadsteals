// Email Templates for NomadSteals

import { Deal } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nomadsteals.vercel.app';

// Generate a single deal card HTML
function dealCardHtml(deal: Deal): string {
  const savingsColor = deal.savingsPercent >= 50 ? '#059669' : '#2563eb';
  const valueScoreColor = deal.valueScore >= 90 ? '#dc2626' : deal.valueScore >= 80 ? '#f59e0b' : '#2563eb';
  
  return `
    <div style="background: white; border-radius: 12px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="padding: 20px;">
        <div style="margin-bottom: 12px;">
          ${deal.isHotDeal ? '<span style="background: #fef2f2; color: #dc2626; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">🔥 HOT</span>' : ''}
          <span style="background: #eff6ff; color: ${valueScoreColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 4px;">⚡ ${deal.valueScore} Score</span>
        </div>
        
        <h3 style="color: #1f2937; margin: 0 0 8px; font-size: 18px;">${deal.title}</h3>
        
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px; line-height: 1.5;">
          ${deal.description.substring(0, 120)}${deal.description.length > 120 ? '...' : ''}
        </p>
        
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <span style="font-size: 24px; font-weight: bold; color: #1f2937;">$${deal.currentPrice.toLocaleString()}</span>
            ${deal.originalPrice > deal.currentPrice ? `<span style="color: #9ca3af; text-decoration: line-through; margin-left: 8px;">$${deal.originalPrice.toLocaleString()}</span>` : ''}
          </div>
          <span style="color: ${savingsColor}; font-weight: 600;">Save ${deal.savingsPercent}%</span>
        </div>
        
        <a href="${deal.bookingUrl}" style="display: block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-align: center; margin-top: 16px;">
          Book Now →
        </a>
      </div>
    </div>
  `;
}

// Deal Alert Email (for instant/single deal alerts)
export function dealAlertEmailHtml(deal: Deal, unsubscribeToken: string): string {
  const preferencesUrl = `${BASE_URL}/newsletter/preferences?token=${unsubscribeToken}`;
  const unsubscribeUrl = `${BASE_URL}/api/subscribe/unsubscribe?token=${unsubscribeToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); border-radius: 16px 16px 0 0; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔥 Hot Deal Alert!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">A deal matching your preferences just dropped</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 0 0 16px 16px; padding: 24px;">
          ${dealCardHtml(deal)}
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 16px 0 0;">
            ⏰ Book quickly - deals like this don't last long!
          </p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/deals" style="color: #2563eb; font-size: 14px;">View all deals →</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> • 
          <a href="${preferencesUrl}" style="color: #9ca3af;">Update preferences</a><br><br>
          © ${new Date().getFullYear()} NomadSteals • Travel deals, delivered daily
        </p>
      </div>
    </body>
    </html>
  `;
}

// Daily Digest Email
export function dailyDigestEmailHtml(deals: Deal[], unsubscribeToken: string): string {
  const preferencesUrl = `${BASE_URL}/newsletter/preferences?token=${unsubscribeToken}`;
  const unsubscribeUrl = `${BASE_URL}/api/subscribe/unsubscribe?token=${unsubscribeToken}`;
  
  const topDeals = deals.slice(0, 5); // Limit to top 5 deals
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); border-radius: 16px 16px 0 0; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✈️ Your Daily Deal Digest</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${today}</p>
        </div>
        
        <div style="background: #f9fafb; border-radius: 0 0 16px 16px; padding: 24px;">
          <p style="color: #6b7280; margin: 0 0 20px; font-size: 14px;">
            We found <strong style="color: #1f2937;">${deals.length} deals</strong> matching your preferences today!
          </p>
          
          ${topDeals.map(deal => dealCardHtml(deal)).join('')}
          
          ${deals.length > 5 ? `
            <div style="text-align: center; margin-top: 16px;">
              <a href="${BASE_URL}/deals" style="display: inline-block; background: #f3f4f6; color: #1f2937; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                View ${deals.length - 5} more deals →
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/deals" style="color: #2563eb; font-size: 14px;">Browse all deals →</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> • 
          <a href="${preferencesUrl}" style="color: #9ca3af;">Update preferences</a><br><br>
          © ${new Date().getFullYear()} NomadSteals • Travel deals, delivered daily
        </p>
      </div>
    </body>
    </html>
  `;
}

// Weekly Digest Email
export function weeklyDigestEmailHtml(deals: Deal[], unsubscribeToken: string): string {
  const preferencesUrl = `${BASE_URL}/newsletter/preferences?token=${unsubscribeToken}`;
  const unsubscribeUrl = `${BASE_URL}/api/subscribe/unsubscribe?token=${unsubscribeToken}`;
  
  const topDeals = deals.slice(0, 10); // Top 10 for weekly
  const totalSavings = deals.reduce((sum, d) => sum + (d.originalPrice - d.currentPrice), 0);
  const avgValueScore = Math.round(deals.reduce((sum, d) => sum + d.valueScore, 0) / deals.length);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); border-radius: 16px 16px 0 0; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📬 Your Weekly Deal Roundup</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">The best deals from the past 7 days</p>
        </div>
        
        <div style="background: #f9fafb; padding: 24px;">
          <!-- Stats Row -->
          <div style="display: flex; justify-content: space-around; margin-bottom: 24px; text-align: center;">
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #1f2937;">${deals.length}</div>
              <div style="font-size: 12px; color: #6b7280;">Deals Found</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #059669;">$${totalSavings.toLocaleString()}</div>
              <div style="font-size: 12px; color: #6b7280;">Total Savings</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${avgValueScore}</div>
              <div style="font-size: 12px; color: #6b7280;">Avg Value Score</div>
            </div>
          </div>
          
          <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 16px;">🏆 Top Picks This Week</h2>
          
          ${topDeals.map(deal => dealCardHtml(deal)).join('')}
          
          ${deals.length > 10 ? `
            <div style="text-align: center; margin-top: 16px;">
              <a href="${BASE_URL}/deals" style="display: inline-block; background: #f3f4f6; color: #1f2937; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                View ${deals.length - 10} more deals →
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="background: white; border-radius: 0 0 16px 16px; padding: 24px; text-align: center;">
          <p style="color: #6b7280; margin: 0 0 16px; font-size: 14px;">
            Want deals more often? Switch to daily or instant alerts!
          </p>
          <a href="${preferencesUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
            Update My Preferences →
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> • 
          <a href="${preferencesUrl}" style="color: #9ca3af;">Update preferences</a><br><br>
          © ${new Date().getFullYear()} NomadSteals • Travel deals, delivered daily
        </p>
      </div>
    </body>
    </html>
  `;
}
