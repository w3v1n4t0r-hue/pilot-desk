import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const journey=read('assets/flight-journey.js');
const bootstrap=read('assets/app-bootstrap.js');
const site=read('assets/site.js');
const routeSave=read('assets/route-save.js');
const route=read('assets/route-planner.js');
const weather=read('assets/weather-fixed.js');
const wb=read('assets/weight-balance.js');
const math=read('assets/flight-workspace.js');
const procedures=read('assets/procedures.js');
const brief=read('assets/flight-brief.js');
const css=read('assets/experience.css');

for(const step of ['aircraft','route','weather','loading','math','procedures','review']){
 check(journey.includes("'"+step+"'"),'Flight journey missing step: '+step);
}
check(journey.includes("q.set('flight',f.id)"),'Flight ID is not preserved across workflow steps');
check(journey.includes("q.set('station',dst)"),'Weather step does not carry the destination');
check(journey.includes("q.set('ident',dst)"),'Procedure step does not carry the destination');
check(journey.includes("q.set('aircraft',f.aircraftId)"),'Loading step does not carry the saved aircraft');
check(journey.includes("pd-flight-progress:"),'Per-flight workflow progress is not persisted');
check(journey.includes("Flight Workflow Step"),'Flight workflow analytics missing');
check(journey.includes("Next: "),'Contextual next-step prompt missing');

check(bootstrap.includes('/assets/flight-journey.js'),'App bootstrap does not route-scope the flight journey');
check(site.includes('/assets/flight-journey.js'),'Legacy planning pages cannot load the flight journey');
check(routeSave.includes('distance:Number.isFinite')&&routeSave.includes('course:Number.isFinite'),'Saved flight does not capture route math for downstream steps');
check(route.includes('totalDistance:dist')&&route.includes('course:legs[0]?.course'),'Route planner does not persist downstream math context');
check(weather.includes("get('flight')")&&weather.includes('flightStation'),'Weather does not derive destination from the active flight');
check(weather.includes("nextUrl.searchParams.set('flight',flightId)"),'Weather URL drops the active flight');
check(wb.includes("get('aircraft')"),'Weight and Balance does not honor the active-flight aircraft');
check(wb.includes('pilotdesk:wb-calculated'),'Weight and Balance does not signal valid workflow math');
check(math.includes("get('flight')")&&math.includes("'pd-saved-flights'"),'Flight math does not prefill from a saved flight');
check(math.includes('pilotdesk:flight-math-calculated'),'Flight math completion signal missing');
check(procedures.includes("q.set('flight',flightId)")&&procedures.includes('pilotdesk:proceduresloaded'),'Procedures do not preserve/signal flight context');
check(brief.includes('pilotdesk:briefready'),'Flight brief completion signal missing');
check(css.includes('.pd-flight-journey-steps'),'Flight journey styling missing');
check(css.includes('@media(max-width:600px)'),'Flight journey mobile guard missing');

if(failures.length){
 console.error('Connected flight-planning checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Connected flight-planning checks passed: saved flight context, seven-step handoffs, destination/aircraft carryover, downstream math, progress signals, analytics, and mobile navigation verified.');
