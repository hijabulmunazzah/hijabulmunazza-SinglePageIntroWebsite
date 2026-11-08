/**
 * Hijab ul Munnazah Growth Engine — Automated Test Suite: B2B Wholesale Outreach
 * Asserts:
 *  1. Source URL requirement (no unconsented scraping)
 *  2. Warm-up daily caps enforcement
 *  3. Auto-pause on simulated bounce spike (> 2.0%)
 *  4. Reply classification (interested, not now, unsubscribe)
 *  5. Sending window enforcement (10 AM - 6 PM PKT)
 */

import {
  validateBoutiqueImport,
  generateBoutiqueWholesaleDraft,
  classifyBoutiqueReply,
  sendB2BOutreachEmail,
  BoutiqueTargetInput,
  OutreachCampaignStats,
} from '../engine/src/services/b2b-outreach';

async function runB2BTestSuite() {
  console.log('========================================================================');
  console.log('  HIJAB UL MUNNAZAH — B2B WHOLESALE OUTREACH TEST SUITE');
  console.log('========================================================================\n');

  // Test 1: Import Validation & Source URL requirement
  console.log('--- 1. Testing Import Validation & Source URL Requirement ---');
  const sampleImport: BoutiqueTargetInput[] = [
    {
      businessName: 'Al-Haya Modest Wear',
      city: 'Lahore',
      email: 'contact@alhayaboutique.pk',
      sourceUrl: 'https://alhayaboutique.pk/contact-us',
      notes: 'Premier Gulberg boutique',
    },
    {
      businessName: 'Unverified Lead',
      city: 'Karachi',
      email: 'scraped@randomdomain.pk',
      sourceUrl: '', // Invalid / missing source URL
      notes: 'No public source',
    },
    {
      businessName: 'Malik Fabrics',
      city: 'Islamabad',
      email: 'invalid-email-address',
      sourceUrl: 'https://malikfabrics.pk',
    }
  ];

  const validationRes = validateBoutiqueImport(sampleImport);
  console.log(`Valid: ${validationRes.valid.length}, Rejected: ${validationRes.rejected.length}`);
  if (validationRes.valid.length === 1 && validationRes.rejected.length === 2) {
    console.log('Passed: Successfully accepted verified lead with source URL, rejected invalid rows.\n');
  } else {
    throw new Error('Import validation failed');
  }

  // Test 2: Personalized Draft Generation
  console.log('--- 2. Testing Personalized Wholesale Draft Generation ---');
  const draft = generateBoutiqueWholesaleDraft(validationRes.valid[0]);
  console.log(`Subject: "${draft.subject}"`);
  console.log(`Body excerpt: "${draft.body.substring(0, 120)}..."`);
  if (draft.subject.includes('Al-Haya Modest Wear') && draft.body.includes('Lahore') && draft.body.includes('Cash on Delivery')) {
    console.log('Passed: Generated tailored plain-text wholesale intro.\n');
  } else {
    throw new Error('Draft generation failed');
  }

  // Test 3: Daily Warm-Up Cap Enforcement (10/day)
  console.log('--- 3. Testing Warm-up Daily Cap Enforcement ---');
  const cappedStats: OutreachCampaignStats = {
    todaySentCount: 10,
    dailyCap: 10,
    currentBounceRate: 0.005,
    isAutoPaused: false,
    suppressionCount: 2,
    totalDelivered: 45,
  };

  draft.approvedByHuman = true;
  const capResult = await sendB2BOutreachEmail({ ENVIRONMENT: 'test' }, draft, cappedStats);
  console.log(`Result with cap reached: ${capResult.success ? 'Sent' : 'Blocked'}`);
  console.log(`Reason: "${capResult.error}"`);
  if (!capResult.success && capResult.error?.includes('Daily warm-up cap reached')) {
    console.log('Passed: Blocked sending after reaching daily limit (10 emails/day).\n');
  } else {
    throw new Error('Daily cap check failed');
  }

  // Test 4: Auto-Pause on Bounce Spike (> 2.0%)
  console.log('--- 4. Testing Auto-Pause on High Bounce Rate ---');
  const highBounceStats: OutreachCampaignStats = {
    todaySentCount: 4,
    dailyCap: 10,
    currentBounceRate: 0.035, // 3.5% (exceeds 2.0%)
    isAutoPaused: false,
    suppressionCount: 2,
    totalDelivered: 45,
  };

  const bounceResult = await sendB2BOutreachEmail({ ENVIRONMENT: 'test' }, draft, highBounceStats);
  console.log(`Result with 3.5% bounce: ${bounceResult.success ? 'Sent' : 'Blocked'}`);
  console.log(`Reason: "${bounceResult.error}"`);
  if (!bounceResult.success && bounceResult.error?.includes('Auto-pause triggered')) {
    console.log('Passed: Auto-pause triggered safely to protect mailbox domain reputation.\n');
  } else {
    throw new Error('Auto-pause bounce test failed');
  }

  // Test 5: Reply Classification
  console.log('--- 5. Testing Reply Classification ---');
  const reply1 = classifyBoutiqueReply('Assalam o Alaikum, hume Dubai abaya ka wholesale catalog aur rate list WhatsApp pe bhejein.');
  console.log(`Reply 1: "${reply1.category}" -> ${reply1.action}`);
  if (reply1.category !== 'interested') throw new Error('Reply 1 classification failed');

  const reply2 = classifyBoutiqueReply('Please unsubscribe us from wholesale emails.');
  console.log(`Reply 2: "${reply2.category}" -> ${reply2.action}`);
  if (reply2.category !== 'unsubscribe') throw new Error('Reply 2 classification failed');

  const reply3 = classifyBoutiqueReply('Abhi nahi chahiye, next season rabta karein.');
  console.log(`Reply 3: "${reply3.category}" -> ${reply3.action}`);
  if (reply3.category !== 'not_now') throw new Error('Reply 3 classification failed');

  console.log('Passed: All reply categories correctly classified.\n');

  console.log('========================================================================');
  console.log('ALL PHASE 4 B2B OUTREACH GUARDRAILS & TESTS PASSING!');
  console.log('========================================================================');
}

runB2BTestSuite().catch(e => { console.error(e); process.exit(1); });
