(()=>{
'use strict';
if(window.__pilotDeskCalculatorUx)return;window.__pilotDeskCalculatorUx=true;
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
if(!location.pathname.startsWith('/calculators/')||location.pathname.includes('weight-balance-builder'))return;
const inputs=qsa('[data-calc-input]'),calc=qs('[data-calculate]'),box=qs('.calc-box'),results=qs('.results');
if(!inputs.length||!calc||!box)return;
const storageKey='pd-calc-inputs:'+location.pathname;
const defaults=Object.fromEntries(inputs.map(i=>[i.id,i.defaultValue]));
const calcKey=document.body.dataset.calc||location.pathname.split('/').filter(Boolean).pop()||'calculator';
const QUICK_HELP={
  crosswind:'Use runway heading and wind direction from the same magnetic/true reference. The primary result is crosswind magnitude and side.',
  densityAltitude:'Pressure altitude + OAT drive the result. Use the aircraft POH/AFM charts—not density altitude alone—for takeoff and climb performance.',
  fuelRequired:'Fuel on board is compared with trip fuel plus the entered reserve. Confirm the reserve you enter matches the operation you are planning.',
  windTriangle:'Use a true course with true wind, or keep all directional references consistently magnetic. The result gives heading, groundspeed, and WCA.',
  tasApprox:'This is the common 2% per 1,000 ft training estimate. It is not a substitute for aircraft-specific air-data or performance information.',
  climbGradient:'Enter the required gradient in ft/NM and the groundspeed you expect during the climb. The primary result is required FPM.',
  threeDegree:'Enter groundspeed to estimate the FPM for a 3° path. The exact result and the common GS × 5 shortcut are shown together.',
  momentCg:'The calculated CG is arithmetic only. Compare it with the approved envelope and weight limits for the exact aircraft.',
  rateTurn:'Use true airspeed and bank angle. The results show turn rate, time for 360°, and turn radius.',
  turnRadius:'Use true airspeed and bank angle. The results show radius, diameter, and turn rate.'
};
const SUMMARY={
  crosswind:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'Crosswind: '+a+'. '+b+'. Relative angle: '+d+'.':''},
  densityAltitude:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'Density altitude: '+a+'. ISA temperature: '+b+'; deviation: '+d+'.':''},
  fuelRequired:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'Required fuel: '+a+'. Trip fuel: '+b+'. Margin after reserve: '+d+'.':''},
  windTriangle:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'Heading: '+a+'. Groundspeed: '+b+'. Wind correction: '+d+'.':''},
  tasApprox:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent;return a&&a!=='—'?'Estimated TAS: '+a+'. Estimated increase over CAS: '+b+'.':''},
  climbGradient:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent;return a&&a!=='—'?'Required vertical speed: '+a+'. Equivalent gradient: '+b+'.':''},
  threeDegree:()=>{const a=qs('#out0')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'3° path: '+a+'. GS × 5 shortcut: '+d+'.':''},
  momentCg:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent;return a&&a!=='—'?'Station moment: '+a+'. Calculated total CG: '+b+'.':''},
  rateTurn:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'Turn rate: '+a+'. 360° time: '+b+'. Radius: '+d+'.':''},
  turnRadius:()=>{const a=qs('#out0')?.textContent,b=qs('#out1')?.textContent,d=qs('#out2')?.textContent;return a&&a!=='—'?'Turn radius: '+a+'. Diameter: '+b+'. Turn rate: '+d+'.':''}
};
if(results){results.setAttribute('aria-live','polite');results.setAttribute('aria-atomic','true')}
const advisoryBox=document.createElement('div');advisoryBox.className='safety-warning';advisoryBox.id='pdAdvisory';advisoryBox.setAttribute('aria-live','polite');
const inputHeading=document.createElement('div');inputHeading.className='pd-calc-section-head';inputHeading.innerHTML='<b>Inputs</b><span>Use consistent units and references.</span>';
const resultsHeading=document.createElement('div');resultsHeading.className='pd-calc-section-head pd-calc-results-head';resultsHeading.innerHTML='<b>Results</b><span>Primary answer first.</span>';
const quickHelp=document.createElement('div');quickHelp.className='pd-calc-quick-help';quickHelp.innerHTML='<b>Before you calculate</b><span></span>';
quickHelp.querySelector('span').textContent=QUICK_HELP[calcKey]||'Confirm each input, unit, and reference before using the result. PilotDesk shows the arithmetic; approved sources control operational decisions.';
const resultSummary=document.createElement('div');resultSummary.className='pd-calc-result-summary';resultSummary.setAttribute('aria-live','polite');resultSummary.hidden=true;
resultSummary.innerHTML='<small>QUICK READ</small><strong></strong>';
const actions=document.createElement('div');actions.className='calc-actions';actions.setAttribute('aria-label','Calculation actions');actions.innerHTML='<button class="pd-calc-save" type="button" data-pd-save-calculation>Save calculation</button><button type="button" data-pd-copy-result>Copy result</button><button type="button" data-pd-reset>Reset</button><button type="button" data-pd-copy-link>Copy link</button><button type="button" data-pd-share>Share setup</button><button type="button" data-pd-print>Print</button><a href="/feedback.html?type=calculation" data-pd-report>Report result</a>';
const more=document.createElement('details');more.className='pd-export-menu';more.innerHTML='<summary>Share / export</summary>';[...actions.children].filter(el=>!el.matches('[data-pd-save-calculation],[data-pd-copy-result],[data-pd-reset]')).forEach(el=>more.append(el));actions.append(more);
const notice=box.querySelector('.notice');const anchor=notice||box.lastElementChild;
const fields=box.querySelector('.fields');fields?.insertAdjacentElement('beforebegin',inputHeading);fields?.insertAdjacentElement('beforebegin',quickHelp);
results?.insertAdjacentElement('beforebegin',resultsHeading);results?.insertAdjacentElement('afterend',resultSummary);
anchor?.insertAdjacentElement('beforebegin',advisoryBox);anchor?.insertAdjacentElement('beforebegin',actions);
if(fields&&results){
  const workbench=document.createElement('div');workbench.className='pd-calc-workbench';
  const inputPanel=document.createElement('section');inputPanel.className='pd-calc-input-panel';inputPanel.setAttribute('aria-label','Calculator inputs');
  const outputPanel=document.createElement('section');outputPanel.className='pd-calc-output-panel';outputPanel.setAttribute('aria-label','Calculator results');
  inputPanel.append(quickHelp,inputHeading,fields,calc);
  outputPanel.append(resultsHeading,results,resultSummary);
  workbench.append(inputPanel,outputPanel);
  box.insertBefore(workbench,box.firstChild);
  box.classList.add('pd-calc-shell');
}
const toast=m=>window.toast?.(m);
function loadSaved(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
const fromUrl=new URLSearchParams(location.search);
try{localStorage.removeItem(storageKey)}catch{}
const restoreNote=document.createElement('p');restoreNote.className='pd-calc-restore-note fine';restoreNote.hidden=true;restoreNote.setAttribute('role','status');fields?.insertAdjacentElement('beforebegin',restoreNote);
function parseValue(i,v){if(v==null||String(v).trim()==='')return null;if(i.type==='number'||i.inputMode==='decimal'||i.inputMode==='numeric'){return Number.isFinite(Number(v))?String(v):null}return String(v)}
inputs.forEach(i=>{const u=parseValue(i,fromUrl.get(i.id));if(u!==null){i.value=u;restoreNote.hidden=false;restoreNote.textContent='Inputs loaded from this link. Check the values and conditions before using the result.'}});
function advisory(){const key=document.body.dataset.calc||'',msgs=[];const alt=qs('#altimeter');if(alt&&Number.isFinite(Number(alt.value))&&(Number(alt.value)<28||Number(alt.value)>31))msgs.push('Altimeter setting is outside the common 28.00–31.00 inHg sanity-check range. Verify the source and units.');const w=qs('#windSpeed');if((key==='crosswind'||key==='windTriangle')&&w&&Number.isFinite(Number(w.value))&&Number(w.value)>99)msgs.push('Wind speed exceeds 99 kt. Verify the entry and current source data.');if(key==='fuelWeight'){const p=qs('#ppg');if(p&&Number.isFinite(Number(p.value))){const x=Number(p.value);if(Math.abs(x-6.01)<.04)msgs.push('6.01 lb/US gal matches the FAA handbook standard Avgas weight at 59°F. Actual fuel weight varies; use actual or approved data when available.');else if(Math.abs(x-6.68)<.04)msgs.push('6.68 lb/US gal matches the FAA handbook standard Jet A/A-1 weight at 59°F. Actual fuel weight varies; use actual or approved data when available.');else msgs.push('Custom fuel density entered. Verify it for the actual fuel and temperature.')}}advisoryBox.textContent=msgs.join(' ');advisoryBox.classList.toggle('show',msgs.length>0)}
function valuesObject(){return Object.fromEntries(inputs.filter(i=>i.value!=='').map(i=>[i.id,i.value]))}
function shareParams(){const p=new URLSearchParams();inputs.forEach(i=>{if(i.value===''||i.value===defaults[i.id])return;p.set(i.id,i.value)});return p}
function sync(){const p=shareParams(),v=valuesObject();history.replaceState(null,'',location.pathname+(p.toString()?'?'+p.toString():''));advisory()}
function referralUrl(){const u=new URL(location.href);u.searchParams.set('utm_source','pilotdesk_calculator_share');u.searchParams.set('utm_medium','referral');u.searchParams.set('utm_campaign','calculator_setup');u.searchParams.set('utm_content',(document.body.dataset.calc||location.pathname.split('/').filter(Boolean).pop()||'calculator').toLowerCase());return u.toString()}
function inputText(){return inputs.map(i=>{const label=i.closest('.field')?.querySelector('label')?.textContent?.trim()||i.id;return i.value!==''?`${label}: ${i.value}`:null}).filter(Boolean)}
function outputText(){return qsa('.result').map(r=>{const k=r.querySelector('small')?.textContent?.trim(),v=r.querySelector('strong')?.textContent?.trim();return k&&v&&v!=='—'?`${k}: ${v}`:null}).filter(Boolean)}
function outputObject(){return Object.fromEntries(qsa('.result').map(r=>[r.querySelector('small')?.textContent?.trim(),r.querySelector('strong')?.textContent?.trim()]).filter(([k,v])=>k&&v&&v!=='—'))}
function calculateCurrent(){if(window.PilotDeskSafety&&!window.PilotDeskSafety.validate(calcKey))return false;calc.click();return true}
function resultText(url=location.href){const title=qs('.calc-hero h1')?.textContent?.trim()||'PilotDesk calculation';const out=outputText();return [title,...inputText(),...(out.length?['',...out]:[]),'',`Try this exact setup: ${url}`].join('\n')}
function track(name){try{window.va?.('event',{name,data:{calculator:document.body.dataset.calc||location.pathname}})}catch{}}
function bringResultIntoView(){if(!results||!matchMedia('(max-width:760px)').matches)return;const r=results.getBoundingClientRect();if(r.top>=0&&r.bottom<=innerHeight)return;results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})}
function updateSummary(){const fn=SUMMARY[calcKey],text=fn?.()||'';resultSummary.hidden=!text;resultSummary.querySelector('strong').textContent=text}
function afterCalculate(){sync();updateSummary();track('Calculator Used');bringResultIntoView();const detail={title:qs('.calc-hero h1')?.textContent?.trim()||'Calculator',path:location.pathname,inputs:valuesObject(),summary:outputText().slice(0,3).join(' · '),url:location.href};document.dispatchEvent(new CustomEvent('pilotdesk:calculated',{detail}))}
calc.addEventListener('click',()=>setTimeout(afterCalculate,0));
inputs.forEach(i=>{i.addEventListener('change',sync);i.addEventListener('input',()=>{advisory();requestAnimationFrame(updateSummary)})});
box.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();calc.click()}});
actions.querySelector('[data-pd-save-calculation]').addEventListener('click',async()=>{
  if(!calculateCurrent())return;sync();updateSummary();
  const outputs=outputObject();if(!Object.keys(outputs).length){toast('Calculate first, then save the result');return}
  const service=window.PilotDeskSavedCalculations;if(!service){toast('Account save is still loading');return}
  const saved=await service.save({toolSlug:calcKey,title:qs('.calc-hero h1')?.textContent?.trim()||'PilotDesk calculation',inputs:valuesObject(),result:{outputs,summary:outputText(),url:location.href}});
  if(saved.ok){toast('Calculation saved to your PilotDesk account');window.pdTrack?.('Calculation Saved',{calculator:calcKey});return}
  if(saved.reason==='signin'){location.assign(saved.url);return}
  toast('Could not save calculation to your account');
});
actions.querySelector('[data-pd-copy-result]').addEventListener('click',async()=>{if(!calculateCurrent())return;sync();try{await navigator.clipboard.writeText(resultText(referralUrl()));toast('Result copied with share link');track('Result Copied');window.pdTrack?.('Calculator Result Copied',{calculator:document.body.dataset.calc||location.pathname})}catch{toast('Copy failed')}});
actions.querySelector('[data-pd-copy-link]').addEventListener('click',async()=>{sync();const url=referralUrl();try{await navigator.clipboard.writeText(url);toast('Shareable calculation link copied');track('Calculation Link Copied');window.pdTrack?.('Calculator Link Copied',{calculator:document.body.dataset.calc||location.pathname})}catch{toast('Copy failed')}});
actions.querySelector('[data-pd-share]').addEventListener('click',async()=>{if(!calculateCurrent())return;sync();const title=qs('h1')?.textContent?.trim()||'PilotDesk',url=referralUrl(),text=resultText(url);try{if(navigator.share)await navigator.share({title,text,url});else{await navigator.clipboard.writeText(text);toast('Setup link copied')}track('Calculation Shared');window.pdTrack?.('Calculator Shared',{calculator:document.body.dataset.calc||location.pathname,method:navigator.share?'native':'copy'})}catch(e){if(e?.name!=='AbortError')toast('Share failed')}});
actions.querySelector('[data-pd-reset]').addEventListener('click',()=>{qsa('[data-calc-input]').forEach(i=>{i.value=defaults[i.id]??i.defaultValue??'';i.dispatchEvent(new Event('input',{bubbles:true}))});restoreNote.hidden=true;try{localStorage.removeItem(storageKey)}catch{}history.replaceState(null,'',location.pathname);advisoryBox.classList.remove('show');qsa('.result strong').forEach(e=>e.textContent='—');resultSummary.hidden=true;resultSummary.querySelector('strong').textContent='';toast('Calculator reset')});
actions.querySelector('[data-pd-print]').addEventListener('click',()=>window.print());
const report=actions.querySelector('[data-pd-report]');if(report){const u=new URL(report.href,location.origin);u.searchParams.set('page',location.pathname);report.href=u.pathname+u.search}
advisory();requestAnimationFrame(()=>{updateSummary();if([...fromUrl.keys()].some(k=>inputs.some(i=>i.id===k)))calc.click()});
})();
