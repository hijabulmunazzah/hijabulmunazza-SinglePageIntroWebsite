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
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      nav.classList.toggle('active');
      document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', (e) => {
      if (nav.classList.contains('active') && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
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

  // Wire all dynamic Social Hub buttons across pages
  document.querySelectorAll('.btn-social-wa').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.productTitle || btn.closest('.product-card')?.querySelector('.product-title')?.textContent?.trim() || '';
      const url = config.getWhatsAppUrl(title);
      window.open(url, '_blank');
    });
  });

  document.querySelectorAll('.btn-social-ig').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.productTitle || btn.closest('.product-card')?.querySelector('.product-title')?.textContent?.trim() || '';
      const url = config.getInstagramDmUrl(title);
      window.open(url, '_blank');
    });
  });

  document.querySelectorAll('.btn-social-tt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = config.getTikTokUrl();
      window.open(url, '_blank');
    });
  });

  // ==========================================================================
  // VIP REMEMBER ME MODAL (DISCOUNT VOUCHER)
  // ==========================================================================
  const rememberModal = document.querySelector('#rememberModal');
  const openModalBtn = document.querySelector('#openRememberModal');
  const openVipNavBtn = document.querySelector('#openVipNavBtn');
  const closeModalBtn = document.querySelector('#closeRememberModal');
  const rememberForm = document.querySelector('#rememberForm');
  const rememberSuccess = document.querySelector('#rememberSuccess');
  const closeSuccessBtn = document.querySelector('#closeSuccessBtn');
  const tabPhoneBtn = document.querySelector('#tabPhoneBtn');
  const tabEmailBtn = document.querySelector('#tabEmailBtn');
  const fieldPhoneGroup = document.querySelector('#fieldPhoneGroup');
  const fieldEmailGroup = document.querySelector('#fieldEmailGroup');
  const rememberPhoneInput = document.querySelector('#rememberPhone');
  const rememberEmailInput = document.querySelector('#rememberEmail');
  const errorMsg = document.querySelector('#rememberError');

  let activeContactTab = 'phone';

  function switchContactTab(tab) {
    activeContactTab = tab;
    if (errorMsg) errorMsg.style.display = 'none';

    if (tab === 'phone') {
      tabPhoneBtn?.classList.add('active');
      tabEmailBtn?.classList.remove('active');
      if (fieldPhoneGroup) fieldPhoneGroup.style.display = 'block';
      if (fieldEmailGroup) fieldEmailGroup.style.display = 'none';
      rememberPhoneInput?.focus();
    } else {
      tabEmailBtn?.classList.add('active');
      tabPhoneBtn?.classList.remove('active');
      if (fieldEmailGroup) fieldEmailGroup.style.display = 'block';
      if (fieldPhoneGroup) fieldPhoneGroup.style.display = 'none';
      rememberEmailInput?.focus();
    }
  }

  if (tabPhoneBtn) tabPhoneBtn.addEventListener('click', () => switchContactTab('phone'));
  if (tabEmailBtn) tabEmailBtn.addEventListener('click', () => switchContactTab('email'));

  if (rememberPhoneInput) {
    rememberPhoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (errorMsg) errorMsg.style.display = 'none';
    });
  }

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
      if (rememberForm) rememberForm.style.display = 'none';
      if (rememberSuccess) {
        rememberSuccess.style.display = 'block';
        const claimBtn = document.querySelector('#claimOnWhatsAppBtn');
        if (claimBtn && saved) {
          const text = window.HUMTracker ?
            window.HUMTracker.getWhatsAppText(saved) :
            `Assalam o Alaikum Hijab ul Munnazah! Maine VIP Remember Me join kiya hai. Mera Rs. 500 Discount Voucher (HUM-VIP500) confirm karein.`;
          claimBtn.href = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(text)}`;
        }
      }
    } else {
      if (rememberForm) rememberForm.style.display = 'block';
      if (rememberSuccess) rememberSuccess.style.display = 'none';
      if (saved && document.querySelector('#rememberName')) {
        document.querySelector('#rememberName').value = saved.name || '';
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

  // Handle VIP form submit
  if (rememberForm) {
    rememberForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.querySelector('#rememberName')?.value.trim();
      let normalizedPhone = null;
      let normalizedEmail = null;

      if (!name) {
        if (errorMsg) {
          errorMsg.textContent = 'Baraye meharbani apna naam darj karein.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      if (activeContactTab === 'phone') {
        const rawPhone = rememberPhoneInput?.value.replace(/\D/g, '').trim();
        if (!rawPhone || rawPhone.length < 10) {
          if (errorMsg) {
            errorMsg.textContent = 'Durust Pakistani phone number darj karein (e.g. 0307 1771829).';
            errorMsg.style.display = 'block';
          }
          return;
        }
        normalizedPhone = rawPhone.startsWith('0') ? '+92' + rawPhone.substring(1) : '+92' + rawPhone;
      } else {
        const rawEmail = rememberEmailInput?.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!rawEmail || !emailRegex.test(rawEmail)) {
          if (errorMsg) {
            errorMsg.textContent = 'Durust email address darj karein (e.g. name@gmail.com).';
            errorMsg.style.display = 'block';
          }
          return;
        }
        normalizedEmail = rawEmail.toLowerCase();
      }

      // Save customer locally
      const customerData = {
        name,
        phone: normalizedPhone,
        email: normalizedEmail,
        joinedAt: new Date().toISOString()
      };
      localStorage.setItem('hum_saved_customer', JSON.stringify(customerData));

      // 30 Days Snooze
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('hum_vip_submitted_until', (Date.now() + thirtyDays).toString());
      sessionStorage.setItem('hum_vip_dismissed', 'true');

      // WhatsApp Claim Button Link
      const claimBtn = document.querySelector('#claimOnWhatsAppBtn');
      if (claimBtn) {
        const text = window.HUMTracker ?
          window.HUMTracker.getWhatsAppText(customerData) :
          `Assalam o Alaikum Hijab ul Munnazah! Maine VIP Remember Me join kiya hai. Mera Rs. 500 Discount Voucher (HUM-VIP500) confirm karein.`;
        claimBtn.href = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(text)}`;
      }

      rememberForm.style.display = 'none';
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
