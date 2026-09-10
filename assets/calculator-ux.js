(()=>{
'use strict';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
if(!location.pathname.startsWith('/calculators/')||location.pathname.includes('weight-balance-builder'))return;
const inputs=qsa('[data-calc-input]'),calc=qs('[data-calculate]'),box=qs('.calc-box'),results=qs('.results');
if(!inputs.length||!calc||!box)return;
const storageKey='pd-calc-inputs:'+location.pathname;
const defaults=Object.fromEntries(inputs.map(i=>[i.id,i.defaultValue]));
if(results){results.setAttribute('aria-live','polite');results.setAttribute('aria-atomic','true')}
const advisoryBox=document.createElement('div');advisoryBox.className='safety-warning';advisoryBox.id='pdAdvisory';advisoryBox.setAttribute('aria-live','polite');
const actions=document.createElement('div');actions.className='calc-actions';actions.setAttribute('aria-label','Calculation actions');actions.innerHTML='<button type="button" data-pd-copy-result>Copy result</button><button type="button" data-pd-copy-link>Copy link</button><button type="button" data-pd-share>Share</button><button type="button" data-pd-reset>Reset</button><button type="button" data-pd-print>Print</button><a href="/feedback.html?type=calculation" data-pd-report>Report result</a>';
const notice=box.querySelector('.notice');const anchor=notice||box.lastElementChild;anchor?.insertAdjacentElement('beforebegin',advisoryBox);anchor?.insertAdjacentElement('beforebegin',actions);
const toast=m=>window.toast?.(m);
function loadSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
const fromUrl=new URLSearchParams(location.search),saved=loadSaved();
function parseValue(i,v){if(v==null||String(v).trim()==='')return null;if(i.type==='number'||i.inputMode==='decimal'||i.inputMode==='numeric'){return Number.isFinite(Number(v))?String(v):null}return String(v)}
inputs.forEach(i=>{const u=parseValue(i,fromUrl.get(i.id));const s=parseValue(i,saved[i.id]);if(u!==null)i.value=u;else if(s!==null)i.value=s});
function advisory(){const key=document.body.dataset.calc||'',msgs=[];const alt=qs('#altimeter');if(alt&&Number.isFinite(Number(alt.value))&&(Number(alt.value)<28||Number(alt.value)>31))msgs.push('Altimeter setting is outside the common 28.00–31.00 inHg sanity-check range. Verify the source and units.');const w=qs('#windSpeed');if((key==='crosswind'||key==='windTriangle')&&w&&Number.isFinite(Number(w.value))&&Number(w.value)>99)msgs.push('Wind speed exceeds 99 kt. Verify the entry and current source data.');if(key==='fuelWeight'){const p=qs('#ppg');if(p&&Number.isFinite(Number(p.value))){const x=Number(p.value);if(Math.abs(x-6.01)<.04)msgs.push('6.01 lb/US gal matches the FAA handbook standard Avgas weight at 59°F. Actual fuel weight varies; use actual or approved data when available.');else if(Math.abs(x-6.68)<.04)msgs.push('6.68 lb/US gal matches the FAA handbook standard Jet A/A-1 weight at 59°F. Actual fuel weight varies; use actual or approved data when available.');else msgs.push('Custom fuel density entered. Verify it for the actual fuel and temperature.')}}advisoryBox.textContent=msgs.join(' ');advisoryBox.classList.toggle('show',msgs.length>0)}
function valuesObject(){return Object.fromEntries(inputs.filter(i=>i.value!=='').map(i=>[i.id,i.value]))}
function shareParams(){const p=new URLSearchParams();inputs.forEach(i=>{if(i.value===''||i.value===defaults[i.id])return;p.set(i.id,i.value)});return p}
function sync(){const p=shareParams(),v=valuesObject();history.replaceState(null,'',location.pathname+(p.toString()?'?'+p.toString():''));try{localStorage.setItem(storageKey,JSON.stringify(v))}catch{}advisory()}
function inputText(){return inputs.map(i=>{const label=i.closest('.field')?.querySelector('label')?.textContent?.trim()||i.id;return i.value!==''?`${label}: ${i.value}`:null}).filter(Boolean)}
function outputText(){return qsa('.result').map(r=>{const k=r.querySelector('small')?.textContent?.trim(),v=r.querySelector('strong')?.textContent?.trim();return k&&v&&v!=='—'?`${k}: ${v}`:null}).filter(Boolean)}
function resultText(){const title=qs('.calc-hero h1')?.textContent?.trim()||'PilotDesk calculation';const out=outputText();return [title,...inputText(),...(out.length?['',...out]:[]),'',location.href].join('\n')}
function track(name){try{window.va?.('event',{name,data:{calculator:document.body.dataset.calc||location.pathname}})}catch{}}
function bringResultIntoView(){if(!results||!matchMedia('(max-width:760px)').matches)return;const r=results.getBoundingClientRect();if(r.top>=0&&r.bottom<=innerHeight)return;results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})}
function afterCalculate(){sync();track('Calculator Used');bringResultIntoView();const detail={title:qs('.calc-hero h1')?.textContent?.trim()||'Calculator',path:location.pathname,inputs:valuesObject(),summary:outputText().slice(0,3).join(' · '),url:location.href};document.dispatchEvent(new CustomEvent('pilotdesk:calculated',{detail}))}
calc.addEventListener('click',()=>setTimeout(afterCalculate,0));
inputs.forEach(i=>{i.addEventListener('change',sync);i.addEventListener('input',advisory)});
box.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();calc.click()}});
actions.querySelector('[data-pd-copy-result]').addEventListener('click',async()=>{sync();try{await navigator.clipboard.writeText(resultText());toast('Result copied');track('Result Copied')}catch{toast('Copy failed')}});
actions.querySelector('[data-pd-copy-link]').addEventListener('click',async()=>{sync();try{await navigator.clipboard.writeText(location.href);toast('Calculation link copied');track('Calculation Link Copied')}catch{toast('Copy failed')}});
actions.querySelector('[data-pd-share]').addEventListener('click',async()=>{sync();const title=qs('h1')?.textContent?.trim()||'PilotDesk';try{if(navigator.share)await navigator.share({title,text:resultText(),url:location.href});else{await navigator.clipboard.writeText(location.href);toast('Link copied')}}catch(e){if(e?.name!=='AbortError')toast('Share failed')}});
actions.querySelector('[data-pd-reset]').addEventListener('click',()=>{inputs.forEach(i=>i.value=defaults[i.id]??'');try{localStorage.removeItem(storageKey)}catch{}history.replaceState(null,'',location.pathname);advisoryBox.classList.remove('show');qsa('.result strong').forEach(e=>e.textContent='—');toast('Calculator reset')});
actions.querySelector('[data-pd-print]').addEventListener('click',()=>window.print());
const report=actions.querySelector('[data-pd-report]');if(report){const u=new URL(report.href,location.origin);u.searchParams.set('page',location.pathname);report.href=u.pathname+u.search}
advisory();if([...fromUrl.keys()].length)requestAnimationFrame(()=>calc.click());
})();
