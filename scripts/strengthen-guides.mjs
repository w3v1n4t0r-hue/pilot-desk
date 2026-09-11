import fs from 'node:fs';
import path from 'node:path';

const SITE='https://www.pilot-desk.com';
const dir='guides';
const files=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.html'));

const groups=[
  {name:'Weather',test:/metar|taf|weather|dew-point|cloud|flight-categories|isa|pressure-altitude|density-altitude/i,hub:'/guides/aviation-weather-reference.html',hubLabel:'Aviation weather reference',copy:'Weather knowledge becomes useful when the observation or forecast is connected to a specific flight decision. Read the reported values in context, keep observation time and forecast period in mind, and separate what the weather product actually says from what a rule of thumb only estimates. When aircraft performance is affected, carry the current atmospheric values into the approved performance method rather than stopping at the weather interpretation.'},
  {name:'Navigation',test:/wind|course|heading|track|navlog|dme|great-circle|coordinate|reciprocal|holding|airport|runway|nautical|time-speed-distance/i,hub:'/guides/navigation-reference.html',hubLabel:'Pilot navigation reference',copy:'Navigation problems connect direction, wind, speed, distance, time and position. Keep true and magnetic references consistent, use groundspeed for movement over the earth, and preserve the sign of latitude, longitude and magnetic variation. A useful study check is to estimate the answer before calculating it, then ask whether the result makes sense for the route, wind and time available.'},
  {name:'Performance',test:/climb|descent|stall|load-factor|weight|balance|cg|mac|glide|hydroplan|wing|power|maneuvering|pivotal|turn|fuel|performance|mach|airspeed/i,hub:'/guides/aircraft-performance-reference.html',hubLabel:'Aircraft performance reference',copy:'Aircraft-performance math shows how variables are related, but the operational answer remains aircraft specific. Weight, configuration, runway condition, wind, pressure, temperature and technique can all change the result. Use the relationship to understand the trend and to check arithmetic, then use the current POH or AFM procedure and chart for the airplane when the number affects a flight.'},
  {name:'Conversions',test:/conversion|conversions|altimeter-pressure/i,hub:'/guides/aviation-conversions.html',hubLabel:'Aviation conversion reference',copy:'Unit conversions are simple only when the starting quantity is identified correctly. Write the unit next to every value, convert one quantity at a time, and perform a reasonableness check before moving the number into another formula. A conversion changes the unit, not the type of speed, distance, pressure, temperature, weight or volume being described.'},
  {name:'Training',test:/e6b|flow|checklist|training|math|formula|glossary/i,hub:'/e6b-flight-computer.html',hubLabel:'Online E6B flight computer',copy:'Training is strongest when the formula, the mental estimate and the tool all agree. Work a representative problem by hand, identify why each input belongs in the relationship, and then use the PilotDesk tool as a cross-check. That makes the page useful for oral-exam preparation and for recognizing an unreasonable answer instead of simply memorizing button presses.'}
];

const defaultGroup={name:'Pilot reference',hub:'/guides.html',hubLabel:'All aviation guides',copy:'Use this reference as part of a larger planning or training workflow. Identify the source of each input, keep units consistent, estimate the expected range, and then compare the result with the current aircraft, weather, chart or procedural information that governs the real operation.'};

const strip=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

