import fs from 'node:fs';
import path from 'node:path';

const read=p=>fs.readFileSync(p,'utf8');
const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const sourceLogo=read('assets/icon.svg').trim();
const favicon=read('favicon.svg').trim();
const layout=read('src/layouts/BaseLayout.astro');
const header=read('src/components/Header.astro');
const shared=read('scripts/shared-shell.mjs');
const brand=read('assets/brand.js');
const home=read('src/pages/index.astro');
const manifest=read('site.webmanifest');
const sw=read('sw.js');
const calculatorGenerator=read('scripts/generate-calculator-pages.mjs');
const vercel=JSON.parse(read('vercel.json'));

check(sourceLogo===favicon,'favicon.svg must be an exact copy of the existing user-created PilotDesk aircraft/math logo');
for(const [name,text] of [['BaseLayout',layout],['Header',header],['shared shell',shared],['brand runtime',brand],['homepage schema',home],['manifest',manifest],['service worker',sw],['calculator generator',calculatorGenerator]]){
  check(text.includes('/favicon.svg'),name+' does not use the canonical PilotDesk logo');
}
check(!layout.includes('/assets/icon.svg'),'BaseLayout still references the old logo URL');
check(!header.includes('/assets/icon.svg'),'Header still references the old logo URL');
check(!brand.includes('/assets/icon.svg'),'Brand runtime still references the old logo URL');
check(!manifest.includes('/assets/icon.svg'),'Manifest still references the old logo URL');
check(!home.includes('www.pilot-desk.com/assets/icon.svg'),'Organization schema still references the old logo URL');
check(!calculatorGenerator.includes('/assets/icon.svg'),'Calculator generator still emits the old logo URL');
check(calculatorGenerator.includes('https://www.pilot-desk.com/favicon.svg'),'Calculator schema must use the canonical user-created logo');
check(Number(sw.match(/CACHE='pilotdesk-v(\\d+)'/)?.[1]||0)>=57,'service worker cache fell below the canonical logo rollout floor');
check(!sw.includes("'/assets/icon.svg'"),'service worker still caches the old favicon URL');

const ico=vercel.redirects?.find(x=>x.source==='/favicon.ico');
check(ico?.destination==='/favicon.svg'&&ico?.permanent===true,'/favicon.ico must permanently redirect to /favicon.svg');
const favHeader=vercel.headers?.find(x=>x.source==='/favicon.svg');
check(Boolean(favHeader),'favicon.svg should have an explicit Vercel response rule');

const html=[];
function walk(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))html.push(p)}}
walk('dist');
check(html.length>0,'No built HTML pages found for logo audit');
for(const file of html){
  const text=read(file);
  if(text.includes('/assets/icon.svg'))failures.push(file+': old /assets/icon.svg reference remains in built output');
  const brandMatch=text.match(/<span class="brandmark"[^>]*>[\s\S]*?<\/span>/i)?.[0]||'';
  if(brandMatch)check(brandMatch.includes('src="/favicon.svg"'),file+': header brand is not the canonical PilotDesk logo');
  const icons=[...text.matchAll(/<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi)].map(x=>x[0]);
  for(const tag of icons)check(tag.includes('href="/favicon.svg"'),file+': noncanonical favicon tag found: '+tag);
}

if(failures.length){console.error('PilotDesk logo audit failed ('+failures.length+')');failures.slice(0,100).forEach(x=>console.error(' - '+x));process.exit(1)}
console.log('PilotDesk logo audit passed: the user-created aircraft/math mark is the sole favicon/header/app/schema logo across built pages, manifest, service worker, and favicon fallback.');
