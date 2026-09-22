import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const files=[];
function walk(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules','.astro-public','dist'].includes(e.name))continue;
  const p=path.join(dir,e.name);
  if(e.isDirectory())walk(p);
  else if(e.isFile()&&e.name.endsWith('.html'))files.push(p);
 }
}
walk('dist');

let indexable=0,oldBrand=0;
for(const file of files){
 const html=fs.readFileSync(file,'utf8');
 const lower=html.toLowerCase();
 const robots=(html.match(/<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i)||[])[1]||'';
 const indexablePage=/^\s*index\s*,\s*follow\s*$/i.test(robots);
 if(indexablePage)indexable++;

 check(/<meta\s+name=["']viewport["']/i.test(html),file+': missing responsive viewport');
 check((html.match(/<h1\b/gi)||[]).length<=1,file+': multiple H1 elements');
 check((html.match(/<header\b[^>]*class=["'][^"']*topbar/gi)||[]).length<=1,file+': duplicate topbar');
 check((html.match(/<footer\b/gi)||[]).length<=1,file+': duplicate footer');
 check(!/brandmark[^>]*>\s*(?:PD|✈)\s*</i.test(html),file+': retired text/emoji brandmark returned');
 check(!/viewBox=["']0 0 64 40["']/i.test(html),file+': retired inline airplane logo returned');
 check(!/data-pd-wireframe=["']1["']/i.test(html),file+': retired wireframe brand marker returned');
 check(!/pilotdeak/i.test(html),file+': PilotDesk typo returned');
 check(!/\bTODO\b|\bFIXME\b/.test(html),file+': unfinished TODO/FIXME text in public HTML');
 if(indexablePage){
  check(/rel=["']canonical["']/i.test(html),file+': indexable page missing canonical');
  check(/<title>[^<]{8,}<\/title>/i.test(html),file+': indexable page missing useful title');
  check(/meta\s+name=["']description["'][^>]*content=["'][^"']{40,}["']/i.test(html),file+': indexable page missing useful meta description');
 }
 if(/class=["'][^"']*brand[^"']*["']/i.test(html)){
  const official=/\/favicon\.svg/i.test(html);
  const astro=/data-pd-astro-native=["']1["']/i.test(html);
  check(official||astro,file+': branded legacy page does not reference official PilotDesk icon');
 }
}

// Shared runtime invariants after all product passes.
const bootstrap=fs.readFileSync('assets/app-bootstrap.js','utf8');
const nav=fs.readFileSync('assets/global-nav.js','utf8');
const styles=fs.readFileSync('assets/styles.css','utf8');
const tokens=fs.readFileSync('assets/design-tokens.css','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const workflow=fs.readFileSync('.github/workflows/qa.yml','utf8');

check(bootstrap.includes('/assets/navigation-core.js')&&!bootstrap.includes('/assets/navigation-data.js'),'bootstrap regressed to heavy navigation payload');
check(nav.includes('/assets/navigation-search.js')&&nav.includes('requestIdleCallback'),'navigation search/account hydration no longer lazy');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'design tokens must remain final shared CSS authority');
check(tokens.includes('body:before{animation:none}'),'decorative persistent motion guard missing');
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=42,'service-worker version regressed from professional shell release');
check(!bootstrap.includes('/assets/brand.js'),'runtime brand normalizer must stay retired from bootstrap');
check(workflow.includes('node qa/page-surface-smoke.mjs'),'all-page surface audit missing from QA');
check(workflow.includes('node qa/performance-budget.mjs'),'performance budget missing from QA');
check(workflow.includes('node qa/site-integrity.mjs'),'site-integrity audit missing from QA');

if(failures.length){
 console.error('Final product audit failed with '+failures.length+' issue(s):');
 failures.slice(0,160).forEach(x=>console.error(' - '+x));
 if(failures.length>160)console.error(' ... '+(failures.length-160)+' more');
 process.exit(1);
}
console.log('Final product audit passed: '+files.length+' built HTML pages reviewed ('+indexable+' indexable), with responsive metadata, branding, heading/footer duplication, SEO basics, critical runtime, CSS authority, service-worker, and QA coverage verified.');