for(const ent of files){
  const file=path.join(dir,ent.name);
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  const slug=ent.name.replace(/\.html$/,'');
  const group=groups.find(g=>g.test.test(slug))||defaultGroup;
  const h1=strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)||[])[1])||slug.replaceAll('-',' ');
  const meta=strip((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)||[])[1])||`${h1} aviation guide for pilots and flight students.`;
  const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)||[])[1]||`${SITE}/guides/${ent.name}`;

  if(!html.includes('property="og:image"')){
    html=html.replace('</head>',`<meta property="og:title" content="${esc(h1)} | PilotDesk"><meta property="og:description" content="${esc(meta)}"><meta property="og:type" content="article"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${SITE}/assets/aviation-guide-reference.svg"><meta name="twitter:card" content="summary_large_image"></head>`);
  }

  if(!html.includes('data-pd-guide-schema')){
    const isHub=/reference|aviation-conversions/.test(slug);
    const schema={'@context':'https://schema.org','@type':isHub?'CollectionPage':'Article',headline:h1,name:h1,description:meta,image:`${SITE}/assets/aviation-guide-reference.svg`,mainEntityOfPage:canonical,url:canonical,author:{'@type':'Organization',name:'PilotDesk',url:`${SITE}/`},publisher:{'@type':'Organization',name:'PilotDesk',url:`${SITE}/`,logo:{'@type':'ImageObject',url:`${SITE}/assets/icon.svg`}}};
    const crumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PilotDesk',item:`${SITE}/`},{'@type':'ListItem',position:2,name:'Aviation Guides',item:`${SITE}/guides.html`},{'@type':'ListItem',position:3,name:h1,item:canonical}]};
    const tags=`<script type="application/ld+json" data-pd-guide-schema="1">${JSON.stringify(schema)}</script><script type="application/ld+json" data-pd-guide-breadcrumbs="1">${JSON.stringify(crumbs)}</script>`;
    html=html.replace('</head>',`${tags}</head>`);
  }

  const words=strip(html).split(/\s+/).filter(Boolean).length;
  if(words<650&&!html.includes('data-pd-guide-depth')){
    const block=`<section class="info-card" data-pd-guide-depth="1"><h2>How ${esc(h1)} fits into pilot training</h2><p>${esc(meta)}</p><p>${esc(group.copy)}</p><h2>A practical way to study this topic</h2><p>Start by naming the quantity you are trying to find and the units it should have. Write down the source of each input, make a rough mental estimate, and then work the relationship. If the calculated answer is far outside the estimate, check units, signs, direction references and whether the formula assumes groundspeed, true airspeed, indicated airspeed, pressure altitude or another specific value.</p><p>For an actual flight, finish the process by comparing the training result with the current source that controls the operation. That may be the aircraft POH or AFM, an FAA or charting publication, current airport data, official weather, ATC instructions, or an operator procedure. The purpose of the math is to improve understanding and cross-checking—not to replace those sources.</p><h2>Continue the topic</h2><p><a href="${group.hub}">${esc(group.hubLabel)}</a> · <a href="/guides/pilot-math-formulas.html">Pilot math formula reference</a> · <a href="/e6b-flight-computer.html">Online E6B</a> · <a href="/">All aviation calculators</a></p></section>`;
    const marker='<div class="safety-strip">';
    if(html.includes(marker)) html=html.replace(marker,`${block}${marker}`);
    else html=html.replace('</main>',`${block}</main>`);
  }

  if(!html.includes('<footer>')){
    const footer=`<footer><div><b>PilotDesk</b><p>Free aviation calculators, pilot references and training tools.</p></div><div class="footer-links"><a href="/">Calculators</a><a href="/guides.html">Guides</a><a href="/flight-training.html">Flight training</a><a href="/sources.html">Sources</a><a href="/about.html">About</a><a href="/legal/safety.html">Safety</a></div><p class="fine">Planning and training aid only. Verify operational information with current approved sources.</p></footer>`;
    html=html.replace('</body>',`${footer}</body>`);
  }

  if(before!==html) fs.writeFileSync(file,html);
}

