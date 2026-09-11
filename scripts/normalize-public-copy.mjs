import fs from 'node:fs';
import path from 'node:path';

const replacements=[
  [/\bin one place\b/gi,'together']
];

const files=[];
function walk(dir='.'){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p);
    else if(ent.isFile()&&ent.name.endsWith('.html')) files.push(p);
  }
}
walk();

let changed=0;
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  for(const [pattern,replacement] of replacements) html=html.replace(pattern,replacement);
  if(html!==before){
    fs.writeFileSync(file,html);
    changed++;
  }
}
console.log(`Normalized public copy in ${changed} HTML page${changed===1?'':'s'}.`);
