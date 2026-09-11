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

console.log(`Strengthened ${files.length} aviation guide pages with consistent schema, social metadata, contextual depth, crawl paths and footer links.`);
