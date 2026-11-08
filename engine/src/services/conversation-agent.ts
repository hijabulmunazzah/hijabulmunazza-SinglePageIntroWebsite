/**
 * Hijab ul Munnazah Growth Engine — AI Conversation Agent Service
 * Handles Roman Urdu + English customer dialogues for Instagram DM, WhatsApp, & Messenger.
 * Enforces strict catalog pricing, sizing assistance, 24-hr messaging window, and human handoff triggers.
 */

import brandConfig from '../../../brands/hijab.json';

export interface ConversationTurnInput {
  channel: 'instagram' | 'whatsapp' | 'messenger';
  customerId: string;
  customerName?: string;
  incomingText: string;
  conversationHistory: Array<{ role: 'customer' | 'assistant'; text: string; timestamp: string }>;
  isWithin24Hours?: boolean;
}

export interface LeadCard {
  lead_score: number; // 0 - 100
  intent: 'order_inquiry' | 'wholesale_inquiry' | 'price_checking' | 'sizing_query' | 'complaint' | 'opt_out' | 'general';
  temperature: 'hot' | 'warm' | 'cold';
  handoff_required: boolean;
  handoff_reason?: string;
  opt_out: boolean;
  customer_profile: {
    name?: string;
    phone?: string;
    city?: string;
    height?: string;
    preferred_size?: string;
    interested_products: string[];
    is_wholesale: boolean;
  };
  summary: string;
}

export interface AgentReplyResult {
  replyText: string;
  leadCard: LeadCard;
  shouldSendReply: boolean;
  suppressionReason?: string;
}

const STOP_KEYWORDS = ['stop', 'unsubscribe', 'ruk jao', 'roko', 'message mat karo', 'mat bhejo', 'band karo'];

const HANDOFF_KEYWORDS = [
  'insaan', 'human', 'admin', 'manager', 'owner', 'call karo', 'baat karwao',
  'kharaab', 'fraud', 'shikayat', 'complaint', 'gussa', 'bakwaas', 'dhoka',
  'order book kardo', 'order conform karo', 'confirm kardo', 'mera order lelo', 'address note karo',
  'rider ne', 'courier wale ne', 'nahi diya', 'open nahi karne diya'
];

/**
 * Main AI agent dialogue processor
 */
