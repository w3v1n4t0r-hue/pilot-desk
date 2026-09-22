import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const planner=read('route-planner.html');
const route=read('assets/route-planner.js');
const routeSave=read('assets/route-save.js');
const pro=read('assets/planner-pro.js');
const journey=read('assets/flight-journey.js');
const bootstrap=read('assets/app-bootstrap.js');
const flights=read('assets/flights.js');
const aircraft=read('assets/aircraft-v2.js');
const airport=read('assets/airport.js');
const procedures=read('assets/procedures.js');
const brief=read('assets/flight-brief.js');
const css=read('assets/planning-2026.css');
const styles=read('assets/styles.css');
const sw=read('sw.js');

// Connected planning sub-app.
for(const item of ['Airport Search','Route Planner','Procedures','Aircraft','Saved Flights','Flight Brief'])
  check(journey.includes(item),'Planning sub-app navigation missing '+item);
for(const path of ['/planner.html','/airport.html','/route-planner.html','/flights.html','/procedures.html','/aircraft.html','/flight-brief.html'])
  check(bootstrap.includes("'"+path+"'"),'Flight journey is not loaded on '+path);
check(journey.includes("sub.className='pd-flight-subnav'"),'Shared planning sub-navigation is not injected');
check(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))'),'Desktop planning sub-navigation is not a six-item EFB strip');
check(css.includes('box-shadow:inset 0 -2px 0 var(--accent)'),'Planning active state does not use restrained aviation accent');

// Route builder + persistent data.
for(const id of ['rpRoute','rpMap','rpSummaryDistance','rpSummaryEte','rpSummaryFuel','rpSavedRoutes'])
  check(planner.includes('id="'+id+'"'),'Route Planner missing '+id);
check(css.includes('.rp-live-summary')&&css.includes('position:sticky'),'Route totals do not stay visible on desktop');
check(route.includes('function updateLiveSummary('),'Live route summary updater missing');
check(route.includes('scheduleAutoBuild')&&route.includes("id==='rpRoute'?'input':'change'"),'Route changes do not recalculate automatically');
check(route.includes('scheduleAutoBuild(0)')&&route.includes('added from chart. Recalculating route'),'Chart waypoint changes do not recalculate automatically');
check(routeSave.includes('PilotDeskRoutePlanner?.rebuild?.()'),'Reopened saved flights do not rebuild nav data');
check(pro.includes("dispatchEvent(new Event('change'"),'Aircraft planning defaults do not trigger route recalculation');

// Saved route repeat workflow.
check(route.includes('renderSavedRoutes')&&route.includes('Duplicate & edit'),'Saved route panel / duplicate-and-edit action missing');
check(route.includes("location.assign('/route-planner.html?flight='"),'Duplicate-and-edit does not open the new copy in the planner');
check(flights.includes('data-dup')&&flights.includes('data-edit'),'Saved Flights page lost duplicate/edit actions');

// Inline weather.
check(route.includes('loadLegWeather')&&route.includes('rp-leg-wx'),'Compact weather per route leg missing');
check(route.includes("title=\"Compact airport weather only — open Weather for the full report\""),'Inline route weather does not clearly identify itself as compact context');
check(route.includes('cache:\'no-store\''),'Route weather/nav data fetches are not explicitly no-store');

// Data continuity across sub-app.
check(pro.includes('pd-aircraft-active')&&pro.includes('rpAircraft'),'Aircraft profile does not feed planner');
check(airport.includes('/route-planner.html?route='),'Airport page cannot hand an airport to the Route Planner');
check(procedures.includes('pd-route-procedures'),'Procedure page is not tied to the route pack');
check(brief.includes('pd-saved-flights')&&brief.includes('PilotDeskNavlog.build'),'Flight Brief does not rebuild from saved flight/navlog data');
check(aircraft.includes('/flights.html?aircraft='),'Aircraft profile cannot start a connected flight');

// Step 3 visual contract.
check(!/radial-gradient|linear-gradient|backdrop-filter|border-radius:\s*999/i.test(css),'Step 3 planning layer contains SaaS/decorative styling');
check(css.includes('.pd-plan-primary .pd-hub-card')&&css.includes('clip-path:none'),'Planner landing cards were not flattened into the EFB system');
check(css.includes('.pd-saved-flight-card:after{display:none!important}'),'Decorative saved-flight card artifact remains');
check(styles.includes('@import url("/assets/planning-2026.css");'),'Step 3 stylesheet is not loaded');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final CSS authority');
check(sw.includes("'/assets/planning-2026.css'"),'Step 3 styling missing from offline shell');
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=46,'Step 3 service-worker release version did not advance');

if(failures.length){
  console.error('Claude Step 3 planning smoke failed ('+failures.length+')');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Claude Step 3 connected flight-planning smoke passed.');
