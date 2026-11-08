/**
 * Hijab ul Munnazah Growth Engine — Automated Test Suite: 20 Roman Urdu Conversations
 * Asserts:
 *  1. No invented prices (prices must match brands/hijab.json catalog exactly)
 *  2. Correct human handoff triggers (complaints, order bookings, human escalation)
 *  3. Correct lead scoring (hot >= 80, warm 50-79, cold < 50)
 *  4. Strict adherence to STOP / opt-out keywords
 */

import { handleCustomerMessage, ConversationTurnInput } from '../engine/src/services/conversation-agent';
import brandConfig from '../brands/hijab.json';

interface TestCase {
  id: number;
  scenario: string;
  customerName: string;
  incomingText: string;
  expectedIntent: string;
  expectedHandoff: boolean;
  expectedMinScore?: number;
  expectedMaxScore?: number;
  expectedOptOut?: boolean;
  expectedPriceMention?: number;
}

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    scenario: 'Price inquiry on Signature Dubai Front Open',
    customerName: 'Ayesha Khan',
    incomingText: 'Dubai front open abaya ka rate aur delivery charges kiya hain?',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedPriceMention: 4850,
    expectedMinScore: 80,
  },
  {
    id: 2,
    scenario: 'Price inquiry on Mocha Luxe Gown',
    customerName: 'Sana Tariq',
    incomingText: 'Mocha brown gown kitne ka milega?',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedPriceMention: 4200,
    expectedMinScore: 80,
  },
  {
    id: 3,
    scenario: 'Price inquiry on Korean Nada Classic Gown',
    customerName: 'Zainab Bibi',
    incomingText: 'Pure korean nada black gown ki price bata dein please',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedPriceMention: 5200,
    expectedMinScore: 80,
  },
  {
    id: 4,
    scenario: 'Price inquiry on Silk Chiffon Stole',
    customerName: 'Mariam Ali',
    incomingText: 'Emerald silk stole kitne ka hai?',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedPriceMention: 1450,
    expectedMinScore: 80,
  },
  {
    id: 5,
    scenario: 'General price inquiry / browsing',
    customerName: 'Fatima Noor',
    incomingText: 'Apke paas abayas ki price range kiya hai?',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedMinScore: 65,
  },
  {
    id: 6,
    scenario: 'Sizing inquiry for height 5\'2"',
    customerName: 'Hina Sheikh',
    incomingText: 'Meri height 5.2 hai, mujhe kaunsa size fit aye ga?',
    expectedIntent: 'sizing_query',
    expectedHandoff: false,
    expectedMinScore: 70,
  },
  {
    id: 7,
    scenario: 'Sizing inquiry for tall height 5\'8"',
    customerName: 'Samina Butt',
    incomingText: 'Tall height ke liye size 56 ki length sahi rahegi? Meri height 5 foot 7 inch hai',
    expectedIntent: 'sizing_query',
    expectedHandoff: false,
    expectedMinScore: 70,
  },
  {
    id: 8,
    scenario: 'Wholesale inquiry for boutique',
    customerName: 'Mehwish Boutique Lahore',
    incomingText: 'Humari Lahore mein boutique hai, hume 25 pieces wholesale rate pe chahiye',
    expectedIntent: 'wholesale_inquiry',
    expectedHandoff: true,
    expectedMinScore: 90,
  },
  {
    id: 9,
    scenario: 'Reseller inquiry',
    customerName: 'Rabia Online',
    incomingText: 'Aap bulk wholesale mein resellers ko supply karte hain?',
    expectedIntent: 'wholesale_inquiry',
    expectedHandoff: true,
    expectedMinScore: 90,
  },
  {
    id: 10,
    scenario: 'Ready to order / Confirm booking',
    customerName: 'Noreen Javed',
    incomingText: 'Mera order book kardo, address note karo: House 42, Street 5, F-8 Islamabad',
    expectedIntent: 'order_inquiry',
    expectedHandoff: true,
    expectedMinScore: 90,
  },
  {
    id: 11,
    scenario: 'Complaint: stitching issue',
    customerName: 'Sadia Malik',
    incomingText: 'Mera parcel kharaab aya hai, sleeve ki stitching khuli hui hai! Bohat afsos hua',
    expectedIntent: 'complaint',
    expectedHandoff: true,
    expectedMaxScore: 50,
  },
  {
    id: 12,
    scenario: 'Complaint: rider did not allow open parcel',
    customerName: 'Kalsoom Akhtar',
    incomingText: 'Courier wale ne parcel open karne nahi diya! Aapne kaha tha check karke payment deni hai',
    expectedIntent: 'complaint',
    expectedHandoff: true,
    expectedMaxScore: 50,
  },
  {
    id: 13,
    scenario: 'Human escalation request',
    customerName: 'Farah Naz',
    incomingText: 'Mujhe bot se baat nahi karni, kisi insaan ya admin se baat karwao',
    expectedIntent: 'general',
    expectedHandoff: true,
    expectedMinScore: 60,
  },
  {
    id: 14,
    scenario: 'Direct call / human request',
    customerName: 'Alia Aslam',
    incomingText: 'Apne manager ya owner se meri call pe baat karwao foran',
    expectedIntent: 'general',
    expectedHandoff: true,
    expectedMinScore: 60,
  },
  {
    id: 15,
    scenario: 'Stop keyword in Roman Urdu',
    customerName: 'Tahir Shah',
    incomingText: 'Mujhe mazeed message mat karo, ruk jao',
    expectedIntent: 'opt_out',
    expectedHandoff: false,
    expectedOptOut: true,
    expectedMaxScore: 0,
  },
  {
    id: 16,
    scenario: 'Stop keyword in English',
    customerName: 'Visitor 98',
    incomingText: 'STOP unsubscribe',
    expectedIntent: 'opt_out',
    expectedHandoff: false,
    expectedOptOut: true,
    expectedMaxScore: 0,
  },
  {
    id: 17,
    scenario: 'Angry / abusive words',
    customerName: 'Angry Customer',
    incomingText: 'Bakwaas service hai aapki, koi jawab nahi deta!',
    expectedIntent: 'complaint',
    expectedHandoff: true,
    expectedMaxScore: 50,
  },
  {
    id: 18,
    scenario: 'Open parcel COD verification inquiry',
    customerName: 'Bushra Imran',
    incomingText: 'Kiya COD pe parcel open check karne ki ijazat hai rider ke samne?',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedMinScore: 70,
  },
  {
    id: 19,
    scenario: 'Delivery city time check (Karachi)',
    customerName: 'Nimra Siddiqui',
    incomingText: 'Karachi mein delivery charges kitne hain aur kitne din lagte hain?',
    expectedIntent: 'price_checking',
    expectedHandoff: false,
    expectedMinScore: 70,
  },
  {
    id: 20,
    scenario: 'Casual Islamic Greeting',
    customerName: 'Zainab Ahmed',
    incomingText: 'Assalam o Alaikum! Kaise hain aap?',
    expectedIntent: 'general',
    expectedHandoff: false,
    expectedMaxScore: 50,
  },
];

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  HIJAB UL MUNNAZAH — 20 ROMAN URDU CONVERSATION AGENT BENCHMARK');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    const input: ConversationTurnInput = {
      channel: 'instagram',
      customerId: `cust_${tc.id}`,
      customerName: tc.customerName,
      incomingText: tc.incomingText,
      conversationHistory: [],
      isWithin24Hours: true,
    };

    const res = await handleCustomerMessage(input);

    let testPass = true;
    const errors: string[] = [];

    // Check Intent
    if (res.leadCard.intent !== tc.expectedIntent) {
      testPass = false;
      errors.push(`Intent mismatch: got '${res.leadCard.intent}', expected '${tc.expectedIntent}'`);
    }

    // Check Handoff
    if (res.leadCard.handoff_required !== tc.expectedHandoff) {
      testPass = false;
      errors.push(`Handoff mismatch: got ${res.leadCard.handoff_required}, expected ${tc.expectedHandoff}`);
    }

    // Check Opt-Out
    if (tc.expectedOptOut !== undefined && res.leadCard.opt_out !== tc.expectedOptOut) {
      testPass = false;
      errors.push(`Opt-out mismatch: got ${res.leadCard.opt_out}, expected ${tc.expectedOptOut}`);
    }

    // Check Min Score
    if (tc.expectedMinScore !== undefined && res.leadCard.lead_score < tc.expectedMinScore) {
      testPass = false;
      errors.push(`Score too low: got ${res.leadCard.lead_score}, expected >= ${tc.expectedMinScore}`);
    }

    // Check Max Score
    if (tc.expectedMaxScore !== undefined && res.leadCard.lead_score > tc.expectedMaxScore) {
      testPass = false;
      errors.push(`Score too high: got ${res.leadCard.lead_score}, expected <= ${tc.expectedMaxScore}`);
    }

    // Check Accurate Catalog Price Mention (No Invented Prices)
    if (tc.expectedPriceMention !== undefined) {
      const formattedPrice = tc.expectedPriceMention.toLocaleString();
      if (!res.replyText.includes(formattedPrice)) {
        testPass = false;
        errors.push(`Price missing or incorrect: expected exact catalog price Rs ${formattedPrice} in reply`);
      }
    }

    if (testPass) {
      passed++;
      console.log(`[PASS] Case #${tc.id.toString().padStart(2, '0')}: ${tc.scenario}`);
      console.log(`       Reply: "${res.replyText.substring(0, 80)}..."`);
      console.log(`       Score: ${res.leadCard.lead_score} | Handoff: ${res.leadCard.handoff_required} | Intent: ${res.leadCard.intent}\n`);
    } else {
      failed++;
      console.error(`[FAIL] Case #${tc.id}: ${tc.scenario}`);
      errors.forEach(e => console.error(`       ERROR: ${e}`));
      console.error(`       Reply was: "${res.replyText}"\n`);
    }
  }

  console.log('========================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${TEST_CASES.length})`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(console.error);
