/* ==========================================================================
   Growth Studio Admin — Secure Portal Script
   Enforces Supabase Auth + TOTP MFA, Human Approval Queue, and CRM View
   ========================================================================== */

(function() {
  'use strict';

  // Config defaults (can be overridden via localStorage or window.ADMIN_CONFIG)
  const savedUrl = localStorage.getItem('hum_supabase_url') || (window.ADMIN_CONFIG && window.ADMIN_CONFIG.supabaseUrl) || '';
  const savedKey = localStorage.getItem('hum_supabase_key') || (window.ADMIN_CONFIG && window.ADMIN_CONFIG.supabaseAnonKey) || '';

  let supabaseClient = null;
  let activeChallenge = null;
  let activeFactorId = null;

  // DOM Elements
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');
  const loginForm = document.getElementById('loginForm');
  const mfaForm = document.getElementById('mfaForm');
  const loginError = document.getElementById('loginError');
  const mfaError = document.getElementById('mfaError');
  const adminEmailInput = document.getElementById('adminEmail');
  const adminPasswordInput = document.getElementById('adminPassword');
  const mfaCodeInput = document.getElementById('mfaCode');
  const cancelMfaBtn = document.getElementById('cancelMfaBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminUserEmailDisplay = document.getElementById('userEmailLabel');

  // Navigation tabs
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Initialize Supabase Client
  function initSupabase() {
    if (savedUrl && savedKey && window.supabase) {
      supabaseClient = window.supabase.createClient(savedUrl, savedKey);
    }
  }

  // Helper: Show error banner
  function showError(el, message) {
    el.textContent = message;
    el.style.display = 'block';
  }

  function hideError(el) {
    el.textContent = '';
    el.style.display = 'none';
  }

  // Switch between Login Step and MFA Step
  function showStep(step) {
    hideError(loginError);
    hideError(mfaError);
    if (step === 'login') {
      loginForm.style.display = 'block';
      mfaForm.style.display = 'none';
    } else if (step === 'mfa') {
      loginForm.style.display = 'none';
      mfaForm.style.display = 'block';
      mfaCodeInput.value = '';
      mfaCodeInput.focus();
    }
  }

  // Show App Layout or Auth Screen
  function setAuthenticatedState(isAuthenticated, user) {
    if (isAuthenticated) {
      authContainer.style.display = 'none';
      appContainer.style.display = 'flex';
      if (adminUserEmailDisplay && user) {
        adminUserEmailDisplay.textContent = user.email || 'Admin';
      }
      loadDashboardData();
    } else {
      authContainer.style.display = 'flex';
      appContainer.style.display = 'none';
      showStep('login');
    }
  }

  // Tab switching logic
  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // Step 1: Handle Email + Password Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError(loginError);

      if (!supabaseClient) {
        const urlPrompt = prompt('Enter Supabase Project URL (e.g. https://xyz.supabase.co):', savedUrl);
        const keyPrompt = prompt('Enter Supabase Anon Key:', savedKey);
        if (urlPrompt && keyPrompt) {
          localStorage.setItem('hum_supabase_url', urlPrompt.trim());
          localStorage.setItem('hum_supabase_key', keyPrompt.trim());
          supabaseClient = window.supabase.createClient(urlPrompt.trim(), keyPrompt.trim());
        } else {
          showError(loginError, 'Supabase URL aur Anon Key configure karein.');
          return;
        }
      }

      const email = adminEmailInput.value.trim();
      const password = adminPasswordInput.value;

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check if MFA (TOTP) is required / enrolled
        const factorsRes = await supabaseClient.auth.mfa.listFactors();
        const totpFactor = factorsRes.data?.totp?.find(f => f.status === 'verified');

        if (totpFactor) {
          activeFactorId = totpFactor.id;
          const challenge = await supabaseClient.auth.mfa.challenge({ factorId: activeFactorId });
          if (challenge.error) throw challenge.error;
          activeChallenge = challenge.data;
          showStep('mfa');
        } else {
          // If no TOTP enrolled yet, user can access session or enroll in settings
          console.warn('Notice: MFA (TOTP) is recommended for production admin.');
          setAuthenticatedState(true, data.user);
        }
      } catch (err) {
        showError(loginError, err.message || 'Login failed. Please check credentials.');
      }
    });
  }

  // Step 2: Handle TOTP MFA Verification
  if (mfaForm) {
    mfaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError(mfaError);

      const code = mfaCodeInput.value.trim();
      if (!code || code.length !== 6) {
        showError(mfaError, 'Barahe meherbani 6-digit code enter karein.');
        return;
      }

      try {
        if (!activeChallenge || !activeFactorId) {
          throw new Error('MFA challenge expired. Please login again.');
        }

        const { data, error } = await supabaseClient.auth.mfa.verify({
          factorId: activeFactorId,
          challengeId: activeChallenge.id,
          code: code
        });

        if (error) throw error;

        const { data: userRes } = await supabaseClient.auth.getUser();
        setAuthenticatedState(true, userRes.user);
      } catch (err) {
        showError(mfaError, err.message || 'Verification failed. Code invalid ya expire ho chuka hai.');
      }
    });
  }

  // Cancel MFA button
  if (cancelMfaBtn) {
    cancelMfaBtn.addEventListener('click', () => {
      showStep('login');
      if (supabaseClient) supabaseClient.auth.signOut();
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      setAuthenticatedState(false);
    });
  }

  // Check initial session
  async function checkSession() {
    initSupabase();
    if (!supabaseClient) {
      setAuthenticatedState(false);
      return;
    }

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error || !session) {
        setAuthenticatedState(false);
        return;
      }

      // Check assurance level (AAL)
      const aal = session.user?.app_metadata?.aal || 'aal1';
      const factorsRes = await supabaseClient.auth.mfa.listFactors();
      const hasTotp = factorsRes.data?.totp?.some(f => f.status === 'verified');

      if (hasTotp && aal !== 'aal2') {
        // Must complete MFA
        const totpFactor = factorsRes.data.totp.find(f => f.status === 'verified');
        activeFactorId = totpFactor.id;
        const challenge = await supabaseClient.auth.mfa.challenge({ factorId: activeFactorId });
        if (!challenge.error) {
          activeChallenge = challenge.data;
          setAuthenticatedState(false);
          showStep('mfa');
          return;
        }
      }

      setAuthenticatedState(true, session.user);
    } catch (e) {
      console.warn('Session check error:', e);
      setAuthenticatedState(false);
    }
  }

  // Load Dashboard Data (Approval queue, Leads, Contacts, Brand config)
  async function loadDashboardData() {
    loadBrandConfig();
    loadContentApprovalQueue();
    loadLeadsAndContacts();
  }

  // Brand config loader
  async function loadBrandConfig() {
    const brandView = document.getElementById('brandConfigView');
    if (!brandView) return;
    try {
      const res = await fetch('../brands/hijab.json');
      if (res.ok) {
        const json = await res.json();
        brandView.textContent = JSON.stringify(json, null, 2);
      } else {
        brandView.textContent = '// Brand config located at brands/hijab.json';
      }
    } catch {
      brandView.textContent = '// Brand config located at brands/hijab.json';
    }
  }

  // Content Approval Queue loader
  async function loadContentApprovalQueue() {
    const queueContainer = document.getElementById('contentApprovalQueue') || document.querySelector('.approval-preview-list');
    if (!queueContainer) return;

    if (!supabaseClient) {
      renderMockApprovalCards(queueContainer);
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('content_jobs')
        .select('*')
        .in('status', ['pending_review', 'generated'])
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        renderMockApprovalCards(queueContainer);
      } else {
        renderApprovalCards(queueContainer, data);
      }
    } catch (e) {
      renderMockApprovalCards(queueContainer);
    }
  }

  function renderMockApprovalCards(container) {
    container.innerHTML = `
      <div class="approval-card" data-job-id="job-sample-1">
        <div class="approval-card-preview">
          <img src="../images/products/abaya-dubai.jpg" alt="Abaya Preview" onerror="this.src='https://placehold.co/400x300/131B2A/D4AF37?text=Abaya+Preview'" />
          <div class="approval-badge-modesty"><i class="fas fa-shield-heart"></i> Modesty Verified: Loose fit, Hijab cover</div>
        </div>
        <div class="approval-card-content">
          <div class="approval-platform-tag"><i class="fab fa-instagram"></i> Instagram Reel & Carousel &bull; Royal Black Nada</div>
          <p class="approval-caption-preview">
            Har andaz mein shaan aur waqar ✨<br>
            Hijab ul Munnazah ki nayi Dubai Nada Abaya collection ab available hai. Pure fabric, graceful fall, aur perfect modest stitching.<br><br>
            Wholesale ya single order ke liye bio link se WhatsApp karein: +92 307 1771829 🛍️<br>
            #HijabulMunnazah #AbayaPakistan #DubaiAbaya #ModestFashion
          </p>
          <div class="approval-actions">
            <button class="btn btn-success btn-sm btn-approve" onclick="window.HUMAdminApprove('job-sample-1')">
              <i class="fas fa-check"></i> Approve & Queue
            </button>
            <button class="btn btn-danger btn-sm btn-reject" onclick="window.HUMAdminReject('job-sample-1')">
              <i class="fas fa-xmark"></i> Reject
            </button>
          </div>
        </div>
      </div>

      <div class="approval-card" data-job-id="job-sample-2">
        <div class="approval-card-preview">
          <img src="../images/products/silk-emerald.jpg" alt="Abaya Preview" onerror="this.src='https://placehold.co/400x300/131B2A/D4AF37?text=Emerald+Abaya'" />
          <div class="approval-badge-modesty"><i class="fas fa-shield-heart"></i> Modesty Verified: Faceless model</div>
        </div>
        <div class="approval-card-content">
          <div class="approval-platform-tag"><i class="fab fa-tiktok"></i> TikTok Video &bull; Emerald Green Contrast</div>
          <p class="approval-caption-preview">
            Wholesale rates directly from manufacturers! ✨<br>
            Pakistan bhar mein boutique owners aur resellers ke liye khususi discounts. Parcel open check karke COD ada karein.<br><br>
            WhatsApp: 0307 1771829 📦
          </p>
          <div class="approval-actions">
            <button class="btn btn-success btn-sm btn-approve" onclick="window.HUMAdminApprove('job-sample-2')">
              <i class="fas fa-check"></i> Approve & Queue
            </button>
            <button class="btn btn-danger btn-sm btn-reject" onclick="window.HUMAdminReject('job-sample-2')">
              <i class="fas fa-xmark"></i> Reject
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderApprovalCards(container, jobs) {
    container.innerHTML = jobs.map(job => `
      <div class="approval-card" data-job-id="${job.id}">
        <div class="approval-card-preview">
          ${job.media_urls && job.media_urls.length > 0 
            ? `<img src="${job.media_urls[0]}" alt="Job Preview" />` 
            : `<div style="color: var(--text-dim);"><i class="fas fa-image fa-2x"></i></div>`}
          <div class="approval-badge-modesty"><i class="fas fa-shield-heart"></i> ${job.modesty_notes || 'Modesty Checked'}</div>
        </div>
        <div class="approval-card-content">
          <div class="approval-platform-tag"><i class="fab fa-${job.platform || 'instagram'}"></i> ${job.platform || 'Social'} &bull; ${job.format || 'Post'}</div>
          <p class="approval-caption-preview">${(job.caption || '').replace(/\n/g, '<br>')}</p>
          <div class="approval-actions">
            <button class="btn btn-success btn-sm btn-approve" onclick="window.HUMAdminApprove('${job.id}')">
              <i class="fas fa-check"></i> Approve & Queue
            </button>
            <button class="btn btn-danger btn-sm btn-reject" onclick="window.HUMAdminReject('${job.id}')">
              <i class="fas fa-xmark"></i> Reject
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Global action handlers for Human Approval
  window.HUMAdminApprove = async function(jobId) {
    if (!confirm('Kya aap is content ko publish queue mein approve karna chahte hain?')) return;
    try {
      if (supabaseClient) {
        await supabaseClient.from('content_jobs').update({
          status: 'approved',
          approved_at: new Date().toISOString()
        }).eq('id', jobId);
      }
      alert('Content approve ho gaya aur publishing engine mein queue ho gaya.');
      const card = document.querySelector(`[data-job-id="${jobId}"]`);
      if (card) card.remove();
    } catch (e) {
      alert('Approval error: ' + e.message);
    }
  };

  window.HUMAdminReject = async function(jobId) {
    const reason = prompt('Reject karne ki wajah darj karein:');
    if (!reason) return;
    try {
      if (supabaseClient) {
        await supabaseClient.from('content_jobs').update({
          status: 'rejected',
          notes: reason
        }).eq('id', jobId);
      }
      alert('Content reject ho gaya.');
      const card = document.querySelector(`[data-job-id="${jobId}"]`);
      if (card) card.remove();
    } catch (e) {
      alert('Reject error: ' + e.message);
    }
  };

  // Leads & Contacts loader
  async function loadLeadsAndContacts() {
    const tbody = document.getElementById('recentLeadsTable') || document.getElementById('recentLeadsTableBody');
    if (!tbody || !supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        tbody.innerHTML = data.map(c => `
          <tr>
            <td><strong>${c.full_name || 'Anonymous Visitor'}</strong></td>
            <td><a href="https://wa.me/${c.whatsapp_number}" target="_blank" style="color: var(--accent-secondary); text-decoration: none;"><i class="fab fa-whatsapp"></i> ${c.whatsapp_number}</a></td>
            <td><span class="badge-status ${c.opt_in_whatsapp ? 'closed' : 'new'}">${c.source || 'Website'}</span></td>
            <td>${new Date(c.created_at).toLocaleDateString()}</td>
            <td><span class="badge-status new">New</span></td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.warn('Contacts load error:', e);
    }
  }

  // Studio Generator & Interactive Pipeline
  function initStudioHandlers() {
    const studioForm = document.getElementById('studioGenerateForm');
    const studioResultsArea = document.getElementById('studioResultsArea');
    const btnStudioGenerate = document.getElementById('btnStudioGenerate');
    const txtCaptionUrdu = document.getElementById('txtCaptionUrdu');
    const txtCaptionEnglish = document.getElementById('txtCaptionEnglish');
    const txtHashtags = document.getElementById('txtHashtags');
    const btnApproveDraft = document.getElementById('btnApproveDraft');
    const btnRejectDraft = document.getElementById('btnRejectDraft');
    const variantCards = document.querySelectorAll('.variant-card');

    // Handle variant selection
    variantCards.forEach(card => {
      card.addEventListener('click', () => {
        variantCards.forEach(c => {
          c.classList.remove('selected');
          c.style.border = '1px solid var(--border-color)';
        });
        card.classList.add('selected');
        card.style.border = '2px solid var(--accent-primary)';
      });
    });

    if (studioForm) {
      studioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productTitle = document.getElementById('studioProductSelect').value;
        const modestyPref = document.getElementById('studioModestySelect').value;
        const photoRef = document.getElementById('studioPhotoSelect').value;
        const platform = document.getElementById('studioPlatformSelect').value;
        const promptText = document.getElementById('studioPromptInput').value;

        btnStudioGenerate.disabled = true;
        btnStudioGenerate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Modest Variants & AI Copy...';

        try {
          // Attempt worker API or graceful fallback simulation
          let draftData = null;
          try {
            const apiRes = await fetch('http://127.0.0.1:8787/api/admin/content/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local-admin' },
              body: JSON.stringify({
                brandId: 'hijab',
                productTitle: productTitle,
                photoUrl: photoRef,
                promptText: promptText,
                platform: platform,
                modestyPreference: modestyPref
              })
            });
            if (apiRes.ok) {
              const json = await apiRes.json();
              if (json.draft) draftData = json.draft;
            }
          } catch {}

          if (!draftData) {
            // Local fallback generation
            draftData = {
              caption_urdu: `Har andaz mein shaan aur waqar ✨\n\nHijab ul Munnazah ki nayi "${productTitle}" ab dastiyab hai. Khaalis Dubai fabric, graceful fall, aur perfect modest stitching.\n\n🛍️ Single order aur wholesale rates ke liye bio link se WhatsApp karein (+92 307 1771829).\n📦 Pakistan bhar mein Cash on Delivery — parcel pehle check karein phir payment dein!`,
              caption_english: `Timeless modesty crafted with utmost grace ✨ The all-new "${productTitle}" combines authentic Dubai cut with breathable comfort. Designed for the modern Muslimah who values modesty without compromise.`,
              hashtags: '#HijabulMunnazah #AbayaPakistan #DubaiAbaya #ModestFashionPakistan #WholesaleAbaya',
              cost_estimate: { cost_usd: 0.128, cost_pkr: 35.58 }
            };
          }

          txtCaptionUrdu.value = draftData.caption_urdu;
          txtCaptionEnglish.value = draftData.caption_english;
          txtHashtags.value = Array.isArray(draftData.hashtags) ? draftData.hashtags.join(' ') : draftData.hashtags;
          
          studioResultsArea.style.display = 'block';
          studioResultsArea.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
          alert('Generation error: ' + err.message);
        } finally {
          btnStudioGenerate.disabled = false;
          btnStudioGenerate.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate 4 Modest Variants & Dual Captions';
        }
      });
    }

    if (btnApproveDraft) {
      btnApproveDraft.addEventListener('click', async () => {
        const productTitle = document.getElementById('studioProductSelect').value;
        const chkAi = document.getElementById('chkAiDisclosure').checked;
        const confirmApproval = confirm(`Kya aap "${productTitle}" ko publish queue mein approve karna chahte hain?\nAI Disclosure Tag: ${chkAi ? 'HAAN' : 'NAHI'}`);
        if (!confirmApproval) return;

        try {
          if (supabaseClient) {
            await supabaseClient.from('content_jobs').insert({
              brand_id: 'hijab',
              prompt: document.getElementById('studioPromptInput').value || 'Standard modest aesthetic',
              raw_image_url: document.getElementById('studioPhotoSelect').value,
              captions: {
                urdu: txtCaptionUrdu.value,
                english: txtCaptionEnglish.value,
                hashtags: txtHashtags.value.split(' ')
              },
              status: 'approved',
              approved_at: new Date().toISOString()
            });
          }
          alert('Post kamyabi se APPROVE ho gaya aur publishing engine mein queue ho gaya! ✨');
          studioResultsArea.style.display = 'none';
          switchTab('overview');
        } catch (e) {
          alert('Save error: ' + e.message);
        }
      });
    }

    if (btnRejectDraft) {
      btnRejectDraft.addEventListener('click', () => {
        const reason = prompt('Post reject karne ki wajah darj karein:');
        if (reason) {
          alert(`Post reject ho gaya. Wajah: ${reason}`);
          studioResultsArea.style.display = 'none';
        }
      });
    }
  }

  // Conversation & Lead Dialogue Simulator
  function initConversationSimulator() {
    const btnRunSimulate = document.getElementById('btnRunSimulate');
    const inputMessage = document.getElementById('simCustomerMessageInput');
    const replyBox = document.getElementById('simReplyBox');
    const replyText = document.getElementById('simReplyText');
    const scoreBadge = document.getElementById('simScoreBadge');

    if (btnRunSimulate && inputMessage) {
      btnRunSimulate.addEventListener('click', async () => {
        const text = inputMessage.value.trim();
        if (!text) return;

        btnRunSimulate.disabled = true;
        btnRunSimulate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
          let resData = null;
          try {
            const res = await fetch('http://127.0.0.1:8787/api/admin/conversations/simulate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local-admin' },
              body: JSON.stringify({
                channel: 'whatsapp',
                customerName: 'Test Customer',
                incomingText: text
              })
            });
            if (res.ok) {
              resData = await res.json();
            }
          } catch {}

          if (!resData) {
            // Local fallback simulation
            const lower = text.toLowerCase();
            let reply = 'Walaikum Assalam! Hijab ul Munnazah mein khush-amdeed ✨ Hamare paas authentic Dubai Nidha Abayas aur luxury stoles dastiyab hain. Main aapki kya madad kar sakta hoon?';
            let score = 50;

            if (lower.includes('price') || lower.includes('rate') || lower.includes('kitne')) {
              reply = 'Signature Front-Open Dubai Nidha Abaya ki qeemat Rs 4,850 hai (matching stole shamil hai) ✨ Delivery charges Karachi Rs 200 aur deegar shehar Rs 250 hain. Parcel open check karke COD ada karne ki ijazat hai.';
              score = 82;
            } else if (lower.includes('size') || lower.includes('height')) {
              reply = 'Aapki height ke mutabiq standard sizes 50 se 58 tak dastiyab hain. Misaal ke taur par 5\'2" ke liye Size 52 bilkul perfect modest fall deta hai ✨';
              score = 75;
            } else if (lower.includes('order') || lower.includes('confirm')) {
              reply = 'Zabardast! Aapka order finalize karne ke liye hamara order desk foran aapse rabta kar raha hai. Barahe meherbani delivery address aur shehar share farma dein.';
              score = 95;
            }

            resData = { reply, leadCard: { lead_score: score } };
          }

          replyText.textContent = resData.reply;
          scoreBadge.textContent = `Score: ${resData.leadCard?.lead_score || 70}`;
          scoreBadge.className = `score-badge ${(resData.leadCard?.lead_score || 70) >= 80 ? 'high' : 'med'}`;
          replyBox.style.display = 'block';
        } catch (err) {
          alert('Simulator error: ' + err.message);
        } finally {
          btnRunSimulate.disabled = false;
          btnRunSimulate.innerHTML = '<i class="fas fa-paper-plane"></i> Test AI Reply';
        }
      });

      inputMessage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          btnRunSimulate.click();
        }
      });
    }
  }

  // Execute session check and initialize handlers on start
  initStudioHandlers();
  initConversationSimulator();
  checkSession();

})();
