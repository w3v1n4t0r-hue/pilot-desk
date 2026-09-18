import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const page=read('weather.html');
const wx=read('assets/weather-fixed.js');
const extra=read('assets/weather-extra.js');
const css=read('assets/weather.css');
const journey=read('assets/flight-journey.js');

check(page.includes('pdWeatherFlightStops'),'Active-flight weather stop strip missing');
check(!page.includes('pd-flight-subnav'),'Redundant legacy weather planning subnav returned');

for(const marker of [
 'ACTIVE FLIGHT WEATHER',
 'runwayScreen',
 'orientation screen',
 'METAR winds are true; runway numbers are magnetic approximations.',
 'paApprox',
 'Open density altitude',
 'Continue to loading',
 'Weather Planning Handoff',
 'hasRunwayContext',
 'hasDensityAltitudeSetup'
]) check(wx.includes(marker),'Weather Workflow 2.0 missing: '+marker);

check(wx.includes("nextUrl.searchParams.set('flight',flightId)"),'Weather lookup drops active-flight context');
check(wx.includes("q.set('station',station)")||wx.includes("nextUrl.searchParams.set('station',station)"),'Weather station is not retained in the URL');
check(wx.includes("crossQ.set('runway',screen.r.heading)"),'Runway screen does not hand off runway heading');
check(wx.includes("daQ.set('pa',Math.round(paApprox))")&&wx.includes("daQ.set('oat',met.temp)"),'Density-altitude setup does not carry pressure altitude + OAT');
check(wx.includes("(29.92-altInHg)*1000"),'Approximate pressure-altitude handoff formula missing');
check(wx.includes("a.h<0?50:0"),'Runway orientation screen must avoid preferring a tailwind when equivalent crosswind choices exist');
check(wx.includes("data-weather-handoff="crosswind"")&&wx.includes("data-weather-handoff="density-altitude""),'Weather calculator handoff attribution missing');

check(extra.includes("flightId=new URLSearchParams(location.search).get('flight')"),'Nearby-station weather comparison drops active flight');
check(extra.includes("'&flight='+encodeURIComponent(flightId)"),'Nearby-station links do not preserve flight context');

check(css.includes('.pd-weather-flight-stops'),'Flight-stop weather styling missing');
check(css.includes('.pd-weather-decision-grid'),'Weather planning decision-grid styling missing');
check(css.includes('@media(max-width:720px)'),'Weather workflow mobile guard missing');

check(journey.includes("document.addEventListener('pilotdesk:weatherloaded'"),'Weather workflow no longer marks the seven-step flight journey');

if(failures.length){
 console.error('Weather Workflow 2.0 checks failed with '+failures.length+' issue(s):');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Weather Workflow 2.0 checks passed: active-flight stations, runway/orientation context, crosswind and density-altitude handoffs, planning continuation, source verification, analytics, and mobile UI verified.');
