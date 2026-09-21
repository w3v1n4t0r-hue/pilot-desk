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
]}
};
const key='pd-oral-review-v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return{}}};
const write=v=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
const params=new URLSearchParams(location.search);
let current=tracks[params.get('track')]?params.get('track'):'private';
const trackHost=document.querySelector('#pdOralTracks'),list=document.querySelector('#pdOralList'),title=document.querySelector('#pdOralTrackTitle'),standard=document.querySelector('#pdOralTrackStandard'),progress=document.querySelector('#pdOralProgress'),hub=document.querySelector('#pdOralRatingHub');
if(!trackHost||!list)return;
function renderTracks(){
 trackHost.querySelectorAll('[data-track]').forEach(a=>a.setAttribute('aria-current',String(a.dataset.track===current)));
}
function render(){
 const t=tracks[current],state=read(),done=t.items.filter((_,i)=>state[current+':'+i]).length;
 title.textContent=t.title;
 standard.textContent=t.standard;
 progress.innerHTML=`<b>${done}/${t.items.length}</b><span>topics reviewed</span>`;
 hub.href=t.hub;
 hub.textContent='Open '+t.title+' study page';
 list.innerHTML=t.items.map((item,i)=>{
   const id=current+':'+i,checked=Boolean(state[id]);
   return `<details class="pd-oral-item"><summary><b>${i+1}. ${item[0]}</b><span>${item[1]}</span></summary><div class="pd-oral-body"><h3>What a solid answer should cover</h3><p>${item[2]}</p><h3>Check it in</h3><p class="pd-oral-source">${item[3]}</p><div class="pd-oral-review"><input type="checkbox" id="oral-${current}-${i}" data-review="${id}" ${checked?'checked':''}><label for="oral-${current}-${i}">Reviewed with the source</label></div></div></details>`;
 }).join('');
 renderTracks();
}
trackHost.addEventListener('click',e=>{const a=e.target.closest('[data-track]');if(!a)return;e.preventDefault();current=a.dataset.track;const u=new URL(location.href);u.searchParams.set('track',current);history.replaceState(null,'',u);render();title.scrollIntoView({block:'nearest'});});
list.addEventListener('change',e=>{const box=e.target.closest('[data-review]');if(!box)return;const state=read();if(box.checked)state[box.dataset.review]=true;else delete state[box.dataset.review];write(state);render();});
render();
})();
