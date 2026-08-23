(function () {
  var store = window.PenInventory;
  var grid = document.querySelector('#collection .tag-grid');
  if (!store || !grid) return;
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function money(value) { return '₦' + Number(value || 0).toLocaleString('en-NG'); }
  function render() {
    var products = store.read().filter(function (product) { return product.visible; });
    grid.innerHTML = products.map(function (product) {
      var soldOut = product.quantity <= 0;
      return '<article class="tag reveal in-view" data-reveal-group="collection">' +
        '<div class="tag-top media"><img src="' + safe(product.image) + '" alt="' + safe(product.name) + '" loading="lazy">' +
        (soldOut ? '<span class="catalog-badge">Sold out</span>' : product.quantity <= 2 ? '<span class="catalog-badge low">Only ' + product.quantity + ' left</span>' : '') + '</div>' +
        '<div class="tag-body"><div class="cat">' + safe(product.name) + '</div><div class="origin">' + safe(product.color) + ' · ' + safe(product.category) + '</div>' +
        '<div class="note">' + safe(product.description) + '</div><div class="catalog-footer"><b>' + money(product.price) + '</b>' +
        '<a href="https://wa.me/2348930790672?text=' + encodeURIComponent('Hello Pen Collection, I am interested in the ' + product.name + '.') + '" target="_blank" rel="noopener" class="catalog-enquire' + (soldOut ? ' disabled' : '') + '">' + (soldOut ? 'Unavailable' : 'Enquire') + '</a></div></div></article>';
    }).join('');
  }
  render();
  window.addEventListener('pen-inventory-change', render);
})();
