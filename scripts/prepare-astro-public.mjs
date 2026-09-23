import { sharedShell } from './shared-shell.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const target = path.join(root, '.astro-public');
const migratedPages = new Set(['index.html', 'tools.html']);
const excludedDirs = new Set([
  '.git', '.github', '.astro', '.astro-public', 'dist', 'node_modules',
  'api', 'supabase', 'scripts', 'qa', 'src'
]);
const publicRootNames = new Set([
  'robots.txt', 'ads.txt', 'sw.js', 'site.webmanifest', 'favicon.svg',
  'c731d63e44f2d52fcd122041601cfb22.txt'
]);

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  const source = path.join(root, entry.name);
  const destination = path.join(target, entry.name);

  if (entry.isDirectory()) {
    if (excludedDirs.has(entry.name)) continue;
    fs.cpSync(source, destination, { recursive: true });
    continue;
  }

  if (!entry.isFile() || migratedPages.has(entry.name)) continue;
  const isPublicRootFile = publicRootNames.has(entry.name)
    || entry.name.endsWith('.html')
    || entry.name.endsWith('.xml');
  if (isPublicRootFile) fs.copyFileSync(source, destination);
}

console.log('Prepared Astro public passthrough while preserving legacy PilotDesk URLs.');

function applyShell(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) applyShell(p);
    else if(e.name.endsWith('.html')) fs.writeFileSync(p,sharedShell(fs.readFileSync(p,'utf8')));
  }
}
applyShell(target);

// Fingerprinted paths bypass older service-worker caches that ignore query strings.
function fingerprintAsset(name){
  const source=path.join(target,'assets',name);
  const bytes=fs.readFileSync(source);
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const extension=path.extname(name);
  const fingerprinted=name.slice(0,-extension.length)+'.'+hash+extension;
  fs.copyFileSync(source,path.join(target,'assets',fingerprinted));
  return '/assets/'+fingerprinted;
}
// Give returning visitors fresh planner assets even while an older service worker controls the page.
const routePage=path.join(target,'route-planner.html');
let routeHtml=fs.readFileSync(routePage,'utf8');
for(const extension of ['css','js']){
  const name=`route-planner.${extension}`;
  const source=path.join(target,'assets',name);
  const bytes=fs.readFileSync(source);
  const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const fingerprinted=`route-planner.${hash}.${extension}`;
  fs.copyFileSync(source,path.join(target,'assets',fingerprinted));
  const reference=new RegExp(`/assets/route-planner\\.${extension}(?:\\?v=[^"']*)?`,'g');
  if(!reference.test(routeHtml)) throw new Error(`Missing ${name} reference in route-planner.html`);
  routeHtml=routeHtml.replace(reference,`/assets/${fingerprinted}`);
}
const efbReference=/\/assets\/efb-layers\.js(?:\?v=[^"']*)?/g;
if(!efbReference.test(routeHtml))throw new Error('Missing efb-layers.js reference in route-planner.html');
routeHtml=routeHtml.replace(efbReference,fingerprintAsset('efb-layers.js'));
fs.writeFileSync(routePage,routeHtml);
const bootstrapPage=path.join(target,'assets','app-bootstrap.js');
let bootstrap=fs.readFileSync(bootstrapPage,'utf8');
const fingerprintedCalculatorAssets=[];
for(const name of ['crosswind-mfd.js','calculation-account.js']){
  const reference="load('/assets/"+name+"')";
  if(!bootstrap.includes(reference))throw new Error('Missing '+name+' reference in app-bootstrap.js');
  const versioned=fingerprintAsset(name);
  bootstrap=bootstrap.replace(reference,"load('"+versioned+"')");
  fingerprintedCalculatorAssets.push(versioned);
}
fs.writeFileSync(bootstrapPage,bootstrap);


function collectCalculatorOfflineManifest(){
  const calculatorRoot=path.join(target,'calculators');
  const routes=[];
  const assets=new Set();
  if(!fs.existsSync(calculatorRoot)) return { routes, assets:[] };

  const visit=dir=>{
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const p=path.join(dir,entry.name);
      if(entry.isDirectory()){
        visit(p);
        continue;
      }
      if(entry.name!=='index.html') continue;
      const rel=path.relative(target,p).split(path.sep).join('/');
      const route='/'+rel.replace(/index\.html$/,'');
      routes.push(route);
      const html=fs.readFileSync(p,'utf8');
      for(const match of html.matchAll(/\b(?:src|href)=["'](\/[^"'?#\s]+)(?:[?#][^"']*)?["']/gi)){
        const asset=match[1];
        if(/\.(?:css|js|svg|png|jpe?g|webp|woff2?|webmanifest)$/i.test(asset)) assets.add(asset);
      }
    }
  };

  visit(calculatorRoot);
  return { routes:[...new Set(routes)].sort(), assets:[...assets].sort() };
}

const offline=collectCalculatorOfflineManifest();
offline.assets=[...new Set([...offline.assets,...fingerprintedCalculatorAssets])].sort();
const offlineManifest=`// Generated by scripts/prepare-astro-public.mjs. Do not hand-edit.\nself.PILOTDESK_OFFLINE_CALCULATORS=${JSON.stringify(offline.routes,null,2)};\nself.PILOTDESK_OFFLINE_ASSETS=${JSON.stringify(offline.assets,null,2)};\n`;
fs.mkdirSync(path.join(target,'assets'),{recursive:true});
fs.writeFileSync(path.join(target,'assets','offline-precache.js'),offlineManifest);
console.log(`Generated offline precache manifest for ${offline.routes.length} calculator routes and ${offline.assets.length} directly referenced assets.`);
