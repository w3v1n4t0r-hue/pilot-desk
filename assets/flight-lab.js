(()=>{
'use strict';
// Presentation only: the existing calculator owns validation and every result.
const modes={crosswind:{title:'See the wind components',view:'top',reference:'Runway ahead'},windTriangle:{title:'See why the heading changes',view:'top',reference:'Desired course'},densityAltitude:{title:'See the air get thinner',view:'side'}};
const mode=modes[document.body.dataset.calc],box=document.querySelector('.calc-box');
if(!mode||!box||document.querySelector('.pd-flight-lab'))return;
const q=(selector,root=document)=>root.querySelector(selector);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const input=id=>Number(q('#'+id)?.value);
const output=i=>q('#out'+i)?.textContent.trim()||'—';
// Outputs use the visitor's locale. Read the displayed value without reimplementing aviation formulas.
const parts=new Intl.NumberFormat().formatToParts(12345.6);
const group=parts.find(p=>p.type==='group')?.value||',';
const decimal=parts.find(p=>p.type==='decimal')?.value||'.';
const digits=Array.from({length:10},(_,i)=>new Intl.NumberFormat(undefined,{useGrouping:false}).format(i));
function resultNumber(i){let raw=output(i);digits.forEach((digit,i)=>{raw=raw.split(digit).join(String(i))});raw=raw.split(group).join('').replace(decimal,'.').replace(/[\u061c\u200e\u200f]/g,'');return Number(raw.match(/[+−-]?\d+(?:\.\d+)?/)?.[0]?.replace('−','-')??NaN)}

// Original schematic of a 172-class trainer: high straight wing, cabin, tapered
// fuselage, conventional tail and fixed tricycle gear. Dimensions are illustrative.
const topModel=`<g class="pd-lab-aircraft" data-aircraft>
 <path class="pd-lab-gear" d="M-16 8-42 35M16 8 42 35M0-65V-43"/><path class="pd-lab-tire" d="M-43 29v14M43 29v14M0-70v10"/>
 <path class="pd-lab-body" d="M-4 75-50 80-51 90-4 89 0 99 4 89 51 90 50 80 4 75Z"/>
 <path class="pd-lab-body" d="M0-92C-10-92-17-75-18-56L-19 1-7 68-4 91H4L7 68 19 1 18-56C17-75 10-92 0-92Z"/>
 <path class="pd-lab-window" d="M-14-59-11-74H11L14-59 0-55Z"/>
 <path class="pd-lab-wing" d="M-18-36-137-34-142-27V-9L-19-8H19L142-9V-27L137-34 18-36Z"/>
 <path class="pd-lab-detail" d="M-136-17H-27M27-17H136M-98-17v8M98-17v8M0 25V88M-45 85H-8M8 85H45"/>
 <path class="pd-lab-prop" d="M-31-97H31"/><ellipse class="pd-lab-spinner" cx="0" cy="-97" rx="4" ry="7"/>
</g>`;
const sideModel=`<g class="pd-lab-aircraft" data-aircraft>
 <path class="pd-lab-body" d="M96 3 116-51 133-58 128 14Z"/>
 <path class="pd-lab-body" d="M-145 9-130-8-85-12-65-37H-21L15-10 120 9 143 17 107 25-15 35-101 32-137 22Z"/>
 <path class="pd-lab-window" d="M-78-12-61-31H-40V-10ZM-34-31H-23L1-10H-34Z"/>
 <path class="pd-lab-wing" d="M-84-40-26-43 42-35 44-29-88-29Z"/>
 <path class="pd-lab-gear" d="M-64 31-14-30M-128 25-130 56M-23 34-8 61"/>
 <path class="pd-lab-body" d="M97 13 151 10 151 17 101 22Z"/>
 <path class="pd-lab-detail" d="M-34-8V23H-71V-8M-137 15H103M123-43 119 5"/>
 <ellipse class="pd-lab-tire" cx="-129" cy="58" rx="9" ry="10"/><ellipse class="pd-lab-tire" cx="-7" cy="64" rx="12" ry="12"/>
 <path class="pd-lab-prop" d="M-150-20V43"/><path class="pd-lab-spinner" d="M-145 5-161 11-145 18Z"/>
</g>`;
const section=document.createElement('section');section.className='pd-flight-lab';section.dataset.state='idle';section.dataset.mode=document.body.dataset.calc;
section.setAttribute('aria-labelledby','pdFlightLabTitle');
section.innerHTML=`<div class="pd-lab-header"><div><span class="pd-lab-eyebrow">Flight Lab</span><h2 id="pdFlightLabTitle">${mode.title}</h2></div><button class="pd-btn secondary" type="button" data-lab-pause aria-pressed="false">Pause motion</button></div>
 <div class="pd-lab-scene"><svg viewBox="0 0 640 300" role="img" aria-labelledby="pdLabSvgTitle pdLabSvgDesc">
 <title id="pdLabSvgTitle">172-class high-wing trainer, ${mode.view==='top'?'top':'side'} view</title><desc id="pdLabSvgDesc">Calculate to illustrate the result.</desc>
 <defs><clipPath id="pdLabClip"><rect width="640" height="300" rx="8"/></clipPath><marker id="pdLabArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="currentColor"/></marker></defs>
 <g clip-path="url(#pdLabClip)"><g class="pd-lab-reference">${mode.view==='top'?'<path d="M298 0V300M342 0V300"/><path class="pd-lab-course" d="M320 292V8"/>':''}</g>
 <g data-flow-direction transform="translate(320 150)"><g data-flow></g></g>
 <g transform="translate(320 150)">${mode.view==='top'?topModel:sideModel}</g>
 <g class="pd-lab-vector" data-wind-vector><path d="M540 117V183" marker-end="url(#pdLabArrow)"/></g>
 </g></svg><div class="pd-lab-view">${mode.view==='top'?'Top view · ground reference':'Side view · schematic airflow'}</div></div>
 <div class="pd-lab-key"><span><i class="pd-lab-key-air"></i>${mode.view==='top'?'Wind moves toward the arrow':'Particles represent air density'}</span>${mode.reference?`<span><i class="pd-lab-key-course"></i>${mode.reference}</span>`:''}</div>
 <div class="pd-lab-reading" aria-live="polite" aria-atomic="true"><p data-lab-result></p><p data-lab-explanation></p></div>
 <p class="pd-lab-note">172-class trainer schematic. ${mode.view==='side'?'Particle spacing is qualitative; airflow speed is held constant. Use the aircraft POH/AFM for performance.':'Wind is shown relative to the ground; this is not airflow over the wing or a flight-control demonstration.'} <a href="/sources.html">Sources &amp; methods</a></p>`;
box.insertAdjacentElement('afterend',section);
const flow=q('[data-flow]',section),vector=q('[data-wind-vector]',section),aircraft=q('[data-aircraft]',section);
// A single bounded particle field. No animation frame loop or external library.
flow.innerHTML=Array.from({length:15},(_,i)=>`<path class="pd-lab-flow" d="M${i*50-350} -500V500" style="animation-delay:-${(i%7)*.31}s"/>`).join('');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=false,inView=false;
function motion(){section.dataset.paused=String(paused||reduced.matches||!inView||document.hidden);const button=q('[data-lab-pause]',section);button.disabled=reduced.matches;button.textContent=reduced.matches?'Reduced motion':paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused||reduced.matches))}
q('[data-lab-pause]',section).addEventListener('click',()=>{paused=!paused;motion()});
reduced.addEventListener('change',motion);document.addEventListener('visibilitychange',motion);
if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;motion()},{threshold:.05}).observe(section);else inView=true;
function message(state,heading,description){section.dataset.state=state;q('[data-lab-result]',section).textContent=heading;q('[data-lab-explanation]',section).textContent=description;q('#pdLabSvgDesc',section).textContent=heading+' '+description;motion()}
function render(){
 const numbers=[0,1,2].map(resultNumber);
 if(!numbers.every(Number.isFinite)){
  const warning=q('#safetyWarning.show')?.textContent.trim();
  message(warning?'invalid':'idle',warning?'Model unavailable for these inputs':'Calculate to bring the model to life',warning||'Enter values above, then calculate. The model illustrates that result.');return;
 }
 let angle=0,count=60,heading='',description='';
 const key=document.body.dataset.calc;
 if(key==='densityAltitude'){
  // Visual density is deliberately qualitative, never an aircraft-performance calculation.
  count=Math.round(clamp(48-numbers[0]/600,10,60));angle=-90;
  heading=`Density altitude ${output(0)}`;
  description=numbers[2]>0?'Warmer than ISA at this pressure altitude: less dense air and a higher density altitude.':numbers[2]<0?'Colder than ISA at this pressure altitude: denser air and a lower density altitude.':'At ISA temperature, density altitude is approximately pressure altitude.';
  description+=' Change temperature and calculate again to compare the particle spacing.';
  vector.setAttribute('visibility','hidden');
 }else{
  const reference=input(key==='crosswind'?'runway':'course');
  angle=((input('windDir')-reference+540)%360)-180;
  const calm=input('windSpeed')===0;count=calm?0:60;
  aircraft.setAttribute('transform',`rotate(${key==='windTriangle'?numbers[2]:0})`);
  vector.setAttribute('transform',`rotate(${angle} 540 150)`);vector.setAttribute('visibility',calm?'hidden':'visible');
  section.style.setProperty('--pd-lab-flow-time',`${clamp(100/(input('windSpeed')||1),1.5,10)}s`);
  heading=key==='crosswind'?`${output(0)} crosswind · ${output(1)}`:`Heading ${output(0)} · WCA ${output(2)} · ${output(1)} groundspeed`;
  description=calm?'Calm wind: no wind drift or wind component.':key==='crosswind'?'The aircraft points along the runway. Moving traces show where the wind is going; wind direction above names where it comes from.':'The nose points into the crosswind while the desired course stays straight ahead. Moving traces show the ambient wind relative to the ground.';
  if(key==='windTriangle'&&!calm&&Math.abs(numbers[2])<.05)description='Wind is along the course, so no crab angle is needed. Headwind reduces groundspeed; tailwind increases it.';
  if(key==='crosswind'&&q('#gustSpeed')?.value.trim())description+=' This scene uses steady wind; gust components remain in the runway display above.';
 }
 const step=key==='densityAltitude'?4800/count:100;
 section.style.setProperty('--pd-lab-step',`${step}px`);
 if(key==='densityAltitude')section.style.setProperty('--pd-lab-flow-time',`${step/24}s`);
 flow.style.display=count?'':'none';
 q('[data-flow-direction]',section).setAttribute('transform',`translate(320 150) rotate(${angle})`);
 message('ready',heading,description);
}
box.addEventListener('input',event=>{if(event.target.matches('[data-calc-input]'))message('stale','Inputs changed — calculate again','The model pauses until the calculator has a new result.')});
new MutationObserver(render).observe(q('.results',box),{childList:true,subtree:true,characterData:true});
document.addEventListener('pilotdesk:calculated',render);
// Stored input restoration can happen after the calculator's initial default result.
// Wait for a fresh calculation instead of pairing a previous result with restored inputs.
message('idle','Calculate to bring the model to life','Enter values above, then calculate. The model illustrates that result.');
})();
