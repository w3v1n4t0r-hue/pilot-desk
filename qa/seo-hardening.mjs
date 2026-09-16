import fs from 'node:fs';
import path from 'node:path';
let errors=[];
const fail=x=>errors.push(x);
const calcDirs=fs.readdirSync('calculators',{withFileTypes:true}).filter(x=>x.isDirectory());
const handTunedLinks={
  'crosswind':'/guides/crosswind-component.html',
  'density-altitude':'/guides/density-altitude.html',
  'pivotal-altitude':'/guides/pivotal-altitude.html',
  'three-degree-descent':'/guides/three-degree-descent.html'
};
for(const d of calcDirs){ const file=`calculators/${d.name}/index.html`; if(!fs.existsSync(file)) continue; const h=fs.readFileSync(file,'utf8'); if(!h.includes('data-pd-static-calc-schema')) fail(`${file}: missing static app schema`); if(!h.includes('"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}')) fail(`${file}: free app Offer schema missing`); if(!h.includes('data-pd-static-breadcrumbs')) fail(`${file}: breadcrumb schema missing`); const tunedLink=handTunedLinks[d.name]; if(tunedLink){ if(!h.includes(`href="${tunedLink}"`)||!h.includes('class="related"')) fail(`${file}: bespoke semantic internal link block missing`); } else if(!h.includes('Pilot math formula reference')) fail(`${file}: semantic internal link block missing`); }
const approvedArticleImage=/"image":"https:\/\/www\.pilot-desk\.com\/assets\/(?:aviation-guide-reference|pilot-math-reference|social-crosswind|social-density-altitude)\.svg"/;
for(const ent of fs.readdirSync('guides',{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.html'))){ const file=`guides/${ent.name}`,h=fs.readFileSync(file,'utf8'); if(!h.includes('data-pd-guide-schema')) fail(`${file}: Article schema missing`); if(!h.includes('data-pd-guide-breadcrumbs')) fail(`${file}: breadcrumb schema missing`); if(!approvedArticleImage.test(h)) fail(`${file}: representative Article image missing`); if(/"@type":"Article"/.test(h)&&!/"datePublished":"\d{4}-\d{2}-\d{2}"/.test(h)) fail(`${file}: Article datePublished missing`); if(!h.includes('property="og:image"')) fail(`${file}: social image missing`); }
for(const file of ['guides/pilot-math-formulas.html','guides/aviation-math-glossary.html']){ const h=fs.readFileSync(file,'utf8'); const words=h.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length; if(words<700) fail(`${file}: pillar content too short (${words} words)`); }
const e6bFile='e6b-flight-computer.html';
if(!fs.existsSync(e6bFile)) fail(`${e6bFile}: missing E6B search hub`); else { const h=fs.readFileSync(e6bFile,'utf8'); const words=h.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length; if(words<900) fail(`${e6bFile}: E6B content too short (${words} words)`); if(!/<title>[^<]*E6B Flight Computer[^<]*<\/title>/i.test(h)) fail(`${e6bFile}: E6B title missing`); if(!h.includes('rel="canonical" href="https://www.pilot-desk.com/e6b-flight-computer.html"')) fail(`${e6bFile}: self-canonical missing`); if(!h.includes('name="robots" content="index,follow"')) fail(`${e6bFile}: index/follow missing`); for(const href of ['/calculators/wind-triangle/','/calculators/time-speed-distance/','/calculators/fuel-required/','/calculators/density-altitude/','/calculators/true-airspeed/']) if(!h.includes(`href="${href}"`)) fail(`${e6bFile}: missing key E6B link ${href}`); if(!h.includes('"@type":"ItemList"')) fail(`${e6bFile}: ItemList schema missing`); if(!/Planning and training aid only/i.test(h)) fail(`${e6bFile}: safety language missing`); }
for(const file of ['guides.html','flight-training.html']){ const h=fs.readFileSync(file,'utf8'); if(!h.includes('href="/e6b-flight-computer.html"')) fail(`${file}: missing internal link to E6B hub`); }

const rootSitemap=fs.readFileSync('sitemap.xml','utf8');
const childFiles=[...rootSitemap.matchAll(/<loc>https:\/\/www\.pilot-desk\.com\/([^<]+\.xml)<\/loc>/g)].map(x=>x[1]).filter(f=>fs.existsSync(f));
const sitemapBodies=childFiles.length?childFiles.map(f=>fs.readFileSync(f,'utf8')):[rootSitemap];
const sitemap=sitemapBodies.join('\n');
const locs=[...sitemap.matchAll(/<loc>(https:\/\/www\.pilot-desk\.com\/(?![^<]*\.xml<)[^<]*)<\/loc>/g)].map(x=>x[1].replaceAll('&amp;','&'));
if(rootSitemap.includes('<sitemapindex')&&!childFiles.length)fail('sitemap index has no readable local child sitemaps');

const productionFileFor=url=>{
  const pathname=new URL(url).pathname;
  const rel=pathname==='/'?'index.html':pathname.endsWith('/')?`${pathname.slice(1)}index.html`:pathname.slice(1);
  const built=path.join('dist',rel);
  if(fs.existsSync(built))return built;
  return fs.existsSync(rel)?rel:null;
};
for(const u of locs){
  const file=productionFileFor(u);
  if(!file){fail(`sitemap URL missing production HTML: ${u}`);continue}
  const h=fs.readFileSync(file,'utf8');
  const canonical=(h.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||h.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)||[])[1];
  const normalized=canonical?.replace('https://pilot-desk.com','https://www.pilot-desk.com');
  if(normalized!==u)fail(`sitemap URL is not self-canonical in ${file}: ${u}`);
  const robots=(h.match(/<meta[^>]+name=["']robots["'][^>]*>/i)||[''])[0];
  if(/noindex/i.test(robots))fail(`sitemap contains noindex production page: ${u}`);
}
if(!sitemap.includes('<loc>https://www.pilot-desk.com/e6b-flight-computer.html</loc>')) fail('E6B hub missing from sitemap');
if(sitemap.includes('weight-balance.html</loc>')) fail('canonicalized weight-balance.html must not be in sitemap');
if(fs.readFileSync('assets/seo.js','utf8').includes('SearchAction')) fail('fake homepage SearchAction should not be emitted');
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`SEO hardening PASS: ${calcDirs.length} calculator dirs, ${locs.length} sitemap URLs across ${sitemapBodies.length} sitemap file(s), production self-canonicals/indexability, guide schemas/images, pillar content, E6B hub, and app offers checked.`);
