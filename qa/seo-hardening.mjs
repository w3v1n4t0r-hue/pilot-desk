import fs from 'node:fs';
import path from 'node:path';
let errors=[];
const fail=x=>errors.push(x);
const calcDirs=fs.readdirSync('calculators',{withFileTypes:true}).filter(x=>x.isDirectory());
for(const d of calcDirs){ const file=`calculators/${d.name}/index.html`; if(!fs.existsSync(file)) continue; const h=fs.readFileSync(file,'utf8'); if(!h.includes('data-pd-static-calc-schema')) fail(`${file}: missing static app schema`); if(!h.includes('"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}')) fail(`${file}: free app Offer schema missing`); if(!h.includes('data-pd-static-breadcrumbs')) fail(`${file}: breadcrumb schema missing`); if(!h.includes('Pilot math formula reference')) fail(`${file}: semantic internal link block missing`); }
for(const ent of fs.readdirSync('guides',{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.html'))){ const file=`guides/${ent.name}`,h=fs.readFileSync(file,'utf8'); if(!h.includes('data-pd-guide-schema')) fail(`${file}: Article schema missing`); if(!h.includes('data-pd-guide-breadcrumbs')) fail(`${file}: breadcrumb schema missing`); if(!/"image":"https:\/\/www\.pilot-desk\.com\/assets\/(?:aviation-guide-reference|pilot-math-reference)\.svg"/.test(h)) fail(`${file}: representative Article image missing`); if(!h.includes('property="og:image"')) fail(`${file}: social image missing`); }
for(const file of ['guides/pilot-math-formulas.html','guides/aviation-math-glossary.html']){ const h=fs.readFileSync(file,'utf8'); const words=h.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length; if(words<700) fail(`${file}: pillar content too short (${words} words)`); }
const e6bFile='e6b-flight-computer.html';
if(!fs.existsSync(e6bFile)) fail(`${e6bFile}: missing E6B search hub`); else { const h=fs.readFileSync(e6bFile,'utf8'); const words=h.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length; if(words<900) fail(`${e6bFile}: E6B content too short (${words} words)`); if(!/<title>[^<]*E6B Flight Computer[^<]*<\/title>/i.test(h)) fail(`${e6bFile}: E6B title missing`); if(!h.includes('rel="canonical" href="https://www.pilot-desk.com/e6b-flight-computer.html"')) fail(`${e6bFile}: self-canonical missing`); if(!h.includes('name="robots" content="index,follow"')) fail(`${e6bFile}: index/follow missing`); for(const href of ['/calculators/wind-triangle/','/calculators/time-speed-distance/','/calculators/fuel-required/','/calculators/density-altitude/','/calculators/true-airspeed/']) if(!h.includes(`href="${href}"`)) fail(`${e6bFile}: missing key E6B link ${href}`); if(!h.includes('"@type":"ItemList"')) fail(`${e6bFile}: ItemList schema missing`); if(!/Planning and training aid only/i.test(h)) fail(`${e6bFile}: safety language missing`); }
for(const file of ['guides.html','flight-training.html']){ const h=fs.readFileSync(file,'utf8'); if(!h.includes('href="/e6b-flight-computer.html"')) fail(`${file}: missing internal link to E6B hub`); }
const map=new Map();
function walk(dir='.') { for(const ent of fs.readdirSync(dir,{withFileTypes:true})) { if(['.git','node_modules','.github','api','assets','qa','scripts'].includes(ent.name)) continue; const p=path.join(dir,ent.name); if(ent.isDirectory()) walk(p); else if(ent.isFile()&&ent.name.endsWith('.html')&&ent.name!=='404.html'){ const f=p.replaceAll('\\','/').replace(/^\.\//,''),h=fs.readFileSync(p,'utf8'); const m=h.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||h.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i); if(m) map.set(m[1].replace('https://pilot-desk.com','https://www.pilot-desk.com'),{f,h}); }} }
walk();
const rootSitemap=fs.readFileSync('sitemap.xml','utf8');
const childFiles=[...rootSitemap.matchAll(/<loc>https:\/\/www\.pilot-desk\.com\/([^<]+\.xml)<\/loc>/g)].map(x=>x[1]).filter(f=>fs.existsSync(f));
const sitemapBodies=childFiles.length?childFiles.map(f=>fs.readFileSync(f,'utf8')):[rootSitemap];
const sitemap=sitemapBodies.join('\n');
const locs=[...sitemap.matchAll(/<loc>(https:\/\/www\.pilot-desk\.com\/(?![^<]*\.xml<)[^<]*)<\/loc>/g)].map(x=>x[1].replaceAll('&amp;','&'));
if(rootSitemap.includes('<sitemapindex')&&!childFiles.length)fail('sitemap index has no readable local child sitemaps');
for(const u of locs){ const entry=map.get(u); if(!entry) fail(`sitemap URL missing self-canonical HTML: ${u}`); else if(/noindex/i.test((entry.h.match(/<meta[^>]+name=["']robots["'][^>]*>/i)||[''])[0])) fail(`sitemap contains noindex page: ${u}`); }
if(!sitemap.includes('<loc>https://www.pilot-desk.com/e6b-flight-computer.html</loc>')) fail('E6B hub missing from sitemap');
if(sitemap.includes('weight-balance.html</loc>')) fail('canonicalized weight-balance.html must not be in sitemap');
if(fs.readFileSync('assets/seo.js','utf8').includes('SearchAction')) fail('fake homepage SearchAction should not be emitted');
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`SEO hardening PASS: ${calcDirs.length} calculator dirs, ${locs.length} sitemap URLs across ${sitemapBodies.length} sitemap file(s), guide schemas/images, pillar content, E6B hub, and app offers checked.`);
