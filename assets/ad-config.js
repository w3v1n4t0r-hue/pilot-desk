/* PilotDesk AdSense configuration. Auto Ads stay available while manual slots can be added later. */
window.PILOTDESK_ADS={publisherId:"ca-pub-2325772529624834",slots:{top:"",content:"",sidebar:"",footer:""},autoAds:true};
(()=>{
  const hasBrand=[...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname==='/assets/brand.js'}catch{return false}});
  if(!hasBrand){const s=document.createElement('script');s.src='/assets/brand.js';s.defer=true;s.dataset.pdBrandLoader='1';document.head.appendChild(s)}
  if(location.pathname==='/'||location.pathname==='/index.html'){
    const hasBootstrap=[...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname==='/assets/app-bootstrap.js'}catch{return false}});
    if(!hasBootstrap){const s=document.createElement('script');s.src='/assets/app-bootstrap.js';s.defer=true;s.dataset.pdAppBootstrapLoader='1';document.head.appendChild(s)}
  }
})();
