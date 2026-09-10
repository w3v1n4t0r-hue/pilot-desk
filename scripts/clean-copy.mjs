import fs from 'node:fs';
import path from 'node:path';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const edit=(file,fn)=>{const before=read(file),after=fn(before);if(after!==before){write(file,after);console.log('updated',file)}else console.log('no change',file)};
const swap=(s,from,to,file)=>{if(!s.includes(from))throw new Error(`Missing expected copy in ${file}: ${from.slice(0,90)}`);return s.replace(from,to)};
const swaps=(file,pairs)=>edit(file,s=>pairs.reduce((v,[a,b])=>swap(v,a,b,file),s));

swaps('planner.html',[
  ['Flight Planning Workspace | PilotDesk','Flight Planner | PilotDesk'],
  ['PilotDesk flight planning workspace with airport search, FAA chart route planning, saved flights, one-page flight briefs, live aviation weather, FAA terminal procedures, My Hangar aircraft profiles, POH chart tools, and checklist training.','PilotDesk flight planning tools for airport lookup, FAA chart route planning, saved flights, flight briefs, aviation weather, FAA procedures, aircraft profiles, POH charts, and checklist practice.'],
  ['PILOTDESK FLIGHT WORKSPACE','FLIGHT PLANNING'],
  ['From airport search to flight brief.','Plan a flight'],
  ['Start with an airport or a route, carry your active aircraft through the planning tools, save the flight, and reopen a current brief without retyping the same information.','Look up an airport, build a route, save the flight, and open a brief. Your active aircraft can fill in the TAS and fuel-burn values you use most often.'],
  ['<small>Start here</small>','<small>Airport lookup</small>'],
  ['<small>FAA charts + navlog</small>','<small>Route and navlog</small>'],
  ['<small>Local library</small>','<small>Saved on this device</small>'],
  ['<small>Current snapshot</small>','<small>Flight summary</small>'],
  ['<small>Aircraft defaults</small>','<small>Aircraft</small>'],
  ['Search by ICAO/FAA identifier or airport/city name. Open weather, runways, nearby stations, FAA procedures, and planning links together.','Search by airport identifier, airport name, or city. Open weather, runway wind, nearby stations, FAA procedures, or the route planner from the result.'],
  ['Plot over FAA chart imagery, calculate leg-by-leg navigation and fuel math, load endpoint weather/procedures, then save the route.','Plot a route over FAA chart tiles, calculate the navlog and fuel, load endpoint weather and procedures, and save the route.'],
  ['Rebuild navlog math and reload current endpoint weather from a saved or recent route.','Open the navlog and reload current weather for a saved or recent route.'],
  ['Built around source visibility','Data sources']
]);

swaps('airport.html',[
  ['Search airports and aviation weather stations, then view current METAR and TAF context, runway wind components, nearby stations, FAA terminal procedures, and planning links in one PilotDesk workspace.','Search airports and aviation weather stations, then open current METAR and TAF reports, runway wind components, nearby stations, FAA procedures, and flight-planning links.'],
  ['AIRPORT WORKSPACE','AIRPORT SEARCH'],
  ['Search once. Plan from one screen.','Airport Search'],
  ['Enter an ICAO/FAA identifier such as <strong>KMCO</strong> or <strong>MCO</strong>, or search by an airport/city name. PilotDesk ties current weather, runway-wind context, nearby weather stations, FAA terminal procedures, and planning shortcuts together.','Enter an ICAO/FAA identifier such as <strong>KMCO</strong> or <strong>MCO</strong>, or search by airport or city name. From the result you can open current weather, runway wind, nearby stations, FAA procedures, and the route planner.'],
  ['What PilotDesk airport search is for','What this page does'],
  ['This page is designed to reduce repeated typing while you plan. A single airport selection can lead directly to current METAR/TAF context, runway wind-component math when runway data is available, current FAA terminal procedure links, a new route, or a saved flight brief.','Use one airport lookup instead of entering the same identifier again on the weather, procedures, and planner pages. You can also save the airport for quicker access later.']
]);

