import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const canonical="<span class=\"brandmark\" aria-label=\"PilotDesk\"><img src=\"/assets/icon.svg\" alt=\"\" width=\"36\" height=\"36\" aria-hidden=\"true\"></span>";
let changed=0, replaced=0, inserted=0;

function normalize(html){
  const before=html;

  // Replace legacy PilotDesk brandmarks, including the old inline wireframe airplane.
  html=html.replace(/<span\s+class=["']brandmark["'][^>]*>\s*(?:<svg[\s\S]*?<\/svg>|<img[^>]*>)\s*<\/span>/gi,()=>{
    replaced++;
    return canonical;
  });
  html=html.replace(/<span\s+class=["']brandmark["'][^>]*>\s*PD\s*<\/span>/gi,()=>{
    replaced++;
    return canonical;
  });

  // Legacy pages sometimes have only the wordmark. Give them the same official mark.
  html=html.replace(/(<a\s+class=["']brand["'][^>]*href=["']\/["'][^>]*>)(?!\s*<span\s+class=["']brandmark["'])/gi,(_,open)=>{
    inserted++;
    return open+canonical;
  });

  return html===before?null:html;
}

function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','dist'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(ent.isFile()&&ent.name.endsWith('.html')){
      const html=fs.readFileSync(p,'utf8');
      const next=normalize(html);
      if(next!==null){fs.writeFileSync(p,next);changed++;}
    }
  }
}

walk(root);
console.log(`Normalized PilotDesk branding in ${changed} HTML files (${replaced} legacy marks replaced, ${inserted} missing marks inserted).`);
