(function () {
  const CART_KEY = 'pc_cart';
  let cartOpener = null;

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }
  function addItem(item) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === item.id && i.size === item.size);
    if (existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    saveCart(cart);
    renderCart();
    openCart();
  }
  function removeItem(id, size) {
    saveCart(getCart().filter((i) => !(i.id === id && i.size === size)));
    renderCart();
  }
  function changeQty(id, size, delta) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id && i.size === size);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart(cart);
    renderCart();
  }
  function formatNaira(kobo) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
  }

  function updateCartCount() {
    const count = getCart().reduce((n, i) => n + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = String(count);
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function injectCartUI() {
    const navInner = document.querySelector('.contact-nav') || document.querySelector('.site-nav .nav-inner');
    if (navInner && !document.querySelector('.cart-toggle')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'contact-icon cart-toggle';
      btn.setAttribute('aria-label', 'Open cart');
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/></svg><span class="cart-count"></span>';
      const profile = navInner.querySelector('[data-profile]');
      navInner.insertBefore(btn, profile ? profile.closest('.profile-shell') || profile : navInner.querySelector('.menu-shell') || null);
      btn.addEventListener('click', openCart);
    }

    if (!document.getElementById('cart-drawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'cart-drawer';
      drawer.className = 'cart-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-labelledby', 'cart-title');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = `
        <div class="cart-drawer-inner">
          <div class="cart-header">
            <h3 id="cart-title">Your Cart</h3>
            <button type="button" class="cart-close" aria-label="Close cart">✕</button>
          </div>
          <div class="cart-items"></div>
          <div class="cart-footer">
            <div class="cart-total"></div>
            <a class="btn btn-gold" href="checkout.html">Checkout</a>
          </div>
        </div>`;
      document.body.appendChild(drawer);
      drawer.querySelector('.cart-close').addEventListener('click', closeCart);
    }
    if (!document.getElementById('cart-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'cart-overlay';
      overlay.className = 'cart-overlay';
      overlay.addEventListener('click', closeCart);
      document.body.appendChild(overlay);
    }
  }

  function openCart() {
    if (window.PenContact) window.PenContact.close(false);
    document.dispatchEvent(new CustomEvent('pc-cart-opening'));
    cartOpener = document.activeElement;
    const drawer = document.getElementById('cart-drawer');
    drawer?.classList.add('open');
    drawer?.setAttribute('aria-hidden', 'false');
    document.getElementById('cart-overlay')?.classList.add('open');
    renderCart();
    drawer?.querySelector('.cart-close')?.focus();
  }
  function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const wasOpen = drawer?.classList.contains('open');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    document.getElementById('cart-overlay')?.classList.remove('open');
    if (wasOpen && cartOpener && typeof cartOpener.focus === 'function') cartOpener.focus();
  }

  function renderCart() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    const cart = getCart();
    const itemsEl = drawer.querySelector('.cart-items');
    const totalEl = drawer.querySelector('.cart-total');
    if (!cart.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      totalEl.textContent = '';
      return;
    }
    itemsEl.innerHTML = cart
      .map(
        (i) => `
      <div class="cart-item">
        <div>
          <p class="cart-item-name">${i.name}${i.size ? ' — ' + i.size : ''}</p>
          <div class="cart-qty">
            <button type="button" data-action="dec" data-id="${i.id}" data-size="${i.size || ''}">−</button>
            <span>${i.quantity}</span>
            <button type="button" data-action="inc" data-id="${i.id}" data-size="${i.size || ''}">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <p>${formatNaira(i.price * i.quantity)}</p>
          <button type="button" class="cart-remove" data-action="remove" data-id="${i.id}" data-size="${i.size || ''}">Remove</button>
        </div>
      </div>`
      )
      .join('');
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalEl.textContent = 'Total: ' + formatNaira(total);
  }

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart');
    if (addBtn) {
      const card = addBtn.closest('.product, .tag');
      const sizeSelect = card ? card.querySelector('.size-select') : null;
      addItem({
        id: addBtn.dataset.id,
        name: addBtn.dataset.name,
        price: parseInt(addBtn.dataset.price, 10),
        size: sizeSelect ? sizeSelect.value : null,
      });
      return;
    }
    const qtyBtn = e.target.closest('[data-action="inc"], [data-action="dec"]');
    if (qtyBtn) {
      changeQty(qtyBtn.dataset.id, qtyBtn.dataset.size || null, qtyBtn.dataset.action === 'inc' ? 1 : -1);
      return;
    }
    const removeBtn = e.target.closest('[data-action="remove"]');
    if (removeBtn) removeItem(removeBtn.dataset.id, removeBtn.dataset.size || null);
  });

  injectCartUI();
  updateCartCount();
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && document.getElementById('cart-drawer')?.classList.contains('open')) closeCart(); });
  document.addEventListener('pc-contact-opening', closeCart);
  document.addEventListener('pc-profile-opening', closeCart);
  document.addEventListener('pc-menu-opening', closeCart);

  window.PenCart = { getCart, saveCart, clearCart: () => saveCart([]) };
})();
