import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/calculator-config.js','utf8'),context);
const calcs=context.window.PD_CALCS||[];

const categories={
  'Flight Planning':['crosswind','wind-triangle','time-speed-distance','fuel-required','endurance-range','top-of-descent','three-degree-descent','holding-leg-distance'],
  'Atmosphere & Weather':['pressure-altitude','density-altitude','isa-temperature','cloud-base','speed-of-sound','mach-number'],
  'Performance':['true-airspeed','climb-gradient','fpm-to-gradient','gradient-angle','glide-range','maneuvering-speed-weight','accelerated-stall','hydroplaning','wing-loading','power-loading','obstacle-gradient'],
  'Maneuvers & Turns':['pivotal-altitude','standard-rate-bank','load-factor','turn-radius','rate-of-turn'],
  'Navigation':['reciprocal-heading','true-magnetic','arc-distance','great-circle-distance','dms-decimal','nm-per-minute'],
  'Weight & Balance':['moment-cg','percent-mac','ballast','fuel-weight'],
  'Conversions':['speed-conversion','distance-conversion','temperature-conversion','weight-conversion','volume-conversion','pressure-conversion','vertical-speed-conversion']
};

const calcBySlug=new Map(calcs.map(c=>[c[0],c[2]]));
const categoryFor=slug=>Object.entries(categories).find(([,items])=>items.includes(slug))?.[0]||'Aviation';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit=u=>u?`<span>${esc(u)}</span>`:'';

const formulas={
  crosswind:'Crosswind = wind speed × sin(relative wind angle). Headwind or tailwind = wind speed × cos(relative wind angle).',
  windTriangle:'The wind triangle resolves the wind vector against the aircraft true-airspeed vector to solve wind-correction angle, heading and groundspeed.',
  tsd:'Distance = speed × time. Rearranging the same relationship gives time = distance ÷ speed and speed = distance ÷ time.',
  fuelRequired:'Trip fuel = fuel flow × trip time. Total required fuel adds the entered reserve quantity before comparing the result with fuel on board.',
  endurance:'Maximum endurance = usable fuel ÷ fuel flow. Reserve-adjusted endurance subtracts the entered reserve time before range is estimated from groundspeed.',
  tod:'Top-of-descent distance = altitude to lose ÷ selected descent gradient. Descent time then follows from groundspeed.',
  threeDegree:'Vertical speed = groundspeed × 6,076.1 ÷ 60 × tan(3°). The familiar groundspeed × 5 rule is a cockpit approximation.',
  holdDistance:'Distance = groundspeed × time, with knots converted from nautical miles per hour to nautical miles per second.',
  pressureAltitude:'Pressure altitude ≈ field elevation + (29.92 − altimeter setting) × 1,000 for the common training approximation.',
  densityAltitude:'PilotDesk derives dry-air density from pressure altitude and temperature, then converts that density to an ISA-equivalent altitude.',
  isaTemp:'In the lower standard atmosphere, ISA temperature decreases from 15°C at sea level at roughly 1.98°C per 1,000 feet.',
  cloudBase:'The convective cloud-base shortcut uses surface temperature/dew-point spread and a standard training approximation; it is not a ceiling forecast.',
  speedSound:'Local speed of sound is calculated from absolute temperature using the ideal-gas relationship for air.',
  mach:'Mach number = true airspeed ÷ local speed of sound, with local sound speed calculated from temperature.',
  tasApprox:'The 2% rule estimates TAS by increasing CAS about 2% per 1,000 feet. It is a training shortcut, not a precision air-data solution.',
  climbGradient:'Vertical speed (ft/min) = climb gradient (ft/NM) × groundspeed (NM/min).',
  fpmGradient:'Climb gradient (ft/NM) = vertical speed (ft/min) ÷ groundspeed (NM/min).',
  gradientAngle:'Flight-path gradient and angle are connected by tangent geometry; percent grade and feet per nautical mile are different ways to express the same slope.',
  glide:'Still-air glide distance = altitude available × glide ratio, then the horizontal distance is converted to nautical miles.',
  vaWeight:'Adjusted Va ≈ published Va × √(current weight ÷ published reference weight).',
  stallBank:'Accelerated stall speed = 1-G stall speed × √load factor, with coordinated level-turn load factor based on bank angle.',
  hydro:'Dynamic hydroplaning speed estimate ≈ 9 × √tire pressure in psi.',
  wingLoading:'Wing loading = aircraft weight ÷ wing area.',
  powerLoading:'Power loading = aircraft weight ÷ horsepower.',
  obstacleGradient:'Required geometric gradient = obstacle height plus desired margin ÷ horizontal distance, with consistent units.',
  pivotal:'Pivotal altitude (ft AGL) ≈ groundspeed² ÷ 11.3 for the common knots-and-feet training rule.',
  stdRate:'A standard-rate turn changes heading about 3° per second. The exact coordinated bank depends on true airspeed.',
  loadFactor:'Load factor in a coordinated level turn = 1 ÷ cos(bank angle).',
  turnRadius:'Coordinated turn radius is determined by true airspeed and bank angle.',
  rateTurn:'Coordinated turn rate is determined by true airspeed and bank angle.',
  reciprocal:'A reciprocal direction is 180° opposite the original direction, normalized to the 001°–360° convention.',
  trueMag:'True and magnetic direction differ by magnetic variation; the sign convention must stay consistent through the conversion.',
  arcDistance:'Arc length equals the selected fraction of a circle multiplied by the circumference at the entered DME radius.',
  greatCircle:'Great-circle distance uses spherical geometry to estimate the shortest path between two latitude/longitude points.',
  dms:'Decimal degrees = degrees + minutes ÷ 60 + seconds ÷ 3,600, with the appropriate north/south or east/west sign.',
  nmMinute:'Nautical miles per minute = groundspeed in knots ÷ 60.',
  momentCg:'Moment = weight × arm. Loaded center of gravity = total moment ÷ total weight.',
  percentMac:'Percent MAC = (CG − LEMAC) ÷ MAC length × 100.',
  ballast:'The ballast equation balances the existing aircraft moment against the target CG and selected ballast arm.',
  fuelWeight:'Fuel weight = volume × entered fuel density.',
  speedConv:'One knot equals one nautical mile per hour, approximately 1.15078 mph, 1.852 km/h or 0.51444 m/s.',
  distanceConv:'One nautical mile equals 1.15078 statute miles, 1.852 kilometers or about 6,076.1 feet.',
  tempConv:'Celsius and Fahrenheit use different zero points and scale sizes; Kelvin is an absolute temperature scale.',
  weightConv:'One pound equals approximately 0.453592 kilograms.',
  volumeConv:'One U.S. gallon equals approximately 3.78541 liters.',
  pressureConv:'29.92 inHg is approximately 1013.25 hPa; the calculator applies the standard pressure-unit conversion.',
  verticalConv:'Vertical-speed units are converted from feet per minute into feet per second and meters per second.'
};