export async function handleCustomerMessage(
  input: ConversationTurnInput
): Promise<AgentReplyResult> {
  const cleanInput = input.incomingText.trim().toLowerCase();

  // 1. Enforce 24-hour messaging window compliance
  if (input.isWithin24Hours === false) {
    return {
      replyText: '',
      shouldSendReply: false,
      suppressionReason: 'Outside 24-hour platform messaging window. Alerting owner instead.',
      leadCard: createDefaultLeadCard(input, 10, 'cold', false, false)
    };
  }

  // 2. Check Opt-Out / Stop keywords (Anti-Spam & PECA compliance)
  if (STOP_KEYWORDS.some(k => cleanInput.includes(k))) {
    return {
      replyText: 'Aapki darkhwast ke mutabiq messages rok diye gaye hain. Agar mustaqbil mein zaroorat ho to aap rabta farma sakte hain. Shukriya.',
      shouldSendReply: true,
      leadCard: {
        lead_score: 0,
        intent: 'opt_out',
        temperature: 'cold',
        handoff_required: false,
        opt_out: true,
        customer_profile: { interested_products: [], is_wholesale: false },
        summary: 'Customer requested opt-out / STOP.'
      }
    };
  }

  // 3. Check Human Handoff Triggers (Complaints, Human Request, Order Confirmation)
  const isHandoffTriggered = HANDOFF_KEYWORDS.some(k => cleanInput.includes(k));
  if (isHandoffTriggered) {
    const isComplaint = cleanInput.includes('kharaab') || cleanInput.includes('fraud') || cleanInput.includes('shikayat') || cleanInput.includes('bakwaas') || cleanInput.includes('rider ne') || cleanInput.includes('courier wale ne') || cleanInput.includes('nahi diya');
    const isOrderFinalization = cleanInput.includes('order book') || cleanInput.includes('confirm') || cleanInput.includes('address note');

    let reply = '';
    let reason = '';
    let score = 75;

    if (isComplaint) {
      reply = 'Bohat maazrat ke aapko pareshani hui! Hum aapki shikayat ko intehai sanjeedgi se le rahe hain. Hamari support team ke senior member foran aapse rabta kar rahe hain.';
      reason = 'Customer complaint / escalation';
      score = 40;
    } else if (isOrderFinalization) {
      reply = 'Zabardast! Aapka order finalize karne ke liye hamara order desk foran aapse rabta kar raha hai. Barahe meherbani apna Delivery Address, Shehar aur WhatsApp number share farma dein.';
      reason = 'Order booking / ready to order';
      score = 95;
    } else {
      reply = 'Jee zaroor! Main foran hamare senior team member ko connect kar raha hoon. Wo thori der mein aapse direct rabta farmayenge.';
      reason = 'Customer requested human / admin conversation';
      score = 70;
    }

    return {
      replyText: reply,
      shouldSendReply: true,
      leadCard: {
        lead_score: score,
        intent: isComplaint ? 'complaint' : (isOrderFinalization ? 'order_inquiry' : 'general'),
        temperature: score >= 80 ? 'hot' : (score >= 50 ? 'warm' : 'cold'),
        handoff_required: true,
        handoff_reason: reason,
        opt_out: false,
        customer_profile: extractCustomerEntities(cleanInput, input.customerName),
        summary: `Handoff triggered: ${reason}`
      }
    };
  }

  // 4. Sizing assistance query
  if (cleanInput.includes('size') || cleanInput.includes('height') || cleanInput.includes('lambi') || cleanInput.includes('fit')) {
    const matchedSize = matchSizeFromHeight(cleanInput);
    let sizingReply = '';
    if (matchedSize) {
      sizingReply = `Aapki height ke mutabiq Size ${matchedSize.size} (Length ${matchedSize.length} inches) bilkul perfect aur modest fall dega ✨ Kya aapko loose fit pasand hai ya standard?`;
    } else {
      sizingReply = `Hamare paas standard sizes 50 se 58 tak dastiyab hain ✨ Aapki height kitni hai (misaal ke taur par 5'2" ya 5'5") taake main aapko sahi size recommend kar sakoon?`;
    }

    return {
      replyText: sizingReply,
      shouldSendReply: true,
      leadCard: {
        lead_score: 75,
        intent: 'sizing_query',
        temperature: 'warm',
        handoff_required: false,
        opt_out: false,
        customer_profile: extractCustomerEntities(cleanInput, input.customerName),
        summary: 'Customer inquiring about sizing and height recommendations.'
      }
    };
  }

  // 5. Wholesale & Bulk inquiries
  if (cleanInput.includes('wholesale') || cleanInput.includes('bulk') || cleanInput.includes('reseller') || cleanInput.includes('boutique') || cleanInput.includes('10 piece') || cleanInput.includes('dokan')) {
    return {
      replyText: 'Assalam o Alaikum! Jee bilkul, Hijab ul Munnazah direct manufacturer hai aur hum Pakistan bhar mein boutiques aur resellers ko wholesale rates faraham karte hain (Minimum 5 pieces). Aapko kitne pieces aur kaunsa design chahiye?',
      shouldSendReply: true,
      leadCard: {
        lead_score: 92,
        intent: 'wholesale_inquiry',
        temperature: 'hot',
        handoff_required: true,
        handoff_reason: 'High-value wholesale / boutique inquiry',
        opt_out: false,
        customer_profile: {
          ...extractCustomerEntities(cleanInput, input.customerName),
          is_wholesale: true
        },
        summary: 'Wholesale inquiry for boutiques/resellers.'
      }
    };
  }

  // 6. Pricing & Delivery inquiries
  if (cleanInput.includes('price') || cleanInput.includes('rate') || cleanInput.includes('kitne') || cleanInput.includes('kitny') || cleanInput.includes('qimat') || cleanInput.includes('delivery') || cleanInput.includes('cod')) {
    const product = findMatchingProduct(cleanInput);
    if (product) {
      return {
        replyText: `${product.name} ki qeemat Rs ${product.retail_price.toLocaleString()} hai (matching stole shamil hai) ✨ Delivery charges Karachi Rs 200 aur deegar shehar Rs 250 hain. Cash on Delivery dastiyab hai aur parcel open check karke payment karne ki ijazat hai. Kya aapko ye design book karna hai?`,
        shouldSendReply: true,
        leadCard: {
          lead_score: 82,
          intent: 'price_checking',
          temperature: 'hot',
          handoff_required: false,
          opt_out: false,
          customer_profile: {
            ...extractCustomerEntities(cleanInput, input.customerName),
            interested_products: [product.name]
          },
          summary: `Inquired about price for ${product.name}.`
        }
      };
    } else {
      return {
        replyText: 'Hamari luxury Dubai Abayas Rs 4,200 se Rs 5,200 ke darmiyan hain, aur premium stoles Rs 950 se shuru hote hain ✨ Delivery pe parcel open check karne ki mukammal sahulat hai. Aapko specifically kaunsa design ya color pasand aya hai?',
        shouldSendReply: true,
        leadCard: {
          lead_score: 70,
          intent: 'price_checking',
          temperature: 'warm',
          handoff_required: false,
          opt_out: false,
          customer_profile: extractCustomerEntities(cleanInput, input.customerName),
          summary: 'General price catalog inquiry.'
        }
      };
    }
  }

  // 7. General inquiry / Greeting
  return {
    replyText: 'Walaikum Assalam! Hijab ul Munnazah mein khush-amdeed ✨ Hamare paas authentic Dubai Nidha Abayas aur luxury stoles dastiyab hain. Main aapki kya madad kar sakta hoon — design dekhna chahte hain ya sizing mein madad chahiye?',
    shouldSendReply: true,
    leadCard: {
      lead_score: 45,
      intent: 'general',
      temperature: 'cold',
      handoff_required: false,
      opt_out: false,
      customer_profile: extractCustomerEntities(cleanInput, input.customerName),
      summary: 'Initial customer greeting / general contact.'
    }
  };
}

