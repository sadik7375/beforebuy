if (!window.beforebuyFeedbackInitialized) {
  window.beforebuyFeedbackInitialized = true;

  let selectedReason = 'Price is higher than expected';
  let isEmailEnabled = true;
  let isEmailRequired = false;
  let isPhoneEnabled = false;
  let isPhoneRequired = false;
  let whatsappNumberGlobal = '';
  let whatsappTemplateGlobal = 'Hi! I have a question about {product_title}: {product_url}';
  let messengerUsernameGlobal = '';

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    const clean = phone.replace(/[^0-9+]/g, '');
    return clean.length >= 6;
  }

  function strEqualsOther(str) {
    const lower = String(str).toLowerCase().trim();
    return lower === 'other' || lower === 'other reason';
  }

  function autoFillCustomerEmail() {
    const emailInput = document.getElementById('beforebuy-customer-email');
    const triggerBtn = document.getElementById('beforebuy-trigger-btn');
    const modalOverlay = document.getElementById('beforebuy-modal-overlay');

    if (emailInput && !emailInput.value.trim()) {
      const customerEmail = ((triggerBtn && triggerBtn.dataset.customerEmail) || (modalOverlay && modalOverlay.dataset.customerEmail) || '').trim();
      if (customerEmail) {
        emailInput.value = customerEmail;
      }
    }
  }

  function switchTab(targetTab) {
    const feedbackTabBtn = document.getElementById('beforebuy-tab-feedback');
    const inquiryTabBtn = document.getElementById('beforebuy-tab-inquiry');
    const feedbackView = document.getElementById('beforebuy-view-feedback');
    const inquiryView = document.getElementById('beforebuy-view-inquiry');

    if (targetTab === 'inquiry') {
      if (feedbackTabBtn) feedbackTabBtn.classList.remove('beforebuy-tab-active');
      if (inquiryTabBtn) inquiryTabBtn.classList.add('beforebuy-tab-active');
      if (feedbackView) feedbackView.style.display = 'none';
      if (inquiryView) inquiryView.style.display = 'block';
    } else {
      if (inquiryTabBtn) inquiryTabBtn.classList.remove('beforebuy-tab-active');
      if (feedbackTabBtn) feedbackTabBtn.classList.add('beforebuy-tab-active');
      if (inquiryView) inquiryView.style.display = 'none';
      if (feedbackView) feedbackView.style.display = 'block';
    }
  }

  function triggerWhatsAppChat() {
    let cleanNum = (whatsappNumberGlobal || '').replace(/[^0-9+]/g, '');
    if (cleanNum.startsWith('+')) {
      cleanNum = cleanNum.substring(1);
    }
    if (!cleanNum) {
      alert('Merchant WhatsApp number is not configured yet.');
      return;
    }

    const triggerBtn = document.getElementById('beforebuy-trigger-btn');
    const prodTitle = triggerBtn ? (triggerBtn.dataset.productTitle || '') : '';
    const prodUrl = triggerBtn ? (triggerBtn.dataset.productUrl || window.location.href) : window.location.href;

    let msg = whatsappTemplateGlobal
      .replace('{product_title}', prodTitle)
      .replace('{product_url}', prodUrl);

    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  function triggerMessengerChat() {
    let cleanHandle = (messengerUsernameGlobal || '').trim();
    cleanHandle = cleanHandle.replace(/^(https?:\/\/)?(www\.)?(facebook\.com\/|m\.me\/|@)?/i, '').replace(/\/$/, '');
    if (!cleanHandle) {
      alert('Merchant Facebook Messenger username is not configured yet.');
      return;
    }

    const msgrUrl = `https://m.me/${cleanHandle}`;
    window.open(msgrUrl, '_blank');
  }

  // GLOBAL CLICK DELEGATION: Handles modal open, tab switching, close, and WhatsApp chat
  document.addEventListener('click', function (e) {
    // 1. Storefront Feedback Trigger Button Click -> Open Modal
    const triggerBtn = e.target.closest('#beforebuy-trigger-btn, .beforebuy-trigger-btn');
    if (triggerBtn) {
      e.preventDefault();
      e.stopPropagation();

      const modalOverlay = document.getElementById('beforebuy-modal-overlay');
      if (modalOverlay) {
        modalOverlay.classList.add('beforebuy-is-open');

        const emailError = document.getElementById('beforebuy-email-error');
        const emailInput = document.getElementById('beforebuy-customer-email');
        const phoneError = document.getElementById('beforebuy-phone-error');
        const phoneInput = document.getElementById('beforebuy-customer-phone');

        if (emailError) emailError.style.display = 'none';
        if (emailInput) emailInput.classList.remove('beforebuy-invalid');
        if (phoneError) phoneError.style.display = 'none';
        if (phoneInput) phoneInput.classList.remove('beforebuy-invalid');

        // Default to feedback tab when opened
        switchTab('feedback');

        autoFillCustomerEmail();
        fetchSettings();
      }
      return;
    }

    // 2. Tab Switcher Buttons Inside Modal
    const tabFeedbackBtn = e.target.closest('#beforebuy-tab-feedback');
    if (tabFeedbackBtn) {
      e.preventDefault();
      switchTab('feedback');
      return;
    }

    const tabInquiryBtn = e.target.closest('#beforebuy-tab-inquiry');
    if (tabInquiryBtn) {
      e.preventDefault();
      switchTab('inquiry');
      return;
    }

    // 3. WhatsApp Action Button Inside Inquiry Tab
    const waInquiryBtn = e.target.closest('#beforebuy-inquiry-wa-btn');
    if (waInquiryBtn) {
      e.preventDefault();
      triggerWhatsAppChat();
      return;
    }

    // 4. Facebook Messenger Action Button Inside Inquiry Tab
    const msgrInquiryBtn = e.target.closest('#beforebuy-inquiry-msgr-btn');
    if (msgrInquiryBtn) {
      e.preventDefault();
      triggerMessengerChat();
      return;
    }

    // 4. Close Modal Button Click
    const closeBtn = e.target.closest('#beforebuy-close-btn');
    if (closeBtn) {
      e.preventDefault();
      const modalOverlay = document.getElementById('beforebuy-modal-overlay');
      if (modalOverlay) modalOverlay.classList.remove('beforebuy-is-open');
      return;
    }

    // 5. Click outside modal card on overlay background
    const modalOverlay = document.getElementById('beforebuy-modal-overlay');
    if (modalOverlay && e.target === modalOverlay) {
      modalOverlay.classList.remove('beforebuy-is-open');
    }
  });

  function fetchSettings() {
    const triggerBtn = document.getElementById('beforebuy-trigger-btn');
    const modalOverlay = document.getElementById('beforebuy-modal-overlay');
    const emailGroup = document.getElementById('beforebuy-email-group');
    const emailLabel = document.getElementById('beforebuy-email-label');
    const phoneGroup = document.getElementById('beforebuy-phone-group');
    const phoneLabel = document.getElementById('beforebuy-phone-label');
    const modalTabs = document.getElementById('beforebuy-modal-tabs');
    const waBtnLabel = document.getElementById('beforebuy-wa-btn-label');
    const waMsgPreview = document.getElementById('beforebuy-inquiry-msg-preview');
    const reasonsContainer = document.querySelector('.beforebuy-reasons-grid');
    const wrapper = triggerBtn ? triggerBtn.closest('.beforebuy-feedback-wrapper') : null;

    const currentShop = window.Shopify ? window.Shopify.shop : window.location.hostname;
    fetch('https://beforebuy.cannyapps.com/api/settings?shop=' + encodeURIComponent(currentShop))
      .then(res => res.json())
      .then(data => {
        if (!data) return;

        // Product Targeting & Visibility Check
        if (triggerBtn) {
          const targetingMode = data.product_targeting_mode || 'all';
          const excludedList = (data.excluded_products || []).map(item => String(item).toLowerCase().trim());
          const includedList = (data.included_products || []).map(item => String(item).toLowerCase().trim());

          const currentProductId = String(triggerBtn.dataset.productId || '').toLowerCase().trim();
          const currentProductHandle = String(triggerBtn.dataset.productHandle || '').toLowerCase().trim();

          function isProductMatch(list) {
            if (!list || list.length === 0) return false;
            return list.some(item => item && (item === currentProductId || item === currentProductHandle));
          }

          let isVisible = true;
          if (targetingMode === 'exclude') {
            if (isProductMatch(excludedList)) isVisible = false;
          } else if (targetingMode === 'include') {
            if (!isProductMatch(includedList)) isVisible = false;
          }

          if (!isVisible) {
            if (wrapper) wrapper.style.display = 'none';
            triggerBtn.style.display = 'none';
            return;
          } else {
            if (wrapper) wrapper.style.display = 'flex';
            triggerBtn.style.display = '';
          }
        }

        // Email settings
        if (typeof data.enable_email !== 'undefined') isEmailEnabled = Boolean(data.enable_email);
        if (typeof data.require_email !== 'undefined') isEmailRequired = Boolean(data.require_email);

        // Phone settings
        if (typeof data.enable_phone !== 'undefined') isPhoneEnabled = Boolean(data.enable_phone);
        if (typeof data.require_phone !== 'undefined') isPhoneRequired = Boolean(data.require_phone);

        // Popup Theme Preset
        if (data.popup_theme && modalOverlay) {
          modalOverlay.classList.remove(
            'beforebuy-preset-modern',
            'beforebuy-preset-minimal',
            'beforebuy-preset-dark',
            'beforebuy-preset-pills'
          );
          modalOverlay.classList.add(`beforebuy-preset-${data.popup_theme}`);
        }

        if (emailGroup) {
          if (isEmailEnabled) {
            emailGroup.style.display = 'block';
            if (emailLabel) {
              emailLabel.innerText = isEmailRequired
                ? 'Your Email Address * (Required):'
                : 'Your Email Address (Optional):';
            }
          } else {
            emailGroup.style.display = 'none';
          }
        }

        if (phoneGroup) {
          if (isPhoneEnabled) {
            phoneGroup.style.display = 'block';
            if (phoneLabel) {
              phoneLabel.innerText = isPhoneRequired
                ? 'Your Phone Number * (Required):'
                : 'Your Phone Number (Optional):';
            }
          } else {
            phoneGroup.style.display = 'none';
          }
        }

        // WhatsApp & Messenger Inquiry settings
        const isWhatsappEnabled = Boolean(data.enable_whatsapp);
        whatsappNumberGlobal = (data.whatsapp_number || '').trim();
        const whatsappLabelText = (data.whatsapp_button_text || 'Chat on WhatsApp').trim();
        if (data.whatsapp_message_template) {
          whatsappTemplateGlobal = data.whatsapp_message_template;
        }

        const isMessengerEnabled = Boolean(data.enable_messenger);
        messengerUsernameGlobal = (data.messenger_username || '').trim();
        const messengerLabelText = (data.messenger_button_text || 'Chat on Messenger').trim();

        const waInquiryBtn = document.getElementById('beforebuy-inquiry-wa-btn');
        const msgrInquiryBtn = document.getElementById('beforebuy-inquiry-msgr-btn');
        const msgrBtnLabel = document.getElementById('beforebuy-msgr-btn-label');

        const showWa = Boolean(isWhatsappEnabled || whatsappNumberGlobal);
        const showMsgr = Boolean(isMessengerEnabled || messengerUsernameGlobal);

        if (waInquiryBtn) {
          waInquiryBtn.style.display = showWa ? 'flex' : 'none';
          if (waBtnLabel) waBtnLabel.innerText = whatsappLabelText;
        }

        if (msgrInquiryBtn) {
          msgrInquiryBtn.style.display = showMsgr ? 'flex' : 'none';
          if (msgrBtnLabel) msgrBtnLabel.innerText = messengerLabelText;
        }

        if (modalTabs) {
          if (showWa || showMsgr) {
            modalTabs.style.display = 'flex';
          } else {
            modalTabs.style.display = 'none';
            switchTab('feedback');
          }
        }

        // Reason settings
        if (data.reasons && data.reasons.length > 0 && reasonsContainer) {
          let reasonsList = [...data.reasons];
          const hasOther = reasonsList.some(r => strEqualsOther(r));
          if (!hasOther) {
            reasonsList.push('Other reason');
          }

          reasonsContainer.innerHTML = '';

          const isDropdownTheme = data.popup_theme === 'dropdown' || data.popup_theme === 'badge_list';

          if (isDropdownTheme) {
            const selectWrapper = document.createElement('div');
            selectWrapper.className = 'beforebuy-dropdown-wrapper';

            const selectLabel = document.createElement('label');
            selectLabel.className = 'beforebuy-dropdown-label';
            selectLabel.innerText = 'Select Reason:';
            selectWrapper.appendChild(selectLabel);

            const selectEl = document.createElement('select');
            selectEl.className = 'beforebuy-dropdown-select';

            reasonsList.forEach((reasonText, idx) => {
              const opt = document.createElement('option');
              opt.value = reasonText;
              opt.innerText = reasonText;
              if (idx === 0) {
                opt.selected = true;
                selectedReason = reasonText;
              }
              selectEl.appendChild(opt);
            });

            selectEl.addEventListener('change', function () {
              selectedReason = this.value;
            });

            selectWrapper.appendChild(selectEl);
            reasonsContainer.appendChild(selectWrapper);
          } else {
            reasonsList.forEach((reasonText, idx) => {
              const isChecked = idx === 0;
              if (isChecked) selectedReason = reasonText;

              const letterBadge = String.fromCharCode(65 + (idx % 26));
              const label = document.createElement('label');
              label.className = `beforebuy-reason-item ${isChecked ? 'beforebuy-selected' : ''}`;
              label.dataset.reason = reasonText;

              label.innerHTML = `
                <span class="beforebuy-badge-letter">${letterBadge}</span>
                <input type="radio" name="beforebuy_reason" value="${escapeHtml(reasonText)}" class="beforebuy-reason-radio" ${isChecked ? 'checked' : ''}>
                <span>${escapeHtml(reasonText)}</span>
              `;

              label.addEventListener('click', function (e) {
                e.stopPropagation();
                document.querySelectorAll('.beforebuy-reason-item').forEach(el => el.classList.remove('beforebuy-selected'));
                this.classList.add('beforebuy-selected');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                selectedReason = this.dataset.reason || (radio ? radio.value : reasonText);
              });

              reasonsContainer.appendChild(label);
            });
          }
        }
      })
      .catch(err => console.log('Using default settings:', err));
  }

  function initBeforeBuyWidget() {
    const triggerBtn = document.getElementById('beforebuy-trigger-btn');
    if (triggerBtn) {
      const wrapper = triggerBtn.closest('.beforebuy-feedback-wrapper');
      if (wrapper) {
        const buyButtonsForm = document.querySelector('form[action*="/cart/add"], .product-form, .product-form__buttons, [data-shopify="payment-button"]');
        if (buyButtonsForm && buyButtonsForm.parentNode && wrapper.parentNode !== buyButtonsForm.parentNode) {
          buyButtonsForm.parentNode.insertBefore(wrapper, buyButtonsForm.nextSibling);
        }
      }
    }

    autoFillCustomerEmail();
    fetchSettings();

    // Submit Feedback Handler
    const submitBtn = document.getElementById('beforebuy-submit-btn');
    if (submitBtn && !submitBtn.dataset.bound) {
      submitBtn.dataset.bound = 'true';
      submitBtn.addEventListener('click', function () {
        if (submitBtn.dataset.submitting === 'true') return;

        const emailInput = document.getElementById('beforebuy-customer-email');
        const emailError = document.getElementById('beforebuy-email-error');
        const phoneInput = document.getElementById('beforebuy-customer-phone');
        const countryCodeSelect = document.getElementById('beforebuy-country-code');
        const phoneError = document.getElementById('beforebuy-phone-error');
        const commentInput = document.getElementById('beforebuy-custom-comment');
        const modalBody = document.getElementById('beforebuy-modal-body');
        const successBox = document.getElementById('beforebuy-success-box');
        const currentTriggerBtn = document.getElementById('beforebuy-trigger-btn');

        if (emailError) emailError.style.display = 'none';
        if (emailInput) emailInput.classList.remove('beforebuy-invalid');
        if (phoneError) phoneError.style.display = 'none';
        if (phoneInput) phoneInput.classList.remove('beforebuy-invalid');

        const userEmail = emailInput ? emailInput.value.trim() : '';
        const userPhone = phoneInput ? phoneInput.value.trim() : '';

        // Validate email
        if (isEmailEnabled && isEmailRequired) {
          if (!userEmail || !isValidEmail(userEmail)) {
            if (emailError) {
              emailError.innerText = 'Please enter a valid email address.';
              emailError.style.display = 'block';
            }
            if (emailInput) emailInput.classList.add('beforebuy-invalid');
            return;
          }
        } else if (isEmailEnabled && userEmail && !isValidEmail(userEmail)) {
          if (emailError) {
            emailError.innerText = 'Please enter a valid email address.';
            emailError.style.display = 'block';
          }
          if (emailInput) emailInput.classList.add('beforebuy-invalid');
          return;
        }

        // Validate phone
        if (isPhoneEnabled && isPhoneRequired) {
          if (!userPhone || !isValidPhone(userPhone)) {
            if (phoneError) {
              phoneError.innerText = 'Please enter a valid phone number.';
              phoneError.style.display = 'block';
            }
            if (phoneInput) phoneInput.classList.add('beforebuy-invalid');
            return;
          }
        } else if (isPhoneEnabled && userPhone && !isValidPhone(userPhone)) {
          if (phoneError) {
            phoneError.innerText = 'Please enter a valid phone number.';
            phoneError.style.display = 'block';
          }
          if (phoneInput) phoneInput.classList.add('beforebuy-invalid');
          return;
        }

        submitBtn.dataset.submitting = 'true';
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        let formattedPhone = userPhone;
        const countryCode = countryCodeSelect ? countryCodeSelect.value : '';
        if (userPhone && countryCode) {
          if (!userPhone.startsWith('+')) {
            formattedPhone = `${countryCode} ${userPhone.replace(/^0+/, '')}`;
          }
        }

        const payload = {
          shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
          product_id: currentTriggerBtn ? currentTriggerBtn.dataset.productId || '' : '',
          product_title: currentTriggerBtn ? currentTriggerBtn.dataset.productTitle || '' : '',
          product_handle: currentTriggerBtn ? currentTriggerBtn.dataset.productHandle || '' : '',
          reason: selectedReason,
          custom_comment: commentInput ? commentInput.value : '',
          customer_email: userEmail,
          customer_phone: formattedPhone
        };

        fetch('https://beforebuy.cannyapps.com/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        })
          .then(response => response.json())
          .then(data => {
            if (modalBody) modalBody.style.display = 'none';
            if (successBox) successBox.style.display = 'block';
          })
          .catch(err => {
            console.error('BeforeBuy Feedback Error:', err);
            if (modalBody) modalBody.style.display = 'none';
            if (successBox) successBox.style.display = 'block';
          });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBeforeBuyWidget);
  } else {
    initBeforeBuyWidget();
  }
}
