/* PilotDesk AdSense configuration
   Auto Ads are enabled site-wide through the AdSense publisher script.
   Manual ad-unit slot IDs can be added later for fixed placements. */
window.PILOTDESK_ADS={
  publisherId:"ca-pub-2325772529624834",
  slots:{top:"",content:"",sidebar:"",footer:""},
  autoAds:true
};

/* Load the current PilotDesk brand lockup on pages that already load ad-config. */
(()=>{
  if(document.querySelector('script[data-pd-brand-loader]'))return;
  const s=document.createElement('script');
  s.src='/assets/brand.js';
  s.defer=true;
  s.dataset.pdBrandLoader='1';
  document.head.appendChild(s);
})();