function matchSizeFromHeight(text: string) {
  if (text.includes("4'10") || text.includes("4'11") || text.includes("5'0") || text.includes("5.0")) return { size: '50', length: 50 };
  if (text.includes("5'1") || text.includes("5'2") || text.includes("5'3") || text.includes("5.2") || text.includes("5.3")) return { size: '52', length: 52 };
  if (text.includes("5'4") || text.includes("5'5") || text.includes("5.4") || text.includes("5.5")) return { size: '54', length: 54 };
  if (text.includes("5'6") || text.includes("5'7") || text.includes("5'8") || text.includes("5.6") || text.includes("5.7")) return { size: '56', length: 56 };
  if (text.includes("5'9") || text.includes("5'10") || text.includes("5.9")) return { size: '58', length: 58 };
  return null;
}

function findMatchingProduct(text: string) {
  const products = brandConfig.catalog.products;
  if (text.includes('front open') || text.includes('dubai nidha') || text.includes('dubai')) return products[0];
  if (text.includes('mocha') || text.includes('brown')) return products[1];
  if (text.includes('korean') || text.includes('nada') || text.includes('black gown')) return products[2];
  if (text.includes('emerald') || text.includes('silk') || text.includes('green')) return products[3];
  if (text.includes('georgette') || text.includes('hijab') || text.includes('stole')) return products[4];
  return null;
}

function extractCustomerEntities(text: string, defaultName?: string) {
  const interested: string[] = [];
  const prod = findMatchingProduct(text);
  if (prod) interested.push(prod.name);

  let city: string | undefined = undefined;
  if (text.includes('karachi')) city = 'Karachi';
  else if (text.includes('lahore')) city = 'Lahore';
  else if (text.includes('islamabad')) city = 'Islamabad';
  else if (text.includes('rawalpindi')) city = 'Rawalpindi';
  else if (text.includes('faisalabad')) city = 'Faisalabad';
  else if (text.includes('multan')) city = 'Multan';
  else if (text.includes('peshawar')) city = 'Peshawar';
  else if (text.includes('quetta')) city = 'Quetta';

  const sizeMatch = matchSizeFromHeight(text);

  return {
    name: defaultName,
    city: city,
    preferred_size: sizeMatch?.size,
    interested_products: interested,
    is_wholesale: text.includes('wholesale') || text.includes('bulk')
  };
}

function createDefaultLeadCard(
  input: ConversationTurnInput,
  score: number,
  temp: 'hot' | 'warm' | 'cold',
  handoff: boolean,
  optOut: boolean
): LeadCard {
  return {
    lead_score: score,
    intent: 'general',
    temperature: temp,
    handoff_required: handoff,
    opt_out: optOut,
    customer_profile: {
      name: input.customerName,
      interested_products: [],
      is_wholesale: false
    },
    summary: 'Standard dialogue turn.'
  };
}
