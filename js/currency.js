/**
 * Hijab ul Munnazah — Country & Currency Selector
 * Inspired by trueawrah.com (Header pill -> Searchable country picker -> Live price conversion)
 */

(function () {
  'use strict';

  const COUNTRIES = [
    { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰', locale: 'ur-PK' },
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦', locale: 'ar-SA' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪', locale: 'ar-AE' },
    { code: 'QA', name: 'Qatar', currency: 'QAR', flag: '🇶🇦', locale: 'ar-QA' },
    { code: 'KW', name: 'Kuwait', currency: 'KWD', flag: '🇰🇼', locale: 'ar-KW' },
    { code: 'OM', name: 'Oman', currency: 'OMR', flag: '🇴🇲', locale: 'ar-OM' },
    { code: 'BH', name: 'Bahrain', currency: 'BHD', flag: '🇧🇭', locale: 'ar-BH' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', locale: 'en-GB' },
    { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', locale: 'en-US' },
    { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', locale: 'en-CA' },
    { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', locale: 'en-AU' },
    { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', locale: 'de-DE' },
    { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', locale: 'fr-FR' },
    { code: 'NL', name: 'Netherlands', currency: 'EUR', flag: '🇳🇱', locale: 'nl-NL' },
    { code: 'SE', name: 'Sweden', currency: 'SEK', flag: '🇸🇪', locale: 'sv-SE' },
    { code: 'NO', name: 'Norway', currency: 'NOK', flag: '🇳🇴', locale: 'nb-NO' },
    { code: 'TR', name: 'Turkey', currency: 'TRY', flag: '🇹🇷', locale: 'tr-TR' },
    { code: 'MY', name: 'Malaysia', currency: 'MYR', flag: '🇲🇾', locale: 'ms-MY' },
    { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬', locale: 'en-SG' },
    { code: 'ID', name: 'Indonesia', currency: 'IDR', flag: '🇮🇩', locale: 'id-ID' },
    { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', locale: 'en-IN' },
    { code: 'BD', name: 'Bangladesh', currency: 'BDT', flag: '🇧🇩', locale: 'bn-BD' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦', locale: 'en-ZA' },
    { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬', locale: 'ar-EG' }
  ];

  let ratesData = {
    PKR: 1.0,
    USD: 0.0036,
    SAR: 0.0135,
    AED: 0.0132,
    GBP: 0.00278,
    EUR: 0.00333,
    CAD: 0.0050,
    AUD: 0.0055,
    QAR: 0.0131,
    KWD: 0.0011,
    OMR: 0.00138,
    BHD: 0.00135,
    MYR: 0.016,
    TRY: 0.123,
    INR: 0.303,
    BDT: 0.435,
    SGD: 0.0048,
    ZAR: 0.065,
    NOK: 0.039,
    SEK: 0.038,
    IDR: 57.0,
    EGP: 0.176
  };

  let currentCountry = COUNTRIES[0]; // PK by default

  // Fetch rates.json if available
  fetch('data/rates.json')
    .then(r => r.json())
    .then(data => {
      if (data && data.rates) {
        ratesData = { ...ratesData, ...data.rates };
      }
    })
    .catch(() => {});

  function loadSavedCountry() {
    try {
      const savedCode = localStorage.getItem('hum_currency_country');
      if (savedCode) {
        const found = COUNTRIES.find(c => c.code === savedCode);
        if (found) currentCountry = found;
      }
    } catch (e) {}
  }

  function saveCountry(country) {
    currentCountry = country;
    try {
      localStorage.setItem('hum_currency_country', country.code);
    } catch (e) {}
  }

  function updateHeaderPill() {
    const pill = document.querySelector('#currencyPillBtn');
    if (!pill) return;
    pill.innerHTML = `
      <span>${currentCountry.flag}</span>
      <span>${currentCountry.code} · ${currentCountry.currency}</span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function formatPrice(pkrAmount, targetCountry) {
    if (targetCountry.currency === 'PKR') {
      return `Rs. ${Math.round(pkrAmount).toLocaleString()}`;
    }

    const rate = ratesData[targetCountry.currency] || ratesData['USD'] || 0.0036;
    const converted = pkrAmount * rate;
    const isAboveTen = converted >= 10;
    const rounded = isAboveTen ? Math.round(converted) : Math.round(converted * 10) / 10;

    try {
      const formatter = new Intl.NumberFormat(targetCountry.locale, {
        style: 'currency',
        currency: targetCountry.currency,
        maximumFractionDigits: isAboveTen ? 0 : 1,
        minimumFractionDigits: 0
      });
      return formatter.format(rounded);
    } catch (e) {
      return `${targetCountry.currency} ${rounded}`;
    }
  }

  function convertPagePrices() {
    // 1. Elements with data-pkr
    const priceEls = document.querySelectorAll('[data-pkr], .price-current, .price-original');
    priceEls.forEach(el => {
      let pkr = el.getAttribute('data-pkr');
      if (!pkr) {
        const numMatch = el.textContent.replace(/,/g, '').match(/\d+/);
        if (numMatch) {
          pkr = numMatch[0];
          el.setAttribute('data-pkr', pkr);
          el.setAttribute('data-orig-text', el.textContent.trim());
        }
      }

      if (pkr) {
        const val = parseFloat(pkr);
        if (currentCountry.currency === 'PKR') {
          const orig = el.getAttribute('data-orig-text');
          el.textContent = orig || `Rs. ${val.toLocaleString()}`;
        } else {
          el.textContent = formatPrice(val, currentCountry);
        }
      }
    });

    // 2. Product Detail view if present
    const detailCurrent = document.querySelector('#detailCurrentPrice');
    if (detailCurrent && detailCurrent.hasAttribute('data-pkr')) {
      const val = parseFloat(detailCurrent.getAttribute('data-pkr'));
      detailCurrent.textContent = formatPrice(val, currentCountry);
    }
  }

  function createCurrencyModal() {
    let modal = document.querySelector('#currencyModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'currencyModal';
    modal.className = 'currency-modal-overlay';
    modal.innerHTML = `
      <div class="currency-modal-card" role="dialog" aria-modal="true" aria-labelledby="currencyModalTitle">
        <div class="currency-modal-grab" aria-hidden="true"></div>

        <div class="currency-modal-header">
          <div>
            <h3 class="currency-modal-title" id="currencyModalTitle">Choose your display country</h3>
            <p class="currency-modal-sub">Rounded price estimates. Payment stays in PKR.</p>
          </div>
          <button type="button" class="currency-modal-close" id="closeCurrencyModalBtn" aria-label="Close currency picker">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="currency-search-wrap">
          <svg class="currency-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="currencySearchInput" class="currency-search-input" placeholder="Search country or currency..." autocomplete="off" />
        </div>

        <div class="currency-country-list" id="currencyCountryList">
          <!-- Populated dynamically -->
        </div>

        <div class="currency-modal-footer">
          <span>Prices are shown and charged in PKR.</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#closeCurrencyModalBtn');
    const searchInput = modal.querySelector('#currencySearchInput');

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      renderCountryItems(q);
    });

    return modal;
  }

  function renderCountryItems(filterQuery = '') {
    const list = document.querySelector('#currencyCountryList');
    if (!list) return;

    const filtered = COUNTRIES.filter(c => {
      if (!filterQuery) return true;
      return c.name.toLowerCase().includes(filterQuery) ||
             c.code.toLowerCase().includes(filterQuery) ||
             c.currency.toLowerCase().includes(filterQuery);
    });

    if (filtered.length === 0) {
      list.innerHTML = `<div class="currency-empty-state">No matching countries found</div>`;
      return;
    }

    list.innerHTML = filtered.map(c => {
      const isSelected = c.code === currentCountry.code;
      return `
        <button type="button" class="currency-item-btn ${isSelected ? 'selected' : ''}" data-code="${c.code}">
          <span class="currency-item-flag">${c.flag}</span>
          <div class="currency-item-info">
            <span class="currency-item-name">${c.name}</span>
            <span class="currency-item-currency">${c.code} · ${c.currency}</span>
          </div>
          ${isSelected ? `
            <svg class="currency-item-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </button>
      `;
    }).join('');

    list.querySelectorAll('.currency-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        const picked = COUNTRIES.find(c => c.code === code);
        if (picked) {
          saveCountry(picked);
          updateHeaderPill();
          convertPagePrices();
          const modal = document.querySelector('#currencyModal');
          if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
          }
        }
      });
    });
  }

  function openCurrencyModal() {
    const modal = createCurrencyModal();
    const searchInput = modal.querySelector('#currencySearchInput');
    if (searchInput) searchInput.value = '';
    renderCountryItems();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (searchInput && window.innerWidth >= 640) searchInput.focus();
    }, 150);
  }

  function initCurrency() {
    loadSavedCountry();
    updateHeaderPill();
    convertPagePrices();

    const pillBtn = document.querySelector('#currencyPillBtn');
    if (pillBtn) {
      pillBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCurrencyModal();
      });
    }
  }

  // Expose globally
  window.HUMCurrency = {
    init: initCurrency,
    open: openCurrencyModal,
    convert: convertPagePrices,
    format: formatPrice,
    getCurrent: () => currentCountry
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrency);
  } else {
    initCurrency();
  }
})();
