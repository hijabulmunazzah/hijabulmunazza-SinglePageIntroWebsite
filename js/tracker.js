/**
 * Hijab ul Munnazah — Pure Modest Fashion
 * Visitor Journey & Customer Engagement Tracker
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'hum_visitor_journey';
  const SESSION_START_KEY = 'hum_session_start';
  const OWNER_PHONE = '923071771829'; // Hijab ul Munnazah Official Business WhatsApp

  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }

  function getJourney() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveJourney(journey) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
    } catch (e) {}
  }

  let currentPageName = 'Home';
  let currentProduct = null;
  let currentVariant = null;
  let pageEnterTime = Date.now();

  function identifyPage() {
    const path = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('id');

    if (path.includes('product.html')) {
      currentPageName = 'Product View: ' + (prodId || 'Featured Hijab');
      currentProduct = prodId || 'Royal Chiffon Georgette';
    } else if (path.includes('collection.html')) {
      currentPageName = 'Complete Collection';
    } else if (path.includes('contact.html')) {
      currentPageName = 'Contact & Wholesale Page';
    } else if (path.includes('faq.html')) {
      currentPageName = 'FAQ Page';
    } else if (path.includes('privacy-policy.html')) {
      currentPageName = 'Privacy Policy';
    } else if (path.includes('terms-and-conditions.html')) {
      currentPageName = 'Terms & Conditions';
    } else {
      currentPageName = 'Home Page';
    }
  }

  identifyPage();

  function recordDwellTime() {
    const durationSec = Math.round((Date.now() - pageEnterTime) / 1000);
    if (durationSec <= 1) return;

    const journey = getJourney();
    let label = currentPageName;
    if (currentVariant) {
      label += ` (${currentVariant})`;
    }

    const lastEntry = journey[journey.length - 1];
    if (lastEntry && lastEntry.page === label) {
      lastEntry.dwellSeconds = (lastEntry.dwellSeconds || 0) + durationSec;
      lastEntry.timestamp = new Date().toISOString();
    } else {
      journey.push({
        page: label,
        dwellSeconds: durationSec,
        timestamp: new Date().toISOString()
      });
    }

    if (journey.length > 25) journey.shift();
    saveJourney(journey);
    pageEnterTime = Date.now();
  }

  setInterval(recordDwellTime, 10000);
  window.addEventListener('beforeunload', recordDwellTime);

  window.HUMTracker = {
    setProductVariant: function (variant) {
      currentVariant = variant;
    },
    getDossier: function () {
      recordDwellTime();
      const journey = getJourney();
      if (journey.length === 0) return 'Direct Visit';
      return journey.map(j => `${j.page} (~${j.dwellSeconds || 5}s)`).join(' ➔ ');
    },
    getWhatsAppText: function (customer) {
      const dossier = this.getDossier();
      let text = `Assalam o Alaikum Hijab ul Munnazah!\n`;
      text += `Mera Naam: ${customer.name || 'Customer'}\n`;
      if (customer.phone) text += `Phone / WhatsApp: ${customer.phone}\n`;
      if (customer.email) text += `Email: ${customer.email}\n`;
      text += `\nMain VIP Member ke tor par Rs. 500 Discount Voucher (HUM-VIP500) hasil karna chahti hoon.\n`;
      text += `\nBrowsing Context: ${dossier}`;
      return text;
    }
  };
})();
