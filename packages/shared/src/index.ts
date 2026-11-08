export interface BrandConfig {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  supportEmail: string;
  handles: {
    instagram: string;
    facebook: string;
    tiktok: string;
    whatsappNumber: string;
    whatsappDisplay: string;
  };
  tone: string;
  colours: {
    gold: string;
    primary: string;
    dark: string;
    whatsapp: string;
  };
  modestyRules: {
    fit: string;
    headCoverage: string;
    models: string;
    transparency: string;
  };
  catalog: {
    type: string;
    currency: string;
    allowDirectWebsiteOrders: boolean;
    salesChannels: string[];
  };
}

export interface ContactLead {
  id?: string;
  brand_id: string;
  name: string;
  whatsapp: string;
  email?: string;
  consent_whatsapp: boolean;
  consent_email: boolean;
  consent_text?: string;
  source_page?: string;
  utm?: Record<string, string>;
  created_at?: string;
}

export interface Conversation {
  id: string;
  brand_id: string;
  contact_id?: string;
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'email';
  external_thread_id?: string;
  status: 'active' | 'handoff' | 'closed';
  lead_score: number;
  created_at: string;
  updated_at: string;
}

export interface ContentJob {
  id: string;
  brand_id: string;
  prompt: string;
  raw_image_url?: string;
  generated_image_url?: string;
  captions: {
    urdu?: string;
    english?: string;
    hashtags?: string[];
  };
  status: 'pending' | 'approved' | 'rejected' | 'published';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}