swaps('flights.html',[
  ['LOCAL FLIGHT LIBRARY','SAVED ON THIS DEVICE'],
  ['Planning convenience only.','Planning aid only.'],
  ['Use your active Hangar aircraft for quick defaults, or enter planning values manually.','Use the active Hangar aircraft for defaults, or enter the numbers yourself.'],
  ['They are designed to move a route and planning assumptions quickly between the saved-flight library, Route Planner, and Flight Brief.','You can reopen a saved route in the Route Planner or Flight Brief without entering the same planning numbers again.']
]);

swaps('flight-brief.html',[
  ['Build a one-page PilotDesk flight brief from a saved route with navlog math, endpoint METAR context, FAA procedure links, aircraft planning values, and official weather/NOTAM/TFR shortcuts.','Open a saved route as a one-page flight brief with navlog math, endpoint METARs, FAA procedure links, aircraft planning values, and weather, NOTAM, and TFR links.'],
  ['CONNECTED FLIGHT WORKSPACE','FLIGHT BRIEF'],
  ['Open a saved flight or the most recent Route Planner route. PilotDesk rebuilds the navlog and loads current departure/destination weather each time you open the brief.','Open a saved flight or the most recent Route Planner route. The brief rebuilds the navlog and reloads current departure and destination weather when you open it.'],
  ['What this brief is — and is not','What the brief includes'],
  ["PilotDesk combines your locally saved planning assumptions with current endpoint weather and quick links to authoritative sources. It is intentionally a convenience workspace, not a substitute for an official weather briefing, flight plan, dispatch release, approved performance source, or regulatory requirement.","The brief uses the route and planning numbers saved in your browser, then reloads current weather for the departure and destination. It is not an official weather briefing, filed flight plan, dispatch release, approved performance source, or regulatory requirement."]
]);

swaps('aircraft.html',[
  ['Save aircraft-specific cruise, fuel, performance, weight-and-balance, home-airport, and source values locally so PilotDesk can reuse them across saved flights and planning tools.','Save aircraft cruise, fuel, performance, weight-and-balance, home-airport, and source notes locally for use in PilotDesk planning tools.'],
  ['PERSONAL AIRCRAFT WORKSPACE','AIRCRAFT PROFILES'],
  ['Save the aircraft values you repeatedly use. Pick one aircraft as active and PilotDesk can carry its cruise TAS and fuel burn into saved flights and planning tools without making you type the same numbers every time.','Save the aircraft numbers you use often. The active aircraft can fill in cruise TAS and fuel burn on the planner and saved-flight pages.'],
  ['A Hangar profile is a convenience copy only.','A Hangar profile is only a saved copy.']
]);

swaps('weather.html',[
  ['Current METAR and TAF data with Aviation Weather Center as the primary source and NOAA/NWS as an automatic backup. PilotDesk also shows observation freshness, runway wind components when airport data is available, nearby reporting stations, and separated TAF change groups.','Look up current METAR and TAF reports. PilotDesk tries Aviation Weather Center first and falls back to NOAA/NWS text products if needed. It also shows report age, runway wind when runway data is available, nearby stations, and TAF change groups.'],
  ['Weather data behavior','Where the weather comes from'],
  ["PilotDesk requests live weather server-side from the Aviation Weather Center and NOAA/NWS. AWC is preferred; NOAA/NWS can supply METAR and TAF text automatically when AWC is slow or unavailable. Nearby stations use the AWC station index and are shown by straight-line distance only.","PilotDesk requests weather from Aviation Weather Center and NOAA/NWS. It uses AWC when available and can fall back to NOAA/NWS METAR and TAF text. Nearby stations come from the AWC station list and are sorted by straight-line distance."]
]);

swaps('metar-decoder.html',[
  ['Learning and convenience tool.','Training aid only.'],
  ['The original token stays beside its explanation so you can learn the coded format.','Each code stays next to its plain-language meaning.'],
  ['PilotDesk intentionally keeps the original METAR beside the explanation.','The original METAR stays visible beside the explanation.']
]);

