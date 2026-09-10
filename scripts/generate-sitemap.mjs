import fs from 'node:fs';
import path from 'node:path';
const SITE='https://www.pilot-desk.com';
const skipDirs=new Set(['.git','node_modules','.github','api','assets','qa','scripts']);
const files=[];
function walk(dir='.') { for(const ent of fs.readdirSync(dir,{withFileTypes:true})) { if(skipDirs.has(ent.name)) continue; const p=path.join(dir,ent.name); if(ent.isDirectory()) walk(p); else if(ent.isFile()&&ent.name.endsWith('.html')&&ent.name!=='404.html') files.push(p.replaceAll('\\','/').replace(/^\.\//,'')); } }
walk();
function publicUrl(file){ if(file==='index.html') return SITE+'/'; if(file.endsWith('/index.html')) return SITE+'/'+file.slice(0,-'index.html'.length); return SITE+'/'+file; }
const urls=[];
for(const file of files){ const html=fs.readFileSync(file,'utf8'); if(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)||/<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html)) continue; const m=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i); if(!m) continue; const canonical=m[1].replace('https://pilot-desk.com',SITE); if(!canonical.startsWith(SITE+'/')) continue; const expected=publicUrl(file); if(canonical.replace(/\/$/,'')!==expected.replace(/\/$/,'')) continue; urls.push(canonical); }
const unique=[...new Set(urls)].sort((a,b)=>a===SITE+'/'?-1:b===SITE+'/'?1:a.localeCompare(b));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...unique.map(u=>`<url><loc>${esc(u)}</loc></url>`),'</urlset>',''].join('\n');
fs.writeFileSync('sitemap.xml',xml);
console.log(`Generated canonical sitemap with ${unique.length} URLs.`);
