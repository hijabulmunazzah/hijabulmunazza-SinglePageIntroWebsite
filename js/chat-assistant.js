/**
 * Hijab ul Munnazah — Floating Chat Assistant & Mobile Bottom Sheet
 * Inspired by TaxiDex Assistant (Proactive Prompt + Mobile Native Bottom Sheet)
 */

(function () {
  'use strict';

  function getOwnerWhatsAppNumber() {
    return (window.HUM_CONFIG && window.HUM_CONFIG.whatsappNumber)
      ? window.HUM_CONFIG.whatsappNumber
      : '923071771829';
  }

  function getWhatsAppUrl() {
    let text = '';
    const currentProd = document.querySelector('#detailHeadingTitle')?.textContent?.trim();
    const currentShade = document.querySelector('#selectedColorLabel')?.textContent?.trim();

    text = currentProd
      ? `Assalam o Alaikum! Mujhe ${currentProd} (${currentShade || 'Default'}) ke baray mein sawal hai.`
      : `Assalam o Alaikum Hijab-ul-Munnazah! Mujhe French Jilbabs aur factory wholesale rates ke baray mein maloomat chahiye.`;

    try {
      if (window.HUMTracker && typeof window.HUMTracker.getBrowsingContextText === 'function') {
        const ctx = window.HUMTracker.getBrowsingContextText();
        if (ctx) text += `\n\n${ctx}`;
      }
    } catch (e) {}

    const num = getOwnerWhatsAppNumber();
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  }

  function initChatAssistant() {
    // If wrapper already exists, use it; otherwise create and inject it
    let wrapper = document.querySelector('#chatAssistantWrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'chatAssistantWrapper';
      wrapper.className = 'chat-assistant-wrapper';
      wrapper.innerHTML = `
        <!-- Mobile Backdrop -->
        <div class="sheet-backdrop" id="sheetBackdrop" aria-hidden="true"></div>

        <!-- Assistant Bottom Sheet / Card (Open by default like TaxiDex) -->
        <div class="chat-assistant-card open" id="chatAssistantCard" role="dialog" aria-labelledby="assistantTitle" aria-hidden="false">
          <!-- Subtle Brand Watermark (TaxiDex style) -->
          <div class="sheet-watermark" aria-hidden="true">Hijab-ul-Munnazah</div>

          <!-- Mobile Grab / Drag Handle -->
          <div class="sheet-grab-bar" aria-hidden="true"></div>

          <!-- Header -->
          <div class="sheet-header">
            <div class="sheet-avatar">
              <img src="images/logo.png" alt="Hijab-ul-Munnazah Emblem" />
            </div>
            <div class="sheet-header-text">
              <div class="sheet-title" id="assistantTitle">
                Hijab-ul-Munnazah Assistant
              </div>
              <div class="sheet-subtitle">
                Answers in seconds — a person can join
              </div>
            </div>
            <button type="button" class="sheet-close-btn" id="closeAssistantBtn" aria-label="Close assistant">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="sheet-body">
            <p>
              Welcome back 👋 Want to pick up where you left off — pricing, shades, or custom sizing?
            </p>
          </div>

          <!-- Actions (Single full-width Continue button — Book a Demo removed) -->
          <div class="sheet-actions single-action">
            <a href="#" class="sheet-btn-primary" id="assistantContinueBtn" target="_blank">
              Continue
            </a>
          </div>
        </div>

        <!-- Floating Trigger Pill ("Chat with us") -->
        <button type="button" class="chat-pill-btn" id="toggleAssistantBtn" aria-label="Chat with us" aria-expanded="false">
          <span class="chat-pill-pulse"></span>
          <i class="fas fa-comment-dots chat-pill-icon"></i>
          <span>Chat with us</span>
        </button>
      `;
      document.body.appendChild(wrapper);
    }

    const card = wrapper.querySelector('#chatAssistantCard');
    const backdrop = wrapper.querySelector('#sheetBackdrop');
    const toggleBtn = wrapper.querySelector('#toggleAssistantBtn');
    const closeBtn = wrapper.querySelector('#closeAssistantBtn');
    const continueBtn = wrapper.querySelector('#assistantContinueBtn');

    function openAssistant() {
      card.classList.add('open');
      backdrop.classList.add('active');
      card.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (continueBtn) continueBtn.href = getWhatsAppUrl();
    }

    function closeAssistant(userDismissed = false) {
      card.classList.remove('open');
      backdrop.classList.remove('active');
      card.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      if (userDismissed) {
        try {
          sessionStorage.setItem('hum_assistant_dismissed', 'true');
        } catch (e) {}
      }
    }

    // Toggle button
    toggleBtn.addEventListener('click', () => {
      if (card.classList.contains('open')) {
        closeAssistant(true);
      } else {
        openAssistant();
      }
    });

    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAssistant(true);
    });

    // Backdrop click (mobile)
    backdrop.addEventListener('click', () => {
      closeAssistant(true);
    });

    // Continue button
    continueBtn.addEventListener('click', () => {
      continueBtn.href = getWhatsAppUrl();
      closeAssistant(false);
    });

    // Touch Swipe Down on Mobile to Dismiss
    let touchStartY = 0;
    card.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchEndY - touchStartY > 60) {
        closeAssistant(true);
      }
    }, { passive: true });

    // Scroll trigger: "on scroll pr remember me ka dilog"
    let scrollTriggered = false;
    window.addEventListener('scroll', () => {
      if (scrollTriggered) return;
      if (window.scrollY > 150) {
        scrollTriggered = true;
        try {
          if (!sessionStorage.getItem('hum_assistant_dismissed')) {
            openAssistant();
          }
        } catch (e) {
          openAssistant();
        }
      }
    }, { passive: true });

    // Proactive Auto-Open: Gently pops up after 3 seconds unless dismissed
    try {
      const isDismissed = sessionStorage.getItem('hum_assistant_dismissed');
      if (!isDismissed) {
        setTimeout(() => {
          if (!card.classList.contains('open')) {
            openAssistant();
          }
        }, 3000);
      }
    } catch (e) {
      setTimeout(openAssistant, 3000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatAssistant);
  } else {
    initChatAssistant();
  }
})();
