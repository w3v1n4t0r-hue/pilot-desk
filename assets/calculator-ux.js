(()=>{
  const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  if(!location.pathname.startsWith('/calculators/'))return;
  const inputs=qsa('[data-calc-input]'),calc=qs('[data-calculate]'),box=qs('.calc-box');
  if(!inputs.length||!calc||!box)return;
  const storageKey='pd-calc-inputs:'+location.pathname;
  const warn=document.createElement('div');warn.className='safety-warning';warn.id='pdAdvisory';warn.setAttribute('aria-live','polite');
  const actions=document.createElement('div');actions.className='calc-actions';actions.innerHTML='<button type="button" data-pd-copy>Copy link</button><button type="button" data-pd-reset>Reset</button>';
  const notice=box.querySelector('.notice');(notice||box.lastElementChild)?.insertAdjacentElement('beforebegin',warn);(notice||box.lastElementChild)?.insertAdjacentElement('beforebegin',actions);
  const defaults=Object.fromEntries(inputs.map(i=>[i.id,i.defaultValue]));
  const readSaved=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}};
  const fromUrl=new URLSearchParams(location.search),saved=readSaved();
  inputs.forEach(i=>{const u=fromUrl.get(i.id);if(u!==null&&u.trim()!==''&&Number.isFinite(Number(u)))i.value=u;else if(saved[i.id]!==undefined&&saved[i.id]!==''&&Number.isFinite(Number(saved[i.id])))i.value=saved[i.id]});
  function advisory(){
    const key=document.body.dataset.calc||'';const msgs=[];
    const alt=qs('#altimeter');if(alt&&Number.isFinite(Number(alt.value))&&(Number(alt.value)<28||Number(alt.value)>31))msgs.push('Altimeter setting is outside the common 28.00–31.00 inHg sanity-check range. Verify the source before using the result.');
    if((key==='crosswind'||key==='windTriangle')){const w=qs('#windSpeed');if(w&&Number(w.value)>99)msgs.push('Wind speed exceeds 99 kt. The calculator can still evaluate it, but verify the entry and source data.');}
    if(key==='fuelWeight'){const p=qs('#ppg');if(p&&Number.isFinite(Number(p.value))){const n=Number(p.value);if(Math.abs(n-6)<.06)msgs.push('Fuel density is approximately 6.0 lb/gal, commonly used as an AvGas planning value. Verify actual fuel data.');else if(Math.abs(n-6.7)<.06)msgs.push('Fuel density is approximately 6.7 lb/gal, commonly used as a Jet-A planning value. Verify actual fuel data.');else msgs.push('Custom fuel density entered. Verify the pounds-per-gallon value for the actual fuel and temperature.');}}
    warn.textContent=msgs.join(' ');warn.classList.toggle('show',msgs.length>0);
  }
  function sync(){
    const p=new URLSearchParams();const values={};inputs.forEach(i=>{if(i.value!==''){p.set(i.id,i.value);values[i.id]=i.value}});history.replaceState(null,'',location.pathname+(p.toString()?'?'+p:''));try{localStorage.setItem(storageKey,JSON.stringify(values))}catch{}advisory();
  }
  calc.addEventListener('click',()=>setTimeout(sync,0));inputs.forEach(i=>i.addEventListener('change',sync));
  box.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();calc.click()}});
  actions.querySelector('[data-pd-copy]').addEventListener('click',async()=>{sync();try{await navigator.clipboard.writeText(location.href);window.toast?.('Calculation link copied')}catch{window.toast?.('Copy failed')}});
  actions.querySelector('[data-pd-reset]').addEventListener('click',()=>{inputs.forEach(i=>i.value=defaults[i.id]??'');try{localStorage.removeItem(storageKey)}catch{}history.replaceState(null,'',location.pathname);warn.classList.remove('show');calc.click();window.toast?.('Calculator reset')});
  advisory();if([...fromUrl.keys()].length)calc.click();
})();
