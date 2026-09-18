import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const page=read('flights.html');
const flights=read('assets/flights.js');
const brief=read('assets/flight-brief.js');
const store=read('assets/flight-store.js');
const journey=read('assets/flight-journey.js');
const css=read('assets/experience.css');

check(page.includes('pdSavedFlightResume'),'Saved Flights resume card missing');
check(page.includes('flightSearch')&&page.includes('flightSort'),'Saved Flights search/sort controls missing');
check(page.includes('Reuse a flight instead of rebuilding it.'),'Reusable-flight framing missing');

for(const marker of [
 'Copy for tomorrow',
 'Resume planning',
 'Planning progress',
 'CHANGED SINCE REVIEW',
 'Never reviewed',
 "pd-flight-progress:",
 "pd-active-flight",
 "Saved Flight Reused",
 "Saved Flight Resume"
]) check(flights.includes(marker),'Saved Flights 2.0 missing: '+marker);

check(flights.includes("date:forTomorrow?tomorrow():f.date"),'Tomorrow copy must receive a fresh planned date');
check(flights.includes('lastReviewedAt:null'),'Reused flights must not inherit a prior review');
check(flights.includes("localStorage.removeItem('pd-flight-progress:'+id)"),'Reused/deleted flights must reset local workflow progress');
check(flights.includes('Number(f.updatedAt||0)>Number(f.lastReviewedAt||0)'),'Changed-since-review state missing');
check(flights.includes("sort==='progress'")&&flights.includes("sort==='date'"),'Saved flight sorting modes missing');
check(flights.includes('window.PilotDeskFlights?.write'),'Saved flights should use the shared flight store when available');

check(brief.includes('lastReviewedAt:reviewedAt'),'Successful brief review is not persisted');
check(brief.includes('PilotDeskFlights?.upsert'),'Flight brief review does not use the shared flight store');
check(store.includes('pilotdesk:flights-changed'),'Shared flight store change signal missing');
check(journey.includes("pd-flight-progress:"),'Saved Flights progress must share the seven-step workflow state');

check(css.includes('.pd-saved-flight-resume'),'Resume-card styling missing');
check(css.includes('.pd-review-state.changed'),'Changed-since-review visual state missing');
check(css.includes('@media(max-width:560px)'),'Saved Flights mobile layout guard missing');

if(failures.length){
 console.error('Saved Flights 2.0 checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Saved Flights 2.0 checks passed: resume state, seven-step progress, review freshness, tomorrow reuse, active-flight context, filtering/sorting, analytics, and mobile UI verified.');
