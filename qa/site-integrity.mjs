import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const htmlFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))htmlFiles.push(p)}}
walk(root);
const failures=[];
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
JSON.parse(fs.readFileSync('vercel.json','utf8'));

function localExists(url){
  let p=String(url).split('#')[0].split('?')[0];
  if(!p||p==='/'||p.startsWith('/api/'))return true;
  if(!p.startsWith('/'))return true;
  if(p==='/calculators/weight-balance-builder'||p==='/calculators/weight-balance-builder/')return fs.existsSync('weight-balance.html');
  p=decodeURIComponent(p).replace(/^\//,'');
  const candidates=[p,path.join(p,'index.html')];
  return candidates.some(x=>fs.existsSync(x));
}

for(const file of htmlFiles){
  const raw=fs.readFileSync(file,'utf8');
  const first1024=Buffer.from(raw,'utf8').subarray(0,1024).toString('utf8');
  if(!/<meta\s+[^>]*charset\s*=\s*["']?utf-8["']?[^>]*>/i.test(first1024)){
    failures.push(`${file}: missing UTF-8 charset declaration within first 1024 bytes`);
  }
  const ids=[...raw.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
  const seen=new Set();for(const id of ids){if(seen.has(id))failures.push(`${file}: duplicate id ${id}`);seen.add(id)}
  for(const m of raw.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)){
    const u=m[1];
    if(u.startsWith('/')&&!localExists(u))failures.push(`${file}: missing local target ${u}`);
  }
}
for(const s of manifest.shortcuts||[])if(!localExists(s.url))failures.push(`site.webmanifest: missing shortcut target ${s.url}`);
const sitemap=fs.readFileSync('sitemap.xml','utf8');
for(const m of sitemap.matchAll(/<loc>https:\/\/www\.pilot-desk\.com([^<]*)<\/loc>/g))if(!localExists(m[1]||'/'))failures.push(`sitemap.xml: missing target ${m[1]||'/'}`);
if(failures.length){console.error(`Site integrity failed with ${failures.length} issue(s):`);for(const x of failures.slice(0,100))console.error(' - '+x);process.exit(1)}
console.log(`Site integrity passed: ${htmlFiles.length} HTML pages, UTF-8 declarations, local links/assets, duplicate IDs, manifest shortcuts, and sitemap targets checked.`);
