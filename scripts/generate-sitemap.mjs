import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const SITE='https://www.pilot-desk.com';
const skipDirs=new Set(['.git','node_modules','.github','api','assets','qa','scripts']);
const files=[];
function walk(dir='.') { for(const ent of fs.readdirSync(dir,{withFileTypes:true})) { if(skipDirs.has(ent.name)) continue; const p=path.join(dir,ent.name); if(ent.isDirectory()) walk(p); else if(ent.isFile()&&ent.name.endsWith('.html')&&ent.name!=='404.html') files.push(p.replaceAll('\\','/').replace(/^\.\//,'')); } }
walk();
function lastmod(file){ try { return execFileSync('git',['log','-1','--format=%cs','--',file],{encoding:'utf8'}).trim()||null; } catch { return null; } }
const byCanonical=new Map();
for(const file of files){ const html=fs.readFileSync(file,'utf8'); if(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)||/<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html)) continue; const m=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i); if(!m) continue; const canonical=m[1].replace('https://pilot-desk.com',SITE); if(!canonical.startsWith(SITE+'/')) continue; const date=lastmod(file); const prev=byCanonical.get(canonical); if(!prev||(!prev.lastmod&&date)) byCanonical.set(canonical,{canonical,lastmod:date,file}); }
const entries=[...byCanonical.values()].sort((a,b)=>a.canonical===SITE+'/'?-1:b.canonical===SITE+'/'?1:a.canonical.localeCompare(b.canonical));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...entries.map(({canonical,lastmod})=>`<url><loc>${esc(canonical)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}</url>`),'</urlset>',''].join('\n');
fs.writeFileSync('sitemap.xml',xml);
console.log(`Generated canonical sitemap with ${entries.length} URLs.`);
