import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const files=fs.readdirSync('guides').filter(name=>name.endsWith('.html')).map(name=>`guides/${name}`);
let updated=0;
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const published=execFileSync('git',['log','--follow','--diff-filter=A','--format=%cs','--',file],{encoding:'utf8'}).trim().split('\n').filter(Boolean).at(-1);
  if(!published)continue;
  html=html.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(full,open,body,close)=>{
    try{
      const data=JSON.parse(body);
      if(data['@type']!=='Article'||data.datePublished)return full;
      data.datePublished=published;
      updated++;
      return `${open}${JSON.stringify(data)}${close}`;
    }catch{return full}
  });
  fs.writeFileSync(file,html);
}
console.log(`Added accurate publication dates to ${updated} article schemas.`);
