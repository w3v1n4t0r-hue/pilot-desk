import fs from 'node:fs';
import vm from 'node:vm';

const nodes=new Map();
const head={appendChild(){},append(){}};
const document={
  addEventListener(){},querySelector(){return null},querySelectorAll(selector){if(selector==='[data-calc-input]')return [...nodes.values()].filter(x=>x?.dataset?.calcInput);if(selector==='[id^=\"out\"]')return [...nodes.entries()].filter(([id])=>id.startsWith('out')).map(([,x])=>x);return[]},
  getElementById(id){return nodes.get(id)||null},
  createElement(tag){return{tagName:String(tag).toUpperCase(),rel:'',href:'',src:'',defer:false,dataset:{},classList:{add(){},remove(){},toggle(){}}}},
  head,scripts:[],body:{dataset:{}},
};
const context={document,window:{},navigator:{},location:{protocol:'http:',pathname:'/'},localStorage:{getItem(){return null},setItem(){}},console,setTimeout,clearTimeout};
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/site.js','utf8')+'\nglobalThis.__F=F;',context);
const F=context.__F;
if(!F)throw new Error('Calculator function table not available');
const configContext={window:{}};
vm.runInNewContext(fs.readFileSync('assets/calculator-config.js','utf8'),configContext);
const allCalcs=configContext.window.PD_CALCS||[];
if(allCalcs.length!==47)throw new Error(`Expected 47 calculator definitions, found ${allCalcs.length}`);


function run(key,inputs){nodes.clear();for(const [id,value] of Object.entries(inputs))nodes.set(id,{value:String(value)});for(let i=0;i<4;i++)nodes.set('out'+i,{textContent:'—'});F[key]();return [0,1,2,3].map(i=>nodes.get('out'+i)?.textContent)}
const n=s=>Number(String(s).replace(/,/g,'').match(/[-+]?\d*\.?\d+/)?.[0]);
const near=(actual,expected,tol,msg)=>{if(!Number.isFinite(actual)||Math.abs(actual-expected)>tol)throw new Error(`${msg}: expected ${expected} ±${tol}, got ${actual}`)};

let o=run('crosswind',{runway:180,windDir:220,windSpeed:20});near(n(o[0]),12.9,.2,'Crosswind');near(n(o[1]),15.3,.2,'Headwind');near(n(o[2]),40,.1,'Wind angle');
o=run('pressureAltitude',{elev:1000,altimeter:29.42});near(n(o[0]),1500,1,'Pressure altitude');
o=run('fuelRequired',{fuel:50,burn:10,time:2.5,reserve:45});near(n(o[0]),32.5,.1,'Fuel required');near(n(o[1]),25,.1,'Trip fuel');near(n(o[2]),17.5,.1,'Fuel margin');
o=run('pivotal',{gs:100});near(n(o[0]),885,1,'Pivotal altitude');
o=run('hydro',{psi:36});near(n(o[0]),54,.1,'Hydroplaning speed');
o=run('stdRate',{tas:120});near(n(o[0]),17.8,.4,'Standard-rate exact bank');near(n(o[1]),18,.1,'Standard-rate quick estimate');
o=run('weightConv',{lb:100});near(n(o[0]),45.36,.02,'Pounds to kg');
o=run('trueMag',{direction:270,variation:8});near(n(o[0]),262,.1,'True to magnetic');near(n(o[1]),278,.1,'Magnetic to true');
o=run('stallBank',{vs:50,bank:60});near(n(o[0]),70.7,.2,'Accelerated stall');
o=run('greatCircle',{lat1:47.95,lon1:-97.18,lat2:47.95,lon2:-97.18});near(n(o[0]),0,.1,'Zero great-circle distance');


const safetyWarning={textContent:'',classList:{toggle(){}}};
nodes.clear();
for(const [id,value] of Object.entries({runway:180,windDir:220,windSpeed:20,gustSpeed:''})){
  nodes.set(id,{id,value:String(value),dataset:{calcInput:true,...(id==='gustSpeed'?{optional:'true'}:{})},closest(){return{querySelector(){return{textContent:id}}}}});
}
nodes.set('safetyWarning',safetyWarning);
const crosswindMfd=fs.readFileSync('assets/crosswind-mfd.js','utf8');
if(!crosswindMfd.includes('data-optional=\"true\"'))throw new Error('Injected gust input must be marked optional');
vm.runInContext(fs.readFileSync('assets/safety.js','utf8'),context);
const safety=context.window.PilotDeskSafety;
if(!safety.validate('crosswind'))throw new Error('Blank optional gust speed must not block crosswind calculation');
for(const [slug,key,, ,fields] of allCalcs){
  nodes.clear();
  for(const [id,,value] of fields)nodes.set(id,{id,value:String(value),dataset:{calcInput:true},closest(){return{querySelector(){return{textContent:id}}}}});
  nodes.set('safetyWarning',safetyWarning);
  if(!safety.validate(key))throw new Error(`${slug} shipped defaults fail validation: ${safetyWarning.textContent}`);
  const [firstId, , firstValue]=fields[0];
  nodes.get(firstId).value='';
  if(safety.validate(key))throw new Error(`${slug} accepts a blank required input`);
  nodes.get(firstId).value='Infinity';
  if(safety.validate(key))throw new Error(`${slug} accepts Infinity as an input`);
}
nodes.clear();
for(const [id,value] of Object.entries({runway:180,windDir:220,windSpeed:20,gustSpeed:''})){
  nodes.set(id,{id,value:String(value),dataset:{calcInput:true,...(id==='gustSpeed'?{optional:'true'}:{})},closest(){return{querySelector(){return{textContent:id}}}}});
}
nodes.set('safetyWarning',safetyWarning);

nodes.get('gustSpeed').value='30';
if(!safety.validate('crosswind'))throw new Error('A valid gust speed must pass crosswind validation');
nodes.get('gustSpeed').value='301';
if(safety.validate('crosswind'))throw new Error('Out-of-range gust speed must be rejected');
nodes.get('gustSpeed').value='';
nodes.get('runway').value='';
if(safety.validate('crosswind'))throw new Error('Blank required runway heading must be rejected');

console.log('PilotDesk formula regression tests passed.');
