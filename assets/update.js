(()=>{
  if(!('serviceWorker' in navigator))return;
  let refreshing=false;
  function show(reg){
    if(document.getElementById('pdUpdateNotice'))return;
    const el=document.createElement('div');el.id='pdUpdateNotice';el.className='pd-update-notice';el.innerHTML='<span>A newer PilotDesk version is ready.</span><button type="button">Refresh</button>';
    el.querySelector('button').addEventListener('click',()=>{reg.waiting?.postMessage({type:'SKIP_WAITING'});location.reload()});document.body.appendChild(el);
  }
  navigator.serviceWorker.ready.then(reg=>{
    if(reg.waiting)show(reg);
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)show(reg)})});
  }).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
})();
