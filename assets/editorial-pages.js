(function(){
  var body=document.body,button=document.getElementById('page-theme'),saved;
  try{saved=localStorage.getItem('pc_theme');}catch(e){}
  if(saved==='dark')body.classList.add('dark');
  function sync(){var dark=body.classList.contains('dark');button.textContent=dark?'☾':'☀';button.setAttribute('aria-label',dark?'Use light mode':'Use dark mode');button.title=dark?'Dark mode active':'Light mode active';}
  button.addEventListener('click',function(){body.classList.toggle('dark');try{localStorage.setItem('pc_theme',body.classList.contains('dark')?'dark':'light');}catch(e){}sync();});
  sync();
  document.querySelectorAll('[data-year]').forEach(function(n){n.textContent=new Date().getFullYear();});

})();
