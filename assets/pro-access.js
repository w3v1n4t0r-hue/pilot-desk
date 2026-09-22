(()=>{
'use strict';
if(window.PilotDeskProAccess)return;
const limits=Object.freeze({aircraft:1,savedFlights:3,oralTopicsPerTrack:2});
async function snapshot(){
 const billing=window.PilotDeskBilling;
 if(!billing)return {isPro:false,isSchool:false,plan:'free',limits};
 try{await billing.ready}catch{}
 const s=billing.snapshot?.()||{};
 return {isPro:Boolean(s.isPro),isSchool:Boolean(s.isSchool),plan:s.isSchool?'school':s.isPro?'pro':'free',limits};
}
async function canCreate(kind,currentCount){
 const s=await snapshot(),limit=limits[kind];
 if(s.isPro||!Number.isFinite(limit))return true;
 return Number(currentCount||0)<limit;
}
async function canUseFullOral(){return (await snapshot()).isPro}
function upgradeUrl(source='feature'){
 const u=new URL('/pricing.html',location.origin);
 u.searchParams.set('from',String(source||'feature').slice(0,64));
 return u.pathname+u.search;
}
window.PilotDeskProAccess={limits,snapshot,canCreate,canUseFullOral,upgradeUrl};
snapshot().then(s=>document.dispatchEvent(new CustomEvent('pilotdesk:pro-access',{detail:s}))).catch(()=>{});
})();