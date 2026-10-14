import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const handlers=new Map(),state={reduced:false,saved:false,hidden:false,animations:0};
const listen=(key,fn)=>{handlers.set(key,[...(handlers.get(key)||[]),fn]);};
const emit=(key,detail)=>handlers.get(key)?.forEach(fn=>fn({detail}));
const node=()=>({textContent:'',style:{},disabled:false,addEventListener(key,fn){this[key]=fn;},removeEventListener(){},animate(){state.animations++;return{finished:new Promise(()=>{}),cancel(){}};}});
function figure(mode){const nodes=Object.fromEntries(['.pd-flight-aircraft','button','[data-flight-from]','[data-flight-to]','[data-flight-time]','[data-flight-distance]'].map(key=>[key,node()]));return{dataset:{pdFlight:mode},hidden:mode==='route',nodes,querySelector:key=>nodes[key],setAttribute(key,value){this[key]=value;}};}
const route=figure('route'),home=figure('home'),departure={...node(),value:''},arrival={...node(),value:''};
vm.runInNewContext(fs.readFileSync('assets/flight-graphic.js','utf8'),{
 document:{querySelectorAll:()=>[home,route],getElementById:id=>id==='pdHomeDeparture'?departure:arrival,documentElement:{classList:{contains:()=>state.saved}},get hidden(){return state.hidden;},addEventListener:listen,removeEventListener(){}},
 window:{addEventListener(){},pdNavlogResult:null},navigator:{},matchMedia:()=>({get matches(){return state.reduced;},addEventListener(){},removeEventListener(){}}),IntersectionObserver:class{observe(){}disconnect(){}}
});
const built={legs:[{from:'KGFK',to:'KFAR'}],totalHours:90/105,totalDistance:90};
emit('pilotdesk:route-built',built);assert(!route.hidden);assert.equal(route.nodes['[data-flight-time]'].textContent,'00:51:26');assert.equal(route.nodes['[data-flight-from]'].textContent,'KGFK');assert.equal(route.nodes['[data-flight-to]'].textContent,'KFAR');assert.equal(state.animations,1);
emit('pilotdesk:route-invalidated');assert(route.hidden);assert.equal(route.nodes['[data-flight-time]'].textContent,'—');
state.reduced=true;emit('pilotdesk:route-built',built);assert.equal(state.animations,1,'reduced motion must not play');emit('pilotdesk:preferences-applied');assert(route.nodes.button.disabled);
state.reduced=false;state.saved=true;emit('pilotdesk:route-built',built);assert.equal(state.animations,1,'saved preference must also disable motion');
state.saved=false;state.hidden=true;emit('pilotdesk:route-built',built);assert.equal(state.animations,1,'hidden pages do not animate');
state.hidden=false;emit('visibilitychange');assert(!route.nodes.button.disabled);
emit('pilotdesk:route-built',{...built,totalHours:NaN});assert(route.hidden);
departure.value='kgfk';arrival.value='kfar';departure.input();assert.equal(home.nodes['[data-flight-from]'].textContent,'KGFK');assert.equal(home.nodes['[data-flight-to]'].textContent,'KFAR');assert.equal(home.nodes['[data-flight-time]'].textContent,'','homepage must not invent a computed flight time');
assert(fs.statSync('assets/flight-aircraft.webp').size<60*1024);
assert(fs.readFileSync('route-planner.html','utf8').includes('data-pd-flight="route"'));
assert(fs.readFileSync('src/pages/index.astro','utf8').includes('<FlightGraphic mode="home"'));
console.log('Flight graphic passed: exact navlog time, endpoint labels, invalidation, OS/saved preferences, hidden-page handling and home input binding.');
