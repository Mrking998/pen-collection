(function(){'use strict';
var KEY='pc_session_counts';
function allowed(){try{return navigator.doNotTrack!=='1'&&localStorage.getItem('pc_cookie_consent')==='accepted';}catch(e){return false;}}
function record(event){if(!allowed())return;try{var counts=JSON.parse(sessionStorage.getItem(KEY)||'{}');counts[event]=Math.max(0,Number(counts[event])||0)+1;sessionStorage.setItem(KEY,JSON.stringify(counts));}catch(e){}}
record('page_views');
document.addEventListener('click',function(event){if(event.target.closest('.add-to-cart'))record('cart_adds');else if(event.target.closest('[data-action="remove"]'))record('cart_removals');else if(event.target.closest('a[href="checkout.html"]'))record('order_reviews');});
document.addEventListener('pc-consent-changed',function(event){if(event.detail==='accepted')record('consent_sessions');});
})();
