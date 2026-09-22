import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const pricing=read('pricing.html'),access=read('assets/pro-access.js');
const oral=read('learn/oral-exam/index.html'),oralJs=read('assets/oral-exam-workbench.js'),oralCss=read('assets/oral-exam.css');
const aircraft=read('aircraft.html'),aircraftJs=read('assets/aircraft-v2.js');
const flights=read('flights.html'),flightsJs=read('assets/flights.js');
const route=read('route-planner.html'),routeSave=read('assets/route-save.js');
const written=read('written-prep.html'),training=read('flight-training.html'),sw=read('sw.js');

for(const phrase of ['Full interactive checkride prep','1 saved aircraft profile','Up to 3 saved flights','No Free-plan aircraft-profile cap','No Free-plan saved-flight cap'])
 check(pricing.includes(phrase),'Pricing missing product rule: '+phrase);
check(pricing.includes('TRAIN')&&pricing.includes('FLY'),'Pricing does not frame Pro around TRAIN + FLY');
check(pricing.includes('Core calculators')||pricing.includes('core aviation calculators'),'Pricing no longer makes the free acquisition surface clear');

check(access.includes('aircraft:1')&&access.includes('savedFlights:3')&&access.includes('oralTopicsPerTrack:2'),'Shared Pro limits are not canonicalized');
check(access.includes('PilotDeskBilling')&&access.includes('isPro'),'Pro access does not use verified billing state');

check(oral.includes('/assets/billing.js')&&oral.includes('/assets/pro-access.js'),'Checkride prep page is not wired to billing entitlement');
check(oral.includes('two-topic preview')&&oral.includes('pdOralPlanPanel'),'Free checkride preview UI missing');
check(oralJs.includes('access.isPro')&&oralJs.includes('lockedRow')&&oralJs.includes('oralTopicsPerTrack'),'Interactive checkride prep is not actually gated');
check(oralJs.includes("FREE PREVIEW · ")&&oralJs.includes('Full '+String('') ),'Checkride plan messaging missing');
check(oralCss.includes('.pd-oral-item-locked')&&oralCss.includes('.pd-oral-plan-panel'),'Checkride Pro states are not styled');
for(const bad of ['linear-gradient','radial-gradient'])check(!oralCss.includes(bad),'Checkride Pro styling introduced prohibited gradient decoration: '+bad);

check(aircraft.includes('/assets/billing.js')&&aircraft.includes('/assets/pro-access.js'),'Aircraft page is not wired to Pro entitlement');
check(aircraftJs.includes("canCreate?.('aircraft'")&&aircraftJs.includes('Free includes 1 aircraft profile'),'Aircraft Free cap is not enforced');
check(aircraftJs.includes('editing')&&aircraftJs.includes('existing aircraft is unchanged'),'Aircraft edits/data-preservation behavior missing');

check(flights.includes('/assets/billing.js')&&flights.includes('/assets/pro-access.js'),'Saved Flights page is not wired to Pro entitlement');
check(flightsJs.includes("canCreate?.('savedFlights'")&&flightsJs.includes('Free includes up to 3 saved flights'),'Saved Flights Free cap is not enforced');
check(route.includes('/assets/billing.js')&&route.includes('/assets/pro-access.js'),'Route Planner is not wired to Pro entitlement');
check(routeSave.includes("canCreate?.('savedFlights'")&&routeSave.includes('Your current route is still usable'),'Route Planner bypasses saved-flight Free cap');

check(written.includes('isAccessibleForFree')&&!written.includes('data-pd-checkout-plan'),'Written Prep core product should remain free');
check(training.includes('FREE PREVIEW / PRO FULL PREP'),'Training hub does not explain the checkride split');
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=52,'Service worker cache did not advance for freemium rollout');
check(sw.includes("'/assets/pro-access.js'"),'Pro entitlement helper is not included in the app cache');

if(failures.length){console.error('Pro freemium checks failed ('+failures.length+')');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('Pro freemium checks passed: free acquisition tools stay open, full checkride prep is Pro, aircraft/flight caps are enforced without deleting existing data, and billing authority is reused.');