const corePages={
  'aircraft.html':{
    heading:'Use aircraft profiles as a planning starting point',
    intro:'An aircraft profile is most useful when it keeps frequently referenced planning values in one place without pretending to replace the airplane records or approved manual. Use the Hangar to organize aircraft-specific reference information, then verify any value that affects a flight against the current POH or AFM, supplements, placards, weight-and-balance data and maintenance status for the exact airplane.',
    checks:['Confirm the exact model, variant and equipment before using a saved value.','Keep empty weight, arms, fuel capacity and performance references tied to the correct aircraft.','Treat user-entered profile data as a convenience copy, not the controlling aircraft record.','Recheck values after avionics, equipment, weighing or configuration changes.'],
    training:'For training, aircraft profiles can connect otherwise separate subjects: loading changes center of gravity, density altitude changes performance, fuel burn changes both weight and range, and equipment changes can affect legal dispatch. Use the profile as a hub that sends you back to the calculator, guide or approved chart needed for the next step.',
    links:'<a href="/guides/weight-and-balance.html">Weight and balance guide</a> · <a href="/guides/aircraft-performance-reference.html">Performance reference</a> · <a href="/poh-chart-studio.html">POH chart practice</a>'
  },
  'airport.html':{
    heading:'Build an airport picture, not just a lookup',
    intro:'Airport planning is more than finding an identifier. A useful airport review connects runway layout, field elevation, frequencies, current weather, procedures and any operational notes that affect arrival or departure. PilotDesk can bring those pieces together quickly, but the final preflight picture should still be checked against current FAA data, NOTAMs, charts and official weather.',
    checks:['Verify the airport identifier and location before using any returned data.','Review runway dimensions, orientation and field elevation in context with aircraft performance.','Compare METAR and TAF times with the planned arrival or departure window.','Open current procedures and official notices when they apply to the flight.'],
    training:'For flight training, choose an airport and work outward from it. Decode the weather, calculate a likely crosswind for the active runway, note field elevation for pressure or density-altitude work, and identify which procedures or airspace features deserve a closer look. That turns an airport search into a realistic planning exercise instead of an isolated database query.',
    links:'<a href="/weather.html">Aviation weather</a> · <a href="/procedures.html">FAA procedures</a> · <a href="/calculators/crosswind/">Crosswind calculator</a>'
  },
  'weather.html':{
    heading:'Use aviation weather as a sequence of questions',
    intro:'A weather page is most useful when it helps answer what conditions are now, what is forecast to change, and what those conditions mean for the planned route, airport and aircraft. Start with observation time and location, then move from wind and visibility to ceilings, pressure, temperature and forecast change groups instead of reading one number in isolation.',
    checks:['Confirm the station and observation time before interpreting a METAR.','Separate current observations from forecast TAF periods and change groups.','Connect wind to runway orientation and performance rather than reading speed alone.','Use official weather sources and the full preflight picture for operational decisions.'],
    training:'A strong study routine is to decode the raw report before looking at the plain-language result. Then compare your interpretation with the decoder, identify the flight category, calculate any useful crosswind or density-altitude values, and explain what would make the weather better or worse. This builds the pattern recognition needed for practical planning.',
    links:'<a href="/metar-decoder.html">METAR decoder</a> · <a href="/guides/metar-taf.html">How to read METARs and TAFs</a> · <a href="/guides/aviation-weather-reference.html">Weather reference</a>'
  },
  'metar-decoder.html':{
    heading:'Decode the report, then interpret the flight picture',
    intro:'A METAR decoder is a learning and cross-check tool. The important skill is understanding how station, time, wind, visibility, weather, sky condition, temperature, dew point and altimeter groups fit together. Decoding each token is only the first step; the next step is deciding which pieces matter for the airport, runway, aircraft and phase of flight you are planning.',
    checks:['Check station identifier and report time before using the observation.','Read wind direction, speed and gusts together, then compare them with runway orientation.','Distinguish visibility from ceiling and identify which cloud layers actually create a ceiling.','Treat remarks and unusual groups as reasons to consult the complete official product when needed.'],
    training:'For practice, read the raw METAR left to right and say what each group means before revealing the decoded output. Then summarize the report in one sentence as if briefing another pilot. Finally, connect the observation to a calculation such as crosswind, pressure altitude or density altitude. That sequence turns decoding into operational understanding.',
    links:'<a href="/guides/metar-taf.html">METAR and TAF guide</a> · <a href="/calculators/crosswind/">Crosswind calculator</a> · <a href="/calculators/density-altitude/">Density altitude calculator</a>'
  },
  'planner.html':{
    heading:'Use the planner as a flight-planning workflow',
    intro:'A useful flight plan is built in layers. Define the route and airports, collect current weather, estimate wind and groundspeed, calculate time and fuel, check aircraft performance, review procedures and airspace, and then make a final legality and risk review. PilotDesk groups those tools so each answer can feed the next planning step.',
    checks:['Keep route, winds, groundspeed and fuel assumptions consistent across calculations.','Use current aircraft data for loading and performance instead of generic examples.','Review departure, en route, destination and alternate considerations as separate questions.','Finish with current official weather, NOTAMs, charts and applicable regulations.'],
    training:'For a training scenario, save the final answer until after making a rough estimate. Predict which leg will have the strongest headwind, where fuel burn will be highest, and which airport condition is most limiting. Then use the tools to test those predictions. The goal is to understand why the numbers move, not simply to produce a navlog.',
    links:'<a href="/route-planner.html">Route planner</a> · <a href="/e6b-flight-computer.html">Online E6B</a> · <a href="/guides/flight-planning.html">Flight-planning guide</a>'
  },
  'route-planner.html':{
    heading:'Turn a route line into a usable navlog',
    intro:'Route planning connects geography with time, wind, fuel and navigation. A line between airports is only the beginning: each leg needs a distance, course or track, expected groundspeed, estimated time and enough context to make the route practical. Use the PilotDesk route tools to build and study that structure, then verify the route against current aeronautical information.',
    checks:['Verify every airport or waypoint before accepting the route.','Keep true and magnetic references consistent when applying wind and variation.','Use expected groundspeed—not airspeed—for time and distance over the ground.','Review airspace, terrain, procedures, NOTAMs and current chart information before flight.'],
    training:'A good navlog exercise is to calculate one leg manually before using the automated tools. Estimate the no-wind time first, apply the wind triangle, compare the new groundspeed and ETA, then calculate fuel for that leg. Repeating the process makes course, heading, wind correction, groundspeed, time and fuel feel like one connected problem.',
    links:'<a href="/calculators/wind-triangle/">Wind triangle</a> · <a href="/calculators/time-speed-distance/">Time/speed/distance</a> · <a href="/guides/vfr-navlog.html">VFR navlog guide</a>'
  },
  'procedures.html':{
    heading:'Treat procedure lookup as document control',
    intro:'Instrument procedures are time-sensitive operating documents. A convenient search page can help you locate the chart, but the important habits are confirming the airport, procedure name, revision or effective information, and that the document comes from a current approved source. Never rely on a remembered plate or a screenshot whose currency is unknown.',
    checks:['Confirm the airport and exact procedure title before briefing it.','Use a current FAA or otherwise approved chart source for the operation.','Review frequencies, course, altitudes, notes, missed approach and minima as separate briefing items.','Check NOTAMs and current navigation-facility status when they can affect the procedure.'],
    training:'For instrument training, brief the plate in the same order every time. Start with the procedure and navigation source, then frequencies, final approach course, altitudes, minimums, timing or distance information, missed approach and any notes that change how the procedure is flown. A consistent flow reduces the chance of skipping a small but important item.',
    links:'<a href="/airport.html">Airport search</a> · <a href="/weather.html">Aviation weather</a> · <a href="/flight-training.html">Flight-training tools</a>'
  },
  'poh-chart-studio.html':{
    heading:'Practice the chart-reading process, not a memorized answer',
    intro:'POH performance charts reward a repeatable method. Identify the chart and configuration, write down every required input, locate the surrounding chart values, interpolate only where the chart and training method allow it, and keep correction factors separate from the base chart result. The purpose of practice is to make that sequence automatic without replacing the approved manual.',
    checks:['Use the correct aircraft, chart, configuration and units.','Identify pressure altitude, temperature, weight, wind and surface assumptions before entering the chart.','Interpolate carefully and avoid inventing precision the chart does not support.','Apply notes and correction factors in the order specified by the current POH or AFM.'],
    training:'After finding a result, explain which variable had the greatest effect and what direction the answer would move if conditions changed. Try a hotter temperature, higher weight or different wind and predict the trend before recalculating. This builds the performance judgment needed for oral questions and real preflight planning.',
    links:'<a href="/guides/poh-performance-chart-interpolation.html">POH interpolation guide</a> · <a href="/calculators/density-altitude/">Density altitude</a> · <a href="/guides/aircraft-performance-reference.html">Performance reference</a>'
  },
  'checklist-trainer.html':{
    heading:'Use checklist practice to build a reliable cockpit sequence',
    intro:'Checklist training works best when it separates memory from verification. A flow can help move through the cockpit efficiently, while the written checklist confirms that required items were actually completed. The goal is not to memorize a generic sequence and carry it into every airplane; it is to practice disciplined verification using the checklist approved or provided for the specific aircraft and operation.',
    checks:['Practice from the checklist that applies to the exact aircraft and training program.','Use flows for organization, then verify with the written checklist.','Say or identify what each item accomplishes instead of memorizing words only.','Treat emergency-memory items separately from normal checklist flows and follow the approved procedure.'],
    training:'A useful study method is recall, verify, correct. Attempt the sequence from memory, compare it with the source, identify exactly where the order or wording changed, and immediately repeat the corrected section. Randomized recall is especially useful once the basic sequence is solid because it tests whether you know the procedure itself rather than only the rhythm of reciting the whole list.',
    links:'<a href="/guides/flows-vs-checklists.html">Flows vs. checklists</a> · <a href="/flight-training.html">Flight-training tools</a> · <a href="/guides.html">Aviation guides</a>'
  },
  'flight-training.html':{
    heading:'Connect PilotDesk tools to a complete lesson',
    intro:'Flight training becomes more useful when calculations, weather, aircraft knowledge and procedures are connected instead of studied as separate boxes. Use PilotDesk to set up a realistic scenario, make a prediction, work the problem, and then explain why the result matters to the flight. That sequence supports both practical planning and oral-exam preparation.',
    checks:['Start with a specific aircraft, route or airport so the exercise has context.','Use current approved sources when the exercise crosses from study into an actual flight.','Explain the reason behind each formula or checklist item rather than memorizing the output.','Finish with a reasonableness check and identify what change in conditions would alter the decision.'],
    training:'A single cross-country scenario can cover weather decoding, airport review, wind correction, groundspeed, time, fuel, density altitude, weight and balance, procedures and checklist practice. Reusing the same scenario across several tools helps show how aviation knowledge fits together and exposes inconsistencies between assumptions before they become habits.',
    links:'<a href="/e6b-flight-computer.html">Online E6B</a> · <a href="/guides/pilot-math-formulas.html">Pilot math formulas</a> · <a href="/checklist-trainer.html">Checklist trainer</a>'
  }
};

