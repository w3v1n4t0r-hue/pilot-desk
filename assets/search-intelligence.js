(()=>{'use strict';
const synonymGroups=[
 ['crosswind','wind component','headwind','tailwind','runway wind'],
 ['density altitude','hot day','hot high','hot and high','performance altitude'],
 ['3 degree descent','three degree descent','descent rate','gs times 5','groundspeed times 5'],
 ['weight balance','weight and balance','cg','center of gravity','centre of gravity','loading'],
 ['vmc','minimum control speed','red line'],
 ['vyse','blue line','single engine climb'],
 ['alternates','alternate minimums','ifr alternate','alternate airport','123 rule','1 2 3 rule','91.169','takeoff alternate'],
 ['oral prep','oral exam','checkride oral','checkride prep'],
 ['written prep','knowledge test','faa written','written test'],
 ['metar taf','aviation weather','airport weather'],
 ['climb gradient','feet per nautical mile','ft nm','obstacle departure'],
 ['groundspeed','ground speed','wind triangle','wind correction angle','wca'],
 ['true magnetic','variation','magnetic heading','true heading'],
 ['pivotal altitude','eights on pylons'],
 ['service ceiling','single engine ceiling','absolute ceiling'],
 ['best glide','glide distance','glide ratio'],
 ['standard rate','rate one','3 degrees per second'],
 ['pressure altitude','altimeter setting'],
 ['fuel required','fuel burn','fuel planning','reserve fuel'],
 ['turn radius','rate of turn','bank angle turn']
];
const intents=[
 {terms:['crosswind','wind component'],title:'Crosswind Component Calculator',href:'/calculators/crosswind/',type:'Calculator',reason:'Runway wind → crosswind and headwind/tailwind components'},
 {terms:['density altitude','hot day','hot high','hot and high'],title:'Density Altitude Calculator',href:'/calculators/density-altitude/',type:'Calculator',reason:'Pressure altitude + temperature → density altitude'},
 {terms:['3 degree descent','three degree descent','descent rate','gs times 5'],title:'3° Descent Rate Calculator',href:'/calculators/three-degree-descent/',type:'Calculator',reason:'Groundspeed → approximate 3° descent rate'},
 {terms:['weight balance','cg','center of gravity','loading'],title:'Weight & Balance',href:'/weight-balance.html',type:'Tool',reason:'Build and check an aircraft loading scenario'},
 {terms:['vmc','red line','vyse','blue line'],title:'VMC vs VYSE Explained',href:'/guides/vmc-vs-vyse.html',type:'Guide',reason:'Red line, blue line, control, and single-engine climb'},
 {terms:['alternates','alternate minimums','ifr alternate','alternate airport','123 rule','1 2 3 rule','91.169'],title:'IFR alternate requirements',href:'/guides/ifr-alternate-requirements.html',type:'Guide',reason:'Worked Part 91 alternate, weather and fuel examples'},
 {terms:['ifr alternate','takeoff alternate','91.169'],title:'ACS & FAR Reference',href:'/training/acs-far-reference.html',type:'Reference',reason:'Return to the controlling FAA source and standard'},
 {terms:['oral prep','oral exam','checkride oral'],title:'FAA Oral Exam Practice',href:'/learn/oral-exam/',type:'Training',reason:'Know it, say it, apply it, verify it'},
 {terms:['written prep','knowledge test','faa written','written test'],title:'Written Prep',href:'/written-prep.html',type:'Training',reason:'Rating-focused practice, misses, and FAA-standard progress'},
 {terms:['metar','taf','aviation weather','airport weather'],title:'Aviation Weather',href:'/weather.html',type:'Weather',reason:'Current METAR, TAF, decoded conditions, and runway-wind context'},
 {terms:['climb gradient','ft nm','feet per nautical mile'],title:'Climb Gradient to FPM Calculator',href:'/calculators/climb-gradient/',type:'Calculator',reason:'Required ft/NM + groundspeed → FPM'},
 {terms:['groundspeed','wind triangle','wca','wind correction'],title:'Wind Triangle Calculator',href:'/calculators/wind-triangle/',type:'Calculator',reason:'Course, TAS, and wind → heading and groundspeed'},
 {terms:['true magnetic','variation','magnetic heading'],title:'True / Magnetic Heading Calculator',href:'/calculators/true-magnetic/',type:'Calculator',reason:'Apply magnetic variation to headings and courses'},
 {terms:['pivotal altitude','eights on pylons'],title:'Pivotal Altitude Calculator',href:'/calculators/pivotal-altitude/',type:'Calculator',reason:'Groundspeed → pivotal altitude'},
 {terms:['service ceiling','single engine ceiling'],title:'Single-Engine Service Ceiling',href:'/guides/service-ceiling-vs-absolute-ceiling.html#oei-service-ceiling',type:'Guide',reason:'Multi-engine single-engine ceiling and performance'},
 {terms:['best glide','glide distance','glide ratio'],title:'Aircraft Glide Distance Calculator',href:'/calculators/glide-range/',type:'Calculator',reason:'Altitude + glide ratio → still-air glide distance'},
 {terms:['fuel required','fuel burn','fuel planning','reserve fuel'],title:'Fuel Required Calculator',href:'/calculators/fuel-required/',type:'Calculator',reason:'Trip time, burn, reserve, and onboard fuel'},
 {terms:['standard rate','rate one','3 degrees per second'],title:'Standard-Rate Bank Calculator',href:'/calculators/standard-rate-bank/',type:'Calculator',reason:'Airspeed → approximate bank for a rate-one turn'}
];
const suggestions=['crosswind','density altitude','IFR alternate','oral prep','3 degree descent'];
const norm=s=>String(s||'').toLowerCase().replace(/°/g,' degree ').replace(/&/g,' and ').replace(/[^a-z0-9./+-]+/g,' ').replace(/\s+/g,' ').trim();
const typeOf=href=>href.startsWith('/calculators/')?'Calculator':href.startsWith('/guides/')?'Guide':href.startsWith('/training/')||href.startsWith('/learn/')||href==='/written-prep.html'||href==='/skill-gap.html'?'Training':href.includes('weather')||href.includes('metar')?'Weather':href.includes('planner')||href.includes('airport')||href.includes('procedures')?'Planning':'PilotDesk';
function variants(q){
 const n=norm(q),set=new Set([n]);
 for(const group of synonymGroups){
  if(group.some(x=>n.includes(norm(x))))for(const x of group)set.add(norm(x));
 }
 return [...set];
}
function intentHits(query){
 const qv=variants(query),out=[];
 for(const item of intents){
  let score=0;
  for(const term of item.terms){const t=norm(term);for(const q of qv){if(q===t)score=Math.max(score,120);else if(q.includes(t)||t.includes(q))score=Math.max(score,95);else{const words=q.split(' ');const tw=t.split(' ');if(tw.every(w=>words.includes(w)))score=Math.max(score,80)}}}
  if(score)out.push({...item,score,intent:true});
 }
 return out;
}
function rank(query,data,limit=8){
 const q=norm(query);if(!q)return[];
 const qv=variants(q),tokens=q.split(' ').filter(Boolean),rows=[];
 for(const [title,href,keywords=''] of data||[]){
  const hay=norm(title+' '+keywords+' '+href);
  let score=0;
  for(const v of qv){if(norm(title)===v)score=Math.max(score,100);else if(norm(title).includes(v))score=Math.max(score,70);else if(hay.includes(v))score=Math.max(score,52)}
  const matched=tokens.filter(t=>hay.includes(t)).length;
  score+=matched*8;if(tokens.length&&matched===tokens.length)score+=18;
  if(score)rows.push({title,href,type:typeOf(href),reason:'PilotDesk '+typeOf(href).toLowerCase(),score});
 }
 const merged=[...intentHits(q),...rows].sort((a,b)=>b.score-a.score);
 return [...new Map(merged.map(x=>[x.href,x])).values()].slice(0,limit);
}
window.PilotDeskSearch={rank,suggestions,norm};
})();