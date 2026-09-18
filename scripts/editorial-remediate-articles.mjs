import fs from 'node:fs';
import path from 'node:path';

const roots=['guides','training'];
const SITE='https://www.pilot-desk.com';
const deepReviewed=new Set([
  'guides/accelerated-stall-load-factor.html',
  'guides/density-altitude.html',
  'guides/feathering-vs-windmilling-propeller.html',
  'guides/pilot-math-formulas.html',
  'guides/vmc-vs-vyse.html',
  'guides/weight-balance-envelope.html'
]);

const families=[
  {
    id:'multiengine',
    test:/multiengine|critical-engine|vmc|vyse|single-engine|feather|identify-verify|zero-sideslip|accelerate-stop|past-critical/i,
    title:'Technical basis — multiengine aerodynamics and performance',
    body:'Primary technical context: the current FAA Airplane Flying Handbook multiengine chapter and the applicable aircraft POH/AFM. Control-speed concepts, asymmetric thrust, propeller state, and single-engine performance are aircraft- and condition-dependent; published procedures and performance data remain controlling.',
    link:'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook',
    label:'FAA Airplane Flying Handbook'
  },
  {
    id:'weather',
    test:/metar|taf|weather|dew-point|cloud|flight-categories|isa|pressure-altitude|density-altitude|altimeter-pressure/i,
    title:'Technical basis — atmosphere and aviation weather',
    body:'Primary technical context: current FAA aviation-weather publications, the AIM, and official weather products. Observation time, forecast validity, pressure/temperature reference, and the distinction between measured data and training approximations must remain explicit.',
    link:'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation',
    label:'FAA Aviation Handbooks & Manuals'
  },
  {
    id:'weight-balance',
    test:/weight-and-balance|weight-balance|moment-center|percent-mac|ballast|cg-shift|useful-load|fuel-weight|aircraft-weight/i,
    title:'Technical basis — mass properties and loading',
    body:'Primary technical context: the FAA Weight & Balance Handbook and the current records and approved loading data for the specific aircraft. Generic moment and CG equations perform arithmetic; they do not supply an aircraft\'s empty-weight data, station arms, envelope, or operating limits.',
    link:'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation',
    label:'FAA Aviation Handbooks & Manuals'
  },
  {
    id:'aerodynamics-performance',
    test:/stall|load-factor|glide|climb|descent|turn|pivotal|maneuvering|wing-loading|power-loading|mach|airspeed|service-ceiling|performance|hydroplan|vx-vy|poh-performance/i,
    title:'Technical basis — aerodynamics and aircraft performance',
    body:'Primary technical context: the current FAA Pilot\'s Handbook of Aeronautical Knowledge and Airplane Flying Handbook. Equations on this page are valid only within their stated assumptions; aircraft-specific speeds, limitations, charts, and performance must come from the current POH/AFM or other approved data.',
    link:'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak',
    label:'FAA Pilot\'s Handbook of Aeronautical Knowledge'
  },
  {
    id:'navigation',
    test:/wind|course|heading|track|navlog|dme|great-circle|coordinate|reciprocal|holding|runway|nautical|time-speed-distance|airport-identifiers|flight-planning|top-of-descent/i,
    title:'Technical basis — navigation and flight planning',
    body:'Primary technical context: the FAA Pilot\'s Handbook of Aeronautical Knowledge, AIM, and current charting/aeronautical data. Direction references, wind reference, groundspeed versus airspeed, coordinate sign, units, and data currency must be kept consistent throughout the calculation.',
    link:'https://www.faa.gov/air_traffic/publications/',
    label:'FAA Aeronautical Information Publications'
  },
  {
    id:'procedures',
    test:/procedure|ifr|approach|holding|flow|checklist/i,
    title:'Technical basis — procedures and operating practice',
    body:'Primary technical context: the current AIM, FAA procedure publications, applicable ACS guidance, and the approved aircraft/operator procedure. A training explanation does not supersede a current chart, checklist, ATC instruction, regulation, or operator procedure.',
    link:'https://www.faa.gov/air_traffic/publications/',
    label:'FAA Aeronautical Information Publications'
  },
  {
    id:'conversions',
    test:/conversion|conversions|distance|temperature|volume|speed|vertical-speed|dms/i,
    title:'Technical basis — quantities and units',
    body:'Conversions preserve the physical quantity while changing its unit representation. Exact unit definitions should be kept separate from operational approximations, and intermediate rounding should be avoided when the result feeds another calculation.',
    link:'https://www.nist.gov/pml/owm/si-units',
    label:'NIST SI Units'
  },
  {
    id:'training',
    test:/checkride|training|private-pilot|instrument-rating|commercial-pilot|cfi|atp|certificate|e6b|math|formula|glossary/i,
    title:'Technical basis — flight training reference',
    body:'Primary technical context: the applicable FAA Airman Certification Standards, FAA handbooks, regulations, and current aircraft documents. Study material should explain the underlying relationship and source, not replace the controlling publication or aircraft-specific procedure.',
    link:'https://www.faa.gov/training_testing/testing/acs',
    label:'FAA Airman Certification Standards'
  }
];

