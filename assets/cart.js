(function () {
  const CART_KEY = 'pc_cart';

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
    const navInner = document.querySelector('.site-nav .nav-inner');
    if (navInner && !document.querySelector('.cart-toggle')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cart-toggle';
      btn.setAttribute('aria-label', 'Open cart');
      btn.innerHTML = '🛍️<span class="cart-count"></span>';
      navInner.appendChild(btn);
      btn.addEventListener('click', openCart);
    }

    if (!document.getElementById('cart-drawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'cart-drawer';
      drawer.className = 'cart-drawer';
      drawer.innerHTML = `
        <div class="cart-drawer-inner">
          <div class="cart-header">
            <h3>Your Bag</h3>
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
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    renderCart();
  }
  function closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
  }

  function renderCart() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    const cart = getCart();
    const itemsEl = drawer.querySelector('.cart-items');
    const totalEl = drawer.querySelector('.cart-total');
    if (!cart.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Your bag is empty.</p>';
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
      const card = addBtn.closest('.tag');
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

  window.PenCart = { getCart, saveCart, clearCart: () => saveCart([]) };
})();
