(()=>{
  const seen=new Map(),WINDOW=60000;
  const send=(kind,message,stack)=>{try{const key=String(kind)+'|'+String(message||'Unknown error').slice(0,220)+'|'+location.pathname,now=Date.now(),last=seen.get(key)||0;if(now-last<WINDOW)return;seen.set(key,now);fetch('/api/client-error',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({kind:String(kind).slice(0,40),message:String(message||'Unknown error').slice(0,500),stack:String(stack||'').slice(0,1500),path:location.pathname})}).catch(()=>{})}catch{}};
  window.addEventListener('error',e=>send('error',e.message,e.error?.stack));window.addEventListener('unhandledrejection',e=>{const r=e.reason;send('unhandledrejection',r?.message||r,r?.stack)});
})();
