import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/app-bootstrap.js','utf8');
function loads(path,calc=''){
 const scripts=[],window={};
 const document={scripts,body:{dataset:{calc}},documentElement:{dataset:{}},readyState:'complete',head:{append:s=>{if(s.src)s.src=new URL(s.src,'http://pd.test').href;scripts.push(s)}},createElement:()=>({})};
 const context={window,document,location:{pathname:path,href:'http://pd.test'+path,protocol:'http:',hostname:'pd.test'},navigator:{},URL};
 vm.createContext(context);vm.runInContext(source,context);const first=scripts.length;vm.runInContext(source,context);assert.equal(scripts.length,first,'Bootstrap must remain idempotent');
 return scripts.filter(s=>s.src).map(s=>new URL(s.src).pathname);
}
let calculators=0;
for(const entry of fs.readdirSync('calculators',{withFileTypes:true})){
 if(!entry.isDirectory())continue;const file='calculators/'+entry.name+'/index.html';if(!fs.existsSync(file))continue;
 const calc=fs.readFileSync(file,'utf8').match(/<body[^>]*data-calc="([^"]+)"/)?.[1];if(!calc)continue;
 const assets=loads('/calculators/'+entry.name+'/',calc);calculators++;
 assert.equal(assets.includes('/assets/metar-model.js'),false);
 assert.equal(assets.includes('/assets/crosswind-mfd.js'),calc==='crosswind');
 assert.ok(assets.includes('/assets/calculator-ux.js'));assert.ok(assets.includes('/assets/pilotdesk-plus.js'));
 assert.ok(assets.includes('/assets/calculator-motion-runtime.js'));
}
for(const path of ['/weather.html','/airport.html','/route-planner.html','/preflight-brief.html'])assert.ok(loads(path).includes('/assets/metar-model.js'));
for(const path of ['/written-prep.html','/checklist-trainer.html','/e6b-flight-computer.html','/procedures.html'])assert.ok(!loads(path).includes('/assets/metar-model.js'));
console.log('Startup routing passed for '+calculators+' calculators: required tools retained, crosswind scoped, unrelated weather runtime omitted, repeated bootstrap is safe.');
