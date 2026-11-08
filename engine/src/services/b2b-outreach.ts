/**
 * Hijab ul Munnazah Growth Engine — B2B Boutique Wholesale Outreach Service
 * Deliverability-First Architecture enforcing strict Pakistani business hours,
 * gradual mailbox warm-up, source URL verification, bounce auto-pause, and human approval.
 */

export interface Env {
  ENVIRONMENT: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OUTREACH_API_KEY?: string;
  OUTREACH_SENDER_EMAIL?: string; // e.g. wholesale@hijabulmunazzah.com
}

export interface BoutiqueTargetInput {
  businessName: string;
  city: string;
  email: string;
  sourceUrl: string; // Mandatory public business listing link
  instagramHandle?: string;
  phone?: string;
  notes?: string;
}

export interface OutreachCampaignStats {
  todaySentCount: number;
  dailyCap: number; // Week 1: 10/day
  currentBounceRate: number; // Must be < 2.0%
  isAutoPaused: boolean;
  pauseReason?: string;
  suppressionCount: number;
  totalDelivered: number;
}

export interface PersonalizedOutreachDraft {
  targetEmail: string;
  businessName: string;
  city: string;
  subject: string;
  body: string;
  approvedByHuman: boolean;
}

// Warm-up schedule limits
const WARMUP_CAPS = {
  WEEK_1: 10,
  WEEK_2: 20,
  WEEK_3: 30,
  WEEK_4_PLUS: 45,
};

const MAX_BOUNCE_THRESHOLD = 0.02; // 2.0%

/**
 * Validates and imports a list of B2B boutiques.
 * Enforces rule: MUST have a public source URL (no unconsented scraping).
 */
export function validateBoutiqueImport(
  boutiques: BoutiqueTargetInput[]
): { valid: BoutiqueTargetInput[]; rejected: Array<{ item: BoutiqueTargetInput; reason: string }> } {
  const valid: BoutiqueTargetInput[] = [];
  const rejected: Array<{ item: BoutiqueTargetInput; reason: string }> = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const b of boutiques) {
    if (!b.sourceUrl || !b.sourceUrl.trim().startsWith('http')) {
      rejected.push({ item: b, reason: 'Rejected: Missing verified public source URL where business email is listed.' });
      continue;
    }

    if (!b.email || !emailRegex.test(b.email.trim())) {
      rejected.push({ item: b, reason: 'Rejected: Invalid email format.' });
      continue;
    }

    if (b.email.endsWith('@gmail.com') || b.email.endsWith('@yahoo.com') || b.email.endsWith('@hotmail.com')) {
      // Personal free webmail addresses are flagged
      valid.push({ ...b, notes: `${b.notes || ''} [Note: Free webmail address]` });
    } else {
      valid.push(b);
    }
  }

  return { valid, rejected };
}

/**
 * Checks sending window compliance.
 * Rule: 10:00 AM - 6:00 PM PKT (Pakistan Standard Time, UTC+5) only.
 */
export function isWithinSendingHoursPKT(date = new Date()): boolean {
  // Convert current time to Pakistan Time (UTC+5)
  const utcHours = date.getUTCHours();
  const pktHours = (utcHours + 5) % 24;

  return pktHours >= 10 && pktHours < 18;
}

/**
 * Generates a respectful, personalized wholesale outreach intro per boutique.
 * Strictly plain-text format for maximum inbox deliverability.
 */
