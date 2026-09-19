import fs from 'node:fs';
import path from 'node:path';

const roots=['.'];
const skip=new Set(['node_modules','dist','.astro-public','.git']);
const files=[];
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(ent.isFile()&&ent.name.endsWith('.html'))files.push(p.replaceAll('\\','/').replace(/^\.\//,''));
  }
}
walk('.');

const grab=(h,a,b)=>((h.match(a)||h.match(b)||[])[1]||'').replace(/\s+/g,' ').replace(/<[^>]+>/g,'').trim();
const rows=files.map(file=>{
 const h=fs.readFileSync(file,'utf8');
 return {
  file,h,
  title:grab(h,/<title>([^<]*)<\/title>/i,/$a/),
  desc:grab(h,/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
  canonical:grab(h,/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i),
  robots:grab(h,/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i,/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i),
  h1:grab(h,/<h1[^>]*>([\s\S]*?)<\/h1>/i,/$a/),
  ogTitle:/property=["']og:title["']/i.test(h),
  ogDesc:/property=["']og:description["']/i.test(h),
  jsonLd:/application\/ld\+json/i.test(h)
 };
});

const exempt=new Set(['404.html','offline.html']);
const indexable=rows.filter(r=>!exempt.has(r.file)&&!/noindex/i.test(r.robots||''));
const failures=[],warnings=[];
const fail=(r,msg)=>failures.push(`${r.file}: ${msg}`);
const warn=(r,msg)=>warnings.push(`${r.file}: ${msg}`);

for(const r of indexable){
 if(!r.title)fail(r,'missing <title>');
 if(!r.desc)fail(r,'missing meta description');
 if(!r.canonical)fail(r,'missing canonical');
 else if(!r.canonical.startsWith('https://www.pilot-desk.com/'))fail(r,'canonical is not on canonical www host');
 if(!r.robots)fail(r,'missing robots directive');
 if(!r.h1)fail(r,'missing H1');
 if(r.title&&(r.title.length<20||r.title.length>70))warn(r,`title length ${r.title.length}`);
 if(r.desc&&(r.desc.length<70||r.desc.length>180))warn(r,`description length ${r.desc.length}`);
 if(!r.ogTitle)warn(r,'no static og:title (runtime SEO may supply it)');
 if(!r.ogDesc)warn(r,'no static og:description (runtime SEO may supply it)');
}

function duplicates(key){
 const map=new Map();
 for(const r of indexable){
  const v=String(r[key]||'').toLowerCase().trim();if(!v)continue;
  const a=map.get(v)||[];a.push(r.file);map.set(v,a);
 }
 return [...map.entries()].filter(([,a])=>a.length>1);
}
for(const [v,paths] of duplicates('title'))failures.push(`duplicate title: ${paths.join(', ')} :: ${v}`);
for(const [v,paths] of duplicates('desc'))failures.push(`duplicate description: ${paths.join(', ')} :: ${v}`);

const stale=[
 /paid plans are being prepared now/i,
 /billing is not live yet/i,
 /no card is collected yet/i,
 /product target, not a charge today/i
];
for(const r of rows)for(const re of stale)if(re.test(r.h))fail(r,`stale monetization copy matches ${re}`);

const pricing=rows.find(r=>r.file==='pricing.html');
if(pricing){
 for(const phrase of ['PilotDesk Pro','$5','Flight School','$29'])if(!pricing.h.includes(phrase))fail(pricing,`pricing page missing current plan signal: ${phrase}`);
 if(!pricing.jsonLd)fail(pricing,'pricing page missing JSON-LD');
}

console.log(`Full SEO audit: ${rows.length} HTML pages; ${indexable.length} indexable; ${rows.length-indexable.length} noindex/exempt.`);
if(warnings.length){console.log(`SEO warnings (${warnings.length}):`);for(const x of warnings.slice(0,120))console.log(' - '+x);if(warnings.length>120)console.log(` - … ${warnings.length-120} more warnings`)}
if(failures.length){console.error(`SEO audit failed with ${failures.length} issue(s):`);for(const x of failures)console.error(' - '+x);process.exit(1)}
console.log('Full-site SEO audit PASS: titles, descriptions, canonicals, robots, H1s, duplicates, current monetization language, and pricing signals verified.');
