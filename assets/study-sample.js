(()=>{
'use strict';
function init(){
 const host=document.getElementById('pdStudySample');if(!host)return;
 const items=[
  {
   q:'(Refer to FAA-CT-8080-2H, Figure 8.) Pressure altitude remains 3,000 feet MSL. If temperature increases from 35°F to 50°F, approximately what happens to density altitude?',
   a:['It increases about 1,000 feet.','It decreases about 1,100 feet.','It remains essentially unchanged because pressure altitude did not change.'],
   correct:0,
   why:'At a fixed pressure altitude, warmer air raises density altitude. The FAA sample figure shows roughly a 1,000-foot increase for this change.',
   source:'FAA PAR sample / FAA-CT-8080-2H Figure 8',
   figure:'https://www.faa.gov/sites/faa.gov/files/training_testing/testing/supplements/sport_rec_private_akts.pdf'
  },
  {
   q:'To act as PIC under IFR, which recent instrument experience must be completed within the applicable preceding six-calendar-month period in the same category?',
   a:['Six approaches, holding procedures/tasks, and intercepting/tracking courses using navigation systems.','Six hours of instrument time and six approaches in any category.','Three approaches in category and class plus six hours of instrument time.'],
   correct:0,
   why:'The recent-experience rule is based on approaches, holding, and intercepting/tracking tasks; it is not a six-hour instrument-time requirement.',
   source:'FAA IRA sample / 14 CFR 61.57(c)'
  },
  {
   q:'You are PIC of a VFR flight that you expect to be within the aircraft fuel range. Which preflight action is still required?',
   a:['Be familiar with every instrument approach at the destination.','List an alternate airport on the VFR flight plan.','Obtain the applicable weather information and determine fuel requirements for the flight.'],
   correct:2,
   why:'Preflight action under 14 CFR 91.103 includes becoming familiar with available information appropriate to the flight, including weather and fuel requirements.',
   source:'FAA CAX sample / 14 CFR 91.103'
  }
 ];
 let index=0,score=0;
 const title=host.querySelector('[data-sample-question]'),options=host.querySelector('[data-sample-options]'),feedback=host.querySelector('[data-sample-feedback]'),next=host.querySelector('[data-sample-next]');
 function render(){
  const item=items[index];title.textContent=`${index+1} of ${items.length} · ${item.q}`;options.replaceChildren();feedback.replaceChildren();next.hidden=true;
  item.a.forEach((txt,i)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.addEventListener('click',()=>{
   [...options.children].forEach(x=>x.disabled=true);b.setAttribute('aria-pressed','true');if(i===item.correct)score++;
   const p=document.createElement('span');p.textContent=(i===item.correct?'Correct. ':'Review this one. ')+item.why+' Source: '+item.source+'.';feedback.append(p);
   if(item.figure){const a=document.createElement('a');a.href=item.figure;a.target='_blank';a.rel='noopener';a.textContent=' Open official FAA figure ↗';feedback.append(a)}
   next.hidden=false;next.textContent=index<items.length-1?'Next question':'See sample score';
  });options.append(b)})
 }
 next.addEventListener('click',()=>{index++;if(index<items.length)return render();title.textContent=`Sample complete: ${score} of ${items.length} correct`;options.replaceChildren();feedback.textContent='The live bank uses the same source-first format and removes mass-generated numeric variants.';next.hidden=true});
 render();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();