swaps('route-planner.html',[
  ['Plot a route over FAA Sectional, TAC, IFR Low, or IFR High chart tiles; build a transparent navlog; view endpoint weather; attach FAA terminal procedures; and save the flight into PilotDesk.','Plot a route over FAA Sectional, TAC, IFR Low, or IFR High chart tiles; calculate a navlog; view endpoint weather; attach FAA terminal procedures; and save the flight.'],
  ['Build the route over official FAA Aeronautical Information Services raster chart tiles. PilotDesk calculates each leg transparently, shows endpoint weather, can collect current FAA terminal procedures into a local route pack, and now saves the same planning inputs into Saved Flights and Flight Brief.','Enter a route and plot it over FAA Aeronautical Information Services chart tiles. PilotDesk calculates each leg, loads endpoint weather and FAA procedures, and can save the route for later.'],
  ['Calculation and source model','How the navlog is calculated'],
  ['Surface METAR wind is airport context only; it is <strong>not silently used as an enroute wind forecast</strong>. The chart background comes from FAA AIS public raster tile services. Terminal-procedure links come from the FAA d-TPP search and remain FAA-hosted PDFs.','Surface METAR wind is shown for airport context only. It is <strong>not used for the enroute wind calculation</strong>. The chart background comes from FAA AIS public raster tile services. Terminal-procedure links come from the FAA d-TPP search and remain FAA-hosted PDFs.']
]);

swaps('procedures.html',[
  ['Find current FAA d-TPP approach plates, airport diagrams, departures, arrivals, and minimums, preview the FAA PDF, and attach selected procedures to a local PilotDesk route pack.','Find current FAA d-TPP approach plates, airport diagrams, departures, arrivals, and minimums, preview the FAA PDF, and save selected procedure links on this device.'],
  ['Search the current FAA d-TPP metafile by airport, preview the original FAA chart through PilotDesk, and keep selected plates in a local route pack.','Search the current FAA d-TPP list by airport, preview the FAA PDF, and save selected procedure links on this device.'],
  ['Source model','FAA source'],
  ['Transparent planning tools built around official source material.','Flight planning and study tools.']
]);

swaps('checklist-trainer.html',[
  ['Why the library is aircraft-based','Why sets stay with an aircraft'],
  ['A normal checklist, an emergency memory item, and a maneuver setup can all contain similar words while meaning very different things on different aircraft. PilotDesk therefore files training sets by saved aircraft profile first, then by Normal, Emergency, or Maneuver category. Nothing is shared to another aircraft unless you deliberately duplicate and re-file it.','Checklist wording can change between aircraft. PilotDesk keeps each set under the aircraft profile you chose, then separates Normal, Emergency, and Maneuver items. A set does not move to another aircraft unless you duplicate it there.']
]);

swaps('guides.html',[
  ['Practical explanations of the weather, planning workflow, and pilot math behind PilotDesk. The goal is to show what the numbers mean and keep the original source or formula close at hand.','Short guides for aviation weather, flight planning, and the math used in PilotDesk. Each guide shows the formula or source it relies on.'],
  ['<small>Planning workflow</small>','<small>Flight planning</small>']
]);

swaps('about.html',[
  ['PilotDesk is a fast aviation utility built around the calculations pilots actually reach for: crosswind, fuel, altitude, descent, turns, navigation, weight and balance, conversions and more.','PilotDesk is a free set of aviation tools for common pilot math, weather lookups, aircraft profiles, and flight planning.'],
  ['A lot of pilot math is simple but repetitive. PilotDesk puts those calculations in one mobile-friendly place so a pilot or student can get the arithmetic quickly, see the method, and move on. No account is required for the core calculators.','A lot of pilot math is repetitive. PilotDesk keeps the common calculations easy to find and shows the formula so you can check the work. No account is required for the calculators.'],
  ['More than calculators','Other tools'],
  ['PilotDesk also includes live METAR and TAF lookup, runway wind-component assistance when airport data is available, locally stored aircraft profiles, favorites, recent calculations and a reusable Weight & Balance Builder.','The site also has METAR and TAF lookup, runway wind components when runway data is available, aircraft profiles, saved flights, favorites, recent calculations, and a Weight & Balance Builder.'],
  ['Built around verification','Check the source'],
  ['PilotDesk is intentionally not presented as an authority. Calculator outputs are planning aids. Weather is supplemental. Aircraft-specific limitations and performance come from current approved data. When PilotDesk and an approved source disagree, the approved source controls.','PilotDesk is a planning aid, not an approved source. Check aircraft limitations and performance against current approved data, and use current official sources for weather and flight information. If PilotDesk disagrees with an approved source, use the approved source.'],
  ['Privacy and monetization','Local data and ads'],
  ['Keep it useful','Feedback'],
  ['If something looks wrong, report it. If there is a calculator pilots would actually use, suggest it. The goal is not to become an overloaded flight-planning suite; it is to stay quick, clear and useful.','If something looks wrong, report it. If there is a calculator or pilot tool you would use, suggest it.']
]);

