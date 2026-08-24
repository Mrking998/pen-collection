(function () {
  const loginSection = document.getElementById('admin-login');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  function formatNaira(kobo) {
    return '₦' + (kobo / 100).toLocaleString('en-NG');
  }

  function showDashboard() {
    loginSection.style.display = 'none';
    dashboard.style.display = 'block';
    loadProducts();
    loadOrders();
    loadMessages();
  }

  fetch('/api/admin/session')
    .then((r) => r.json())
    .then((d) => {
      if (d.authenticated) showDashboard();
    });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const password = document.getElementById('login-password').value;
    const resp = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (resp.ok) showDashboard();
    else loginError.textContent = 'Incorrect password.';
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.reload();
  });

  tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    })
  );

  // ---------------- PRODUCTS ----------------
  const productList = document.getElementById('product-list');
  const productForm = document.getElementById('product-form');

  function loadProducts() {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => renderProducts(d.products || []));
  }

  function renderProducts(products) {
    productList.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.color || ''}</td>
        <td>${formatNaira(p.price_kobo)}</td>
        <td>${p.stock_quantity}</td>
        <td>${p.is_active ? 'Active' : 'Hidden'}</td>
        <td>
          <button type="button" data-action="edit" data-id="${p.id}">Edit</button>
          <button type="button" data-action="delete" data-id="${p.id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');
    productList._data = products;
  }

  productList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const product = (productList._data || []).find((p) => String(p.id) === id);
    if (btn.dataset.action === 'edit' && product) fillProductForm(product);
    if (btn.dataset.action === 'delete') {
      if (confirm('Delete this product? This cannot be undone.')) {
        fetch('/api/admin/products?id=' + id, { method: 'DELETE' }).then(loadProducts);
      }
    }
  });

  function fillProductForm(p) {
    productForm.id.value = p.id;
    productForm.name.value = p.name;
    productForm.color.value = p.color || '';
    productForm.category.value = p.category || '';
    productForm.description.value = p.description || '';
    productForm.price_naira.value = p.price_kobo / 100;
    productForm.image_url.value = p.image_url || '';
    productForm.sizes.value = (p.sizes || []).join(', ');
    productForm.stock_quantity.value = p.stock_quantity;
    productForm.is_active.checked = p.is_active;
    document.getElementById('product-form-title').textContent = 'Edit Product';
  }

  document.getElementById('product-form-reset').addEventListener('click', () => {
    productForm.reset();
    productForm.id.value = '';
    document.getElementById('product-form-title').textContent = 'Add Product';
  });

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = productForm.id.value;
    const payload = {
      id: id || undefined,
      name: productForm.name.value,
      color: productForm.color.value,
      category: productForm.category.value,
      description: productForm.description.value,
      price_kobo: Math.round(parseFloat(productForm.price_naira.value) * 100),
      image_url: productForm.image_url.value,
      sizes: productForm.sizes.value.split(',').map((s) => s.trim()).filter(Boolean),
      stock_quantity: parseInt(productForm.stock_quantity.value, 10) || 0,
      is_active: productForm.is_active.checked,
    };
    await fetch('/api/admin/products', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    productForm.reset();
    productForm.id.value = '';
    document.getElementById('product-form-title').textContent = 'Add Product';
    loadProducts();
  });

  // ---------------- ORDERS ----------------
  const orderList = document.getElementById('order-list');
  function loadOrders() {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((d) => renderOrders(d.orders || []));
  }
  function renderOrders(orders) {
    orderList.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td>${o.reference}</td>
        <td>${o.customer_name}<br><small>${o.customer_email}</small></td>
        <td>${(o.items || []).map((i) => `${i.product_name}${i.size ? ' (' + i.size + ')' : ''} ×${i.quantity}`).join('<br>')}</td>
        <td>${formatNaira(o.total_kobo)}</td>
        <td>
          <select data-id="${o.id}" class="order-status-select">
            ${['pending', 'paid', 'fulfilled', 'cancelled']
              .map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </td>
        <td>${new Date(o.created_at).toLocaleString()}</td>
      </tr>`
      )
      .join('');
  }
  orderList.addEventListener('change', (e) => {
    const select = e.target.closest('.order-status-select');
    if (!select) return;
    fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: select.dataset.id, status: select.value }),
    });
  });

  // ---------------- MESSAGES ----------------
  const messageList = document.getElementById('message-list');
  function loadMessages() {
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((d) => renderMessages(d.messages || []));
  }
  function renderMessages(messages) {
    messageList.innerHTML = messages
      .map(
        (m) => `
      <tr class="${m.is_read ? '' : 'unread'}">
        <td>${m.name || '—'}<br><small>${m.phone || ''}</small></td>
        <td>${m.message}</td>
        <td>${new Date(m.created_at).toLocaleString()}</td>
        <td><button type="button" data-id="${m.id}" data-read="${!m.is_read}">${m.is_read ? 'Mark Unread' : 'Mark Read'}</button></td>
      </tr>`
      )
      .join('');
  }
  messageList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: btn.dataset.id, is_read: btn.dataset.read === 'true' }),
    }).then(loadMessages);
  });
})();
