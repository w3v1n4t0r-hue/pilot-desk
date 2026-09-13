import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const write = (p,s) => fs.writeFileSync(path.join(root,p),s);
const esc = s => s.replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

function edit(file, fn){
  const before=read(file); const after=fn(before);
  if(after!==before){write(file,after); console.log('updated',file)}
}
function title(html,value){return html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${value}</title>`)}
function meta(html,value){
  const tag=`<meta name="description" content="${esc(value)}">`;
  if(/<meta[^>]+name=["']description["'][^>]*>/i.test(html)) return html.replace(/<meta[^>]+name=["']description["'][^>]*>/i,tag);
  if(/<meta[^>]+content=["'][^"']*["'][^>]+name=["']description["'][^>]*>/i.test(html)) return html.replace(/<meta[^>]+content=["'][^"']*["'][^>]+name=["']description["'][^>]*>/i,tag);
  return html.replace(/<\/title>/i,`</title>${tag}`);
}
function robots(html,value){
  const tag=`<meta name="robots" content="${value}">`;
  if(/<meta[^>]+name=["']robots["'][^>]*>/i.test(html)) return html.replace(/<meta[^>]+name=["']robots["'][^>]*>/i,tag);
  return html.replace(/<\/title>/i,`</title>${tag}`);
}
function canonical(html,url){
  const tag=`<link rel="canonical" href="${url}">`;
  if(/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) return html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i,tag);
  return html.replace(/<\/head>/i,`${tag}</head>`);
}
function icon(html){
  if(/<link[^>]+rel=["'](?:shortcut )?icon["']/i.test(html)) return html;
  return html.replace(/<\/head>/i,'<link rel="icon" href="/assets/icon.svg" type="image/svg+xml"></head>');
}
function altDecorative(html){
  return html.replace(/<img\b(?![^>]*\balt=)([^>]*)>/gi,'<img alt=""$1>');
}
function og(html,{url,type='article'}){
  const ttl=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||'PilotDesk';
  const desc=(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)||[])[1]||'';
  const tags=[
    ['og:title',ttl],['og:description',desc],['og:type',type],['og:url',url],['og:image','https://www.pilot-desk.com/assets/aviation-guide-reference.svg']
  ].map(([p,v])=>`<meta property="${p}" content="${v.replace(/&amp;/g,'&')}">`).join('');
  if(!/property=["']og:title["']/i.test(html)) html=html.replace(/<\/head>/i,`${tags}<meta name="twitter:card" content="summary_large_image"></head>`);
  else if(!/property=["']og:image["']/i.test(html)) html=html.replace(/<\/head>/i,`<meta property="og:image" content="https://www.pilot-desk.com/assets/aviation-guide-reference.svg"><meta name="twitter:card" content="summary_large_image"></head>`);
  return html;
}
function normalizeArticle(html,url,published='2026-09-13'){
  const re=/<script\s+type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi;
  let found=false;
  html=html.replace(re,(whole,attrs,body)=>{
    let data; try{data=JSON.parse(body)}catch{return whole}
    const candidates=data?.['@graph']||[data];
    const article=candidates.find(x=>x&&x['@type']==='Article');
    if(!article)return whole;
    found=true;
    const desc=(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)||[])[1]||article.description||'';
    article.url ||= url; article.mainEntityOfPage ||= url; article.description ||= desc;
    article.image ||= 'https://www.pilot-desk.com/assets/aviation-guide-reference.svg';
    article.datePublished ||= published; article.dateModified='2026-09-13';
    article.author={"@type":"Organization","name":"PilotDesk","url":"https://www.pilot-desk.com/","logo":{"@type":"ImageObject","url":"https://www.pilot-desk.com/assets/icon.svg"}};
    article.publisher={"@type":"Organization","name":"PilotDesk","url":"https://www.pilot-desk.com/","logo":{"@type":"ImageObject","url":"https://www.pilot-desk.com/assets/icon.svg"}};
    return `<script type="application/ld+json"${attrs}>${JSON.stringify(data)}</script>`;
  });
  return {html,found};
}
function breadcrumb(html,url,name,parentName='Aviation Guides',parentUrl='https://www.pilot-desk.com/guides.html'){
  if(/"@type":"BreadcrumbList"/.test(html))return html;
  const json={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"PilotDesk","item":"https://www.pilot-desk.com/"},{"@type":"ListItem","position":2,"name":parentName,"item":parentUrl},{"@type":"ListItem","position":3,"name":name,"item":url}]};
  return html.replace(/<\/head>/i,`<script type="application/ld+json">${JSON.stringify(json)}</script></head>`);
}
function webPageSchema(html,url,name,description){
  if(/"@type":"WebPage"/.test(html))return html;
  const json={"@context":"https://schema.org","@type":"WebPage","name":name,"url":url,"description":description,"publisher":{"@type":"Organization","name":"PilotDesk","url":"https://www.pilot-desk.com/","logo":{"@type":"ImageObject","url":"https://www.pilot-desk.com/assets/icon.svg"}}};
  return html.replace(/<\/head>/i,`<script type="application/ld+json">${JSON.stringify(json)}</script></head>`);
}
function insertUseful(file,heading,body){
  edit(file,html=>{
    if(html.includes('data-pd-audit-polish="1"'))return html;
    const block=`<section data-pd-audit-polish="1"><h2>${heading}</h2>${body}</section>`;
    if(html.includes('<div class="safety-strip">'))return html.replace('<div class="safety-strip">',block+'<div class="safety-strip">');
    return html.replace(/<\/main>/i,block+'</main>');
  });
}

const titles={
  'about.html':'About PilotDesk Aviation Tools | PilotDesk',
  'aircraft.html':'Aircraft Profiles & Weight and Balance | PilotDesk',
  'calculators/maneuvering-speed-weight/index.html':'Maneuvering Speed Calculator by Weight | PilotDesk',
  'embed.html':'Aviation Calculator Widgets for Flight Schools | PilotDesk',
  'guides/aircraft-performance-reference.html':'Aircraft Performance & Weight-Balance Reference | PilotDesk',
  'guides/aircraft-weight-conversions.html':'Aircraft Weight Conversions | PilotDesk',
  'guides/feathering-vs-windmilling-propeller.html':'Feathering vs Windmilling Propellers | PilotDesk',
  'guides/critical-engine-multiengine.html':'Critical Engine in Multi-Engine Airplanes | PilotDesk',
  'guides/multiengine-vmc-factors.html':'VMC Factors & SMACFUM Explained | PilotDesk',
  'guides/identify-verify-feather.html':'Identify, Verify, Feather | PilotDesk',
  'guides/past-critical-engine.html':'PAST & the Critical Engine | PilotDesk',
  'guides/vmc-demonstration-explained.html':'VMC Demonstration Explained | PilotDesk',
  'guides/single-engine-climb-performance.html':'Single-Engine Climb Performance | PilotDesk',
  'training/cfi.html':'CFI Study Hub & Instructor Resources | PilotDesk',
  'legal/privacy.html':'Privacy Policy & Data Practices | PilotDesk',
  'legal/safety.html':'Aviation Tool Safety & Trust | PilotDesk',
  'legal/terms.html':'PilotDesk Terms of Use for Aviation Tools'
};
for(const [file,value] of Object.entries(titles)) edit(file,h=>title(h,value));

const descriptions={
  'editorial-policy.html':'How PilotDesk aviation guides and calculators are reviewed, sourced, updated, and separated from approved operational data for actual flights.',
  'guides/cessna-172-glide-distance.html':'Estimate Cessna 172 glide distance using the exact POH, usable height, wind, turns and a worked geometry example without inventing one universal ratio.',
  'guides/multiengine-vmc-factors.html':'Study the FAA factors that affect VMC, including power, CG, weight, bank, density altitude and critical-engine effects, with SMACFUM kept in context.',
  'guides/vmc-demonstration-explained.html':'Understand the purpose, setup, recognition and recovery logic behind a VMC demonstration, with FAA concepts separated from aircraft-specific procedures.',
  'guides/pilot-seo-priority.html':'Popular PilotDesk aviation calculators and pilot references for glide distance, crosswind, density altitude, fuel, descent, E6B math and multi-engine study.',
  'legal/disclaimer.html':'PilotDesk is a planning and training aid, not approved flight data. See the limits on calculators, weather, charts, procedures and aircraft-specific information.',
  'flights.html':'Review locally saved PilotDesk flight plans stored in this browser, reopen planning work, and keep personal planning data on your own device.',
  'flight-brief.html':'Review a local PilotDesk flight-planning brief assembled from your saved route and planning inputs before verifying all operational data with approved sources.'
};
for(const [file,value] of Object.entries(descriptions)) edit(file,h=>meta(h,value));

edit('about.html',altDecorative); edit('legal/privacy.html',altDecorative); edit('flight-planning-workspace.html',altDecorative); edit('feedback.html',altDecorative); edit('offline.html',altDecorative);

// Keep private/local utility pages out of search, but make their metadata deliberate.
edit('feedback.html',h=>webPageSchema(canonical(robots(title(meta(h,'Send PilotDesk feedback, report a bug, or suggest an aviation calculator or training improvement.'),'PilotDesk Feedback & Bug Reports'),'noindex,follow'),'https://www.pilot-desk.com/feedback.html'),'https://www.pilot-desk.com/feedback.html','PilotDesk Feedback','Send PilotDesk feedback, report a bug, or suggest an aviation calculator or training improvement.'));
edit('offline.html',h=>canonical(meta(h,'PilotDesk offline fallback page for previously cached aviation tools and navigation when your connection is unavailable.'),'https://www.pilot-desk.com/offline.html'));
edit('history.html',h=>canonical(meta(h,'Calculation history saved locally in this browser for your recent PilotDesk aviation calculator work.'),'https://www.pilot-desk.com/history.html'));

// Rename the internal SEO-sounding hub to a human-facing URL before it has search traction.
const oldHub=path.join(root,'guides/pilot-seo-priority.html');
const newHub=path.join(root,'guides/popular-aviation-tools.html');
if(fs.existsSync(oldHub)){
  let h=fs.readFileSync(oldHub,'utf8').replaceAll('https://www.pilot-desk.com/guides/pilot-seo-priority.html','https://www.pilot-desk.com/guides/popular-aviation-tools.html');
  fs.writeFileSync(newHub,h); fs.unlinkSync(oldHub); console.log('renamed priority hub');
}
for(const file of ['sitemap-growth.xml','robots.txt','guides.html','index.html','llms.txt']){
  const p=path.join(root,file); if(!fs.existsSync(p))continue;
  const b=fs.readFileSync(p,'utf8'); const a=b.replaceAll('/guides/pilot-seo-priority.html','/guides/popular-aviation-tools.html').replaceAll('https://www.pilot-desk.com/guides/pilot-seo-priority.html','https://www.pilot-desk.com/guides/popular-aviation-tools.html');
  if(a!==b)fs.writeFileSync(p,a);
}

// Normalize article trust/schema/social metadata on hand-written guide and training pages.
const articleFiles=[
  'guides/accelerate-stop-accelerate-go.html','guides/feathering-vs-windmilling-propeller.html','guides/critical-engine-multiengine.html','guides/multiengine-vmc-factors.html','guides/identify-verify-feather.html','guides/past-critical-engine.html','guides/vmc-demonstration-explained.html','guides/single-engine-climb-performance.html','guides/single-engine-service-ceiling.html','guides/vmc-vs-vyse.html','guides/zero-sideslip-multiengine.html',
  'training/cfi.html','training/commercial-pilot.html','training/instrument-rating.html','training/private-pilot.html','training/multiengine.html'
];
for(const file of articleFiles){
  edit(file,html=>{
    const route='https://www.pilot-desk.com/'+file;
    html=icon(html); html=og(html,{url:route});
    html=normalizeArticle(html,route,file.startsWith('training/')?'2026-09-13':'2026-09-12').html;
    if(file.startsWith('training/')){
      const h1=(html.match(/<h1>(.*?)<\/h1>/i)||[])[1]?.replace(/<[^>]+>/g,'')||'Flight Training';
      html=breadcrumb(html,route,h1,'Flight Training','https://www.pilot-desk.com/flight-training.html');
    }
    return html;
  });
}

// Legal/trust pages benefit from explicit WebPage identity without pretending to be articles.
for(const [file,name,desc] of [
  ['legal/privacy.html','Privacy Policy & Data Practices','How PilotDesk handles local browser data, analytics, advertising and privacy.'],
  ['legal/disclaimer.html','Aviation Disclaimer','Limits and verification requirements for PilotDesk aviation calculators, weather and planning tools.'],
  ['legal/safety.html','Aviation Tool Safety & Trust','Safety boundaries, source verification and operational limitations for PilotDesk.'],
  ['legal/terms.html','PilotDesk Terms of Use','Terms governing use of PilotDesk aviation planning, calculation and training tools.']
]) edit(file,h=>webPageSchema(h,`https://www.pilot-desk.com/${file}`,name,desc));

// Add substantive, non-filler content where the live crawl found genuinely thin search pages.
insertUseful('flight-planning-workspace.html','What belongs in a useful planning workspace','<p>A route is only one piece of a flight plan. A useful workspace keeps the route, airport information, weather, fuel arithmetic, aircraft notes and calculation results close enough that you can spot when one assumption changes another. If the wind changes, for example, groundspeed changes, which can change time en route, fuel required and a descent target.</p><p>PilotDesk keeps this workspace on the planning side of the line: it can organize your work, but it does not turn a saved plan into an operational release or weather briefing. Before flight, verify the route, NOTAMs, weather, performance, fuel, weight and balance, charts and procedures with current approved sources.</p>');
insertUseful('guides/aircraft-performance-reference.html','Treat performance as a chain of inputs','<p>Performance numbers are only as good as the conditions fed into them. Weight, pressure altitude, temperature, wind, runway condition, configuration and obstacle assumptions can all move the answer. That is why a takeoff or climb number copied from a different weight or day is not a shortcut to the chart for the flight you are actually planning.</p><p>Weight and balance is related, but it is not the same calculation. First establish that the airplane is within approved weight and CG limits; then use the applicable performance data for that loading and those conditions. When PilotDesk shows a general formula, use it to understand the relationship. Use the POH/AFM chart, notes and interpolation method for the aircraft-specific result.</p>');
insertUseful('guides/accelerated-stall-load-factor.html','A worked example shows why bank matters','<p>In a coordinated level turn at 45° of bank, load factor is about 1.41 G. The theoretical stall-speed multiplier is the square root of that load factor, about 1.19. If an airplane stalled at 50 knots in the reference condition, the simplified relationship would put the corresponding accelerated-stall speed near 60 knots. That is a teaching example, not a substitute for the airplane’s published speeds or limitations.</p><p>The formula assumes a steady coordinated level turn. A real maneuver can include turbulence, changing pitch, uncoordinated flight, configuration changes and control inputs that the simple equation does not model. The useful lesson is the trend: as load factor rises, stall speed rises too.</p>');
insertUseful('guides/altimeter-pressure-conversions.html','Keep unit conversion separate from altimeter technique','<p>Pressure units can be converted exactly enough for planning: 1 inHg is about 33.8639 hPa, and standard sea-level pressure is 29.92 inHg or 1013.25 hPa. That conversion is useful when a weather source and an altimeter setting use different units.</p><p>It does not change the operating procedure. Set the altimeter using the current setting and procedure that applies, and use the aircraft instruments and current publications for flight. A pressure conversion page is arithmetic; it is not a reason to invent a setting, round aggressively, or ignore a locally reported value.</p>');
insertUseful('guides/aviation-weather-reference.html','Separate observations, forecasts and operating minimums','<p>A METAR tells you what was observed at an airport at a stated time. A TAF is a forecast for a defined airport area and validity period. Those are different jobs, and neither one replaces the rest of a preflight weather picture. Radar, satellite, winds aloft, advisories, NOTAMs and the trend between observations can matter just as much as a single coded report.</p><p>VFR, MVFR, IFR and LIFR labels are useful weather categories, but they are not a replacement for the regulations, approach minimums or a pilot’s own operating limits. Use PilotDesk to decode and organize weather information, then verify current official weather and the requirements that actually apply to the flight.</p>');
insertUseful('guides/feathering-vs-windmilling-propeller.html','Why a windmilling propeller costs so much performance','<p>A windmilling propeller is being driven by the airflow. The rotating blades present substantial drag, and on a light twin that drag can consume a large part of the performance that remains after an engine failure. Feathering turns the blades toward a low-drag angle so the propeller stops or nearly stops rotating, reducing that penalty.</p><p>The aerodynamic idea is general; the procedure is not. Propeller controls, accumulators, unfeathering systems, RPM limits and restart procedures differ by airplane. Use the exact POH/AFM and checklist for the model being flown, and treat any memory aid as study support rather than an emergency checklist.</p>');
insertUseful('guides/climb-gradient.html','Convert the requirement with groundspeed, not airspeed','<p>A climb gradient in feet per nautical mile is tied to distance over the ground. At 90 knots groundspeed, the airplane covers 1.5 NM each minute. A 200 ft/NM requirement therefore corresponds to 300 feet per minute: 200 × 1.5 = 300.</p><p>That is why wind matters. With the same climb performance, a lower groundspeed produces more feet of climb per nautical mile, while a higher groundspeed produces fewer. For an actual departure, use the published procedure, current conditions and aircraft performance data rather than assuming a rule-of-thumb vertical speed guarantees obstacle clearance.</p>');
insertUseful('guides/climb-rate-vs-climb-gradient.html','Same climb rate, different gradient','<p>Imagine an airplane climbing at 500 fpm. At 100 knots groundspeed it travels about 1.67 NM each minute, so the climb gradient is roughly 300 ft/NM. At 120 knots groundspeed the same 500 fpm is spread over 2 NM each minute, or about 250 ft/NM. The vertical speed did not change; the distance covered did.</p><p>This is the practical reason to keep rate and gradient separate. A departure procedure may publish a gradient, while the vertical-speed indicator shows feet per minute. Converting between them requires the groundspeed you expect during the climb.</p>');
insertUseful('guides/navigation-reference.html','Build the navigation picture in the right order','<p>Course, heading and track answer different questions. Course is the path you intend to follow, heading is where the nose points, and track is the path the airplane actually makes over the ground. Wind is what usually creates the difference between heading and course, while groundspeed determines how quickly you move along the track.</p><p>A good navlog keeps those relationships visible instead of treating each number as an isolated worksheet box. Start with current route and chart data, apply the wind correction, compute groundspeed and time, then let those values feed the fuel and descent planning. PilotDesk can handle the arithmetic, but current aeronautical data and operational decisions still come from approved sources.</p>');
insertUseful('guides/standard-rate-turn.html','What “standard rate” actually means','<p>A standard-rate turn is 3° of heading change per second. At that rate, a 180° turn takes about one minute and a 360° turn about two minutes. The bank angle needed to produce that rate increases as true airspeed increases, which is why one memorized bank angle cannot describe every airplane and speed.</p><p>Rules of thumb can help you anticipate the bank, but in instrument flying the turn-rate indication and aircraft attitude are what you fly. Turbulence, speed changes and bank limits can all make the real maneuver differ from a clean classroom estimate.</p>');
insertUseful('guides/top-of-descent.html','The 3-to-1 rule is a starting point, not a clearance','<p>A common mental estimate for a roughly three-degree path is about 3 NM for every 1,000 feet of altitude to lose. Losing 6,000 feet therefore suggests starting around 18 NM before the target, before allowing for level segments, slowing, configuration changes or a different required path.</p><p>Once the descent starts, groundspeed matters too. The familiar groundspeed × 5 shortcut gives a quick approximate vertical speed for a three-degree path. Use those rules to build situational awareness, then follow ATC instructions, published vertical guidance and the actual procedure or aircraft requirements.</p>');
insertUseful('guides/true-airspeed-rule.html','Where the 2% rule stops being useful','<p>The common training shortcut says true airspeed increases roughly 2% per 1,000 feet of altitude above sea level for the same indicated airspeed. It is useful for quick mental checks because it points in the right direction as air density decreases.</p><p>It is still an approximation. Temperature, compressibility at higher speeds, instrument and position error, and the difference between indicated and calibrated airspeed are not captured by one fixed percentage. For a real performance or navigation calculation, use the aircraft data, an E6B or a proper TAS calculation with the applicable inputs.</p>');

console.log('Live audit polish complete.');
