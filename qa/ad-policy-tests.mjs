import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(process.env.PILOTDESK_ADS_SOURCE||'assets/ads.js','utf8');
function run({pathname='/guides/crosswind-component.html',robots='',latePro=false,initialPro=false,existingLoader=false,lateLoad=false}={}){
 const timers=[],listeners=new Map(),requests=[],renders=[];
 const root={dataset:{pdAdFree:initialPro?'1':'0'}};
 const slot={dataset:{adSlot:'content'},closest:()=>({hidden:false}),replaceWith:el=>renders.push(el)};
 const oldScript={src:'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',addEventListener:(_event,fn)=>listeners.set('ad-load',fn)};
 const document={
  documentElement:root,readyState:'complete',scripts:existingLoader?[oldScript]:[],
  querySelector:selector=>selector==='meta[name="robots"]'?{content:robots}:lateLoad&&selector==='[data-ad-slot="content"]'?slot:null,
  querySelectorAll:selector=>selector==='.ad-slot'&&lateLoad?[slot]:[],
  createElement:()=>({style:{},dataset:{},setAttribute(){},addEventListener(){}}),
  head:{appendChild:script=>requests.push(script.src)},
  addEventListener:(name,fn)=>listeners.set(name,fn)
 };
 const context={document,window:{PILOTDESK_ADS:{publisherId:'ca-pub-123',slots:lateLoad?{content:'123'}:{},autoAds:true}},location:{pathname},navigator:{onLine:true},matchMedia:()=>({matches:false}),setTimeout:fn=>(timers.push(fn),timers.length),clearTimeout(){},requestIdleCallback:fn=>fn(),addEventListener(){},console};
 vm.runInNewContext(source,context);
 const pro=()=>{root.dataset.pdAdFree='1';listeners.get('pilotdesk:billing')?.({detail:{isPro:true}})};
 if(latePro&&!lateLoad)pro();
 for(const fn of timers)fn();
 if(latePro&&lateLoad)pro();
 if(lateLoad)listeners.get('ad-load')?.();
 return {requests,renders};
}

assert.equal(run().requests.length,1,'An eligible original guide can request ads');
assert.equal(run({initialPro:true}).requests.length,0,'An already ad-free account does not request ads');
assert.equal(run({latePro:true}).requests.length,0,'Pro hydration during the delayed start must suppress the ad request');
assert.equal(run({existingLoader:true,lateLoad:true,latePro:true}).renders.length,0,'A late ad-library load must not render slots after Pro hydration');
for(const robots of ['noindex,follow','NOINDEX, FOLLOW','none'])assert.equal(run({robots}).requests.length,0,robots+' must remain ad-free');
for(const pathname of ['/tools.html','/guides.html','/faa-sample-questions.html','/account.html','/history.html','/flights.html','/flight-brief.html','/aircraft.html','/airport.html','/procedures.html','/route-planner.html','/planner.html','/weather.html','/feedback.html','/404.html','/learn/study-plan/']){
 assert.equal(run({pathname}).requests.length,0,'Behavioral/reference screen must not request ads: '+pathname);
}
console.log('PASS ad policy: eligible guide, behavioral/reference exclusions, robots rules and delayed Pro transitions.');