swaps('index.html',[
  ['aviation calculators in one place.','aviation calculators.'],
  ['<span>Learn the why</span>','<span>How the math works</span>']
]);

swaps('poh-chart-studio.html',[
  ['Digitize a user-supplied POH or AFM performance chart into a deterministic interpolation model with visible calibration and traced source curves.','Trace a POH or AFM performance chart you provide, calibrate the axes, and interpolate between the traced curves.'],
  ['Turn a chart you legally possess into a deterministic interpolation model. The image stays in your browser. PilotDesk does not treat AI or OCR guesses as authoritative aircraft performance data.','Load a POH or AFM chart you are allowed to use, calibrate the axes, trace the curves, and interpolate between the points. The image stays in your browser.'],
  ['What this version can do','Supported chart type'],
  ['This engine handles a common chart pattern: one X axis, one Y axis, and a family of parameter curves. It converts pixel positions into calibrated chart coordinates, linearly interpolates along traced curves, and interpolates between adjacent curve-family values.','This version handles a chart with one X axis, one Y axis, and a family of parameter curves. It converts the traced pixel positions into chart values, interpolates along each curve, and then interpolates between adjacent curves.'],
  ['Chained nomographs like some Piper takeoff charts require several linked chart regions. PilotDesk’s model format is being designed for that, but this page intentionally does not pretend a simple 2-D model can safely interpret every POH chart. A chart should be considered usable only after its axes, curves, associated conditions, and published examples have been independently checked against the source.','Chained nomographs, including some takeoff charts, need a different model and are not supported here. Check the axes, traced curves, conditions, and published examples against the original chart before using the result.'],
  ['Transparent pilot math and training tools.','Pilot math and training tools.']
]);

edit('assets/weather-fixed.js',s=>{
  s=swap(s,"fetch('/api/weather?station='+encodeURIComponent(id),{headers:{Accept:'application/json'}})","fetch('/api/weather?station='+encodeURIComponent(id),{headers:{Accept:'application/json'},cache:'no-store'})",'assets/weather-fixed.js');
  s=s.replace('Fetching live aviation weather…','Loading weather…').replace('Loading current METAR, TAF, and airport data…','Loading METAR, TAF, and airport data…').replace('Supplemental convenience display only. This is not a complete weather briefing.','For planning only. This is not a complete weather briefing.');
  return s;
});

edit('site.webmanifest',s=>{
  const m=JSON.parse(s);
  m.description='Pilot tools for airport search, aviation weather, FAA chart route planning, saved flights, flight briefs, aircraft profiles, weight and balance, and pilot math.';
  const icon={src:'/assets/icon.svg',sizes:'any',type:'image/svg+xml'};
  const shortcuts=[
    ['Airport Search','Airports','Search airports, weather, runways, nearby stations, and FAA procedures.','/airport.html'],
    ['Route Planner','Planner','Open the FAA chart route planner and navlog.','/route-planner.html'],
    ['Airport Weather','Weather','Open current METAR and TAF reports.','/weather.html'],
    ['Weight & Balance','W&B','Open the Weight & Balance Builder.','/calculators/weight-balance-builder/']
  ];
  m.shortcuts=shortcuts.map(([name,short_name,description,url])=>({name,short_name,description,url,icons:[icon]}));
  return JSON.stringify(m,null,2)+'\n';
});

edit('sw.js',s=>{
  if(!/CACHE='pilotdesk-v\d+'/.test(s))throw new Error('Service worker cache marker missing');
  return s.replace(/CACHE='pilotdesk-v\d+'/,"CACHE='pilotdesk-v20'");
});