const defaultFamily={
  id:'general',
  title:'Technical basis and limitations',
  body:'This page is a training reference. Technical claims should be checked against current FAA publications or other controlling primary material, and aircraft-specific values, limitations, and procedures must come from the current approved source for the aircraft and operation.',
  link:'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation',
  label:'FAA Aviation Handbooks & Manuals'
};

const genericPatterns=[
  /<section\s+class=["']info-card["']\s+data-pd-guide-depth=["']1["']>[\s\S]*?<\/section>/gi,
  /<section\s+data-pd-guide-depth=["']1["']\s+class=["']info-card["']>[\s\S]*?<\/section>/gi,
  /<section\s+class=["']info-card["']\s+data-pd-core-depth=["']1["']>[\s\S]*?<\/section>/gi
];

let pages=0,changed=0,basisAdded=0,boilerplateRemoved=0;
const familyCounts={};

function stripGenerated(html){
  for(const re of genericPatterns){
    html=html.replace(re,()=>{boilerplateRemoved++;return '';});
  }
  html=html
    .replace(/<h2>How How\s+/gi,'<h2>How ')
    .replace(/<h2>Why it matters<\/h2>/gi,'<h2>Operational significance</h2>')
    .replace(/<h2>How it works<\/h2>/gi,'<h2>Underlying relationship</h2>');
  return html;
}

function familyFor(rel){
  return families.find(f=>f.test.test(rel))||defaultFamily;
}

for(const root of roots){
  if(!fs.existsSync(root))continue;
  for(const ent of fs.readdirSync(root,{withFileTypes:true})){
    if(!ent.isFile()||!ent.name.endsWith('.html'))continue;
    const file=path.join(root,ent.name);
    const rel=file.replaceAll('\\','/');
    let html=fs.readFileSync(file,'utf8');
    const before=html;
    pages++;

    html=stripGenerated(html);
    const family=familyFor(rel);
    familyCounts[family.id]=(familyCounts[family.id]||0)+1;

    // Machine-readable editorial coverage without adding a visible template banner.
    if(/<main\b/i.test(html)&&!html.includes('data-pd-editorial-standard=')){
      html=html.replace(/<main\b([^>]*)>/i,`<main$1 data-pd-editorial-standard="technical-2026" data-pd-editorial-family="${family.id}">`);
    }

    // Deep-reviewed articles already contain bespoke technical-basis material.
    if(!deepReviewed.has(rel)&&!html.includes('class="info-card pd-editorial-basis"')){
      const block=`<section class="info-card pd-editorial-basis"><h2>${family.title}</h2><p>${family.body}</p><p class="fine"><a href="${family.link}" target="_blank" rel="noopener">${family.label}</a> · <a href="/sources.html">PilotDesk Sources &amp; Methods</a></p></section>`;
      const safety=html.search(/<div\s+class=["']safety-strip["']/i);
      if(safety>=0) html=html.slice(0,safety)+block+html.slice(safety);
      else html=html.replace(/<\/main>/i,`${block}</main>`);
      basisAdded++;
    }

    if(html!==before){
      fs.writeFileSync(file,html);
      changed++;
    }
  }
}

console.log(`Editorial remediation covered ${pages} article pages; changed ${changed}, added ${basisAdded} technical-basis sections, removed ${boilerplateRemoved} generated filler blocks.`);
console.log('Families:',familyCounts);