const guideFor={
  'crosswind':'/guides/crosswind-component.html','wind-triangle':'/guides/wind-triangle.html','time-speed-distance':'/guides/time-speed-distance.html','fuel-required':'/guides/fuel-planning.html','endurance-range':'/guides/endurance-range.html','top-of-descent':'/guides/top-of-descent.html','three-degree-descent':'/guides/three-degree-descent.html','holding-leg-distance':'/guides/holding-leg-distance.html',
  'pressure-altitude':'/guides/pressure-altitude.html','density-altitude':'/guides/density-altitude.html','isa-temperature':'/guides/isa-temperature.html','cloud-base':'/guides/cloud-base-estimate.html','speed-of-sound':'/guides/mach-speed-of-sound.html','mach-number':'/guides/mach-speed-of-sound.html',
  'true-airspeed':'/guides/true-airspeed-rule.html','climb-gradient':'/guides/climb-gradient.html','fpm-to-gradient':'/guides/climb-rate-vs-climb-gradient.html','gradient-angle':'/guides/flight-path-gradient-angle.html','glide-range':'/guides/glide-range.html','maneuvering-speed-weight':'/guides/maneuvering-speed-weight.html','accelerated-stall':'/guides/accelerated-stall-load-factor.html','hydroplaning':'/guides/hydroplaning-speed.html','wing-loading':'/guides/wing-loading.html','power-loading':'/guides/power-loading.html','obstacle-gradient':'/guides/obstacle-climb-gradient.html',
  'pivotal-altitude':'/guides/pivotal-altitude.html','standard-rate-bank':'/guides/standard-rate-turn.html','load-factor':'/guides/accelerated-stall-load-factor.html','turn-radius':'/guides/turn-radius-rate.html','rate-of-turn':'/guides/turn-radius-rate.html',
  'reciprocal-heading':'/guides/reciprocal-heading.html','true-magnetic':'/guides/true-magnetic-heading.html','arc-distance':'/guides/dme-arc-distance.html','great-circle-distance':'/guides/great-circle-distance.html','dms-decimal':'/guides/dms-coordinates.html','nm-per-minute':'/guides/nautical-miles-per-minute.html',
  'moment-cg':'/guides/moment-center-of-gravity.html','percent-mac':'/guides/percent-mac.html','ballast':'/guides/ballast-cg.html','fuel-weight':'/guides/fuel-weight.html',
  'speed-conversion':'/guides/aviation-speed-conversions.html','distance-conversion':'/guides/aviation-distance-conversions.html','temperature-conversion':'/guides/aviation-temperature-conversions.html','weight-conversion':'/guides/aircraft-weight-conversions.html','volume-conversion':'/guides/aviation-volume-conversions.html','pressure-conversion':'/guides/altimeter-pressure-conversions.html','vertical-speed-conversion':'/guides/vertical-speed-conversions.html'
};

