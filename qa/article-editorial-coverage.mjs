import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const articles=[];
for(const root of ['guides','training']){
  for(const ent of fs.readdirSync(root,{withFileTypes:true})){
    if(ent.isFile()&&ent.name.endsWith('.html')) articles.push(path.join(root,ent.name));
  }
}

const generic=[
  /data-pd-guide-depth=["']1["']/i,
  /data-pd-core-depth=["']1["']/i,
  /How .{0,90} fits into pilot training/i,
  /A practical way to study this topic/i,
  /Use this reference as part of a larger planning or training workflow/i,
  /Whether you['’]re a/i,
  /In today['’]s fast[- ]paced/i,
  /\bultimate guide\b/i,
  /\bgame[- ]changing\b/i,
  /\bunlock (?:the|your)\b/i
];

const familyCounts={};
for(const file of articles){
  const html=fs.readFileSync(file,'utf8');
  if(!/<h1\b/i.test(html)) failures.push(`${file}: missing H1`);
  if(!/rel=["']canonical["']/i.test(html)) failures.push(`${file}: missing canonical`);
  const m=html.match(/<main\b[^>]*data-pd-editorial-standard=["']technical-2026["'][^>]*data-pd-editorial-family=["']([^"']+)["']/i);
  if(!m) failures.push(`${file}: missing technical editorial coverage marker`);
  else familyCounts[m[1]]=(familyCounts[m[1]]||0)+1;
  const hasBasis=/pd-editorial-basis|Technical basis|Technical sources|Sources and limitations|References/i.test(html);
  if(!hasBasis) failures.push(`${file}: missing visible technical/source basis`);
  const hasBoundary=/FAA|NIST|POH|AFM|approved|controlling|official/i.test(html);
  if(!hasBoundary) failures.push(`${file}: missing source/operational boundary`);
  for(const re of generic) if(re.test(html)) failures.push(`${file}: generic generated copy matched ${re}`);
}

if(articles.length<108) failures.push(`Expected at least 108 guide/training articles; found ${articles.length}`);

if(failures.length){
  console.error(`Article editorial coverage failed (${failures.length})`);
  failures.slice(0,180).forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Article editorial coverage passed across ${articles.length} pages.`);
console.log('Technical families:',familyCounts);
