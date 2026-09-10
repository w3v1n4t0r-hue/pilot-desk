import fs from 'node:fs';
import path from 'node:path';
const target='<span class="brandmark" aria-label="PilotDesk"><svg';
const replacement='<span class="brandmark" aria-label="PilotDesk" data-pd-wireframe="1" style="background:transparent;box-shadow:none;border:1px solid #34383f;color:#d9dde2;width:38px;height:38px;border-radius:8px;padding:3px"><svg';
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html')){let s=fs.readFileSync(p,'utf8');if(s.includes(target)){s=s.split(target).join(replacement);fs.writeFileSync(p,s)}}}}
walk(process.cwd());
console.log('Locked static PilotDesk airplane logo styling.');
