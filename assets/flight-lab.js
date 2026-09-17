(()=>{
'use strict';
const box=document.querySelector('.calc-box');
if(!box||document.querySelector('.pd-flight-lab'))return;
const section=document.createElement('section');section.className='pd-flight-lab';section.dataset.state='idle';section.setAttribute('aria-labelledby','pdFlightLabTitle');
section.innerHTML=`<div class="pd-lab-header"><div><span class="pd-lab-eyebrow">Flight Lab · 3D</span><h2 id="pdFlightLabTitle">Explore the aircraft. Inspect the airflow.</h2></div><button type="button" class="pd-btn secondary" data-lab-open aria-expanded="false" aria-controls="pdLabWorkspace">Open 3D lab</button></div>
<div id="pdLabWorkspace" hidden>
  <div class="pd-lab-toolbar" role="group" aria-label="Aircraft view">
    <button type="button" class="pd-btn secondary" data-view="orbit">Perspective</button><button type="button" class="pd-btn secondary" data-view="top">Top</button><button type="button" class="pd-btn secondary" data-view="side">Side</button>
    <span class="pd-lab-zoom"><button type="button" class="pd-btn secondary" data-zoom="-1" aria-label="Zoom in">+</button><button type="button" class="pd-btn secondary" data-zoom="1" aria-label="Zoom out">−</button></span>
  </div>
  <div class="pd-lab-scene"><canvas tabindex="0" role="img" aria-label="Interactive user-supplied trainer model. Drag to orbit; arrow keys rotate, plus and minus zoom, Home resets." aria-describedby="pdLabControls"></canvas><span class="pd-lab-view" data-lab-badge>Aircraft geometry · not CFD</span></div>
  <p id="pdLabControls" class="pd-lab-hint">Drag to orbit · Arrow keys to rotate · + / − to zoom</p>
  <div class="pd-lab-toolbar">
    <label class="pd-lab-file">Import reviewed CFD result<input type="file" accept=".json,application/json" data-lab-file></label>
    <button type="button" class="pd-btn secondary" data-lab-pressure aria-pressed="false" disabled>Surface pressure</button>
    <button type="button" class="pd-btn secondary" data-lab-pause aria-pressed="true" disabled>Play flow traces</button>
  </div>
  <p class="pd-lab-legend" data-lab-legend hidden></p>
  <div class="pd-lab-reading" aria-live="polite" aria-atomic="true"><p data-lab-status>OpenFOAM results are not loaded.</p><p data-lab-detail>The supplied mesh is available to inspect. Airflow appears only from an imported, reviewed solver export.</p></div>
  <details class="pd-lab-method"><summary>Simulation provenance &amp; limitations</summary><p data-lab-provenance>No solver run is attached. The display mesh has open and non-manifold edges and is not yet a CFD-ready surface.</p><p>Steady incompressible CFD is an educational model, not a flight simulator, stall prediction or aircraft POH. Animated traces travel through a fixed solved field; they do not show a time-resolved simulation. Imported conditions remain fixed when calculator inputs change.</p></details>
</div>
<p class="pd-lab-calculation" data-lab-result>Calculator results remain independent of the 3D lab.</p>`;
box.insertAdjacentElement('afterend',section);
const q=selector=>section.querySelector(selector),workspace=q('#pdLabWorkspace'),open=q('[data-lab-open]'),canvas=q('canvas'),pause=q('[data-lab-pause]'),pressure=q('[data-lab-pressure]');
let renderer=null,dataset=null,initializing=false,expanded=false,inView=false,playing=false,mapped=false,importId=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function activity(){renderer?.setActive(expanded&&inView&&!document.hidden);renderer?.setPaused(!playing||reduced.matches);pause.textContent=reduced.matches?'Reduced motion':playing?'Pause flow traces':'Play flow traces';pause.setAttribute('aria-pressed',String(!playing||reduced.matches));pause.disabled=!dataset||reduced.matches}
function status(title,detail){q('[data-lab-status]').textContent=title;q('[data-lab-detail]').textContent=detail}
open.addEventListener('click',async()=>{
  expanded=!expanded;workspace.hidden=!expanded;open.setAttribute('aria-expanded',String(expanded));open.textContent=expanded?'Close 3D lab':'Open 3D lab';activity();
  if(!expanded||renderer||initializing)return;
  initializing=true;status('Loading your aircraft model…','The calculator remains ready to use.');
  try{const {createRenderer}=await import('/assets/flight-lab-renderer.mjs');renderer=createRenderer(canvas,message=>status('3D viewer unavailable',message));await renderer.loadModel('/assets/flight-lab/trainer.pdm');status('Aircraft geometry loaded · no solved airflow','Import a reviewed OpenFOAM export to inspect surface pressure and solved streamlines.');activity()}
  catch(error){status('3D viewer unavailable',error.message);renderer?.dispose();renderer=null}
  finally{initializing=false}
});
section.addEventListener('click',event=>{const button=event.target.closest('button');if(button?.dataset.view)renderer?.setView(button.dataset.view);if(button?.dataset.zoom)renderer?.zoom(Number(button.dataset.zoom))});
pause.addEventListener('click',()=>{playing=!playing;activity()});
pressure.addEventListener('click',()=>{mapped=!mapped;pressure.setAttribute('aria-pressed',String(mapped));renderer?.setPressure(mapped);q('[data-lab-legend]').hidden=!mapped});
q('[data-lab-file]').addEventListener('change',async event=>{
  const file=event.target.files?.[0],request=++importId;event.target.value='';if(!file)return;
  try{
    if(!renderer||initializing)throw Error('Wait for the aircraft viewer to load, then import again.');
    if(file.size>20*1024*1024)throw Error('Choose an exported dataset smaller than 20 MB.');
    const {validateDataset}=await import('/assets/flight-lab-data.mjs');const next=validateDataset(JSON.parse(await file.text()));if(request!==importId)return;
    const range=renderer.setDataset(next);dataset=next;playing=false;mapped=false;renderer.setPressure(false);pressure.disabled=false;pressure.setAttribute('aria-pressed','false');q('[data-lab-legend]').hidden=true;
    q('[data-lab-legend]').textContent=`Surface pressure relative to outlet · blue ${range[0].toFixed(0)} Pa → red ${range[1].toFixed(0)} Pa`;
    const c=dataset.conditions,p=dataset.provenance;
    q('[data-lab-badge]').textContent='Imported OpenFOAM field · fixed conditions';
    status('Reviewed solver export loaded',`${c.speedMs.toFixed(1)} m/s · density ${c.densityKgM3.toFixed(3)} kg/m³ · AoA ${c.aoaDeg}° · sideslip ${c.sideslipDeg}°. Calculator inputs do not modify this solved case.`);
    q('[data-lab-provenance]').textContent=`Declared solver: OpenFOAM ${p.version} / ${p.solver}. Solved ${p.solvedAt}. Reviewed by ${p.reviewedBy} on ${p.reviewedAt}. Geometry SHA-256: ${p.geometrySha256}. Case SHA-256: ${p.caseSha256}. Review applies to this export, not aircraft certification.`;
    activity();
  }catch(error){if(request===importId)status('CFD import rejected',`${error instanceof SyntaxError?'The file is not valid JSON.':error.message} ${dataset?'The previous field is still displayed.':'No airflow is displayed.'}`)}
});
if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;activity()},{threshold:.01}).observe(section);else inView=true;
document.addEventListener('visibilitychange',activity);reduced.addEventListener('change',activity);
function calculation(){const values=[0,1,2].map(i=>document.querySelector('#out'+i)?.textContent.trim()||'—');const warning=document.querySelector('#safetyWarning.show')?.textContent.trim();const empty=values.some(v=>v==='—'||!v);
  section.dataset.state=warning?'invalid':empty?'idle':'ready';q('[data-lab-result]').textContent=warning?'Correct the calculator inputs above. CFD cases remain separate.':empty?'Calculator results remain independent of the 3D lab.':`Calculator result: ${values.join(' · ')}. Imported CFD conditions remain fixed.`;
}
box.addEventListener('input',event=>{if(event.target.matches('[data-calc-input]')){section.dataset.state='stale';q('[data-lab-result]').textContent='Inputs changed — calculate again. Imported CFD conditions remain fixed.'}});
const results=box.querySelector('.results');if(results)new MutationObserver(calculation).observe(results,{childList:true,subtree:true,characterData:true});
document.addEventListener('pilotdesk:calculated',calculation);
})();
