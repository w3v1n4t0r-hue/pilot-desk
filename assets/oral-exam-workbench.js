(()=>{
'use strict';
if(location.pathname!=='/learn/oral-exam/'&&location.pathname!=='/learn/oral-exam/index.html')return;
const tracks={
private:{title:'Private Pilot',standard:'Airplane ACS',hub:'/training/private-pilot.html',items:[
 ['Pilot privileges and limits','What can you do with a private pilot certificate, and what changes when compensation or business is involved?','Separate certificate privileges from the operating rules that apply to the flight.','Private Pilot ACS · 14 CFR Part 61'],
 ['Airworthiness today','Walk through how you decide that this airplane is legal and safe to fly today.','Cover documents, inspections, required equipment, discrepancies, and inoperative equipment without turning it into an acronym recital.','Private Pilot ACS · 14 CFR Part 91 · aircraft records/POH'],
 ['Weather picture','Brief the weather for a real trip and tell me what would make you delay, divert, or stay home.','Use the reports and forecasts together. Talk about trend, ceilings, visibility, wind, convective weather, icing, and your own margin.','Private Pilot ACS · Aviation Weather Handbook · current weather sources'],
 ['Airspace and airport operations','Explain the airspace on your route and what you need before entering it.','Include equipment, communication, weather minimums, chart symbols, runway signs/markings, and any special-use airspace that matters.','Private Pilot ACS · 14 CFR Part 91 · AIM · current charts'],
 ['Cross-country planning','Show how you got from route to heading, groundspeed, time, fuel, and checkpoints.','Be able to do the basic math and explain what changes when the wind or route changes.','Private Pilot ACS · PHAK · current chart data'],
 ['Weight, balance, and performance','Prove the airplane can carry the load and use the runway you picked.','Use the exact airplane data. Explain what forward/aft CG, density altitude, weight, wind, runway surface, and obstacles change.','Private Pilot ACS · POH/AFM'],
 ['Aircraft systems','Pick a system in the airplane and explain what it does, how it can fail, and what you would notice.','Know your actual airplane: engine, fuel, electrical, pitot-static, vacuum/pressure if installed, avionics, and landing gear/flaps as applicable.','Private Pilot ACS · POH/AFM · AFH/PHAK'],
 ['Abnormals and risk','Give me the first few decisions after an engine failure, electrical problem, weather trap, or passenger problem.','Prioritize control, a usable landing/escape plan, communication when useful, and the checklist. Explain when the safest choice is to stop the flight.','Private Pilot ACS · POH/AFM · FAA risk-management guidance']
]},
instrument:{title:'Instrument Rating',standard:'Instrument Rating ACS',hub:'/training/instrument-rating.html',items:[
 ['IFR privileges and currency','Are you legal and current for this flight, and how do you prove it?','Separate the instrument rating, recent-experience rules, IPC requirements, logbook evidence, and any aircraft/operator limits.','Instrument Rating ACS · 14 CFR Parts 61 and 91'],
 ['Aircraft IFR readiness','What makes this airplane ready for the IFR flight you planned?','Work from required equipment and inspections into the actual avionics, database status, alternates, and known defects.','Instrument Rating ACS · 14 CFR Part 91 · POH/AFM/supplements'],
 ['Weather and alternate thinking','Brief the IFR weather and explain the escape routes before you launch.','Talk trend, ceilings/visibility, freezing level, icing, convection, winds, alternates, fuel, and airports you can actually use.','Instrument Rating ACS · Aviation Weather Handbook · current weather'],
 ['Clearance and route','Read a clearance back, then explain how you will fly the route and what you will do if ATC changes it.','Know the clearance pieces, departure expectations, enroute structure, altitude constraints, and how to catch a routing mistake.','Instrument Rating ACS · AIM · current charts/procedures'],
 ['Navigation and avionics','Explain what your installed navigation equipment can and cannot legally support.','Know the difference between what the box displays and what is approved for the operation. Include integrity/failure indications and a backup plan.','Instrument Rating ACS · AIM · AFM/avionics supplements'],
 ['Holds and procedure entries','Show me how you would enter, fly, time, and correct a hold.','Explain protected-side thinking, wind correction, speed limits that apply, and how the clearance changes the job.','Instrument Rating ACS · AIM · current procedure'],
 ['Approach, missed, and circling','Brief an approach from the chart and tell me exactly when the missed approach becomes the plan.','Cover setup, fixes, altitudes, minimums, required equipment, runway environment, missed instructions, and circling only when it applies.','Instrument Rating ACS · AIM · current procedure'],
 ['Failures and lost communications','What changes if you lose a display, navigation source, autopilot, alternator, or communication?','Fly the airplane first. Identify what information remains trustworthy, reduce workload, use the published/cleared plan, and choose the safest practical exit.','Instrument Rating ACS · AIM · POH/AFM/supplements']
]},
commercial:{title:'Commercial Pilot',standard:'Commercial Pilot ACS',hub:'/training/commercial-pilot.html',items:[
 ['Commercial privileges','Which flights can you legally be paid for, and when does the operation need authority beyond your pilot certificate?','Keep pilot privileges separate from common/private carriage and the operating rules of the business or operator.','Commercial Pilot ACS · 14 CFR Parts 61, 91, 119 as applicable'],
 ['Professional airworthiness check','Show how you would reject an airplane that is technically available but not right for the mission.','Use records, equipment status, limitations, maintenance, loading, and the actual mission instead of stopping at paperwork.','Commercial Pilot ACS · 14 CFR Part 91 · POH/AFM'],
 ['Performance margins','Build the takeoff, climb, cruise, and landing picture for the day.','Use aircraft data and explain where interpolation, wind, surface, density altitude, weight, obstacles, and conservative margins enter the plan.','Commercial Pilot ACS · POH/AFM'],
 ['Systems at commercial depth','Explain a system far enough that a failure indication makes sense.','Connect components to indications and checklist actions. Use the airplane you will fly on the practical test.','Commercial Pilot ACS · POH/AFM'],
 ['Aerodynamics and energy','Explain what the airplane is doing in the commercial maneuvers instead of reciting control movements.','Connect load factor, stall margin, coordination, pitch/power, energy, wind, and ground reference.','Commercial Pilot ACS · Airplane Flying Handbook'],
 ['Pivotal altitude and ground reference','Why does pivotal altitude change, and what does wind do to the maneuver?','Tie the relationship to groundspeed and explain why the airplane is not flown at one magic altitude around the whole pattern.','Commercial Pilot ACS · Airplane Flying Handbook'],
 ['Weather and mission pressure','What would make you change a flight that a customer, employer, or passenger wants completed?','Use concrete limits and outs. Schedule and money do not improve weather, runway, fuel, or aircraft performance.','Commercial Pilot ACS · FAA risk-management guidance'],
 ['Abnormal decisions','Talk through a realistic system problem or forced landing from recognition through shutdown or landing.','Use the checklist, but explain the priorities and why the sequence matters in your airplane.','Commercial Pilot ACS · POH/AFM']
]},
multi:{title:'Multi-Engine',standard:'Applicable Airplane ACS tasks',hub:'/training/multiengine.html',items:[
 ['Critical engine','Why can losing one engine be worse than losing the other on some twins?','Explain the aerodynamic reasons that apply to the airplane instead of memorizing “left engine” as a universal answer.','Applicable Airplane ACS · Airplane Flying Handbook · POH/AFM'],
 ['VMC','What is VMC, what does the published value represent, and what changes actual control margin?','Keep certification VMC separate from a target operating speed. Explain the factors in terms of yawing moment and available control.','Applicable Airplane ACS · AFH · POH/AFM'],
 ['VMC versus VYSE','Why are these two speeds not interchangeable?','One is tied to directional-control certification; the other is the published best single-engine rate-of-climb speed for the airplane/configuration.','Applicable Airplane ACS · POH/AFM'],
 ['Single-engine performance','Can the airplane climb after an engine failure here?','Use the performance chart for weight, altitude, temperature, configuration, and the airplane. Control and climb performance are separate questions.','Applicable Airplane ACS · POH/AFM performance section'],
 ['Zero sideslip','Why is a small bank normally used toward the operating engine?','Explain how the control inputs reduce sideslip/drag and why “center the ball” is not a complete universal explanation.','Airplane Flying Handbook · POH/AFM'],
 ['Propeller and feathering','What creates windmilling drag, what does the governor do, and what has to happen to feather or unfeather?','Use the exact propeller/governor system and limitations in the airplane you fly.','Applicable Airplane ACS · POH/AFM'],
 ['Twin systems','Trace fuel, electrical, landing gear, and other shared/crossfeed systems that matter after a failure.','Know which components are truly independent and which failure can affect both sides.','POH/AFM systems section'],
 ['Engine failure flow','Talk through an engine failure from recognition to landing.','Maintain control first, set the airplane up, identify and verify before securing, use the checklist, and keep performance expectations realistic.','Applicable Airplane ACS · POH/AFM emergency procedures']
]},
cfi:{title:'Flight Instructor',standard:'Flight Instructor Airplane ACS',hub:'/training/cfi.html',items:[
 ['Learning and human behavior','Why did the learner make that error, and what will you change in the lesson?','Use the FOI material to diagnose the learning problem, not to recite a list of defense mechanisms.','Flight Instructor ACS · Aviation Instructor’s Handbook'],
 ['Instructor responsibilities','What are you responsible for before you sign a learner off?','Know the training, record, endorsement, proficiency, and safety obligations that apply to the specific endorsement or recommendation.','Flight Instructor ACS · 14 CFR Part 61 · current endorsement guidance'],
 ['Lesson structure','Teach a ten-minute lesson with a clear objective and a way to tell whether the learner got it.','Start from what the learner needs to do. Explain, demonstrate or practice, ask useful questions, then assess against a standard.','Flight Instructor ACS · Aviation Instructor’s Handbook'],
 ['Risk management','How do you teach judgment without turning it into slogans?','Use a real flight and make the learner identify hazards, choices, margins, and a trigger to change the plan.','Flight Instructor ACS · FAA risk-management material'],
 ['Teach aerodynamics','Explain a familiar aerodynamic topic without hiding behind vocabulary.','Use a sketch, control input, or flight example. Make the learner predict what changes before you give the answer.','Flight Instructor ACS · PHAK · AFH'],
 ['Teach airworthiness','Have the learner decide whether an airplane with a discrepancy can fly.','Make them find the rule, equipment requirement, aircraft document, and maintenance implication instead of handing them the conclusion.','Flight Instructor ACS · 14 CFR Part 91 · POH/AFM'],
 ['Teach a maneuver','Brief, demonstrate, coach, and critique one maneuver.','Connect sight picture and control use to the objective, tolerances, common errors, risk controls, and recovery.','Flight Instructor ACS · Airplane Flying Handbook'],
 ['Evaluate and debrief','How do you give useful feedback after a weak flight?','Be specific about what happened, why it mattered, what standard applies, and what the learner should do on the next attempt.','Flight Instructor ACS · Aviation Instructor’s Handbook']
]},
cfii:{title:'CFII',standard:'Instrument instructor training',hub:'/training/cfii.html',items:[
 ['Instrument teaching privileges','What instrument training can you give and what endorsements or records are required?','Start with your instructor privileges/limitations and the specific certificate, rating, currency, or practical-test task involved.','14 CFR Part 61 · current FAA instructor guidance'],
 ['Instrument scan and control','Teach a learner to recognize a bad scan before it becomes an airplane-control problem.','Connect instrument information, control/performance, trim, workload, and common fixation/omission errors.','Instrument Flying Handbook · Aviation Instructor’s Handbook'],
 ['IFR legality and currency','Give the learner an IFR scenario and make them prove pilot and aircraft readiness.','Separate rating, currency, IPC, equipment, inspections, databases, and operator limitations.','Instrument Rating ACS · 14 CFR Parts 61 and 91'],
 ['Weather instruction','Teach an IFR weather decision, not just weather decoding.','Have the learner build a trend, identify icing/convection and ceilings/visibility, compare alternates, and name an exit before departure.','Aviation Weather Handbook · current weather sources'],
 ['Navigation and automation','Teach what the avionics know, what they do not know, and how the learner verifies the setup.','Include mode awareness, source selection, integrity/failure indications, database/procedure loading, and a manual backup.','Instrument Flying Handbook · AIM · AFM/avionics supplements'],
 ['Holding instruction','Teach a hold so the learner can reason through a clearance they have never seen before.','Use clearance, protected side, entry choice, timing/distance, wind correction, and workload management.','Instrument Rating ACS · AIM'],
 ['Approach instruction','Have the learner brief, fly, and miss an approach while explaining the reasons behind each setup choice.','Tie chart data to avionics setup, altitude control, descent planning, minimums, runway environment, and the missed approach.','Instrument Rating ACS · AIM · current procedure'],
 ['Failures and partial panel','Teach a failure without creating more confusion than the failure itself.','Make the learner identify the bad information, stabilize the airplane, reduce automation/workload as needed, and pick a practical way out.','Instrument Rating ACS · Instrument Flying Handbook · POH/AFM']
]},
atp:{title:'ATP / Type Rating',standard:'FAA-S-ACS-11A',hub:'/training/atp.html',items:[
 ['Transport aircraft systems','Choose a major aircraft system and explain normal architecture, redundancy, indications, and the effect of a significant failure.','Connect components to crew indications, degraded capability, checklist logic, and landing/dispatch consequences.','FAA-S-ACS-11A · AFM/FCOM/QRH'],
 ['Performance and limitations','Build a heavy-departure performance picture and distinguish structural limits from performance-limited weight.','Discuss field length, V-speeds, climb, temperature, wind, runway condition, obstacles, and the approved performance source.','FAA-S-ACS-11A · AFM performance data'],
 ['High-altitude aerodynamics','Explain the low-speed and high-speed buffet boundaries and what happens as their margin narrows.','Connect Mach effects, angle of attack, weight, altitude, bank/load factor, and the practical response.','FAA-S-ACS-11A · FAA high-altitude aerodynamics guidance'],
 ['Air-carrier weather','Brief the weather for a transport flight and identify what changes route, alternate, fuel, or departure timing.','Use current observed/forecast weather, convection, icing, turbulence, trends, and operational escape options.','FAA-S-ACS-11A · Aviation Weather Handbook · current official weather'],
 ['Air-carrier operations','Explain how the release, alternates, fuel requirements, company manuals, and operations specifications fit together.','Separate regulation, operations specifications, company procedure, dispatcher/PIC responsibilities, and published approach minima.','FAA-S-ACS-11A · 14 CFR Part 121 as applicable · operations specifications'],
 ['CRM and threat management','A crewmember catches a setup error during a rushed operation. Explain how the crew should manage the threat.','Cover clear challenge/response, verification, workload management, task sharing, and stopping or going around when the operation is no longer stable.','FAA-S-ACS-11A · FAA CRM/human-factors guidance'],
 ['Instrument procedures','Brief a complex arrival and approach with automation mode awareness and a defined missed-approach plan.','Include constraints, navigation requirements, FMA/mode verification, stabilized-approach criteria, minimums, and the missed approach.','FAA-S-ACS-11A · AIM · current procedures · AFM/FCOM'],
 ['Emergency priorities','Talk through a significant system failure in IMC from immediate control through diversion and landing.','Stabilize the flight path, identify/verify, use memory/QRH items appropriately, share workload, and choose a suitable landing airport using current conditions.','FAA-S-ACS-11A · AFM/QRH · company procedures']
]}
};
const key='pd-oral-review-v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}};
const write=v=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
const params=new URLSearchParams(location.search);
let current=tracks[params.get('track')]?params.get('track'):'private';
let access={isPro:false,plan:'free',limits:{oralTopicsPerTrack:2}},accessReady=false;
let mode='study',query='';
const answers=window.PilotDeskOralAnswers||{};
const practiceKey='pd-oral-practice-v1';
const readPractice=()=>{try{return JSON.parse(localStorage.getItem(practiceKey)||'{}')}catch{return{}}};
const writePractice=v=>{try{localStorage.setItem(practiceKey,JSON.stringify(v))}catch{}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const standardLinks={private:'https://www.faa.gov/training_testing/testing/acs/private_airplane_acs_6.pdf',instrument:'https://www.faa.gov/training_testing/testing/acs/instrument_rating_airplane_acs_8.pdf',commercial:'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf',multi:'https://www.faa.gov/training_testing/testing/acs/commercial_airplane_acs_7.pdf',cfi:'https://www.faa.gov/training_testing/testing/acs/cfi_airplane_acs_25.pdf',cfii:'https://www.faa.gov/training_testing/testing/acs/cfi_instrument_pts_9.pdf',atp:'https://www.faa.gov/training_testing/testing/acs'};
const trackHost=document.querySelector('#pdOralTracks'),list=document.querySelector('#pdOralList'),title=document.querySelector('#pdOralTrackTitle'),standard=document.querySelector('#pdOralTrackStandard'),progress=document.querySelector('#pdOralProgress'),hub=document.querySelector('#pdOralRatingHub');
const planLabel=document.querySelector('#pdOralPlanLabel'),planTitle=document.querySelector('#pdOralPlanTitle'),planCopy=document.querySelector('#pdOralPlanCopy'),upgrade=document.querySelector('#pdOralUpgrade');
const search=document.querySelector('#pdOralSearch'),searchStatus=document.querySelector('#pdOralSearchStatus'),modeHelp=document.querySelector('#pdOralModeHelp');
if(!trackHost||!list)return;
function previewLimit(){return Math.max(1,Number(access?.limits?.oralTopicsPerTrack||2))}
function visibleCount(t){return access.isPro?t.items.length:Math.min(previewLimit(),t.items.length)}
function renderTracks(){
 trackHost.querySelectorAll('[data-track]').forEach(a=>a.setAttribute('aria-current',String(a.dataset.track===current)));
}
function renderPlan(t){
 if(!planLabel||!planTitle||!planCopy||!upgrade)return;
 if(!accessReady){
  planLabel.textContent='CHECKING PLAN';planTitle.textContent='Loading checkride access…';planCopy.textContent='PilotDesk is checking the subscription attached to this account.';upgrade.hidden=true;return;
 }
 if(access.isPro){
  planLabel.textContent=access.plan==='school'?'FLIGHT SCHOOL ACCESS':'PILOTDESK PRO';
  planTitle.textContent='Pro access · all '+t.title+' oral subjects available.';
  planCopy.textContent='All '+t.items.length+' subjects are available. Work them out loud, mark verified topics, and move between ratings without a Free-plan cap.';
  upgrade.hidden=true;
 }else{
  const n=visibleCount(t);
  planLabel.textContent='FREE PREVIEW · '+n+' OF '+t.items.length;
  planTitle.textContent='Try the workflow before you subscribe.';
  planCopy.textContent='Free includes '+n+' sample subjects in every rating. Pro includes all oral-prep subjects across the seven training tracks, plus the other Pro planning benefits.';
  upgrade.hidden=false;upgrade.href=window.PilotDeskProAccess?.upgradeUrl?.('oral-exam')||'/pricing.html?from=oral-exam';
 }
}
function lockedRow(item,i,rating){
 return `<article class="pd-oral-item pd-oral-item-locked" aria-label="${esc(item[0])} locked for PilotDesk Pro"><div class="pd-oral-lock-row"><div><small>${esc(rating)} · PRO SUBJECT ${i+1}</small><b>${esc(item[0])}</b><span>Full prompt, answer guidance, and source review are available with PilotDesk Pro.</span></div><a href="${window.PilotDeskProAccess?.upgradeUrl?.('oral-topic')||'/pricing.html?from=oral-topic'}">Pro access →</a></div></article>`;
}
function render(){
 const t=tracks[current],state=read(),practice=readPractice(),limit=visibleCount(t),done=t.items.slice(0,limit).filter((_,i)=>state[current+':'+i]).length;
 title.textContent=t.title;
 standard.textContent=t.standard;
 progress.innerHTML=access.isPro?`<b>${done}/${t.items.length}</b><span>topics reviewed</span>`:`<b>${done}/${limit}</b><span>free preview reviewed</span>`;
 hub.href=t.hub;
 hub.textContent='Open '+t.title+' study page';
 const searchMatches=[];
 Object.entries(tracks).forEach(([track,group])=>group.items.forEach((item,i)=>{
  const detail=answers[track]?.[i],id=track+':'+i;
  const haystack=[group.title,...item,detail?.short,detail?.why,detail?.area,detail?.task,...(detail?.sources||[]).flat()].join(' ').toLowerCase();
  if(query&&!haystack.includes(query))return;
  if(!query&&track!==current)return;
  if(mode==='quiz'&&i>=Math.min(5,visibleCount(group)))return;
  if(mode==='weak'&&practice[id]?.result!=='review')return;
  searchMatches.push({track,group,item,i,detail,id,locked:!access.isPro&&i>=visibleCount(group)});
 }));
 const quizRows=t.items.slice(0,Math.min(5,limit)).map((_,i)=>practice[current+':'+i]?.result),quizCorrect=quizRows.filter(x=>x==='correct').length,quizAnswered=quizRows.filter(Boolean).length;
 if(modeHelp)modeHelp.textContent=mode==='study'?'Study shows the answer notes and FAA links. Mark reviewed after checking the source.':mode==='oral'?'Answer out loud, then reveal the source notes.':mode==='quiz'?`Small self-scored set: ${quizCorrect}/${quizAnswered} marked correct (${quizRows.length} available questions). Reveal the answer and compare before scoring; this is not an examiner grade.`:'Only topics you marked Needs review appear here. Search can include other ratings.';
 if(searchStatus)searchStatus.textContent=query?`${searchMatches.length} matching ${searchMatches.length===1?'topic':'topics'} across Learn ratings.`:mode==='weak'?`${searchMatches.length} topics to review in ${t.title}.`:'';
 document.querySelectorAll('[data-oral-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.oralMode===mode)));
 list.innerHTML=searchMatches.length?searchMatches.map(({track,group,item,i,detail,id,locked})=>{
   if(locked)return lockedRow(item,i,group.title);
   const checked=Boolean(state[id]),result=practice[id]?.result||'',bookmarked=Boolean(practice[id]?.bookmark);
   const sourceLinks=detail?.sources||[[group.standard,standardLinks[track]]];
   const sourceHtml=sourceLinks.map(([label,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('');
   const answerHtml=detail?`<h3>Short answer</h3><p>${esc(detail.short)}</p><h3>Why</h3><p>${esc(detail.why)}</p><h3>FAA source</h3><p class="pd-oral-source-links">${sourceHtml}</p><h3>Related follow-up</h3><p>${esc(detail.follow)}</p>`:`<h3>Answer checkpoints</h3><p>${esc(item[2])}</p><h3>Verify in the controlling source</h3><p class="pd-oral-source">${esc(item[3])}</p><p class="pd-oral-source-links">${sourceHtml}</p>`;
   return `<details class="pd-oral-item" data-topic="${id}" ${mode==='study'?'open':''}><summary><small>${esc(group.title)}${detail?' · '+esc(detail.area)+' / '+esc(detail.task):''}</small><b>${i+1}. ${esc(item[0])}</b><span>${esc(item[1])}</span></summary><div class="pd-oral-body">${answerHtml}<div class="pd-oral-actions"><button type="button" data-bookmark="${id}" aria-pressed="${bookmarked}">${bookmarked?'Bookmarked':'Bookmark'}</button><button type="button" data-score="correct" data-id="${id}" aria-pressed="${result==='correct'}">Correct on review</button><button type="button" data-score="review" data-id="${id}" aria-pressed="${result==='review'}">Needs review</button></div><div class="pd-oral-review"><input type="checkbox" id="oral-${track}-${i}" data-review="${id}" ${checked?'checked':''}><label for="oral-${track}-${i}">Reviewed with the source</label></div></div></details>`;
 }).join(''):`<p class="pd-oral-empty">${mode==='weak'?'No topics marked for review yet. Use “Needs review” on a topic to collect it here.':'No topics match that search. Try a regulation number, rating, or subject.'}</p>`;
 renderTracks();renderPlan(t);
}
trackHost.addEventListener('click',e=>{const a=e.target.closest('[data-track]');if(!a)return;e.preventDefault();current=a.dataset.track;const u=new URL(location.href);u.searchParams.set('track',current);history.replaceState(null,'',u);render();title.scrollIntoView({block:'nearest'});});
list.addEventListener('change',e=>{const box=e.target.closest('[data-review]');if(!box)return;const state=read();if(box.checked)state[box.dataset.review]=true;else delete state[box.dataset.review];write(state);render();});
list.addEventListener('click',e=>{
 const bookmark=e.target.closest('[data-bookmark]'),score=e.target.closest('[data-score]');if(!bookmark&&!score)return;
 const id=bookmark?.dataset.bookmark||score?.dataset.id,state=readPractice(),entry=state[id]||{};
 if(bookmark)entry.bookmark=!entry.bookmark;
 if(score)entry.result=entry.result===score.dataset.score?'':score.dataset.score;
 if(entry.bookmark||entry.result)state[id]=entry;else delete state[id];
 writePractice(state);render();
});
search?.addEventListener('input',()=>{query=search.value.trim().toLowerCase();render()});
document.querySelectorAll('[data-oral-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.oralMode;render()}));
async function init(){
 render();
 try{access=await (window.PilotDeskProAccess?.snapshot?.()||Promise.resolve(access))}catch{}
 accessReady=true;render();
 document.addEventListener('pilotdesk:billing',async()=>{try{access=await window.PilotDeskProAccess.snapshot()}catch{}accessReady=true;render()});
}
init();
})();
