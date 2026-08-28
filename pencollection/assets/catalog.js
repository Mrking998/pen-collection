(function () {
  var store = window.PenInventory;
  var host = document.getElementById('public-inventory');
  var section = document.querySelector('.empty-catalogue');
  if (!store || !host || !section) return;

  function safe(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character];
    });
  }
  function money(value) { return '₦' + Number(value || 0).toLocaleString('en-NG'); }

  function render() {
    var products = store.read().filter(function (product) { return product.visible; });
    section.classList.toggle('has-stock', products.length > 0);
    if (!products.length) {
      host.className = 'catalogue-status';
      host.textContent = 'No stock has been published yet.';
      return;
    }
    host.className = 'public-grid';
    host.innerHTML = products.map(function (product) {
      var soldOut = Number(product.quantity) <= 0;
      var lowStock = Number(product.quantity) > 0 && Number(product.quantity) <= 2;
      var stockLabel = soldOut ? 'Sold out' : lowStock ? 'Only ' + product.quantity + ' left' : 'In stock';
      var media = product.image
        ? '<img src="' + safe(product.image) + '" alt="' + safe(product.name) + '">'
        : '<div class="public-card-placeholder">Image coming soon</div>';
      var sizes = Array.isArray(product.sizes) && product.sizes.length
        ? '<p class="public-sizes">Available sizes: ' + safe(product.sizes.join(', ')) + '</p>' : '';
      var message = encodeURIComponent('Hello Pen Collection, I am interested in ' + product.name + '.');
      return '<article class="public-card">' +
        '<div class="public-card-media">' + media + '<span class="public-stock' + (lowStock ? ' low' : '') + '">' + stockLabel + '</span></div>' +
        '<div class="public-card-body"><div class="public-card-meta">' + safe(product.color) + ' · ' + safe(product.category) + '</div>' +
        '<h2>' + safe(product.name) + '</h2><p class="public-description">' + safe(product.description) + '</p>' + sizes +
        '<div class="public-card-footer"><span class="public-price">' + money(product.price) + '</span>' +
        '<a class="public-enquire' + (soldOut ? ' disabled' : '') + '" href="https://wa.me/2348030790672?text=' + message + '" target="_blank" rel="noopener">' + (soldOut ? 'Unavailable' : 'Enquire') + '</a></div></div></article>';
    }).join('');
  }

  render();
  window.addEventListener('pen-inventory-change', render);
  window.addEventListener('storage', render);
})();
