import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const sw=read('sw.js');
const bootstrap=read('assets/app-bootstrap.js');
const manifestPath='dist/assets/offline-precache.js';
check(fs.existsSync(manifestPath),'build must emit dist/assets/offline-precache.js');

const expectedRoutes=[];
function collect(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) collect(p);
    else if(entry.name==='index.html'){
      const rel=path.relative(process.cwd(),p).split(path.sep).join('/');
      expectedRoutes.push('/'+rel.replace(/index\.html$/,''));
    }
  }
}
collect(path.join(process.cwd(),'calculators'));
expectedRoutes.sort();

let generatedRoutes=[];
let generatedAssets=[];
if(fs.existsSync(manifestPath)){
  const sandbox={self:{}};
  vm.runInNewContext(read(manifestPath),sandbox,{filename:manifestPath});
  generatedRoutes=[...(sandbox.self.PILOTDESK_OFFLINE_CALCULATORS||[])].sort();
  generatedAssets=[...(sandbox.self.PILOTDESK_OFFLINE_ASSETS||[])].sort();
}

check(generatedRoutes.length===expectedRoutes.length,`offline manifest has ${generatedRoutes.length} calculator routes; expected ${expectedRoutes.length}`);
for(const route of expectedRoutes) check(generatedRoutes.includes(route),`offline manifest missing ${route}`);
for(const route of generatedRoutes) check(fs.existsSync(path.join('dist',route.slice(1),'index.html')),`built offline calculator route missing from dist: ${route}`);

for(const asset of ['/assets/styles.css','/assets/hub.css','/assets/site.js','/assets/safety.js','/assets/app-bootstrap.js']){
  check(generatedAssets.includes(asset),`generated calculator asset manifest missing ${asset}`);
}

for(const asset of ['/assets/styles-legacy.css','/assets/hub.css','/assets/experience.css','/assets/design-tokens.css','/assets/site.js','/assets/safety.js','/assets/app-bootstrap.js','/assets/navigation-data.js','/assets/flight-store.js','/assets/global-nav.js','/assets/theme.js','/assets/features.js','/assets/calculator-ux.js','/assets/experience.js','/assets/update.js']){
  check(sw.includes(`'${asset}'`),`service worker CORE missing ${asset}`);
}

check(sw.includes("importScripts('/assets/offline-precache.js')"),'service worker must import the generated calculator manifest');
check(sw.includes('...GENERATED_CALCULATORS'),'service worker must precache every generated calculator route');
check(sw.includes('migrateCalculatorEntries'),'service worker must preserve cached calculator pages during cache-version activation');
check(sw.includes("pathname.startsWith('/api/')")&&sw.includes("pathname.startsWith('/_vercel/')"),'same-origin live API paths must bypass the service-worker cache');
check(bootstrap.includes("serviceWorker.register('/sw.js')")&&bootstrap.includes('requestIdleCallback'),'app bootstrap must schedule service-worker registration shortly after load');

if(failures.length){
  console.error(`Offline cache checks failed with ${failures.length} issue(s):`);
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Offline cache checks passed: ${generatedRoutes.length} calculator routes are deterministically precached with shared dependencies and cache migration safeguards.`);