const hubFor={
  'Flight Planning':['/e6b-flight-computer.html','Online E6B flight computer'],
  'Atmosphere & Weather':['/guides/aviation-weather-reference.html','Aviation weather reference'],
  'Performance':['/guides/aircraft-performance-reference.html','Aircraft performance reference'],
  'Maneuvers & Turns':['/guides/aircraft-performance-reference.html','Aircraft performance reference'],
  'Navigation':['/guides/navigation-reference.html','Pilot navigation reference'],
  'Weight & Balance':['/guides/aircraft-performance-reference.html','Aircraft performance and W&B reference'],
  'Conversions':['/guides/aviation-conversions.html','Aviation conversion reference']
};

const useText={
  'Flight Planning':'Use the calculator to work a flight-planning problem, verify hand calculations, or build an example for training. Start with current, correctly referenced inputs and keep runway, wind, course, speed, time and fuel units consistent.',
  'Atmosphere & Weather':'Use current pressure, temperature and weather information when the calculation depends on atmospheric conditions. Treat the output as a planning or study value and connect it back to the current weather product and aircraft performance data.',
  'Performance':'Use the result as a math check or training reference. Aircraft performance, limitations and operating decisions still come from the current POH or AFM, applicable charts and the conditions that actually exist.',
  'Maneuvers & Turns':'Use the result to understand the geometry and relationships behind common flight-training maneuvers. The calculated number is not a substitute for aircraft limitations, instructor guidance or the applicable training standard.',
  'Navigation':'Use the calculator for navigation planning and cross-checks, keeping true/magnetic references, coordinates, groundspeed and units consistent. Current charts and navigation data remain the controlling source for a flight.',
  'Weight & Balance':'Use the calculator to perform moment, arm, CG or fuel-weight math. A correct arithmetic result still must be compared with the approved loading data and envelope for the exact aircraft.',
  'Conversions':'Use the converter when aviation information arrives in a different unit system. Confirm both the starting unit and the physical quantity before carrying the converted value into another calculation.'
};

const meaningText={
  'Flight Planning':'The output is most useful when it feeds the next planning step. Wind components affect runway decisions, groundspeed affects time and fuel, and descent or holding math depends on how quickly the airplane moves across the ground.',
  'Atmosphere & Weather':'Atmospheric numbers matter because air density, pressure and temperature affect both weather interpretation and aircraft performance. A calculated atmospheric value should be read together with current conditions rather than by itself.',
  'Performance':'Performance math describes relationships, not guarantees. Weight, configuration, runway condition, wind, temperature, technique and aircraft-specific data can all change the operational answer.',
  'Maneuvers & Turns':'These outputs make the speed-bank-load-factor relationships visible. They are especially useful for oral-exam preparation and for checking whether a mental estimate is in the right range.',
  'Navigation':'Navigation results are only as good as the references behind the inputs. A correct formula can still produce a wrong operational answer if true and magnetic directions are mixed or if stale coordinates and winds are used.',
  'Weight & Balance':'Weight-and-balance arithmetic produces a location or moment; airworthiness depends on where that result sits relative to the approved envelope and any weight limits.',
  'Conversions':'A conversion changes the unit, not the underlying quantity. Converting knots to mph does not turn indicated airspeed into true airspeed, and converting pressure units does not change the observed pressure.'
};

