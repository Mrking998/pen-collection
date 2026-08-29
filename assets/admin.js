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

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function adminFetch(url, options) {
    const next = Object.assign({}, options || {});
    next.headers = Object.assign({}, next.headers || {}, { 'X-PC-Admin': '1' });
    return fetch(url, next);
  }

  function showDashboard() {
    document.body.classList.add('dashboard-open');
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
    const submitButton = loginForm.querySelector('.login-submit');
    const submitLabel = submitButton.querySelector('span');
    const feedbackText = loginError.querySelector('span');
    const password = document.getElementById('login-password').value;
    loginError.hidden = true;
    loginError.className = 'login-feedback';
    loginForm.classList.remove('login-shake');
    if (!password) {
      feedbackText.textContent = 'Enter the admin password before continuing.';
      loginError.hidden = false; loginError.classList.add('is-error');
      document.getElementById('login-password').focus();
      return;
    }
    submitButton.disabled = true; submitButton.classList.add('is-loading'); submitLabel.textContent = 'Checking password…';
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
      });
      const result = await resp.json().catch(() => ({}));
      if (resp.ok) {
        submitButton.classList.remove('is-loading'); submitButton.classList.add('is-success'); submitLabel.textContent = 'Access granted';
        feedbackText.textContent = 'Password accepted. Opening the control centre…'; loginError.hidden = false; loginError.classList.add('is-success');
        setTimeout(showDashboard, 450);
        return;
      }
      const message = resp.status === 429 ? 'Too many attempts. Wait 15 minutes before trying again.' : resp.status === 503 ? 'Owner login is temporarily unavailable. Please contact the site administrator.' : result.error === 'Invalid request origin' ? 'This login page is outdated. Refresh the page and try again.' : 'Incorrect password. Check it carefully and try again.';
      feedbackText.textContent = message; loginError.hidden = false; loginError.classList.add('is-error');
      loginForm.classList.add('login-shake'); document.getElementById('login-password').select();
    } catch (error) {
      feedbackText.textContent = 'The site could not check the password. Confirm your connection and try again.';
      loginError.hidden = false; loginError.classList.add('is-error');
    }
    submitButton.disabled = false; submitButton.classList.remove('is-loading'); submitLabel.textContent = 'Log in';
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
  const imageInput = document.getElementById('product-images');
  const imagePreviews = document.getElementById('image-previews');
  const imageLimit = document.getElementById('image-limit');
  const imageError = document.getElementById('image-error');
  const batchPanel = document.getElementById('batch-panel');
  const batchList = document.getElementById('batch-list');
  const batchCount = document.getElementById('batch-count');
  const batchStatus = document.getElementById('batch-status');
  const publishBatch = document.getElementById('publish-batch');
  let selectedFiles = [];
  let existingImages = [];
  let productBatch = [];
  let processingImages = false;

  async function compressToWebP(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use a JPG, PNG or WebP picture.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Each original picture must be smaller than 15 MB.');
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { alpha: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let quality = 0.84;
    let blob = null;
    do {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      quality -= 0.08;
    } while (blob && blob.size > 5 * 1024 * 1024 && quality >= 0.52);
    if (!blob || blob.type !== 'image/webp') throw new Error('This browser could not convert the picture to WebP.');
    if (blob.size > 5 * 1024 * 1024) throw new Error('The optimized picture is still too large. Choose a smaller original.');
    const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 90) || 'product-picture';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  }

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
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.color || '')}</td>
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

  function currentImages() {
    return existingImages.concat(selectedFiles.map((entry) => entry.preview)).slice(0, 5);
  }

  function renderImagePreviews() {
    const images = currentImages();
    imagePreviews.innerHTML = images.map((src, index) => `<figure><img src="${escapeHtml(src)}" alt="Selected product picture ${index + 1}"><figcaption>${index + 1}${index === 0 ? ' · Main' : ''}</figcaption><button type="button" data-remove-image="${index}" aria-label="Remove picture ${index + 1}">×</button></figure>`).join('');
    imageLimit.textContent = images.length === 5 ? '5 of 5 pictures selected — limit reached' : `${images.length} of 5 pictures selected`;
    imageInput.disabled = images.length >= 5;
    imageInput.closest('.admin-image-field').classList.toggle('limit-reached', images.length >= 5);
  }

  imageInput.addEventListener('change', async () => {
    imageError.textContent = '';
    const available = 5 - currentImages().length;
    const files = Array.from(imageInput.files || []);
    if (files.length > available) {
      imageError.textContent = `Only ${available} more picture${available === 1 ? '' : 's'} can be added. Each product has a maximum of 5.`;
      imageInput.value = '';
      return;
    }
    const invalid = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024);
    if (invalid) {
      imageError.textContent = 'Use JPG, PNG or WebP originals no larger than 15 MB each.';
      imageInput.value = '';
      return;
    }
    imageInput.disabled = true;
    processingImages = true;
    document.getElementById('product-save').disabled = true;
    imageLimit.textContent = `Optimizing ${files.length} picture${files.length === 1 ? '' : 's'} to WebP…`;
    try {
      for (const file of files) {
        const optimized = await compressToWebP(file);
        selectedFiles.push({ file: optimized, preview: URL.createObjectURL(optimized) });
      }
    } catch (error) {
      imageError.textContent = error.message || 'A picture could not be optimized.';
    } finally {
      processingImages = false;
      document.getElementById('product-save').disabled = false;
      imageInput.value = '';
      imageInput.disabled = false;
      renderImagePreviews();
    }
  });

  imagePreviews.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-image]');
    if (!button) return;
    const index = Number(button.dataset.removeImage);
    if (index < existingImages.length) existingImages.splice(index, 1);
    else {
      const removed = selectedFiles.splice(index - existingImages.length, 1)[0];
      if (removed) URL.revokeObjectURL(removed.preview);
    }
    renderImagePreviews();
  });

  productList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const product = (productList._data || []).find((p) => String(p.id) === id);
    if (btn.dataset.action === 'edit' && product) fillProductForm(product);
    if (btn.dataset.action === 'delete') {
      if (confirm('Delete this product? This cannot be undone.')) {
        adminFetch('/api/admin/products?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(loadProducts);
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
    existingImages = (p.images || (p.image_url ? [p.image_url] : [])).slice(0, 5);
    selectedFiles = [];
    renderImagePreviews();
    productForm.sizes.value = (p.sizes || []).join(', ');
    productForm.stock_quantity.value = p.stock_quantity;
    productForm.is_active.checked = p.is_active;
    document.getElementById('product-form-title').textContent = 'Edit product';
    document.getElementById('product-save').textContent = 'Save changes';
    productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetProductForm(preservePreviews) {
    if (!preservePreviews) selectedFiles.forEach((entry) => URL.revokeObjectURL(entry.preview));
    selectedFiles = [];
    existingImages = [];
    productForm.reset();
    productForm.id.value = '';
    document.getElementById('product-form-title').textContent = 'Add a product';
    document.getElementById('product-save').textContent = 'Add to upload list';
    imageError.textContent = '';
    renderImagePreviews();
  }

  document.getElementById('product-form-reset').addEventListener('click', () => resetProductForm(false));

  function draftFromForm() {
    return {
      id: productForm.id.value || undefined,
      name: productForm.name.value.trim(), color: productForm.color.value.trim(), category: productForm.category.value.trim(),
      description: productForm.description.value.trim(), price_kobo: Math.round(parseFloat(productForm.price_naira.value) * 100),
      sizes: productForm.sizes.value.split(',').map((s) => s.trim()).filter(Boolean),
      stock_quantity: parseInt(productForm.stock_quantity.value, 10) || 0, is_active: productForm.is_active.checked,
      existingImages: existingImages.slice(), files: selectedFiles.map((entry) => entry.file), previews: currentImages(),
    };
  }

  function renderBatch() {
    batchCount.textContent = `${productBatch.length} of 10 ready`;
    batchPanel.hidden = productBatch.length === 0;
    batchList.innerHTML = productBatch.map((draft, index) => `<article><img src="${escapeHtml(draft.previews[0] || '')}" alt=""><div><strong>${escapeHtml(draft.name)}</strong><span>${escapeHtml(draft.category || 'Uncategorised')} · ${formatNaira(draft.price_kobo)} · ${draft.previews.length} picture${draft.previews.length === 1 ? '' : 's'}</span></div><button type="button" data-remove-draft="${index}" aria-label="Remove ${escapeHtml(draft.name)} from upload list">Remove</button></article>`).join('');
  }

  batchList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-draft]');
    if (!button) return;
    productBatch.splice(Number(button.dataset.removeDraft), 1);
    renderBatch();
  });

  async function uploadFiles(files) {
    const urls = [];
    for (const file of files) {
      const uploadData = new FormData(); uploadData.append('image', file);
      const response = await adminFetch('/api/admin/upload', { method: 'POST', body: uploadData });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'A product picture could not be uploaded.');
      urls.push((await response.json()).image_url);
    }
    return urls;
  }

  async function saveDraft(draft) {
    const uploaded = await uploadFiles(draft.files);
    const payload = Object.assign({}, draft, { images: draft.existingImages.concat(uploaded).slice(0, 5) });
    delete payload.files; delete payload.existingImages; delete payload.previews;
    const response = await adminFetch('/api/admin/products', { method: draft.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'The product could not be saved.');
  }

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (processingImages) return;
    const saveButton = document.getElementById('product-save');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    const draft = draftFromForm();
    if (!draft.previews.length) { imageError.textContent = 'Add at least one product picture.'; saveButton.disabled = false; saveButton.textContent = draft.id ? 'Save changes' : 'Add to upload list'; return; }
    if (draft.id) {
      try { await saveDraft(draft); resetProductForm(); loadProducts(); }
      catch (error) { alert(error.message); }
    } else {
      if (productBatch.length >= 10) { batchStatus.textContent = 'Publish this batch before adding more than 10 products.'; }
      else { productBatch.push(draft); renderBatch(); resetProductForm(true); productForm.name.focus(); }
    }
    saveButton.disabled = false;
    saveButton.textContent = productForm.id.value ? 'Save changes' : 'Add to upload list';
  });

  publishBatch.addEventListener('click', async () => {
    if (!productBatch.length) return;
    publishBatch.disabled = true; batchStatus.textContent = `Publishing 0 of ${productBatch.length}…`;
    const total = productBatch.length;
    try {
      for (let index = 0; index < total; index += 1) { batchStatus.textContent = `Publishing ${index + 1} of ${total}: ${productBatch[index].name}`; await saveDraft(productBatch[index]); }
      productBatch = []; renderBatch(); loadProducts(); batchStatus.textContent = `${total} product${total === 1 ? '' : 's'} published successfully.`;
    } catch (error) { batchStatus.textContent = error.message || 'Publishing stopped. Please try again.'; }
    publishBatch.disabled = false;
  });

  renderImagePreviews(); renderBatch();

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
        <td>${escapeHtml(o.reference)}</td>
        <td>${escapeHtml(o.customer_name)}<br><small>${escapeHtml(o.customer_email)}</small></td>
        <td>${(o.items || []).map((i) => `${escapeHtml(i.product_name)}${i.size ? ' (' + escapeHtml(i.size) + ')' : ''} ×${Number(i.quantity)}`).join('<br>')}</td>
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
    adminFetch('/api/admin/orders', {
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
        <td>${escapeHtml(m.name || '—')}<br><small>${escapeHtml(m.phone || '')}</small></td>
        <td>${escapeHtml(m.message)}</td>
        <td>${new Date(m.created_at).toLocaleString()}</td>
        <td><button type="button" data-id="${m.id}" data-read="${!m.is_read}">${m.is_read ? 'Mark Unread' : 'Mark Read'}</button></td>
      </tr>`
      )
      .join('');
  }
  messageList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    adminFetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: btn.dataset.id, is_read: btn.dataset.read === 'true' }),
    }).then(loadMessages);
  });
})();
