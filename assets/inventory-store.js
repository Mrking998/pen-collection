(function () {
  var KEY = 'pen_collection_inventory_v1';
  var defaults = [
    { id:'navy-peplum', name:'Navy Peplum Skirt Suit', color:'Navy', category:'Skirt suit', price:85000, quantity:5, sizes:['UK 10','UK 12','UK 14','UK 16'], description:'Peplum blazer with a matching pencil skirt.', image:'assets/suit-navy-01.jpeg', visible:true },
    { id:'royal-blue-peplum', name:'Royal Blue Peplum Skirt Suit', color:'Royal Blue', category:'Skirt suit', price:85000, quantity:4, sizes:['UK 10','UK 12','UK 14'], description:'Fitted blazer, peplum waist, matching skirt.', image:'assets/suit-royalblue-01.jpeg', visible:true },
    { id:'black-skirt-suit', name:'Black Skirt Suit', color:'Black', category:'Skirt suit', price:85000, quantity:2, sizes:['UK 10','UK 12'], description:'A tailored staple for the office wardrobe.', image:'assets/suit-black-03.jpeg', visible:true },
    { id:'chocolate-skirt-suit', name:'Chocolate Skirt Suit', color:'Chocolate', category:'Skirt suit', price:85000, quantity:3, sizes:['UK 12','UK 14','UK 16'], description:'A warmer neutral, cut the same tailored way.', image:'assets/suit-brown-01.jpeg', visible:true },
    { id:'camel-pantsuit', name:'Camel Double-Breasted Pantsuit', color:'Camel', category:'Pantsuit', price:95000, quantity:1, sizes:['UK 12'], description:'Double-breasted blazer with straight-leg trousers.', image:'assets/suit-camel-01.jpeg', visible:true },
    { id:'wine-pantsuit', name:'Wine Pantsuit', color:'Wine', category:'Pantsuit', price:95000, quantity:0, sizes:['UK 10','UK 12','UK 14'], description:'A deeper tone for standing out in a room of black and navy.', image:'assets/suit-wine-01.jpeg', visible:true },
    { id:'forest-belted', name:'Forest Green Belted Set', color:'Forest Green', category:'Belted set', price:98000, quantity:4, sizes:['UK 10','UK 12','UK 14','UK 16'], description:'Double-breasted, self-tie waist, wide-leg trousers.', image:'assets/suit-green-01.jpeg', visible:true },
    { id:'teal-belted', name:'Teal Belted Set', color:'Teal', category:'Belted set', price:98000, quantity:2, sizes:['UK 10','UK 12'], description:'The same tailored silhouette in a bolder colourway.', image:'assets/suit-teal-01.jpeg', visible:true }
  ];

  function read() {
    try {
      var stored = localStorage.getItem(KEY);
      return stored ? JSON.parse(stored) : defaults.slice();
    } catch (error) { return defaults.slice(); }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('pen-inventory-change', { detail: items }));
  }
  function makeId(name) {
    return String(name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  }
  window.PenInventory = { read:read, write:write, makeId:makeId, defaults:defaults };
})();