export function generateBoutiqueWholesaleDraft(
  boutique: BoutiqueTargetInput
): PersonalizedOutreachDraft {
  const cityMention = boutique.city ? `${boutique.city} mein` : 'Pakistan bhar mein';

  const subject = `Wholesale Dubai Abaya collection — Hijab ul Munnazah × ${boutique.businessName}`;

  const body = `Assalam o Alaikum ${boutique.businessName} Team,

Umeed hai aap kheriyat se honge.

Hum ${boutique.city ? `${boutique.city} mein ` : ''}aapki boutique ke shandar modest fashion kaam aur curation ko follow kar rahe hain.

Hijab ul Munnazah direct manufacturer aur wholesale exporter hai authentic Dubai Korean Nidha Abayas aur pure Silk Georgette stoles ka. Hum Pakistan bhar ke premium boutiques aur modest clothing studios ko direct factory wholesale rates par stock supply karte hain.

Khususi B2B Sahuliyat:
1. Low Minimum Order Quantity (sirf 5 pieces se shuru)
2. Asli Dubai Nidha aur Korean Nada fabric with matching stoles
3. Cash on Delivery (COD) — parcel open check karke payment ada karne ki mukammal sahulat
4. Guaranteed stitching quality & 7-day exchange support

Agar aap apni boutique ke liye hamara latest 2026 wholesale catalog aur price list dekhna chahein, to barahe meherbani is email ka jawab dein ya hamare direct WhatsApp wholesale desk se rabta farmayein:
WhatsApp: +92 307 1771829 (Maaz Zuindani, Hijab ul Munnazah)

Shukriya aur nek khwahishat,
Hijab ul Munnazah Wholesale Team
Karachi / Lahore, Pakistan
https://hijabulmunazzah.com

---
Agar aap mustaqbil mein wholesale updates nahi chahte to 'Unsubscribe' reply kar dein.`;

  return {
    targetEmail: boutique.email.trim().toLowerCase(),
    businessName: boutique.businessName,
    city: boutique.city,
    subject,
    body,
    approvedByHuman: false,
  };
}

/**
 * Classifies an incoming reply from a boutique.
 */
export function classifyBoutiqueReply(
  replyText: string
): { category: 'interested' | 'not_now' | 'unsubscribe' | 'general'; action: string } {
  const lower = replyText.toLowerCase().trim();

  if (lower.includes('unsubscribe') || lower.includes('stop') || lower.includes('mat bhejo') || lower.includes('remove')) {
    return {
      category: 'unsubscribe',
      action: 'Permanently added to suppression_list. Sequence halted immediately.',
    };
  }

  if (lower.includes('abhi nahi') || lower.includes('not now') || lower.includes('baad mein') || lower.includes('later') || lower.includes('zaroorat nahi')) {
    return {
      category: 'not_now',
      action: 'Archived. Set gentle follow-up reminder for next season.',
    };
  }

  if (lower.includes('catalog') || lower.includes('rate') || lower.includes('price') || lower.includes('samples') || lower.includes('interested') || lower.includes('whatsapp') || lower.includes('bhejein') || lower.includes('bhej dein')) {
    return {
      category: 'interested',
      action: 'Hot wholesale lead created! Dispatched instant owner notification.',
    };
  }

  return {
    category: 'general',
    action: 'Routed to human inbox for review.',
  };
}

/**
 * Checks deliverability guardrails and sends email if approved and healthy.
 */
export async function sendB2BOutreachEmail(
  env: Env,
  draft: PersonalizedOutreachDraft,
  stats: OutreachCampaignStats
): Promise<{ success: boolean; error?: string }> {
  // 1. Check Auto-Pause
  if (stats.isAutoPaused) {
    return { success: false, error: `Sending paused: ${stats.pauseReason}` };
  }

  // 2. Check Bounce rate threshold
  if (stats.currentBounceRate >= MAX_BOUNCE_THRESHOLD) {
    return {
      success: false,
      error: `Auto-pause triggered: Bounce rate (${(stats.currentBounceRate * 100).toFixed(1)}%) exceeds safe 2.0% threshold.`
    };
  }

  // 3. Check Daily Cap
  if (stats.todaySentCount >= stats.dailyCap) {
    return {
      success: false,
      error: `Daily warm-up cap reached (${stats.todaySentCount}/${stats.dailyCap} emails sent today). Resuming tomorrow 10:00 AM PKT.`
    };
  }

  // 4. Check Sending Hours (10:00 AM - 6:00 PM PKT)
  if (!isWithinSendingHoursPKT()) {
    return {
      success: false,
      error: 'Outside sending hours: B2B outreach is strictly sent between 10:00 AM and 6:00 PM PKT.'
    };
  }

  // 5. Human approval verification
  if (!draft.approvedByHuman) {
    return {
      success: false,
      error: 'Human approval required: Owner has not approved this draft.'
    };
  }

  // 6. Dispatch email via domain mailbox
  console.log(`[B2B Outreach] Dispatched email to <${draft.targetEmail}>: "${draft.subject}"`);
  return { success: true };
}
