document.addEventListener('DOMContentLoaded', function () {
  const triggerBtn = document.getElementById('beforebuy-trigger-btn');
  const modalOverlay = document.getElementById('beforebuy-modal-overlay');
  const closeBtn = document.getElementById('beforebuy-close-btn');
  const submitBtn = document.getElementById('beforebuy-submit-btn');
  const reasonItems = document.querySelectorAll('.beforebuy-reason-item');
  const commentInput = document.getElementById('beforebuy-custom-comment');
  const modalBody = document.getElementById('beforebuy-modal-body');
  const successBox = document.getElementById('beforebuy-success-box');

  if (!triggerBtn || !modalOverlay) return;

  let selectedReason = 'Price is higher than expected';

  // Open Modal
  triggerBtn.addEventListener('click', function () {
    modalOverlay.classList.add('beforebuy-is-open');
  });

  // Close Modal
  function closeModal() {
    modalOverlay.classList.remove('beforebuy-is-open');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  // Handle Reason Option Selection
  reasonItems.forEach(function (item) {
    item.addEventListener('click', function () {
      reasonItems.forEach(el => el.classList.remove('beforebuy-selected'));
      this.classList.add('beforebuy-selected');
      const radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      selectedReason = this.dataset.reason || radio.value;
    });
  });

  // Submit Feedback
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending...';

      const payload = {
        shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
        product_id: triggerBtn.dataset.productId || '',
        product_title: triggerBtn.dataset.productTitle || '',
        product_handle: triggerBtn.dataset.productHandle || '',
        reason: selectedReason,
        custom_comment: commentInput ? commentInput.value : '',
        customer_email: ''
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
          // Show success state anyway to ensure friendly user experience
          if (modalBody) modalBody.style.display = 'none';
          if (successBox) successBox.style.display = 'block';
        });
    });
  }
});
