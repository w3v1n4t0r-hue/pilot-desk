import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const files=[];
function walk(dir='.'){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','dist'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(ent.isFile()&&ent.name.endsWith('.html'))files.push(p);
  }
}
walk();

let branded=0;
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  if(!/<a\s+class=["']brand["']/i.test(html))continue;
  branded++;
  if(!/<span\s+class=["']brandmark["'][^>]*>\s*<img\s+[^>]*src=["']\/assets\/icon\.svg["']/i.test(html)){
    failures.push(`${file}: brand does not use canonical /assets/icon.svg mark`);
  }
  if(/data-pd-wireframe/i.test(html)) failures.push(`${file}: legacy wireframe logo marker remains`);
  if(/<span\s+class=["']brandmark["'][^>]*>\s*<svg/i.test(html)) failures.push(`${file}: legacy inline brand SVG remains`);
  if(/<span\s+class=["']brandmark["'][^>]*>\s*PD\s*<\/span>/i.test(html)) failures.push(`${file}: legacy PD placeholder logo remains`);
  if(/M32 5v9|M32 14c-4\.8 0-8 3\.8/i.test(html)) failures.push(`${file}: old airplane-logo path signature remains`);
}

const icon=fs.readFileSync('assets/icon.svg','utf8');
if(!icon.includes('PilotDesk aviation math logo')) failures.push('assets/icon.svg: canonical handmade-logo identity missing');
if(!icon.includes('M25 33 H39 M32 26 V40')) failures.push('assets/icon.svg: canonical plus-symbol geometry missing');
if(!icon.includes('M90 33 H104')) failures.push('assets/icon.svg: canonical minus-symbol geometry missing');

if(failures.length){
  console.error(`Brand consistency failed (${failures.length})`);
  failures.slice(0,150).forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log(`Brand consistency passed: ${branded} branded HTML pages use the canonical handmade PilotDesk logo.`);
