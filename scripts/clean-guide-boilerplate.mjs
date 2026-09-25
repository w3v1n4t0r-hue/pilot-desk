import fs from 'node:fs';
import path from 'node:path';

const dir='guides';
let changed=0;
let removed=0;
let repeatedCalculatorNotes=0;

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

function cleanCalculatorFaqNotes(root='calculators'){
  for(const ent of fs.readdirSync(root,{withFileTypes:true})){
    const file=path.join(root,ent.name);
    if(ent.isDirectory()){cleanCalculatorFaqNotes(file);continue;}
    if(!ent.isFile()||!ent.name.endsWith('.html'))continue;
    let html=fs.readFileSync(file,'utf8');
    const before=html;
    html=html.replace(/<p class=["']fine["']>General references: FAA pilot-training publications and the current aircraft POH\/AFM where aircraft-specific information is required\. PilotDesk is not FAA approved and does not replace approved flight information\.<\/p>/g,()=>{repeatedCalculatorNotes++;return '';});
    if(html!==before){fs.writeFileSync(file,html);changed++;}
  }
}
cleanCalculatorFaqNotes();

console.log(`Cleaned repeated boilerplate from ${changed} pages (${removed} generated guide blocks and ${repeatedCalculatorNotes} calculator notes removed).`);