const mistakeText={
  'Flight Planning':'Common errors include mixing true and magnetic directions, using airspeed where groundspeed belongs, entering minutes as decimal hours, or treating a generic reserve as the legal requirement for every operation.',
  'Atmosphere & Weather':'Common errors include mixing field elevation with pressure altitude, using stale weather, confusing Celsius and Fahrenheit, or treating a rule-of-thumb output as an aircraft performance chart.',
  'Performance':'Common errors include using the wrong weight or configuration, confusing indicated and true airspeed, applying a training shortcut outside its assumptions, or treating a calculated estimate as an aircraft limitation.',
  'Maneuvers & Turns':'Common errors include using indicated airspeed where a formula expects true airspeed, assuming bank angle alone describes every maneuver, or ignoring how wind changes groundspeed-dependent relationships.',
  'Navigation':'Common errors include east/west sign mistakes, mixing runway magnetic headings with true wind directions, entering longitude with the wrong sign, or carrying a rounded intermediate value too far.',
  'Weight & Balance':'Common errors include mixing pounds and kilograms, using an arm from the wrong datum, forgetting fuel burn changes weight and moment, or comparing a calculated CG with the wrong envelope.',
  'Conversions':'The biggest error is converting the wrong starting unit. Write the original unit beside the number, perform the conversion, and make a quick reasonableness check before using the result elsewhere.'
};

const faqBySlug={
  crosswind:[
    ['How is crosswind component calculated?','The wind is resolved into components relative to the runway. Crosswind uses the sine of the relative angle; the along-runway headwind or tailwind component uses the cosine.'],
    ['How should I think about gusts?','If you want to examine the gust condition, run a separate scenario using the reported gust speed while keeping the wind direction consistent with the source. Compare the result with the aircraft and operating guidance that applies.'],
    ['Is demonstrated crosswind automatically a hard limitation?','Not always. Use the exact wording in the current POH or AFM and any operator or personal limits that apply to the flight.']
  ],
  'density-altitude':[
    ['Why does density altitude matter?','Higher density altitude means lower air density and can reduce engine, propeller, wing and climb performance. Use the aircraft performance charts for actual takeoff and landing planning.'],
    ['Is density altitude the same as pressure altitude?','No. Pressure altitude corrects for nonstandard pressure. Density altitude expresses the density of the air as an equivalent standard-atmosphere altitude and is strongly affected by temperature.'],
    ['Can this replace a POH performance chart?','No. The calculator explains and estimates the atmospheric quantity; aircraft-specific performance comes from approved aircraft data.']
  ],
  'pressure-altitude':[
    ['What is pressure altitude used for?','Pressure altitude is a standard reference used in aircraft performance calculations, density-altitude work and many POH or AFM charts.'],
    ['Why is 29.92 inHg important?','29.92 inHg is standard sea-level pressure in the U.S. altimeter system and is the reference setting used to define pressure altitude.'],
    ['Is the 1,000-feet-per-inch formula exact?','No. It is a common training approximation. Use the method specified by the aircraft or chart when precision matters.']
  ],
  'wind-triangle':[
    ['What does a wind triangle solve?','It combines course, true airspeed and wind to solve the heading needed to hold course, the resulting groundspeed and the wind-correction angle.'],
    ['Why must direction references be consistent?','A true course should be paired with a true wind reference, while magnetic values should be paired consistently. Mixing references can introduce an error roughly equal to local magnetic variation.'],
    ['What if the entered wind is stronger than the airplane can overcome?','Some combinations have no steady solution for the requested course. PilotDesk warns when the entered crosswind relationship makes the wind-triangle solution impossible.']
  ]
};

function genericFaq(title,category){return [
  [`What does the ${title} calculator do?`,`It uses the entered aviation values to solve the ${title.toLowerCase()} relationship and displays the main outputs immediately for study, planning and cross-checking.`],
  ['What inputs should I use?',`Use values from the current source that applies to the problem. Keep units and reference systems consistent, then verify that each input describes the quantity the ${category.toLowerCase()} formula expects.`],
  ['Can I use the result as the only source for a flight?','No. PilotDesk is a supplemental calculation and training aid. Verify operational decisions with current approved aircraft data, official weather, charts, procedures and applicable regulations.']
]}

