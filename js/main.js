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
  // SHOPPING CART ENGINE (localStorage backed)
  // ==========================================================================
  const CART_STORAGE_KEY = 'hum_cart_items';
  const FREE_SHIPPING_THRESHOLD = 2500;
  const STANDARD_SHIPPING_FEE = 200;

  function getCart() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      updateCartUI();
    } catch (e) {}
  }

  function addToCart(item) {
    const cart = getCart();
    const existingIndex = cart.findIndex(c => c.id === item.id && c.variant === item.variant);
    if (existingIndex > -1) {
      cart[existingIndex].qty += (item.qty || 1);
    } else {
      cart.push({
        id: item.id,
        title: item.title,
        variant: item.variant || 'Standard',
        price: Number(item.price),
        image: item.image,
        qty: item.qty || 1
      });
    }
    saveCart(cart);
    showToast(`${item.title} added to Bag!`, 'fa-shopping-bag');
    openCartDrawer();
  }
  window.addToCart = addToCart;

  function updateItemQty(index, delta) {
    const cart = getCart();
    if (cart[index]) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
      saveCart(cart);
    }
  }

  function removeCartItem(index) {
    const cart = getCart();
    if (cart[index]) {
      cart.splice(index, 1);
      saveCart(cart);
    }
  }

  function updateCartUI() {
    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Update Badges
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    // Update Drawer Elements
    const listEl = document.querySelector('#cartItemsList');
    const subtotalEl = document.querySelector('#cartSubtotalVal');
    const meterFill = document.querySelector('#shippingBarFill');
    const meterText = document.querySelector('#shippingMeterText');
    const checkoutBtn = document.querySelector('#cartCheckoutBtn');

    if (subtotalEl) {
      subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    }

    if (meterFill && meterText) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        meterFill.style.width = '100%';
        meterFill.style.background = '#2E7D32';
        meterText.innerHTML = '🎉 <strong>Mubarak!</strong> You have unlocked <strong>FREE Nationwide Delivery</strong>!';
      } else {
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        meterFill.style.width = `${pct}%`;
        meterFill.style.background = 'var(--color-badge-wholesale)';
        meterText.innerHTML = `Add <strong>Rs. ${remaining.toLocaleString()}</strong> more to get <strong>FREE Delivery</strong>!`;
      }
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = cart.length === 0;
    }

    if (listEl) {
      if (cart.length === 0) {
        listEl.innerHTML = `
          <div class="cart-empty-state">
            <i class="fas fa-shopping-bag"></i>
            <h4>Your Bag is Empty</h4>
            <p>Explore our premium hijabs and wholesale bundles!</p>
            <a href="collection.html" class="btn btn-primary btn-sm" style="margin-top: 14px;">Browse Collection</a>
          </div>
        `;
      } else {
        listEl.innerHTML = cart.map((item, idx) => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="this.src='images/logo.png'">
            <div class="cart-item-details">
              <h5 class="cart-item-title">${item.title}</h5>
              <span class="cart-item-variant"><i class="fas fa-tag"></i> ${item.variant}</span>
              <div class="cart-item-bottom">
                <div class="cart-item-qty">
                  <button type="button" class="cart-qty-btn" onclick="window.updateCartQty(${idx}, -1)">−</button>
                  <span class="cart-qty-val">${item.qty}</span>
                  <button type="button" class="cart-qty-btn" onclick="window.updateCartQty(${idx}, 1)">+</button>
                </div>
                <div style="display:flex; align-items:center;">
                  <span class="cart-item-price">Rs. ${(item.price * item.qty).toLocaleString()}</span>
                  <button type="button" class="cart-item-remove" onclick="window.removeCartItemAt(${idx})" title="Remove">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  window.updateCartQty = updateItemQty;
  window.removeCartItemAt = removeCartItem;

  // Drawer Open / Close
  const cartDrawer = document.querySelector('#cartDrawer');
  const cartOverlay = document.querySelector('#cartOverlay');
  const cartToggleBtns = document.querySelectorAll('.cart-toggle-btn');
  const cartCloseBtn = document.querySelector('#cartCloseBtn');

  function openCartDrawer() {
    if (cartDrawer && cartOverlay) {
      updateCartUI();
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  cartToggleBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openCartDrawer();
  }));

  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  // Initial cart UI render
  updateCartUI();

  // ==========================================================================
  // CHECKOUT (CASH ON DELIVERY) MODAL & WHATSAPP ORDER DISPATCH
  // ==========================================================================
  const checkoutModal = document.querySelector('#checkoutModal');
  const openCheckoutBtn = document.querySelector('#cartCheckoutBtn');
  const closeCheckoutBtn = document.querySelector('#closeCheckoutModal');
  const checkoutForm = document.querySelector('#checkoutForm');
  const checkoutError = document.querySelector('#checkoutError');

  function openCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
      showToast('Your bag is empty! Add products first.', 'fa-exclamation-circle');
      return;
    }
    closeCartDrawer();
    if (checkoutModal) {
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const finalTotal = subtotal + shipping;

      const subtotalEl = document.querySelector('#checkoutSubtotal');
      const shippingEl = document.querySelector('#checkoutShipping');
      const totalEl = document.querySelector('#checkoutFinalTotal');

      if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
      if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `Rs. ${shipping}`;
      if (totalEl) totalEl.textContent = `Rs. ${finalTotal.toLocaleString()}`;

      // Pre-fill name/phone from saved VIP session if any
      try {
        const saved = JSON.parse(localStorage.getItem('hum_saved_customer') || '{}');
        if (saved.name && document.querySelector('#custName')) {
          document.querySelector('#custName').value = saved.name;
        }
        if (saved.phone && document.querySelector('#custPhone')) {
          document.querySelector('#custPhone').value = saved.phone.replace('+92', '03');
        }
      } catch (e) {}

      checkoutModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCheckout() {
    if (checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (openCheckoutBtn) openCheckoutBtn.addEventListener('click', openCheckout);
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckout);
  if (checkoutModal) {
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) closeCheckout();
    });
  }

  if (checkoutForm) {
    const phoneInput = document.querySelector('#custPhone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
      });
    }

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cart = getCart();
      if (cart.length === 0) return;

      const name = document.querySelector('#custName')?.value.trim();
      const rawPhone = document.querySelector('#custPhone')?.value.replace(/\D/g, '').trim();
      const city = document.querySelector('#custCity')?.value.trim();
      const address = document.querySelector('#custAddress')?.value.trim();
      const note = document.querySelector('#custNote')?.value.trim();

      if (!name || !rawPhone || !city || !address) {
        if (checkoutError) {
          checkoutError.textContent = 'Baraye meharbani tamam zaroori details darj karein.';
          checkoutError.style.display = 'block';
        }
        return;
      }

      if (rawPhone.length < 10 || rawPhone.length > 11) {
        if (checkoutError) {
          checkoutError.textContent = 'Durust Pakistani phone number darj karein (e.g. 0307 1771829).';
          checkoutError.style.display = 'block';
        }
        return;
      }

      const normalizedPhone = rawPhone.startsWith('0') ? '+92' + rawPhone.substring(1) : '+92' + rawPhone;
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
      const finalTotal = subtotal + shipping;

      // Construct Order Receipt
      let orderMsg = `*🌸 NAYI ORDER CONFIRMATION — HIJAB UL MUNNAZAH 🌸*\n\n`;
      orderMsg += `*Customer Details:*\n`;
      orderMsg += `👤 Naam: ${name}\n`;
      orderMsg += `📱 Phone/WhatsApp: ${normalizedPhone}\n`;
      orderMsg += `📍 Shehar: ${city}\n`;
      orderMsg += `🏠 Mukammal Address: ${address}\n`;
      if (note) orderMsg += `📝 Order Note: ${note}\n`;

      orderMsg += `\n*Selected Items (Manufacturer Rates):*\n`;
      cart.forEach((it, i) => {
        orderMsg += `${i + 1}. ${it.title} (${it.variant}) x ${it.qty} = Rs. ${(it.price * it.qty).toLocaleString()}\n`;
      });

      orderMsg += `\n*Order Summary:*\n`;
      orderMsg += `Subtotal: Rs. ${subtotal.toLocaleString()}\n`;
      orderMsg += `Delivery Charges: ${shipping === 0 ? 'FREE (Special Offer)' : 'Rs. ' + shipping}\n`;
      orderMsg += `*Grand Total (Cash on Delivery): Rs. ${finalTotal.toLocaleString()}*\n`;
      orderMsg += `\n*Policy:* Parcel khol kar pehle tasalli se check karein, phir payment karein.`;

      // Save customer details for re-use
      localStorage.setItem('hum_saved_customer', JSON.stringify({
        name,
        phone: normalizedPhone,
        city,
        address
      }));

      // Clear Cart
      saveCart([]);

      // Close modal
      closeCheckout();

      // Open WhatsApp
      const waUrl = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(orderMsg)}`;
      window.open(waUrl, '_blank');

      showToast('Order generated! Opening WhatsApp...', 'fa-check-circle');
    });
  }

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
