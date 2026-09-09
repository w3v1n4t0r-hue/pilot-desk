(()=>{
  // Vercel Web Analytics for a plain static site. The endpoint is first-party on Vercel.
  // It begins reporting when Web Analytics is enabled for the Vercel project.
  if(document.querySelector('script[data-pd-vercel-analytics]'))return;
  const s=document.createElement('script');
  s.defer=true;
  s.src='/_vercel/insights/script.js';
  s.dataset.pdVercelAnalytics='1';
  document.head.appendChild(s);
})();
