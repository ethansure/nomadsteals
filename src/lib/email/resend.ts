// Email service using Resend
// Sign up at https://resend.com to get your API key

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'NomadSteals <deals@nomadsteals.com>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nomadsteals.vercel.app';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return false;
    }

    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verifyUrl = `${BASE_URL}/api/subscribe/verify?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✈️ NomadSteals</h1>
        </div>
        
        <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 16px;">Verify your email</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
            Thanks for subscribing to NomadSteals! Click the button below to verify your email and start receiving the best travel deals.
          </p>
          
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Verify My Email →
          </a>
          
          <p style="color: #9ca3af; font-size: 14px; margin: 24px 0 0;">
            Or copy this link: <br>
            <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If you didn't subscribe to NomadSteals, you can safely ignore this email.
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0;">
          © ${new Date().getFullYear()} NomadSteals • Travel deals, delivered daily
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '✈️ Verify your NomadSteals subscription',
    html,
  });
}

// Send welcome email after verification
export async function sendWelcomeEmail(email: string, unsubscribeToken: string): Promise<boolean> {
  const preferencesUrl = `${BASE_URL}/newsletter/preferences?token=${unsubscribeToken}`;
  const unsubscribeUrl = `${BASE_URL}/api/subscribe/unsubscribe?token=${unsubscribeToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're In!</h1>
        </div>
        
        <div style="background: white; border-radius: 0 0 16px 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin: 0 0 16px;">Welcome to NomadSteals!</h2>
          <p style="color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
            Your email is verified and you're ready to receive amazing travel deals. Here's what to expect:
          </p>
          
          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
            <div style="margin-bottom: 12px;">
              <span style="font-size: 20px;">🔥</span>
              <strong style="color: #1f2937;">Hot Deals First</strong>
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Error fares and flash sales before they sell out</p>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="font-size: 20px;">⚡</span>
              <strong style="color: #1f2937;">Value Score Picks</strong>
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Only exceptional deals make the cut</p>
            </div>
            <div>
              <span style="font-size: 20px;">📍</span>
              <strong style="color: #1f2937;">Personalized</strong>
              <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">Deals matched to your preferences</p>
            </div>
          </div>
          
          <a href="${preferencesUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Customize My Preferences →
          </a>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            <a href="${unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> • 
            <a href="${preferencesUrl}" style="color: #9ca3af;">Update preferences</a>
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0;">
          © ${new Date().getFullYear()} NomadSteals • Travel deals, delivered daily
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to NomadSteals - You\'re all set!',
    html,
  });
}

export { BASE_URL };
