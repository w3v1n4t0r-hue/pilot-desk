import fs from 'node:fs';
import path from 'node:path';
import {symbolRecord} from '../assets/airport-symbol-core.mjs';
export function generate(directory='data/airports'){
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'))),records=[];
 for(const file of fs.readdirSync(directory).filter(f=>/^[A-Z0-9]{2}\.json$/.test(f)).sort()){
  for(const a of Object.values(JSON.parse(fs.readFileSync(path.join(directory,file)))))if(Number.isFinite(a.lat)&&Number.isFinite(a.lon))records.push(symbolRecord(a));
 }
 const result={schema:1,effective:manifest.effective,expires:manifest.expires,source:manifest.source,towerBasis:'FAA NASR local-control frequency service; not real-time tower hours',records};
 fs.writeFileSync(path.join(directory,'symbols.json'),JSON.stringify(result));
 console.log('Generated '+records.length+' FAA airport symbols.');
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/generate-airport-symbols.mjs'))generate(process.argv[2]);
