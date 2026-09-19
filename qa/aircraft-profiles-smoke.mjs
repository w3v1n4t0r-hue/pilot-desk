import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const page=read('aircraft.html');
const hub=read('assets/aircraft-profile-hub.js');
const aircraft=read('assets/aircraft-v2.js');
const transfer=read('assets/aircraft-transfer.js');
const training=read('assets/aircraft-training.js');
const flights=read('assets/flights.js');
const wb=read('assets/weight-balance.js');
const poh=read('assets/poh-chart-studio.js');
const checklist=read('assets/checklist-trainer.js');
const bootstrap=read('assets/app-bootstrap.js');
const css=read('assets/experience.css');

check(page.includes('pdAircraftActiveHub')&&page.includes('Your airplane can drive the rest of PilotDesk.'),'Active-aircraft command center missing from Hangar');
for(const field of ['Route defaults','Fuel planning','Weight & balance','CG envelope','Home airport','Source note']){
 check(hub.includes(field),'Profile coverage missing: '+field);
}
for(const target of [
 '/flights.html?aircraft=',
 '/route-planner.html?aircraft=',
 '/weight-balance.html?aircraft=',
 '/checklist-trainer.html?aircraft=',
 '/poh-chart-studio.html?aircraft='
]) check(hub.includes(target),'Active-aircraft handoff missing: '+target);

check(hub.includes("profile fields covered"),'Coverage language must describe saved fields, not safety readiness');
check(hub.includes('It does not verify that any value is current, approved, or applicable'),'Profile coverage safety boundary missing');
check(hub.includes("pdTrack?.('Aircraft Profile Action'"),'Aircraft hub action analytics missing');
check(hub.includes("pdTrack?.('Aircraft Active Changed'"),'Active-aircraft switch analytics missing');
check(hub.includes("pd-training-library-v2"),'Training-set coverage is not connected to aircraft hub');

check(aircraft.includes("format:'PilotDesk-aircraft-profiles'")&&aircraft.includes('version:2'),'Hangar export format is not versioned');
check(aircraft.includes('Array.isArray(j.profiles)')&&aircraft.includes('Array.isArray(j.aircraft)'),'Hangar import must accept current and legacy backups');
check(aircraft.includes('pilotdesk:aircraft-changed'),'Aircraft changes do not signal dependent UI');
check(transfer.includes("document.querySelector('#aircraftExport')&&document.querySelector('#aircraftImport')"),'Legacy transfer enhancer can still duplicate native import/export controls');

check(flights.includes("requestedAircraft=p.get('aircraft')"),'New-flight flow does not honor Hangar aircraft query');
check(training.includes("link('Weight & Balance','/weight-balance.html',id)")&&training.includes("localStorage.setItem('pd-aircraft-active',a.dataset.aircraftBinder)")&&wb.includes("localStorage.getItem('pd-aircraft-active')"),'Aircraft training binder must use canonical W&B URL while preserving aircraft context');
check(wb.includes("get('aircraft')"),'W&B does not accept aircraft context');
check(poh.includes("get('aircraft')"),'POH Chart Studio does not accept aircraft context');
check(checklist.includes("get('aircraft')"),'Checklist Trainer does not accept aircraft context');

check(bootstrap.includes('/assets/aircraft-profile-hub.js'),'Aircraft command center is not route-loaded');
check(css.includes('.pd-aircraft-active-hub')&&css.includes('@media(max-width:600px)'),'Aircraft command center responsive styling missing');

if(failures.length){
 console.error('Aircraft Profiles 2.0 checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Aircraft Profiles 2.0 checks passed: active-aircraft hub, profile coverage, planning/training handoffs, portable backups, analytics, safety boundaries, and mobile layout verified.');
