(function () {
  const grid = document.querySelector('#collection .tag-grid');
  if (!grid) return;

  function formatNaira(kobo) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
  }

  function renderProducts(products) {
    grid.innerHTML = '';
    products.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'tag reveal is-visible';
      const sizes =
        Array.isArray(p.sizes) && p.sizes.length
          ? `<select class="size-select" aria-label="Size">${p.sizes.map((s) => `<option value="${s}">${s}</option>`).join('')}</select>`
          : '';
      const outOfStock = p.stock_quantity <= 0;
      card.innerHTML = `
        <div class="tag-top media"><img src="${p.image_url || 'assets/placeholder.jpg'}" alt="${(p.color || '') + ' ' + (p.category || '')}" loading="lazy"></div>
        <div class="tag-body">
          <div class="cat">${p.color || p.name}</div>
          <div class="origin">${p.category || ''}</div>
          <div class="note">${p.description || ''}</div>
          <div class="price">${formatNaira(p.price_kobo)}</div>
          ${sizes}
          <button class="btn btn-gold add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price_kobo}" ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Out Of Stock' : 'Add To Cart'}
          </button>
        </div>`;
      grid.appendChild(card);
    });
  }

  fetch('/api/products')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data) => {
      if (data.products && data.products.length) renderProducts(data.products);
      // If there are no products in the database yet, the existing static
      // cards already in the HTML are left exactly as they are.
    })
    .catch(() => {});
})();
