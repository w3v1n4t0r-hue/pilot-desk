/* PilotDesk AdSense configuration. Auto Ads stay available while manual slots can be added later. */
window.PILOTDESK_ADS={publisherId:"ca-pub-2325772529624834",slots:{top:"",content:"",sidebar:"",footer:""},autoAds:true};
(()=>{
  const ensure=(src,key)=>{
    const has=[...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname===src}catch{return false}});
    if(has)return;
    const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key]='1';document.head.appendChild(s);
  };
  ensure('/assets/brand.js','pdBrandLoader');
  if(location.pathname==='/'||location.pathname==='/index.html')ensure('/assets/app-bootstrap.js','pdAppBootstrapLoader');
})();
