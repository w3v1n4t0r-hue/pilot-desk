(()=>{
  const send=(kind,message,stack)=>{
    try{fetch('/api/client-error',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({kind:String(kind).slice(0,40),message:String(message||'Unknown error').slice(0,500),stack:String(stack||'').slice(0,1500),path:location.pathname})}).catch(()=>{})}catch{}
  };
  window.addEventListener('error',e=>{send('error',e.message,e.error?.stack)});
  window.addEventListener('unhandledrejection',e=>{const r=e.reason;send('unhandledrejection',r?.message||r,r?.stack)});
})();
