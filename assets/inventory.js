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
  var lastFocus = null;

  function money(value) { return '₦' + Number(value || 0).toLocaleString('en-NG'); }
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
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
      return '<tr><td><div class="item-cell"><img src="' + safe(item.image) + '" alt=""><div><b>' + safe(item.name) + '</b><span>' + safe(item.color) + ' · ' + safe(item.category) + '</span></div></div></td>' +
        '<td><b>' + money(item.price) + '</b></td>' +
        '<td><div class="quantity-control"><button type="button" data-qty="-1" data-id="' + safe(item.id) + '" aria-label="Reduce quantity">−</button><strong>' + item.quantity + '</strong><button type="button" data-qty="1" data-id="' + safe(item.id) + '" aria-label="Increase quantity">+</button></div></td>' +
        '<td><span class="status status-' + status + '"><i></i>' + label + '</span></td>' +
        '<td><button class="row-action" type="button" data-edit="' + safe(item.id) + '">Edit</button></td></tr>';
    }).join('');
    document.getElementById('empty-state').hidden = shown.length !== 0;
    renderSummary();
  }
  function showPhoto(src) {
    form.elements.image.value = src || '';
    preview.src = src || '';
    preview.hidden = !src;
    prompt.hidden = !!src;
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
    showPhoto(item ? item.image : '');
    document.getElementById('product-form-title').textContent = item ? 'Edit stock item' : 'Add new stock';
    deleteButton.hidden = !item;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () { form.elements.name.focus(); }, 0);
  }
  function closeEditor() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  }
  function save() {
    store.write(items);
    render();
    var state = document.getElementById('save-state');
    state.textContent = 'Changes saved';
    state.classList.add('visible');
    setTimeout(function () { state.classList.remove('visible'); }, 1800);
  }

  document.querySelectorAll('[data-open-product]').forEach(function (button) { button.addEventListener('click', function () { openEditor(null); }); });
  document.querySelectorAll('[data-close-product]').forEach(function (button) { button.addEventListener('click', closeEditor); });
  search.addEventListener('input', render);
  filter.addEventListener('change', render);
  list.addEventListener('click', function (event) {
    var edit = event.target.closest('[data-edit]');
    var quantity = event.target.closest('[data-qty]');
    if (edit) openEditor(items.find(function (item) { return item.id === edit.dataset.edit; }));
    if (quantity) {
      var item = items.find(function (candidate) { return candidate.id === quantity.dataset.id; });
      if (item) { item.quantity = Math.max(0, item.quantity + Number(quantity.dataset.qty)); save(); }
    }
  });
  photoInput.addEventListener('change', function () {
    var file = photoInput.files[0];
    if (!file) return;
    if (file.size > 2500000) { alert('Please choose an image smaller than 2.5 MB.'); photoInput.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function () { showPhoto(reader.result); };
    reader.readAsDataURL(file);
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var record = {
      id: data.get('id') || store.makeId(data.get('name')),
      name: data.get('name').trim(), color: data.get('color').trim(), category: data.get('category'),
      price: Number(data.get('price')), quantity: Number(data.get('quantity')),
      sizes: data.get('sizes').split(',').map(function (size) { return size.trim(); }).filter(Boolean),
      description: data.get('description').trim(), image: data.get('image') || 'assets/suit-navy-02.jpeg',
      visible: form.elements.visible.checked
    };
    var index = items.findIndex(function (item) { return item.id === record.id; });
    if (index === -1) items.unshift(record); else items[index] = record;
    save(); closeEditor();
  });
  deleteButton.addEventListener('click', function () {
    var id = form.elements.id.value;
    if (id && confirm('Delete this product from the inventory?')) { items = items.filter(function (item) { return item.id !== id; }); save(); closeEditor(); }
  });
  modal.addEventListener('click', function (event) { if (event.target === modal) closeEditor(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modal.hidden) closeEditor(); });
  render();
})();
