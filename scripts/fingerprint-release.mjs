import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Every mutable first-party JS/CSS dependency gets a release path. This includes
// runtime imports and CSS imports, so an old worker cannot combine new HTML with
// a cached, unversioned dependency. Source files remain the editing authority.
const root=path.resolve('dist');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const assets=walk(path.join(root,'assets')).filter(p=>/\.(js|css)$/.test(p)&&!p.endsWith('offline-precache.js')).sort();
const hash=createHash('sha256');
for(const file of assets)hash.update(path.relative(root,file)).update(fs.readFileSync(file));
const release=hash.digest('hex').slice(0,12);
const manifest=Object.fromEntries(assets.map(file=>{
 const url='/'+path.relative(root,file).split(path.sep).join('/');
 return [url,url.replace(/\.(js|css)$/,'.'+release+'.$1')];
}));
const rewrite=text=>text.replace(/\/assets\/[\w./-]+\.(?:js|css)(?:\?[^\s"'<>)]*)?/g,url=>manifest[url.split('?')[0]]||url);
for(const file of assets){
 const original='/'+path.relative(root,file).split(path.sep).join('/');
 const content=rewrite(fs.readFileSync(file,'utf8'));
 fs.writeFileSync(file,content);
 fs.writeFileSync(path.join(root,manifest[original].slice(1)),content);
}
for(const file of walk(root).filter(p=>p.endsWith('.html')))fs.writeFileSync(file,rewrite(fs.readFileSync(file,'utf8')));
// Cache the release versions of the existing offline dependency set. Keep old
// names too for bookmarked offline pages and the migration compatibility check.
const precache=path.join(root,'assets/offline-precache.js');
const oldManifest=fs.readFileSync(precache,'utf8');
const swSource=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const dependencies=[...new Set([...(oldManifest+swSource).matchAll(/\/assets\/[\w./-]+\.(?:js|css)/g)].map(m=>manifest[m[0]]).filter(Boolean))];
fs.writeFileSync(precache,oldManifest+'\nself.PILOTDESK_OFFLINE_ASSETS=[...new Set([...self.PILOTDESK_OFFLINE_ASSETS,...'+JSON.stringify(dependencies)+'])];\n');
const sw=rewrite(swSource).replace(/const CACHE='([^']+)'/,`const CACHE='$1-${release}'`);
fs.writeFileSync(path.join(root,'sw.js'),sw);
fs.writeFileSync(path.join(root,'assets/release-manifest.json'),JSON.stringify({release,assets:manifest},null,2));
console.log(`Fingerprinted ${assets.length} JS/CSS files and their dependencies for release ${release}.`);
