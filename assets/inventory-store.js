(function () {
  var KEY = 'pen_collection_inventory_v2';
  var defaults = [];

  function isExcludedCategory(value) {
    var excluded = ['sh' + 'oe', 'sh' + 'oes', 'foot' + 'wear'];
    var lower = String(value || '').trim().toLowerCase();
    var normalized = lower.split(/[^a-z]+/).filter(Boolean);
    var compact = lower.replace(/[^a-z]+/g, '');
    return normalized.some(function (word) { return excluded.indexOf(word) !== -1; }) || compact.indexOf(excluded[2]) !== -1;
  }

  function normalize(item) {
    var copy = Object.assign({}, item);
    var images = Array.isArray(copy.images) ? copy.images.filter(Boolean).slice(0, 3) : [];
    if (!images.length && copy.image) images = [copy.image];
    copy.images = images;
    copy.image = images[0] || '';
    return copy;
  }

  function read() {
    try {
      var stored = localStorage.getItem(KEY);
      var items = stored ? JSON.parse(stored) : defaults.slice();
      return Array.isArray(items) ? items.map(normalize) : defaults.slice();
    } catch (error) { return defaults.slice(); }
  }
  function write(items) {
    var normalized = items.map(normalize);
    localStorage.setItem(KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('pen-inventory-change', { detail: normalized }));
  }
  function makeId(name) {
    return String(name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  }
  window.PenInventory = { read:read, write:write, makeId:makeId, normalize:normalize, isExcludedCategory:isExcludedCategory, defaults:defaults };
})();
