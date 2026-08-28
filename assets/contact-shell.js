(function(){
  'use strict';
  var shell=document.querySelector('[data-contact-shell]');
  if(!shell){shell=document.createElement('div');shell.className='contact-float';shell.setAttribute('data-contact-shell','');document.body.appendChild(shell);}
  shell.innerHTML='<button class="contact-trigger" type="button" aria-expanded="false" aria-controls="contact-actions" aria-haspopup="menu" aria-label="Open contact options"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 4.5h2.1l1 4-1.7 1.5a14.5 14.5 0 0 0 5.4 5.4l1.5-1.7 4 1v2.1c0 1.2-1 2.2-2.2 2.2A12.3 12.3 0 0 1 5 6.7c0-1.2 1-2.2 2.2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="contact-panel" id="contact-actions" role="menu" aria-label="Contact options" hidden><a role="menuitem" href="tel:+2348030790672"><span aria-hidden="true">☎</span><span><b>Call</b><small>0803 079 0672</small></span></a><a role="menuitem" data-whatsapp href="https://wa.me/2348030790672" target="_blank" rel="noopener"><span aria-hidden="true">◉</span><span><b>WhatsApp</b><small>0803 079 0672</small></span></a><a role="menuitem" href="tel:+2348056232268"><span aria-hidden="true">☎</span><span><b>Call</b><small>0805 623 2268</small></span></a><a role="menuitem" data-whatsapp href="https://wa.me/2348056232268" target="_blank" rel="noopener"><span aria-hidden="true">◉</span><span><b>WhatsApp</b><small>0805 623 2268</small></span></a></div>';
  var trigger=shell.querySelector('.contact-trigger'),panel=shell.querySelector('.contact-panel'),timer,token=0,reduced=matchMedia('(prefers-reduced-motion: reduce)');

  var utmKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'],utm={};
  try{var params=new URLSearchParams(location.search),hasUtm=false;utmKeys.forEach(function(key){var value=params.get(key);if(value){utm[key]=value;hasUtm=true;}});if(hasUtm)sessionStorage.setItem('pc_utm',JSON.stringify(utm));else utm=JSON.parse(sessionStorage.getItem('pc_utm')||'{}');}catch(e){utm={};}
  function enrich(link){if(!link||link.dataset.utmEnriched==='true')return;var reference=utmKeys.filter(function(key){return utm[key];}).map(function(key){return key.replace('utm_','')+'='+utm[key];}).join(', ');if(reference){var url=new URL(link.href),message=url.searchParams.get('text')||'Hello Pen Collection.';url.searchParams.set('text',message+'\nReference: '+reference);link.href=url.toString();}link.dataset.utmEnriched='true';}
  panel.querySelectorAll('[data-whatsapp]').forEach(enrich);

  function close(returnFocus){if(panel.hidden)return;token+=1;clearTimeout(timer);panel.classList.remove('contact-opening');panel.classList.add('contact-closing');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Open contact options');timer=setTimeout(function(){panel.hidden=true;panel.classList.remove('contact-closing');if(returnFocus)trigger.focus();},reduced.matches?0:220);}
  function open(){clearTimeout(timer);token+=1;var openingToken=token;panel.classList.remove('contact-closing');panel.classList.add('contact-opening');panel.hidden=false;trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-label','Close contact options');document.dispatchEvent(new CustomEvent('pc-contact-opening'));function finish(){if(openingToken!==token||panel.classList.contains('contact-closing'))return;panel.classList.remove('contact-opening');var first=panel.querySelector('a');if(first)first.focus();}if(reduced.matches)finish();else requestAnimationFrame(function(){requestAnimationFrame(finish);});}
  trigger.addEventListener('click',function(){if(panel.classList.contains('contact-closing')){open();return;}if(panel.hidden)open();else close(true);});
  panel.addEventListener('click',function(event){if(event.target.closest('a'))close(true);});
  document.addEventListener('click',function(event){if(!event.target.closest('[data-contact-shell]')&&!panel.hidden)close(true);});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close(true);}});
  window.PenContact={close:close};

  var footer=document.querySelector('.footer,.page-footer,footer'),banner=document.getElementById('cookie-banner'),frame=0;
  function visibleRect(element){if(!element||element.hidden)return null;var style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return null;var rect=element.getBoundingClientRect();return rect.bottom>0&&rect.top<innerHeight?rect:null;}
  function updatePosition(){cancelAnimationFrame(frame);frame=requestAnimationFrame(function(){var gap=12,lift=0,bannerRect=visibleRect(banner),footerRect=visibleRect(footer);if(bannerRect)lift=Math.max(lift,innerHeight-bannerRect.top+gap);if(footerRect)lift=Math.max(lift,innerHeight-footerRect.top+gap);document.documentElement.style.setProperty('--contact-lift',Math.max(0,Math.ceil(lift))+'px');});}
  addEventListener('scroll',updatePosition,{passive:true});addEventListener('resize',updatePosition,{passive:true});
  if('ResizeObserver'in window){var resizeObserver=new ResizeObserver(updatePosition);resizeObserver.observe(shell);if(banner)resizeObserver.observe(banner);if(footer)resizeObserver.observe(footer);}
  if('IntersectionObserver'in window&&footer)new IntersectionObserver(updatePosition,{threshold:[0,.01,1]}).observe(footer);
  if(banner)new MutationObserver(updatePosition).observe(banner,{attributes:true,attributeFilter:['hidden','class','style']});
  updatePosition();
})();
