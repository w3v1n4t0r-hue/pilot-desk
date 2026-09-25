import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const toolsAstro=read('src/pages/tools.astro');
const toolsLegacy=read('tools.html');
const home=read('src/pages/index.astro');
const siteData=read('src/data/site.mjs');
const schools=read('for-flight-schools.html');
const generator=read('scripts/generate-calculator-pages.mjs');
const sitemap=read('sitemap.xml');
const core=read('sitemap-core.xml');

check(toolsAstro.includes('Free Aviation Calculators for Pilots | PilotDesk'),'Native tools title is not search-intent focused');
check(toolsAstro.includes('robots="index,follow,max-image-preview:large"'),'Native tools page is not explicitly indexable');
check(toolsAstro.includes("name: 'Free Aviation Calculators for Pilots'")&&toolsAstro.includes("'@type': 'ItemList'"),'Native tools CollectionPage/ItemList schema missing');
for(const href of ['/calculators/crosswind/','/calculators/density-altitude/','/calculators/moment-cg/','/calculators/isa-temperature/','/calculators/rate-of-turn/','/calculators/three-degree-descent/'])
  check(toolsAstro.includes(`href="${href}"`),'Native tools page missing crawlable calculator link: '+href);

check(toolsLegacy.includes('<meta name="robots" content="index,follow,max-image-preview:large">'),'Legacy tools fallback is not indexable');
check(toolsLegacy.includes('<link rel="canonical" href="https://www.pilot-desk.com/tools.html">'),'Legacy tools canonical missing');
check(sitemap.includes('<loc>https://www.pilot-desk.com/tools.html</loc>'),'Canonical sitemap missing tools directory');
check(core.includes('<loc>https://www.pilot-desk.com/tools.html</loc>'),'Core sitemap missing tools directory');

check(home.includes('Free aviation calculators →'),'Homepage calculator anchor is not search descriptive');
check(siteData.includes("'Free aviation calculators'"),'Canonical site navigation/search data lost calculator anchor wording');

check(schools.includes('<title>PilotDesk for Flight Schools & CFIs | Free Student Resources</title>'),'Flight-school marketing title missing');
check(schools.includes('Free aviation tools for flight schools, CFIs, and students.'),'Flight-school marketing H1 missing');
check(schools.includes('INSTRUCTOR RESOURCE PACK'),'Instructor resource pack missing');
for(const href of ['/tools.html','/e6b-flight-computer.html','/written-prep.html','/flight-training.html','/embed.html'])
  check(schools.includes(`href="${href}"`),'Flight-school resource pack missing '+href);
check(schools.includes('There is no backlink requirement')||schools.includes('do not require a reciprocal link'),'Flight-school marketing should stay free of reciprocal-link schemes');

for(const needle of [
 "'isa-temperature':'ISA Temperature Calculator | Standard Atmosphere | PilotDesk'",
 "'moment-cg':'Aircraft CG Calculator | Weight × Arm, Moment & CG | PilotDesk'",
 "'rate-of-turn':'Rate 1 Turn Calculator | Turn Rate & Radius | PilotDesk'",
 "'three-degree-descent':'3 Degree Descent Rate Calculator | FPM from Groundspeed | PilotDesk'"
]) check(generator.includes(needle),'High-opportunity calculator title is not durable in generator: '+needle);

for(const [slug,title] of [
 ['isa-temperature','ISA Temperature Calculator | Standard Atmosphere | PilotDesk'],
 ['moment-cg','Aircraft CG Calculator | Weight × Arm, Moment &amp; CG | PilotDesk'],
 ['rate-of-turn','Rate 1 Turn Calculator | Turn Rate &amp; Radius | PilotDesk'],
 ['three-degree-descent','3 Degree Descent Rate Calculator | FPM from Groundspeed | PilotDesk']
]){
 const h=read('calculators/'+slug+'/index.html');
 check(h.includes('<title>'+title+'</title>'),slug+': generated SEO title out of sync');
 const marker='https://www.pilot-desk.com/calculators/'+slug+'/</loc><lastmod>';
 const start=sitemap.indexOf(marker);
 const lastmod=start<0?'':sitemap.slice(start+marker.length,start+marker.length+10);
 check(/^\d{4}-\d{2}-\d{2}$/.test(lastmod),slug+': sitemap entry missing or lastmod is invalid');
}

if(failures.length){
 console.error('SEO + marketing growth smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('SEO + marketing growth smoke passed: indexed calculator hub, Search Console CTR targets, internal authority, and flight-school referral surface verified.');