for(const [slug,key,title,desc,fields,results] of calcs){
  const category=categoryFor(slug);
  const dir=path.join('calculators',slug);
  const file=path.join(dir,'index.html');
  fs.mkdirSync(dir,{recursive:true});

  const formula=formulas[key]||`${title} uses the entered values to compute the displayed outputs with the standard arithmetic relationship for this aviation problem.`;
  const fieldNames=fields.map(x=>x[1]);
  const resultNames=results;
  const defaults=fields.map(x=>`${x[1]} ${x[2]}${x[3]?' '+x[3]:''}`).join('; ');
  const metaCandidate=desc.length<118?`${desc} Free browser-based aviation calculator for pilots and flight students.`:desc;
  const metaDesc=metaCandidate.length>158?metaCandidate.slice(0,155).replace(/\s+\S*$/,'')+'…':metaCandidate;
  const titleTag=`${title} Calculator for Pilots | PilotDesk`;

  const siblings=(categories[category]||[]).filter(x=>x!==slug);
  const position=Math.max(0,(categories[category]||[]).indexOf(slug));
  const relatedSlugs=[...siblings.slice(position,position+4),...siblings.slice(0,4)].slice(0,4);
  const relatedLinks=relatedSlugs.map(x=>`<a href="/calculators/${x}/">${esc(calcBySlug.get(x)||x)}</a>`).join('');
  const guideLink=guideFor[slug]?`<a href="${guideFor[slug]}">Read the ${esc(title)} guide</a>`:'';
  const [hubUrl,hubLabel]=hubFor[category]||['/guides.html','Aviation guides'];
  const faq=faqBySlug[slug]||genericFaq(title,category);
  const faqHtml=faq.map(([q,a])=>`<details><summary><strong>${esc(q)}</strong></summary><p>${esc(a)}</p></details>`).join('');

  const inputList=fields.map(([,label,,u])=>`<li><strong>${esc(label)}</strong>${u?` — enter the value in ${esc(u)}.`:'.'}</li>`).join('');
  const resultList=results.map(r=>`<li><strong>${esc(r)}</strong> — one of the calculated outputs for this problem.</li>`).join('');

  const educational=`<div class="info-card" data-pd-seo-depth="1">
    <h2>How to use the ${esc(title)} calculator</h2>
    <p>${esc(useText[category])}</p>
    <p>This page is built around <strong>${esc(fieldNames.join(', '))}</strong>. Enter the values, calculate, and then check whether <strong>${esc(resultNames.join(', '))}</strong> are reasonable before carrying them into another planning step.</p>
    <h3>Inputs</h3><ul>${inputList}</ul>
    <h2>Formula and method</h2>
    <p>${esc(formula)}</p>
    <p>The calculator keeps the arithmetic visible so it can be used as more than a black-box answer. If you are studying for an oral exam or reviewing a navlog, work the relationship once by hand and use PilotDesk as the cross-check.</p>
    <h2>Worked example setup</h2>
    <p>The default example uses ${esc(defaults)}. Calculate the example first, then change one input at a time. Watching which result changes—and by how much—is a quick way to understand the relationship instead of memorizing a single answer.</p>
    <h2>What the result means</h2>
    <p>${esc(meaningText[category])}</p>
    <ul>${resultList}</ul>
    <h2>Common mistakes to avoid</h2>
    <p>${esc(mistakeText[category])}</p>
    <p>Do a reasonableness check after every calculation. A mathematically valid result can still be unusable if the wrong source value, unit, reference or aircraft data was entered.</p>
    <h2>Sources and limitations</h2>
    <p>PilotDesk uses standard aviation math and training relationships. General background is cross-checked against FAA pilot-training material, while aircraft-specific performance, limitations and procedures must come from the current approved source for that aircraft. See <a href="/sources.html">PilotDesk sources and methods</a>.</p>
  </div>
  <section class="info-card" data-pd-faq><h2>${esc(title)} questions</h2>${faqHtml}<p class="fine">PilotDesk is a supplemental planning and training aid, not an FAA-approved flight-planning source.</p></section>`;

  const appSchema={'@context':'https://schema.org','@type':'WebApplication',name:`${title} Calculator`,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},url:`https://www.pilot-desk.com/calculators/${slug}/`,description:metaDesc,featureList:[...fieldNames,...resultNames],audience:{'@type':'Audience',audienceType:'Pilots, flight students, and aviation educators'},isPartOf:{'@type':'WebSite',name:'PilotDesk',url:'https://www.pilot-desk.com/'},publisher:{'@type':'Organization',name:'PilotDesk',url:'https://www.pilot-desk.com/',logo:{'@type':'ImageObject',url:'https://www.pilot-desk.com/assets/icon.svg'}}};
  const crumbSchema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Calculators',item:'https://www.pilot-desk.com/'},{'@type':'ListItem',position:2,name:category,item:`https://www.pilot-desk.com/#${encodeURIComponent(category.toLowerCase())}`},{'@type':'ListItem',position:3,name:title,item:`https://www.pilot-desk.com/calculators/${slug}/`} ]};
  const schemas=`<script type="application/ld+json" data-pd-static-calc-schema="1">${JSON.stringify(appSchema)}</script><script type="application/ld+json" data-pd-static-breadcrumbs="1">${JSON.stringify(crumbSchema)}</script>`;

  let html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titleTag)}</title><meta name="description" content="${esc(metaDesc)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#08090b"><meta name="color-scheme" content="dark light"><meta property="og:title" content="${esc(titleTag)}"><meta property="og:description" content="${esc(metaDesc)}"><meta property="og:type" content="website"><meta property="og:url" content="https://www.pilot-desk.com/calculators/${slug}/"><meta property="og:image" content="https://www.pilot-desk.com/assets/pilot-math-reference.svg"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="https://www.pilot-desk.com/calculators/${slug}/"><link rel="stylesheet" href="/assets/styles.css"><link rel="manifest" href="/site.webmanifest"><link rel="icon" href="/assets/icon.svg" type="image/svg+xml"><script defer src="/assets/safety.js"></script><script defer src="/assets/site.js"></script><script defer src="/assets/ad-config.js"></script><script defer src="/assets/ads.js"></script>${schemas}</head><body data-calc="${esc(key)}"><a class="skip-link" href="#main-content">Skip to main content</a><header class="topbar"><a class="brand" href="/"><span class="brandmark">PD</span><span><b>PilotDesk</b><small>FLIGHT TOOLS</small></span></a><nav><a href="/">Calculators</a><a href="/airport.html">Airports</a><a href="/weather.html">Weather</a><a href="/aircraft.html">Hangar</a><a href="/guides.html">Guides</a><a href="/about.html">About</a></nav></header><main class="shell" id="main-content"><div class="breadcrumbs"><a href="/">Calculators</a> / ${esc(category)} / ${esc(title)}</div><div class="safety-strip"><strong>Verify before flight.</strong> Use current approved data for aircraft-specific limits, performance and operating decisions.</div><div class="calculator-layout"><section class="calc-main"><div class="calc-hero"><span class="badge">${esc(category)}</span><h1>${esc(title)} Calculator</h1><p>${esc(desc)}</p><p class="fine">Free browser-based aviation calculator for pilots, flight students and instructors.</p></div><div class="calc-box"><div class="fields">${fields.map(([id,label,value,u])=>`<div class="field"><label for="${esc(id)}">${esc(label)}</label><div class="input-wrap"><input data-calc-input id="${esc(id)}" step="any" type="number" value="${esc(value)}">${unit(u)}</div></div>`).join('')}</div><button class="calc-btn" data-calculate type="button">Calculate</button><div class="results">${results.map((r,i)=>`<div class="result${i===0?' primary':''}"><small>${esc(r)}</small><strong id="out${i}">—</strong></div>`).join('')}</div><div class="notice">For planning and study. Verify operational numbers with current approved sources.</div></div><div class="ad-wrap" style="margin-top:32px;margin-bottom:32px"><div class="ad-label">ADVERTISEMENT</div><div class="ad-slot" data-ad-slot="content"><span>Ad space</span></div></div>${educational}</section><aside class="sidebar"><div class="side-card"><h3>Related pilot tools</h3><div class="related">${relatedLinks}${guideLink}<a href="${hubUrl}">${esc(hubLabel)}</a><a href="/guides/pilot-math-formulas.html">Pilot math formula reference</a><a href="/e6b-flight-computer.html">Online E6B flight computer</a></div></div><div class="ad-wrap"><div class="ad-label">ADVERTISEMENT</div><div class="ad-slot" data-ad-slot="sidebar"><span>Ad space</span></div></div></aside></div></main><footer><div><b>PilotDesk</b><p>Free pilot calculators, aviation weather tools and training references.</p></div><div class="footer-links"><a href="/guides.html">Guides</a><a href="/flight-training.html">Flight training</a><a href="/about.html">About</a><a href="/legal/privacy.html">Privacy</a><a href="/legal/terms.html">Terms</a><a href="/legal/disclaimer.html">Disclaimer</a><a href="/legal/safety.html">Safety</a><a href="/sources.html">Sources</a></div><p class="fine">Planning and training aid only. Check operational numbers against current approved sources.</p></footer></body></html>`;

  fs.writeFileSync(file,html);
}

console.log(`Generated ${calcs.length} calculator pages with deeper educational content, semantic internal links, social metadata and structured data.`);
