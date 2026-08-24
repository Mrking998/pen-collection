(function () {
  const summaryEl = document.getElementById('checkout-summary');
  const form = document.getElementById('checkout-form');
  const statusEl = document.getElementById('checkout-status');

  function formatNaira(kobo) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
  }

  function renderSummary() {
    const cart = window.PenCart.getCart();
    if (!cart.length) {
      summaryEl.innerHTML = '<p>Your cart is empty. <a href="index.html#collection">Browse the collection</a>.</p>';
      form.style.display = 'none';
      return;
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    summaryEl.innerHTML =
      cart
        .map(
          (i) => `
      <div class="checkout-line">
        <span>${i.name}${i.size ? ' — ' + i.size : ''} × ${i.quantity}</span>
        <span>${formatNaira(i.price * i.quantity)}</span>
      </div>`
        )
        .join('') + `<div class="checkout-line checkout-total"><span>Total</span><span>${formatNaira(total)}</span></div>`;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    statusEl.textContent = 'Processing…';
    const cart = window.PenCart.getCart();
    const payload = {
      name: document.getElementById('co-name').value,
      email: document.getElementById('co-email').value,
      phone: document.getElementById('co-phone').value,
      items: cart.map((i) => ({ id: i.id, size: i.size, quantity: i.quantity })),
    };
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.authorization_url;
    } catch (err) {
      statusEl.textContent = err.message;
    }
  });

  renderSummary();
})();
