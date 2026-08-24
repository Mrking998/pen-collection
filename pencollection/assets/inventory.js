(function () {
  var store = window.PenInventory;
  var items = store.read();
  var list = document.getElementById('inventory-list');
  var modal = document.getElementById('product-modal');
  var form = document.getElementById('product-form');
  var search = document.getElementById('inventory-search');
  var filter = document.getElementById('inventory-filter');
  var deleteButton = document.getElementById('delete-product');
  var photoInput = document.getElementById('product-photo');
  var preview = document.getElementById('photo-preview');
  var prompt = document.getElementById('photo-prompt');
  var deleteConfirm = document.getElementById('delete-confirm');
  var confirmDelete = document.getElementById('confirm-delete');
  var cancelDelete = document.getElementById('cancel-delete');
  var previewList = document.getElementById('photo-previews');
  var photoImages = [];
  var processingPhotos = false;
  var lastFocus = null;
  var themeButton = document.getElementById('inventory-theme');

  function syncTheme() {
    var dark = document.documentElement.classList.contains('inventory-dark');
    var icon = themeButton && themeButton.querySelector('span');
    document.body.classList.toggle('dark', dark);
    if (themeButton) {
      themeButton.setAttribute('aria-label', dark ? 'Use light mode' : 'Use dark mode');
      themeButton.setAttribute('title', dark ? 'Dark mode active' : 'Light mode active');
    }
    if (icon) icon.textContent = dark ? '☾' : '☀';
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = dark ? '#171514' : '#fffdf8';
  }
  syncTheme();
  if (themeButton) themeButton.addEventListener('click', function () {
    document.documentElement.classList.toggle('inventory-dark');
    var dark = document.documentElement.classList.contains('inventory-dark');
    try { localStorage.setItem('pc_theme', dark ? 'dark' : 'light'); } catch (error) {}
    syncTheme();
  });

  function money(value) { return '₦' + Number(value || 0).toLocaleString('en-NG'); }
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function setCategoryError(message) {
    var input = form.elements.category;
    var error = document.getElementById('category-error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message || '';
  }
  function statusFor(item) {
    if (!item.visible) return 'hidden';
    if (item.quantity === 0) return 'sold-out';
    if (item.quantity <= 2) return 'low';
    return 'available';
  }
  function renderSummary() {
    document.getElementById('summary-products').textContent = items.length;
    document.getElementById('summary-units').textContent = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    document.getElementById('summary-low').textContent = items.filter(function (item) { return item.visible && item.quantity <= 2; }).length;
    document.getElementById('summary-value').textContent = money(items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0));
  }
  function render() {
    var term = search.value.trim().toLowerCase();
    var selected = filter.value;
    var shown = items.filter(function (item) {
      var haystack = [item.name,item.color,item.category].join(' ').toLowerCase();
      return (!term || haystack.indexOf(term) !== -1) && (selected === 'all' || statusFor(item) === selected);
    });
    list.innerHTML = shown.map(function (item) {
      var status = statusFor(item);
      var label = {'available':'In stock','low':'Low stock','sold-out':'Sold out','hidden':'Hidden'}[status];
      var firstImage = (item.images && item.images[0]) || item.image;
      return '<tr><td><div class="item-cell">' + (firstImage ? '<img src="' + safe(firstImage) + '" alt="">' : '<span class="item-photo-placeholder" aria-hidden="true"></span>') + '<div><b>' + safe(item.name) + '</b><span>' + safe(item.color) + ' · ' + safe(item.category) + '</span></div></div></td>' +
        '<td><b>' + money(item.price) + '</b></td>' +
        '<td><div class="quantity-control"><button type="button" data-qty="-1" data-id="' + safe(item.id) + '" aria-label="Reduce quantity">−</button><strong>' + item.quantity + '</strong><button type="button" data-qty="1" data-id="' + safe(item.id) + '" aria-label="Increase quantity">+</button></div></td>' +
        '<td><span class="status status-' + status + '"><i></i>' + label + '</span></td>' +
        '<td><button class="row-action" type="button" data-edit="' + safe(item.id) + '">Edit</button></td></tr>';
    }).join('');
    document.getElementById('empty-state').hidden = shown.length !== 0;
    renderSummary();
  }
  function showPhotos(images) {
    photoImages = (images || []).filter(Boolean).slice(0, 3);
    form.elements.images.value = JSON.stringify(photoImages);
    form.elements.image.value = photoImages[0] || '';
    preview.src = photoImages[0] || '';
    preview.hidden = !photoImages.length;
    prompt.hidden = !!photoImages.length;
    previewList.innerHTML = photoImages.map(function (src, index) { return '<div class="photo-thumb"><img src="' + safe(src) + '" alt="Product photo ' + (index + 1) + '"><span>' + (index + 1) + '</span><button type="button" data-remove-photo="' + index + '" aria-label="Remove photo ' + (index + 1) + '">×</button></div>'; }).join('');
  }
  function openEditor(item) {
    lastFocus = document.activeElement;
    form.reset();
    form.elements.id.value = item ? item.id : '';
    form.elements.name.value = item ? item.name : '';
    form.elements.color.value = item ? item.color : '';
    form.elements.category.value = item ? item.category : '';
    form.elements.price.value = item ? item.price : '';
    form.elements.quantity.value = item ? item.quantity : 1;
    form.elements.sizes.value = item ? item.sizes.join(', ') : '';
    form.elements.description.value = item ? item.description : '';
    form.elements.visible.checked = item ? item.visible : true;
    setCategoryError('');
    showPhotos(item ? (item.images && item.images.length ? item.images : item.image ? [item.image] : []) : []);
    document.getElementById('product-form-title').textContent = item ? 'Edit stock item' : 'Add new stock';
    deleteButton.hidden = !item;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () { form.elements.name.focus(); }, 0);
  }
  function closeEditor() {
    deleteConfirm.hidden = true;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  }
  function snapshot() { return JSON.parse(JSON.stringify(items)); }
  function showState(message, isError) {
    var state = document.getElementById('save-state');
    state.textContent = message;
    state.classList.toggle('error', !!isError);
    state.classList.add('visible');
    if (!isError) setTimeout(function () { state.classList.remove('visible'); }, 1800);
  }
  function save(previousItems) {
    try {
      store.write(items);
      render();
      showState('Changes saved', false);
      return true;
    } catch (error) {
      items = previousItems || store.read();
      render();
      showState('Could not save. Storage is full; remove or replace large photos and try again.', true);
      return false;
    }
  }

  document.querySelectorAll('[data-open-product]').forEach(function (button) { button.addEventListener('click', function () { openEditor(null); }); });
  document.querySelectorAll('[data-close-product]').forEach(function (button) { button.addEventListener('click', closeEditor); });
  search.addEventListener('input', render);
  filter.addEventListener('change', render);
  var tableWrap = document.querySelector('.table-wrap');
  tableWrap.setAttribute('tabindex', '0');
  tableWrap.setAttribute('role', 'region');
  tableWrap.setAttribute('aria-label', 'Inventory table; scroll horizontally to see all columns');
  tableWrap.addEventListener('wheel', function (event) {
    var delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : (event.shiftKey || tableWrap.scrollWidth > tableWrap.clientWidth ? event.deltaY : 0);
    if (!delta) return;
    var before = tableWrap.scrollLeft, max = tableWrap.scrollWidth - tableWrap.clientWidth;
    if ((delta < 0 && before <= 0) || (delta > 0 && before >= max)) return;
    tableWrap.scrollLeft = Math.max(0, Math.min(max, before + delta));
    if (tableWrap.scrollLeft !== before) event.preventDefault();
  }, { passive:false });
  list.addEventListener('click', function (event) {
    var edit = event.target.closest('[data-edit]');
    var quantity = event.target.closest('[data-qty]');
    if (edit) openEditor(items.find(function (item) { return item.id === edit.dataset.edit; }));
    if (quantity) {
      var item = items.find(function (candidate) { return candidate.id === quantity.dataset.id; });
      if (item) { var before = snapshot(); item.quantity = Math.max(0, item.quantity + Number(quantity.dataset.qty)); save(before); }
    }
  });
  function compressFile(file) { return new Promise(function (resolve, reject) { if (file.size > 8000000) return reject(new Error('Each image must be smaller than 8 MB.')); var reader = new FileReader(); reader.onerror = reject; reader.onload = function () { var image = new Image(); image.onerror = reject; image.onload = function () { var max=1400,scale=Math.min(1,max/Math.max(image.width,image.height)),canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.78));};image.src=reader.result;};reader.readAsDataURL(file); }); }
  photoInput.addEventListener('change', async function () {
    var files = Array.prototype.slice.call(photoInput.files || []);
    if (!files.length) return;
    if (files.length > 3) { showState('Choose no more than 3 photos.', true); photoInput.value=''; return; }
    processingPhotos = true; form.querySelector('[type="submit"]').disabled = true; showState('Processing photos…', false);
    try { var compressed=[]; for (var i=0;i<files.length;i++) compressed.push(await compressFile(files[i])); showPhotos(compressed); showState(compressed.length+' photo'+(compressed.length===1?'':'s')+' ready to save',false); }
    catch (error) { showState(error.message || 'A photo could not be processed.',true); }
    finally { processingPhotos=false; form.querySelector('[type="submit"]').disabled=false; photoInput.value=''; }
  });
  previewList.addEventListener('click', function (event) { var button=event.target.closest('[data-remove-photo]'); if (!button) return; photoImages.splice(Number(button.dataset.removePhoto),1); showPhotos(photoImages); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (processingPhotos) { showState('Please wait for the photos to finish processing.', true); return; }
    var data = new FormData(form);
    var category = String(data.get('category') || '').trim();
    if (store.isExcludedCategory(category)) {
      setCategoryError('Pen Collection currently accepts clothing and accessory categories only. Choose another category.');
      form.elements.category.focus();
      showState('Choose a clothing or accessory category before saving.', true);
      return;
    }
    setCategoryError('');
    var record = {
      id: data.get('id') || store.makeId(data.get('name')),
      name: data.get('name').trim(), color: data.get('color').trim(), category: category,
      price: Number(data.get('price')), quantity: Number(data.get('quantity')),
      sizes: data.get('sizes').split(',').map(function (size) { return size.trim(); }).filter(Boolean),
      description: data.get('description').trim(), images: photoImages.slice(), image: photoImages[0] || '',
      visible: form.elements.visible.checked
    };
    var before = snapshot();
    var index = items.findIndex(function (item) { return item.id === record.id; });
    if (index === -1) items.unshift(record); else items[index] = record;
    if (save(before)) closeEditor();
  });
  form.elements.category.addEventListener('input', function () { if (!store.isExcludedCategory(this.value)) setCategoryError(''); });
  deleteButton.addEventListener('click', function () {
    if (form.elements.id.value) { deleteConfirm.hidden = false; confirmDelete.focus(); }
  });
  cancelDelete.addEventListener('click', function () { deleteConfirm.hidden = true; deleteButton.focus(); });
  confirmDelete.addEventListener('click', function () { var id = form.elements.id.value; if (id) { var before = snapshot(); items = items.filter(function (item) { return item.id !== id; }); if (save(before)) { deleteConfirm.hidden = true; lastFocus = document.querySelector('[data-open-product]') || document.querySelector('[data-edit]'); closeEditor(); } } });
  deleteConfirm.addEventListener('click', function (event) { if (event.target === deleteConfirm) cancelDelete.click(); });
  modal.addEventListener('click', function (event) { if (event.target === modal) closeEditor(); });
  function focusables(container) { return Array.prototype.slice.call(container.querySelectorAll('button:not([disabled]):not([hidden]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function (node) { return node.offsetParent !== null; }); }
  document.addEventListener('keydown', function (event) {
    var activeLayer = !deleteConfirm.hidden ? deleteConfirm : !modal.hidden ? modal : null;
    if (!activeLayer) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!deleteConfirm.hidden) cancelDelete.click(); else closeEditor();
      return;
    }
    if (event.key !== 'Tab') return;
    var nodes = focusables(activeLayer); if (!nodes.length) { event.preventDefault(); return; }
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    else if (!activeLayer.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  });
  render();
})();
