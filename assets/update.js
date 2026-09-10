(()=>{
  if(!('serviceWorker' in navigator))return;
  const style=document.createElement('style');style.textContent='.pd-update-notice{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:120;display:flex;align-items:center;gap:12px;background:#111317;color:#e8eaed;border:1px solid #454950;border-radius:10px;padding:11px 13px;box-shadow:0 16px 44px rgba(0,0,0,.45);font:600 12px/1.3 system-ui,-apple-system,Segoe UI,sans-serif}.pd-update-notice button{border:1px solid #d4d7db;background:#e5e7ea;color:#0b0c0e;border-radius:7px;padding:7px 10px;font-weight:750;cursor:pointer}@media(max-width:520px){.pd-update-notice{width:calc(100% - 28px);justify-content:space-between}}';document.head.appendChild(style);
  let refreshing=false;
  function show(reg){if(document.getElementById('pdUpdateNotice'))return;const el=document.createElement('div');el.id='pdUpdateNotice';el.className='pd-update-notice';el.innerHTML='<span>A newer PilotDesk version is ready.</span><button type="button">Refresh</button>';el.querySelector('button').addEventListener('click',()=>{reg.waiting?.postMessage({type:'SKIP_WAITING'});location.reload()});document.body.appendChild(el)}
  navigator.serviceWorker.ready.then(reg=>{if(reg.waiting)show(reg);reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)show(reg)})})}).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
})();
