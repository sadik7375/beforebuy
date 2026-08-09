if (!window.beforebuyFeedbackInitialized) {
  window.beforebuyFeedbackInitialized = true;

  function initBeforeBuyWidget() {
    const triggerBtn = document.getElementById('beforebuy-trigger-btn');
    const modalOverlay = document.getElementById('beforebuy-modal-overlay');
    const closeBtn = document.getElementById('beforebuy-close-btn');
    const submitBtn = document.getElementById('beforebuy-submit-btn');
    const commentInput = document.getElementById('beforebuy-custom-comment');
    const emailInput = document.getElementById('beforebuy-customer-email');
    const emailGroup = document.getElementById('beforebuy-email-group');
    const emailLabel = document.getElementById('beforebuy-email-label');
    const emailError = document.getElementById('beforebuy-email-error');
    const modalBody = document.getElementById('beforebuy-modal-body');
    const successBox = document.getElementById('beforebuy-success-box');
    const reasonsContainer = document.querySelector('.beforebuy-reasons-grid');

    if (!triggerBtn || !modalOverlay) return;

    // Auto-move trigger button right below product form / Buy Buttons container if inside product section
    const wrapper = triggerBtn.closest('.beforebuy-feedback-wrapper');
    if (wrapper) {
      const buyButtonsForm = document.querySelector('form[action*="/cart/add"], .product-form, .product-form__buttons, [data-shopify="payment-button"]');
      if (buyButtonsForm && buyButtonsForm.parentNode && wrapper.parentNode !== buyButtonsForm.parentNode) {
        buyButtonsForm.parentNode.insertBefore(wrapper, buyButtonsForm.nextSibling);
      }
    }

    let selectedReason = 'Price is higher than expected';
    let isEmailEnabled = true;
    let isEmailRequired = false;

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.innerText = text;
      return div.innerHTML;
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function autoFillCustomerEmail() {
      if (emailInput && !emailInput.value.trim()) {
        const customerEmail = (triggerBtn.dataset.customerEmail || modalOverlay.dataset.customerEmail || '').trim();
        if (customerEmail) {
          emailInput.value = customerEmail;
        }
      }
    }

    function fetchSettings() {
      fetch('https://beforebuy.cannyapps.com/api/settings')
        .then(res => res.json())
        .then(data => {
          if (!data) return;

          // Email settings
          if (typeof data.enable_email !== 'undefined') isEmailEnabled = Boolean(data.enable_email);
          if (typeof data.require_email !== 'undefined') isEmailRequired = Boolean(data.require_email);

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

          // Reason settings
          if (data.reasons && data.reasons.length > 0 && reasonsContainer) {
            let reasonsList = [...data.reasons];
            const hasOther = reasonsList.some(r => strEqualsOther(r));
            if (!hasOther) {
              reasonsList.push('Other reason');
            }

            reasonsContainer.innerHTML = '';
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
        })
        .catch(err => console.log('Using default settings:', err));
    }

    function strEqualsOther(str) {
      const lower = String(str).toLowerCase().trim();
      return lower === 'other' || lower === 'other reason';
    }

    function bindReasonEvents() {
      const reasonItems = document.querySelectorAll('.beforebuy-reason-item');
      reasonItems.forEach(function (item) {
        item.addEventListener('click', function () {
          reasonItems.forEach(el => el.classList.remove('beforebuy-selected'));
          this.classList.add('beforebuy-selected');
          const radio = this.querySelector('input[type="radio"]');
          if (radio) radio.checked = true;
          selectedReason = this.dataset.reason || (radio ? radio.value : '');
        });
      });
    }

    bindReasonEvents();
    autoFillCustomerEmail();
    fetchSettings();

    // Open Modal
    triggerBtn.addEventListener('click', function () {
      modalOverlay.classList.add('beforebuy-is-open');
      if (emailError) emailError.style.display = 'none';
      if (emailInput) emailInput.classList.remove('beforebuy-invalid');
      autoFillCustomerEmail();
      fetchSettings();
    });

    // Close Modal
    function closeModal() {
      modalOverlay.classList.remove('beforebuy-is-open');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    // Submit Feedback
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (submitBtn.dataset.submitting === 'true') return;

        if (emailError) emailError.style.display = 'none';
        if (emailInput) emailInput.classList.remove('beforebuy-invalid');

        const userEmail = emailInput ? emailInput.value.trim() : '';

        // Validate email if enabled & required
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

        submitBtn.dataset.submitting = 'true';
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        const payload = {
          shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
          product_id: triggerBtn.dataset.productId || '',
          product_title: triggerBtn.dataset.productTitle || '',
          product_handle: triggerBtn.dataset.productHandle || '',
          reason: selectedReason,
          custom_comment: commentInput ? commentInput.value : '',
          customer_email: userEmail
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
