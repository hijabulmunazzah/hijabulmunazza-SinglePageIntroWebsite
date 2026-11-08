/* ==========================================================================
   Hijab ul Munnazah — Public Configuration
   All social handles, public numbers, and analytics IDs (no secrets here).
   ========================================================================== */

window.HUM_CONFIG = {
  brandName: 'Hijab ul Munnazah',
  tagline: 'Pure Modest Elegance & Manufacturer Wholesale Collection',
  
  // Social Handles & Channels
  instagramUsername: 'hijabulmunazzah.pk', // Default handle (change anytime)
  facebookPageUrl: 'https://facebook.com/hijabulmunazzah', // Default FB page
  tiktokUrl: 'https://www.tiktok.com/@hijabulmunazzah', // Default TikTok handle
  whatsappNumber: '923071771829', // Hijab WhatsApp Number (923071771829)
  whatsappDisplay: '+92 307 1771829',

  // Backend & Database (Supabase REST API)
  // Fill these with your Supabase project settings
  supabaseUrl: '', // e.g. 'https://your-project.supabase.co'
  supabaseAnonKey: '', // Public anon key only (NEVER paste service_role secret here)

  // Analytics IDs (GA4 & Meta Pixel)
  ga4Id: '', // e.g. 'G-XXXXXXXXXX'
  metaPixelId: '', // e.g. '123456789012345'

  // Analytics event dispatcher
  trackEvent: function(eventName, params) {
    params = params || {};
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', eventName, params);
      }
    } catch (e) {
      console.warn('Analytics event dispatch error:', e);
    }
  },

  // Helper generators with UTM tracking
  getWhatsAppUrl: function(productTitle, pageSource) {
    const page = pageSource || (window.location.pathname.split('/').pop() || 'index.html');
    let text = `Assalam o Alaikum Hijab ul Munnazah! Mujhe ${productTitle ? `apki product "${productTitle}"` : 'apki latest collection'} ke baray mein maloomat aur wholesale rates chahiye.`;
    
    // Append tracker context if available
    try {
      if (window.HUMTracker && typeof window.HUMTracker.getBrowsingContextText === 'function') {
        const ctx = window.HUMTracker.getBrowsingContextText();
        if (ctx) text += `\n\n${ctx}`;
      }
    } catch (e) {}

    text += `\n\n[Ref: ${page} | UTM: website-button]`;
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
  },

  getInstagramDmUrl: function(productTitle, pageSource) {
    const page = pageSource || (window.location.pathname.split('/').pop() || 'index.html');
    // ig.me link directly opens DM with the user on Instagram app/web
    return `https://ig.me/m/${this.instagramUsername}?ref=${encodeURIComponent(`utm_source=website&utm_medium=button&utm_campaign=${page}${productTitle ? `&item=${encodeURIComponent(productTitle)}` : ''}`)}`;
  },

  getTikTokUrl: function(pageSource) {
    return `${this.tiktokUrl}`;
  },

  getFacebookUrl: function(pageSource) {
    return `${this.facebookPageUrl}`;
  }
};
