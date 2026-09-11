(()=>{
'use strict';
const cfg=window.PILOTDESK_ADS||{},pub=String(cfg.publisherId||'').trim(),slots=cfg.slots||{};
function validSlot(k){return /^\d+$/.test(String(slots[k]||'').trim())}
function makeSlot(key){if(document.querySelector(`[data-ad-slot="${key}"]`))return null;const wrap=document.createElement('aside');wrap.className='ad-wrap';wrap.setAttribute('aria-label','Advertisement');const box=document.createElement('div');box.className='ad-slot';box.dataset.adSlot=key;wrap.appendChild(box);return wrap}
function ensureManualPlaceholders(){
  if(validSlot('top')){const x=makeSlot('top'),hero=document.querySelector('.hero,.calc-hero');if(x&&hero)hero.insertAdjacentElement('afterend',x)}
  if(validSlot('content')){const x=makeSlot('content'),target=document.querySelector('.info-card,.wx-raw-grid,.pd-panel');if(x&&target)target.insertAdjacentElement('afterend',x)}
  if(validSlot('sidebar')){const x=makeSlot('sidebar'),side=document.querySelector('.sidebar');if(x&&side)side.appendChild(x)}
  if(validSlot('footer')){const x=makeSlot('footer'),foot=document.querySelector('footer');if(x&&foot)foot.insertAdjacentElement('beforebegin',x)}
}
function hideEmptySlots(){document.querySelectorAll('.ad-slot').forEach(box=>{const wrap=box.closest('.ad-wrap'),slot=String(slots[box.dataset.adSlot]||'').trim();if(!slot&&wrap)wrap.hidden=true})}
ensureManualPlaceholders();hideEmptySlots();
function renderManualSlots(){document.querySelectorAll('.ad-slot').forEach(box=>{const key=box.dataset.adSlot,slot=String(slots[key]||'').trim(),wrap=box.closest('.ad-wrap');if(!slot){if(wrap)wrap.hidden=true;return}if(!/^\d+$/.test(slot)){if(wrap)wrap.hidden=true;console.warn('PilotDesk: ignored invalid AdSense slot id for',key);return}if(wrap)wrap.hidden=false;const ins=document.createElement('ins');ins.className='adsbygoogle';ins.style.display='block';ins.style.minHeight=key==='sidebar'?'250px':'90px';ins.dataset.adClient=pub;ins.dataset.adSlot=slot;ins.dataset.adFormat='auto';ins.dataset.fullWidthResponsive='true';box.replaceWith(ins);try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){console.warn('PilotDesk: AdSense slot request failed',e)}})}
function ensureAds(){if(!/^ca-pub-\d+$/.test(pub))return;const existing=[...document.scripts].find(s=>s.src.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'));if(existing){if(window.adsbygoogle)renderManualSlots();else existing.addEventListener('load',renderManualSlots,{once:true});return}if(cfg.autoAds===false&&!Object.values(slots).some(Boolean))return;const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';s.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pub)}`;s.addEventListener('load',renderManualSlots,{once:true});document.head.appendChild(s)}
function scheduleAds(){let started=false,timer=null;const start=()=>{if(started)return;started=true;if(timer)clearTimeout(timer);const run=()=>ensureAds();if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:1500});else setTimeout(run,0)};const interact=()=>start();['pointerdown','keydown','touchstart','scroll'].forEach(ev=>addEventListener(ev,interact,{once:true,passive:true}));const later=()=>{timer=setTimeout(start,6000)};if(document.readyState==='complete')later();else addEventListener('load',later,{once:true})}scheduleAds();
})();
