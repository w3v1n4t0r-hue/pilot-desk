(()=>{
  if(!('serviceWorker' in navigator))return;
  const style=document.createElement('style');style.textContent='.pd-update-notice{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;background:#111317;color:#e8eaed;border-bottom:1px solid #454950;padding:8px 16px;font:500 14px/1.4 system-ui}.pd-update-notice button{border:1px solid #454950;background:#111317;color:#e8eaed;border-radius:0;min-height:44px;padding:8px 12px;font:600 14px system-ui;cursor:pointer}.pd-update-notice button:focus-visible{outline:2px solid #eee;outline-offset:2px}';document.head.appendChild(style);
  let userRequestedRefresh=false, dismissed=false;
  function show(reg){
    if(dismissed||document.getElementById('pdUpdateNotice'))return;
    const el=document.createElement('div');el.id='pdUpdateNotice';el.className='pd-update-notice';el.setAttribute('role','status');
    el.innerHTML='<span>A newer PilotDesk version is ready.</span><button type="button">Refresh</button><button type="button" data-dismiss>Later</button>';
    el.querySelector('button').addEventListener('click',()=>{userRequestedRefresh=true;if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});else location.reload()});
    el.querySelector('[data-dismiss]').addEventListener('click',()=>{dismissed=true;el.remove()});
    const header=document.querySelector('header.topbar');if(header)header.after(el);else document.body.prepend(el)
  }
  navigator.serviceWorker.ready.then(reg=>{
    if(reg.waiting)show(reg);
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)show(reg)})})
  }).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!userRequestedRefresh)return;location.reload()});
})();