edit('.github/workflows/workspace-live.yml',s=>s
  .replaceAll('workspace_live=19','workspace_live=20')
  .replace("planner.includes('From airport search to flight brief.')","planner.includes('<h1>Plan a flight</h1>')")
  .replace("airport.includes('Search once. Plan from one screen.')","airport.includes('<h1>Airport Search</h1>')")
  .replace("flights.includes('LOCAL FLIGHT LIBRARY')","flights.includes('SAVED ON THIS DEVICE')")
  .replace("brief.includes('CONNECTED FLIGHT WORKSPACE')","brief.includes('FLIGHT BRIEF')")
  .replace("grep -q 'pilotdesk-v19' sw.js","grep -q 'pilotdesk-v20' sw.js")
);

edit('.github/workflows/qa.yml',s=>{
  if(s.includes('node qa/copy-tone.mjs'))return s;
  const needle='      - name: Run calculator formula regression tests\n        run: node qa/formula-tests.mjs\n';
  if(!s.includes(needle))throw new Error('QA insertion point missing');
  return s.replace(needle,needle+'      - name: Run site integrity checks\n        run: node qa/site-integrity.mjs\n      - name: Check public copy tone\n        run: node qa/copy-tone.mjs\n');
});

edit('scripts/generate-calculator-pages.mjs',s=>{
  const a=s.indexOf('const useText={');
  const b=s.indexOf('};\nfor(const [slug',a);
  if(a<0||b<0)throw new Error('Generator useText block not found');
  const use=`const useText={
'Flight Planning':'Use this for quick flight-planning math or to check a problem. For an actual flight, use current winds, fuel data, aircraft information, and any required official source.',
'Atmosphere & Weather':'Use current pressure, temperature, and weather data. If the number affects a flight, check it against the aircraft performance information and current weather products you are using.',
'Performance':'Use this math as a quick check or study aid. Takeoff, landing, climb, stall, glide, and limitation data still come from the current POH or AFM for the aircraft.',
'Maneuvers & Turns':'These calculations are useful for training and study. Fly the maneuver using the aircraft limitations, checklist or POH, instructor guidance, and applicable training standards.',
'Navigation':'Use this for planning math and cross-checks. Verify current wind, variation, coordinates, and navigation data before using the result for a flight.',
'Weight & Balance':'The calculator can do the moment and CG math, but the current approved loading data for the aircraft determines whether the loading is within limits.',
'Conversions':'Check the unit before entering a value. A correct conversion can still cause a bad result if the starting number or unit is wrong.'};`;
  s=s.slice(0,a)+use+s.slice(b+2);
  const c=s.indexOf('const copy=`');
  const d=s.indexOf(';\nconst html=`',c);
  if(c<0||d<0)throw new Error('Generator copy block not found');
  const copy="const copy=`<div class=\"info-card\"><h2>How to use this calculator</h2><p>\${esc(useText[category])}</p><p>Enter \${esc(fieldNames)}. The calculator returns \${esc(resultNames)}. Check the inputs before relying on the result.</p><h2>Quick check</h2><p>The sample values are: \${esc(defaults)}. Run the calculation, change one input, and run it again to see how the result changes. For a real flight, replace the sample values with current information and check the result against the applicable POH/AFM, chart, weather product, or navigation source.</p><details class=\"method-card\"><summary><strong>Show formula and assumptions</strong></summary><p>\${esc(formula)}</p><p>Units are shown beside each field and result. Aircraft-specific corrections, interpolation rules, reserves, runway factors, and operating limits are not included unless the page says they are.</p></details><h2>Sources</h2><p>General background comes from FAA pilot-training publications. For an actual flight, use the current approved information that applies to the aircraft and operation. <a href=\"/sources.html\">PilotDesk sources and methods →</a></p></div>`";
  s=s.slice(0,c)+copy+s.slice(d);
  s=s.replace('Free pilot calculator with formula, example inputs, sharing and references.','Pilot calculator with the formula, sample inputs, and references.');
  s=s.replaceAll('Aviation calculators for planning and training.','Pilot calculators and planning tools.');
  s=s.replaceAll('PilotDesk is an educational planning aid. Verify operational numbers with current approved sources.','Planning aid only. Check operational numbers against current approved sources.');
  return s;
});

console.log('PilotDesk public copy cleanup complete.');
