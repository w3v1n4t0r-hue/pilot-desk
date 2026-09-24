import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SITE='https://www.pilot-desk.com';
const skipDirs=new Set(['.git','node_modules','.github','api','assets','qa','scripts']);
const files=[];

function walk(dir='.'){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(skipDirs.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p);
    else if(ent.isFile()&&ent.name.endsWith('.html')&&ent.name!=='404.html') files.push(p.replaceAll('\\','/').replace(/^\.\//,''));
  }
}
walk();

function publicUrl(file){
  if(file==='index.html') return SITE+'/';
  if(file.endsWith('/index.html')) return SITE+'/'+file.slice(0,-'index.html'.length);
  return SITE+'/'+file;
}

// Generate the same dates locally and in CI from the checked-out tree. A PR
// branch ref can be absent, shallow, or point at a different history snapshot.
const HISTORY_REF='HEAD';
const previousLastModified=new Map(
  [...fs.readFileSync('sitemap.xml','utf8').matchAll(/<url>\s*<loc>([^<]+)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)]
    .map(([,url,date])=>[url,date])
);

function lastModified(file){
  const today=new Date().toISOString().slice(0,10);
  try{
    execFileSync('git',['diff','--quiet','HEAD','--',file],{stdio:'ignore'});
    const date=execFileSync('git',['log','-1','--format=%cs',HISTORY_REF,'--',file],{encoding:'utf8'}).trim();
    return date||today;
  }catch{
    return today;
  }
}

const urls=[];
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const robots=(html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i)||[])[1]||'';
  if(/noindex/i.test(robots)) continue;
  const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)||[])[1];
  if(!canonical) continue;
  const normalized=canonical.replace('https://pilot-desk.com',SITE);
  if(!normalized.startsWith(SITE+'/')) continue;
  const expected=publicUrl(file);
  if(normalized.replace(/\/$/,'')!==expected.replace(/\/$/,'')) continue;
  const sourceDate=lastModified(file);
  // Preserve a newer committed lastmod if CI's merge checkout has a shorter
  // file history than the branch that authored the existing sitemap.
  const priorDate=previousLastModified.get(normalized)||'';
  urls.push({url:normalized,file,lastmod:priorDate>sourceDate?priorDate:sourceDate});
}

const byUrl=new Map();
for(const item of urls){
  const prior=byUrl.get(item.url);
  if(!prior||item.lastmod>prior.lastmod) byUrl.set(item.url,item);
}
const unique=[...byUrl.values()].sort((a,b)=>a.url===SITE+'/'?-1:b.url===SITE+'/'?1:a.url.localeCompare(b.url));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...unique.map(({url,lastmod})=>`<url><loc>${esc(url)}</loc><lastmod>${lastmod}</lastmod></url>`),'</urlset>'].join('\n');
fs.writeFileSync('sitemap.xml',xml+'\n');

// Advertise the canonical sitemap plus purpose-built discovery/retention
// sitemaps. Keep this generated so robots.txt cannot drift from the sitemap
// files the product and QA suites expect search engines to discover.
const advertised=[
  'sitemap-index.xml',
  'sitemap.xml',
  'sitemap-core.xml',
  'sitemap-daily.xml',
  'sitemap-growth.xml',
  'sitemap-retention.xml',
  'sitemap-seo-expansion.xml',
  'sitemap-seo-expansion-2.xml',
  'sitemap-written-prep.xml'
].filter(file=>fs.existsSync(file));
const robots=['User-agent: *','Allow: /','Disallow: /api/',...advertised.map(file=>`Sitemap: ${SITE}/${file}`),''].join('\n');
fs.writeFileSync('robots.txt',robots);
console.log(`Generated canonical sitemap with ${unique.length} indexable URLs from ${HISTORY_REF} and advertised ${advertised.join(', ')} in robots.txt.`);
