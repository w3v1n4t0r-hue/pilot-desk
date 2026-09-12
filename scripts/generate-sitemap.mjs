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

function lastModified(file){
  const today=new Date().toISOString().slice(0,10);
  try{
    execFileSync('git',['diff','--quiet','HEAD','--',file],{stdio:'ignore'});
    const date=execFileSync('git',['log','-1','--format=%cs','--',file],{encoding:'utf8'}).trim();
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
  urls.push({url:normalized,file,lastmod:lastModified(file)});
}

const byUrl=new Map();
for(const item of urls){
  const prior=byUrl.get(item.url);
  if(!prior||item.lastmod>prior.lastmod) byUrl.set(item.url,item);
}
const unique=[...byUrl.values()].sort((a,b)=>a.url===SITE+'/'?-1:b.url===SITE+'/'?1:a.url.localeCompare(b.url));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
// Keep output byte-stable: no synthetic trailing blank line that would make CI dirty.
const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...unique.map(({url,lastmod})=>`<url><loc>${esc(url)}</loc><lastmod>${lastmod}</lastmod></url>`),'</urlset>'].join('\n');
fs.writeFileSync('sitemap.xml',xml);
fs.writeFileSync('robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Generated one canonical sitemap with ${unique.length} indexable URLs, accurate lastmod dates, and refreshed robots.txt.`);