for(const [file,data] of Object.entries(corePages)){
  if(!fs.existsSync(file)) continue;
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  if(file==='flight-training.html'){
    html=html.replace(/<meta name="description" content="[^"]*">/i,'<meta name="description" content="Free aviation tools for flight students and CFIs: calculators, weather, E6B, checklist practice, POH chart training and planning references.">');
  }
  if(!html.includes('data-pd-core-depth')){
    const checkList=data.checks.map(x=>`<li>${esc(x)}</li>`).join('');
    const block=`<section class="info-card" data-pd-core-depth="1"><h2>${esc(data.heading)}</h2><p>${esc(data.intro)}</p><h2>A practical verification flow</h2><ul>${checkList}</ul><p>Before accepting any output, ask three questions: Is the source current? Are the units and reference systems correct? Does the result make sense for the aircraft, airport, weather and phase of flight? Those checks catch many planning errors before a more detailed calculation is even needed.</p><h2>Use it for training</h2><p>${esc(data.training)}</p><p>PilotDesk is designed as a supplemental planning and training workspace. It does not replace approved aircraft documents, official weather, current charts, ATC instructions, NOTAMs, regulations or operator procedures. When a result affects an actual flight, verify it with the controlling source.</p><h2>Related PilotDesk resources</h2><p>${data.links} · <a href="/guides.html">All aviation guides</a> · <a href="/">All calculators</a></p></section>`;
    const marker='<div class="safety-strip">';
    if(html.includes(marker)) html=html.replace(marker,`${block}${marker}`);
    else html=html.replace('</main>',`${block}</main>`);
  }
  if(before!==html) fs.writeFileSync(file,html);
}

console.log(`Strengthened ${files.length} aviation guides plus ${Object.keys(corePages).length} major PilotDesk tool and training pages.`);
