/* ==========================================================================
   Hijab ul Munnazah — Main Application JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const OWNER_WHATSAPP = '923071771829'; // 0307 1771829

  // ---------- Header Scroll Effect ----------
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
    header.classList.toggle('scrolled', window.scrollY > 20);
  }

  // ---------- Mobile Menu Toggle ----------
  const menuToggle = document.querySelector('#mobileMenuBtn, .hamburger-btn, .menu-toggle');
  const nav = document.querySelector('#mobileNavOverlay, .nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuToggle.classList.toggle('active');
      nav.classList.toggle('open');
      nav.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('.mobile-nav-link, .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('open');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', (e) => {
      if ((nav.classList.contains('open') || nav.classList.contains('active')) && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        nav.classList.remove('open');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ---------- Active Nav Link Indicator ----------
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---------- Toast Notification System ----------
  function showToast(message, icon = 'fa-check') {
    let toast = document.querySelector('#humToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'humToast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas ${icon}" style="color: var(--color-gold);"></i> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
  window.showToast = showToast;

  // ==========================================================================
  // SOCIAL HUB ENGINE (Instagram DM, WhatsApp, TikTok)
  // Replaces direct cart/checkout as per Phase 1A architecture
  // ==========================================================================
  const config = window.HUM_CONFIG || {
    whatsappNumber: OWNER_WHATSAPP,
    instagramUsername: 'hijabulmunazzah.pk',
    tiktokUrl: 'https://www.tiktok.com/@hijabulmunazzah',
    facebookPageUrl: 'https://facebook.com/hijabulmunazzah',
    getWhatsAppUrl: (title, page) => `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent('Assalam o Alaikum! Mujhe ' + (title || 'collection') + ' ke baray mein janna hai.')}`,
    getInstagramDmUrl: (title, page) => `https://ig.me/m/hijabulmunazzah.pk`,
    getTikTokUrl: () => `https://www.tiktok.com/@hijabulmunazzah`
  };

  // ---------- Analytics Initialization (GA4 & Meta Pixel) ----------
  if (config.ga4Id && config.ga4Id.trim() !== '') {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4Id)}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', config.ga4Id);
  }

  if (config.metaPixelId && config.metaPixelId.trim() !== '') {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', config.metaPixelId);
    fbq('track', 'PageView');
  }

  // Wire all dynamic Social Hub buttons across pages with Analytics tracking
  document.querySelectorAll('.btn-social-wa').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.productTitle || btn.closest('.product-card')?.querySelector('.product-title')?.textContent?.trim() || '';
      if (typeof config.trackEvent === 'function') {
        config.trackEvent('click_whatsapp', { item: title, page: window.location.pathname });
      }
      const url = config.getWhatsAppUrl(title);
      window.open(url, '_blank');
    });
  });

  document.querySelectorAll('.btn-social-ig').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.productTitle || btn.closest('.product-card')?.querySelector('.product-title')?.textContent?.trim() || '';
      if (typeof config.trackEvent === 'function') {
        config.trackEvent('click_instagram', { item: title, page: window.location.pathname });
      }
      const url = config.getInstagramDmUrl(title);
      window.open(url, '_blank');
    });
  });

  document.querySelectorAll('.btn-social-tt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof config.trackEvent === 'function') {
        config.trackEvent('click_tiktok', { page: window.location.pathname });
      }
      const url = config.getTikTokUrl();
      window.open(url, '_blank');
    });
  });

  // ==========================================================================
  // LATEST FROM INSTAGRAM FEED (reads data/posts.json)
  // ==========================================================================
  const feedContainer = document.querySelector('#instagramFeedGrid');
  if (feedContainer) {
    fetch('data/posts.json')
      .then(res => {
        if (!res.ok) throw new Error('Posts not found');
        return res.json();
      })
      .then(posts => {
        if (!Array.isArray(posts) || posts.length === 0) return;
        feedContainer.innerHTML = posts.map(post => `
          <a href="${post.permalink || 'https://instagram.com/hijabulmunazzah.pk'}" target="_blank" class="instagram-card">
            <div class="instagram-media-wrap">
              <img src="${post.media_url}" alt="Instagram Post" loading="lazy" onerror="this.src='images/brand-story.jpg'" />
              <span class="instagram-overlay-badge"><i class="fab fa-instagram"></i></span>
            </div>
            <div class="instagram-card-body">
              <p class="instagram-caption">${post.caption}</p>
              <div class="instagram-footer">
                <span><i class="far fa-heart" style="color:#dc2743;"></i> ${post.like_count || 150} likes</span>
                <span style="color:var(--color-primary); font-weight:600;">View &rarr;</span>
              </div>
            </div>
          </a>
        `).join('');
      })
      .catch(err => {
        console.log('Instagram feed loaded statically or offline:', err.message);
      });
  }

  // ==========================================================================
  // OPT-IN FORM (SUPABASE CONTACTS + PECA COMPLIANT CONSENT)
  // ==========================================================================
  const rememberModal = document.querySelector('#rememberModal');
  const openModalBtn = document.querySelector('#openRememberModal');
  const openVipNavBtn = document.querySelector('#openVipNavBtn');
  const closeModalBtn = document.querySelector('#closeRememberModal');
  const optinForm = document.querySelector('#optinForm') || document.querySelector('#rememberForm');
  const rememberSuccess = document.querySelector('#rememberSuccess');
  const closeSuccessBtn = document.querySelector('#closeSuccessBtn');
  const errorMsg = document.querySelector('#optinError') || document.querySelector('#rememberError');

  function shouldShowRememberModal() {
    const now = Date.now();
    const submittedUntil = localStorage.getItem('hum_vip_submitted_until');
    if (submittedUntil && parseInt(submittedUntil, 10) > now) return false;

    const dismissedUntil = localStorage.getItem('hum_vip_dismissed_until');
    if (dismissedUntil && parseInt(dismissedUntil, 10) > now) return false;

    if (sessionStorage.getItem('hum_vip_dismissed')) return false;
    return true;
  }

  function openRememberDialog(isManual = false) {
    if (!rememberModal) return;

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('hum_saved_customer') || 'null');
    } catch (e) {}

    const submittedUntil = localStorage.getItem('hum_vip_submitted_until');
    const isSubmitted = submittedUntil && parseInt(submittedUntil, 10) > Date.now();

    if (isManual && (isSubmitted || saved)) {
      if (optinForm) optinForm.style.display = 'none';
      if (rememberSuccess) {
        rememberSuccess.style.display = 'block';
        const claimBtn = document.querySelector('#claimOnWhatsAppBtn');
        if (claimBtn && saved) {
          const text = window.HUMTracker ?
            window.HUMTracker.getWhatsAppText(saved) :
            `Assalam o Alaikum Hijab ul Munnazah! Maine VIP club join kiya hai. Mera Rs. 500 Discount Voucher (HUM-VIP500) confirm karein.`;
          claimBtn.href = `https://wa.me/${config.whatsappNumber || OWNER_WHATSAPP}?text=${encodeURIComponent(text)}`;
        }
      }
    } else {
      if (optinForm) optinForm.style.display = 'block';
      if (rememberSuccess) rememberSuccess.style.display = 'none';
      if (saved) {
        const nameField = document.querySelector('#optinName') || document.querySelector('#rememberName');
        if (nameField && saved.name) nameField.value = saved.name;
        const phoneField = document.querySelector('#optinPhone') || document.querySelector('#rememberPhone');
        if (phoneField && saved.phone) phoneField.value = saved.phone.replace('+92', '03');
        const emailField = document.querySelector('#optinEmail') || document.querySelector('#rememberEmail');
        if (emailField && saved.email) emailField.value = saved.email;
      }
    }

    rememberModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeRememberDialog() {
    if (rememberModal) {
      rememberModal.classList.remove('active');
      document.body.style.overflow = '';

      const submittedUntil = localStorage.getItem('hum_vip_submitted_until');
      if (!submittedUntil || parseInt(submittedUntil, 10) <= Date.now()) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('hum_vip_dismissed_until', (Date.now() + sevenDays).toString());
      }
      sessionStorage.setItem('hum_vip_dismissed', 'true');
    }
  }

  if (openModalBtn) openModalBtn.addEventListener('click', (e) => { e.preventDefault(); openRememberDialog(true); });
  if (openVipNavBtn) openVipNavBtn.addEventListener('click', (e) => { e.preventDefault(); openRememberDialog(true); });
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeRememberDialog);
  if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeRememberDialog);

  if (rememberModal) {
    rememberModal.addEventListener('click', (e) => {
      if (e.target === rememberModal) closeRememberDialog();
    });
  }

  // Auto trigger after scrolling a bit on Home page
  let scrollTriggered = false;
  window.addEventListener('scroll', () => {
    if (!scrollTriggered && window.scrollY > 150) {
      if (shouldShowRememberModal()) {
        scrollTriggered = true;
        setTimeout(() => openRememberDialog(false), 400);
      }
    }
  });

  // Handle Opt-in form submit
  if (optinForm) {
    const phoneInput = document.querySelector('#optinPhone') || document.querySelector('#rememberPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (errorMsg) errorMsg.style.display = 'none';
      });
    }

    optinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.querySelector('#optinName') || document.querySelector('#rememberName'))?.value.trim();
      const rawPhone = (document.querySelector('#optinPhone') || document.querySelector('#rememberPhone'))?.value.replace(/\D/g, '').trim();
      const rawEmail = (document.querySelector('#optinEmail') || document.querySelector('#rememberEmail'))?.value.trim();
      const consentWA = document.querySelector('#consentWhatsApp')?.checked || false;
      const consentEmail = document.querySelector('#consentEmail')?.checked || false;

      if (!name) {
        if (errorMsg) {
          errorMsg.textContent = 'Baraye meharbani apna mukammal naam darj karein.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      if (!rawPhone || rawPhone.length < 10) {
        if (errorMsg) {
          errorMsg.textContent = 'Durust Pakistani phone number darj karein (e.g. 0307 1771829).';
          errorMsg.style.display = 'block';
        }
        return;
      }

      if (!consentWA && !consentEmail) {
        if (errorMsg) {
          errorMsg.textContent = 'Baraye meharbani kam az kam aik consent option (WhatsApp ya Email) select karein.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      if (rawEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawEmail)) {
          if (errorMsg) {
            errorMsg.textContent = 'Durust email address darj karein (e.g. ayesha@gmail.com).';
            errorMsg.style.display = 'block';
          }
          return;
        }
      }

      const normalizedPhone = rawPhone.startsWith('0') ? '+92' + rawPhone.substring(1) : '+92' + rawPhone;
      const normalizedEmail = rawEmail ? rawEmail.toLowerCase() : null;

      // Extract UTM parameters
      const urlParams = new URLSearchParams(window.location.search);
      const utmObj = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => {
        if (urlParams.get(k)) utmObj[k] = urlParams.get(k);
      });

      const consentTextParts = [];
      if (consentWA) consentTextParts.push('WhatsApp updates for new drops');
      if (consentEmail) consentTextParts.push('Email updates for discount vouchers');
      const consentText = consentTextParts.join('; ');

      // Save customer data in localStorage
      const customerData = {
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
        consent_whatsapp: consentWA,
        consent_email: consentEmail,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('hum_saved_customer', JSON.stringify(customerData));

      // 30 Days Snooze
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('hum_vip_submitted_until', (Date.now() + thirtyDays).toString());
      sessionStorage.setItem('hum_vip_dismissed', 'true');

      // Dispatch to Supabase REST if configured
      if (config.supabaseUrl && config.supabaseAnonKey) {
        fetch(`${config.supabaseUrl}/rest/v1/contacts`, {
          method: 'POST',
          headers: {
            'apikey': config.supabaseAnonKey,
            'Authorization': `Bearer ${config.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            name,
            whatsapp: normalizedPhone,
            email: normalizedEmail,
            consent_whatsapp: consentWA,
            consent_email: consentEmail,
            consent_text: consentText,
            source_page: window.location.pathname.split('/').pop() || 'index.html',
            utm: utmObj
          })
        }).then(res => {
          if (!res.ok) console.warn('Supabase contact response status:', res.status);
        }).catch(err => {
          console.warn('Supabase contact error:', err);
        });
      }

      // Track analytics event
      if (typeof config.trackEvent === 'function') {
        config.trackEvent('optin_submit', {
          source_page: window.location.pathname.split('/').pop() || 'index.html',
          has_whatsapp: !!normalizedPhone,
          has_email: !!normalizedEmail,
          consent_wa: consentWA,
          consent_email: consentEmail
        });
      }

      // Configure claim button
      const claimBtn = document.querySelector('#claimOnWhatsAppBtn');
      if (claimBtn) {
        const text = window.HUMTracker ?
          window.HUMTracker.getWhatsAppText(customerData) :
          `Assalam o Alaikum Hijab ul Munnazah! Maine VIP club join kiya hai. Mera Rs. 500 Discount Voucher (HUM-VIP500) confirm karein.`;
        claimBtn.href = `https://wa.me/${config.whatsappNumber || OWNER_WHATSAPP}?text=${encodeURIComponent(text)}`;
      }

      optinForm.style.display = 'none';
      if (rememberSuccess) rememberSuccess.style.display = 'block';
      showToast('VIP Member joined! Rs. 500 voucher ready.', 'fa-gift');
    });
  }

  // Copy voucher code
  const copyVoucherBtn = document.querySelector('#copyVoucherBtn');
  if (copyVoucherBtn) {
    copyVoucherBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('HUM-VIP500').then(() => {
        showToast('Voucher code HUM-VIP500 copied!', 'fa-copy');
      });
    });
  }

  // ==========================================================================
  // CATEGORY FILTER BUTTONS (Collection & Home)
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.filter-pill-btn');
  const productCards = document.querySelectorAll('.product-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      productCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================================
  // FAQ ACCORDION & CATEGORY SWITCHER
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });

  const faqCatBtns = document.querySelectorAll('.faq-cat-btn');
  faqCatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      faqCatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.category;
      faqItems.forEach(item => {
        if (cat === 'all' || item.dataset.category === cat) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================================
  // CONTACT FORM HANDLER
  // ==========================================================================
  const contactForm = document.querySelector('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = contactForm.querySelector('[name="name"]')?.value.trim();
      const phone = contactForm.querySelector('[name="phone"]')?.value.trim();
      const inquiryType = contactForm.querySelector('[name="type"]')?.value || 'General Inquiry';
      const message = contactForm.querySelector('[name="message"]')?.value.trim();

      let waMsg = `*🌸 INQUIRY — HIJAB UL MUNNAZAH 🌸*\n\n`;
      waMsg += `👤 Naam: ${name}\n`;
      waMsg += `📱 Phone/WhatsApp: ${phone}\n`;
      waMsg += `📋 Inquiry Type: ${inquiryType}\n`;
      waMsg += `💬 Message: ${message}\n`;

      window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(waMsg)}`, '_blank');
      contactForm.reset();
      showToast('Opening WhatsApp with your inquiry...', 'fa-paper-plane');
    });
  }

  // Footer Year
  const yearEl = document.querySelector('#currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
