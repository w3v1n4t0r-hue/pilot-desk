(()=>{
  // Vercel's documented plain-HTML analytics bootstrap.
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  if(document.querySelector('script[data-pd-vercel-analytics]'))return;
  const s=document.createElement('script');
  s.defer=true;
  s.src='/_vercel/insights/script.js';
  s.dataset.pdVercelAnalytics='1';
  document.head.appendChild(s);
})();
