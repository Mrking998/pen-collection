(function () {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || params.get('trxref');
  const titleEl = document.getElementById('order-status-title');
  const statusEl = document.getElementById('order-status-text');

  if (!reference) {
    titleEl.textContent = 'No order reference found.';
    return;
  }

  fetch('/api/order-status?reference=' + encodeURIComponent(reference))
    .then((r) => r.json())
    .then((data) => {
      if (data.status === 'paid' || data.status === 'fulfilled') {
        titleEl.textContent = 'Payment received — thank you!';
        statusEl.textContent = `Order ${reference} is confirmed. We'll reach out on WhatsApp to arrange collection.`;
        if (window.PenCart) window.PenCart.clearCart();
      } else if (data.status === 'pending') {
        titleEl.textContent = 'Confirming your payment…';
        statusEl.textContent = "This can take a few seconds. Refresh this page shortly if it doesn't update.";
      } else {
        titleEl.textContent = 'Payment not completed';
        statusEl.textContent = `Order ${reference} was not completed. Please try again or contact us on WhatsApp.`;
      }
    })
    .catch(() => {
      titleEl.textContent = 'Could not check order status';
      statusEl.textContent = 'Please contact us on WhatsApp with your reference: ' + reference;
    });
})();
