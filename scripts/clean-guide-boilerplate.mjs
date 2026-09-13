import fs from 'node:fs';
import path from 'node:path';

const dir='guides';
let changed=0;
let removed=0;

for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(!ent.isFile()||!ent.name.endsWith('.html'))continue;
  const file=path.join(dir,ent.name);
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  html=html.replace(/<section\s+class=["']info-card["']\s+data-pd-guide-depth=["']1["']>[\s\S]*?<\/section>/gi,()=>{removed++;return ''});
  html=html.replace(/<section\s+data-pd-guide-depth=["']1["']\s+class=["']info-card["']>[\s\S]*?<\/section>/gi,()=>{removed++;return ''});
  html=html.replace(/<h2>How How\s+/gi,'<h2>How ');
  if(html!==before){fs.writeFileSync(file,html);changed++}
}

console.log(`Cleaned generic guide boilerplate from ${changed} guide pages (${removed} generated depth block(s) removed).`);
