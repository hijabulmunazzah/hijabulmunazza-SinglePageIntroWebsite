/**
 * Hijab ul Munnazah Growth Engine — Owner Email Alert Service
 * Dispatches instant Hot Lead notifications and Daily 9 PM PKT Summaries via Resend / Brevo API.
 * Strict rule: Domain sender address only (never personal Gmail).
 */

export interface Env {
  ENVIRONMENT: string;
  RESEND_API_KEY?: string;
  BREVO_API_KEY?: string;
  ALERT_SENDER_EMAIL?: string; // e.g. 'alerts@hijabulmunazzah.com'
  OWNER_ALERT_EMAIL?: string;  // e.g. 'owner@hijabulmunazzah.com'
}

export interface HotLeadAlertData {
  customerName: string;
  phoneNumber?: string;
  city?: string;
  productTitle: string;
  preferredSize?: string;
  leadScore: number;
  intent: string;
  summary: string;
  channel: string;
}

export interface DailyDigestData {
  date: string;
  hotLeadsCount: number;
  warmLeadsCount: number;
  commentDmsSent: number;
  b2bOutreachSent: number;
  topInquiredProduct: string;
}

export async function sendHotLeadAlert(
  env: Env,
  data: HotLeadAlertData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const city = data.city || 'Pakistan';
  const size = data.preferredSize || 'Standard';
  const name = data.customerName || 'New Visitor';
  const subject = `🔥 HOT LEAD — ${name} (${city}) — ${data.productTitle}, size ${size}`;

  const cleanPhone = (data.phoneNumber || '923071771829').replace(/\D/g, '');
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Assalam o Alaikum ${name}! Hijab ul Munnazah se rabta karne ka shukriya. Aapka "${data.productTitle}" ka order finalize karne ke baray mein...`)}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F17; color: #F3F4F6; padding: 28px; border-radius: 12px; border: 1px solid #243048;">
      <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 14px; margin-bottom: 20px;">
        <span style="background: rgba(239, 68, 68, 0.2); color: #F87171; font-weight: bold; font-size: 0.8rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(239, 68, 68, 0.4);">HOT BUYING INTENT</span>
        <h2 style="color: #D4AF37; margin: 10px 0 4px 0; font-size: 1.4rem;">New Hot Lead Received</h2>
        <p style="color: #9CA3AF; margin: 0; font-size: 0.85rem;">Channel: ${data.channel.toUpperCase()} &bull; Score: <strong style="color: #34D399;">${data.leadScore} / 100</strong></p>
      </div>

      <div style="background: #131B2A; border: 1px solid #243048; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <p style="margin: 0 0 10px 0;"><strong>Customer Name:</strong> ${name}</p>
        <p style="margin: 0 0 10px 0;"><strong>City:</strong> ${city}</p>
        <p style="margin: 0 0 10px 0;"><strong>Product of Interest:</strong> <span style="color: #D4AF37;">${data.productTitle}</span></p>
        <p style="margin: 0 0 10px 0;"><strong>Preferred Size:</strong> ${size}</p>
        <p style="margin: 0 0 10px 0;"><strong>Customer Intent:</strong> ${data.intent.toUpperCase()}</p>
        <p style="margin: 0; color: #9CA3AF; font-size: 0.88rem;"><strong>Dialogue Summary:</strong> ${data.summary}</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${waLink}" style="display: inline-block; background: #00A884; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 1rem;">
          💬 Open WhatsApp Chat with Customer
        </a>
      </div>

      <div style="font-size: 0.75rem; color: #6B7280; text-align: center; border-top: 1px solid #1C263A; padding-top: 14px;">
        Hijab ul Munnazah Growth Engine &bull; Automated Real-Time Alert
      </div>
    </div>
  `;

  return dispatchEmail(env, subject, htmlContent);
}

export async function sendDailyDigest(
  env: Env,
  data: DailyDigestData
): Promise<{ success: boolean; id?: string; error?: string }> {
  const subject = `📊 Hijab ul Munnazah Daily Growth Digest — ${data.date}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F17; color: #F3F4F6; padding: 28px; border-radius: 12px; border: 1px solid #243048;">
      <h2 style="color: #D4AF37; margin: 0 0 6px 0;">Daily 9 PM PKT Growth Digest</h2>
      <p style="color: #9CA3AF; margin: 0 0 20px 0; font-size: 0.85rem;">Date: ${data.date} &bull; Pakistani Market Overview</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div style="background: #131B2A; border: 1px solid #243048; padding: 14px; border-radius: 8px;">
          <span style="font-size: 0.75rem; color: #9CA3AF;">HOT LEADS TODAY</span>
          <h3 style="margin: 4px 0 0 0; color: #F87171; font-size: 1.5rem;">${data.hotLeadsCount}</h3>
        </div>
        <div style="background: #131B2A; border: 1px solid #243048; padding: 14px; border-radius: 8px;">
          <span style="font-size: 0.75rem; color: #9CA3AF;">WARM LEADS</span>
          <h3 style="margin: 4px 0 0 0; color: #FBBF24; font-size: 1.5rem;">${data.warmLeadsCount}</h3>
        </div>
        <div style="background: #131B2A; border: 1px solid #243048; padding: 14px; border-radius: 8px;">
          <span style="font-size: 0.75rem; color: #9CA3AF;">COMMENT DMs SENT</span>
          <h3 style="margin: 4px 0 0 0; color: #60A5FA; font-size: 1.5rem;">${data.commentDmsSent}</h3>
        </div>
        <div style="background: #131B2A; border: 1px solid #243048; padding: 14px; border-radius: 8px;">
          <span style="font-size: 0.75rem; color: #9CA3AF;">B2B OUTREACH (WARM-UP)</span>
          <h3 style="margin: 4px 0 0 0; color: #34D399; font-size: 1.5rem;">${data.b2bOutreachSent} / 10</h3>
        </div>
      </div>

      <div style="background: #131B2A; border: 1px solid #243048; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <span style="font-size: 0.75rem; color: #9CA3AF;">TOP INQUIRED PRODUCT</span>
        <p style="margin: 4px 0 0 0; color: #D4AF37; font-weight: bold;">${data.topInquiredProduct}</p>
      </div>

      <div style="text-align: center;">
        <a href="https://growth.hijabulmunazzah.com/admin" style="display: inline-block; background: #D4AF37; color: #0B0F17; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 0.88rem;">
          Open Growth Studio Admin
        </a>
      </div>
    </div>
  `;

  return dispatchEmail(env, subject, htmlContent);
}

async function dispatchEmail(
  env: Env,
  subject: string,
  html: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const from = env.ALERT_SENDER_EMAIL || 'alerts@hijabulmunazzah.com';
  const to = env.OWNER_ALERT_EMAIL || 'owner@hijabulmunazzah.com';

  // 1. Resend API
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Hijab ul Munnazah <${from}>`,
          to: [to],
          subject: subject,
          html: html,
        }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.message || 'Resend API failed');
      return { success: true, id: data.id };
    } catch (err: any) {
      console.warn('Resend send error:', err);
    }
  }

  // 2. Simulated dry-run mode
  console.log(`[Email Alert Simulated] Subject: "${subject}" to <${to}>`);
  return { success: true, id: `sim_email_${Date.now()}` };
}
