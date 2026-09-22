(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const labels={ppl:['PRIVATE PILOT · PPL','Private Pilot'],ira:['INSTRUMENT · IRA','Instrument Rating'],cpl:['COMMERCIAL PILOT · CPL','Commercial Pilot'],cfi:['FLIGHT INSTRUCTOR · CFI','CFI'],cfii:['INSTRUMENT INSTRUCTOR · CFII','CFII'],atp:['AIRLINE TRANSPORT · ATP','ATP']};
const valid=v=>Object.prototype.hasOwnProperty.call(labels,v)?v:'ppl';
const state={track:'ppl',client:null,session:null};
function text(sel,v){const e=$(sel);if(e)e.textContent=String(v)}
function setTrack(v){state.track=valid(v);try{localStorage.setItem('pd-written-track',state.track)}catch{}const u=new URL(location.href);u.searchParams.set('track',state.track);history.replaceState(null,'',u)}
function savedTrack(){try{return valid(new URLSearchParams(location.search).get('track')||localStorage.getItem('pd-written-track')||'ppl')}catch{return'ppl'}}
function renderIdentity(){if(state.session){text('#pdGapAccountTitle','Signed in');text('#pdGapAccountCopy','Weak Subjects is reading the same saved history used by Written Prep.');const a=$('#pdGapAccountLink');if(a){a.textContent='Open my account →';a.href='/account.html'}}else{text('#pdGapAccountTitle','Not signed in');text('#pdGapAccountCopy','Sign in to read the Written Prep history saved to your account.');const a=$('#pdGapAccountLink');if(a){a.textContent='Sign in →';a.href='/account.html?next=%2Fskill-gap.html'}}}
function renderTracks(){$('[data-track]').forEach(b=>{b.classList.toggle('active',b.dataset.track===state.track);b.setAttribute('aria-pressed',String(b.dataset.track===state.track))});const l=labels[state.track];text('#pdGapTrackLabel',l[0]);text('#pdGapTitle',l[1]+' weak subjects');const link=$('#pdGapWrittenLink');if(link)link.href='/written-prep.html?track='+encodeURIComponent(state.track)+'#pdPrepApp';const oralTrack=state.track==='ppl'?'private':state.track==='ira'?'instrument':state.track==='cpl'?'commercial':state.track;const oral=$('#pdGapOralLink'),plan=$('#pdGapPlanLink'),coverage=$('#pdGapCoverageLink');if(oral)oral.href='/learn/checkride-lab/?track='+encodeURIComponent(oralTrack);if(plan)plan.href='/learn/study-plan/?track='+encodeURIComponent(state.track);if(coverage)coverage.href='/learn/coverage/?track='+encodeURIComponent(state.track)}
function showGate(copy='Sign in and complete Written Prep questions to build this list.'){const gate=$('#pdGapGate'),list=$('#pdGapWeakList');if(gate)gate.hidden=false;if(list){list.hidden=true;list.innerHTML=''}text('#pdGapIntro',copy);text('#pdGapWeakCount','—');for(const id of ['#pdGapReadiness','#pdGapAccuracy','#pdGapCoverage','#pdGapMissed'])text(id,'—');text('#pdGapNextTitle','Start in Written Prep.');text('#pdGapNextCopy','After you answer questions, this page will put the weakest current subject first.')}
async function fetchDashboard(){
 if(!state.client||!state.session)throw new Error('Sign in to read Written Prep history.');
 const name='written-prep?track='+encodeURIComponent(state.track)+'&difficulty=all';
 const {data,error}=await state.client.functions.invoke(name,{method:'GET'});
 if(error)throw new Error('Unable to load Written Prep history.');
 return data||{}
}
function band(v){return v<60?'gap':v<80?'review':'missed'}
function renderDashboard(d){
 const gate=$('#pdGapGate'),list=$('#pdGapWeakList');if(gate)gate.hidden=true;if(list)list.hidden=false;
 const missed=new Map((d.missedByArea||[]).map(x=>[String(x.area||''),Number(x.count)||0]));
 const areas=(d.skillAreas||[]).filter(x=>Number(x.total||0)>0).map(x=>({...x,mastery:Number(x.mastery)||0,misses:missed.get(String(x.area||''))||0}));
 const weak=areas.filter(x=>x.mastery<80||x.misses>0).sort((a,b)=>a.mastery-b.mastery||b.misses-a.misses||String(a.area).localeCompare(String(b.area)));
 text('#pdGapReadiness',(Number(d.readiness)||0)+'%');text('#pdGapAccuracy',(Number(d.accuracy)||0)+'%');text('#pdGapCoverage',(Number(d.coverage)||0)+'%');text('#pdGapMissed',Number(d.missed)||0);
 text('#pdGapWeakCount',weak.length);text('#pdGapIntro',areas.length?'Only subjects currently flagged by Written Prep are shown below.':'No Written Prep answers yet for this rating.');
 const base='/written-prep.html?track='+encodeURIComponent(state.track)+'#pdPrepApp';
 if(!areas.length){list.innerHTML='<div class="pd-gap-empty-state"><b>No Written Prep history yet.</b><span>Answer a session first. Weak Subjects will use that saved performance automatically.</span><a class="pd-btn" href="'+base+'">Start Written Prep →</a></div>';text('#pdGapNextTitle','Build the first signal.');text('#pdGapNextCopy','Run a Written Prep session for this rating.');return}
 if(!weak.length){list.innerHTML='<div class="pd-gap-empty-state"><b>No weak subjects flagged right now.</b><span>Your attempted subjects are currently at or above the review threshold with no active misses. Keep widening question coverage.</span><a class="pd-btn secondary" href="'+base+'">Keep studying →</a></div>';text('#pdGapNextTitle','Keep widening coverage.');text('#pdGapNextCopy','No attempted subject is currently flagged, so continue into unseen FAA elements.');return}
 list.innerHTML=weak.map((x,i)=>`<article class="pd-gap-weak-row" data-band="${band(x.mastery)}"><span class="pd-gap-rank">${String(i+1).padStart(2,'0')}</span><div><b>${esc(x.area||'Subject')}</b><small>${Number(x.correct)||0}/${Number(x.total)||0} correct${x.misses?` · ${x.misses} current miss${x.misses===1?'':'es'}`:''}</small></div><strong>${x.mastery}%</strong><a href="${base}">Work this rating →</a></article>`).join('');
 const first=weak[0];text('#pdGapNextTitle','Start with '+(first.area||'your lowest subject')+'.');const matrix=window.PilotDeskTrainingStandards,cluster=matrix?.matchCluster?.(state.track,{area:first.area})||null;text('#pdGapNextCopy',`${first.mastery}% saved mastery${first.misses?` with ${first.misses} current miss${first.misses===1?'':'es'}`:''}. ${cluster?'This maps to '+cluster.title+'. ':''}Work it in Written Prep, then explain the same subject in Checkride Lab.`);const cross=$('#pdGapCrossCopy');if(cross)cross.textContent=cluster?`Weakest current subject maps to ${cluster.title}. Carry that subject into the oral and study plan instead of starting a separate topic list.`:'Carry the weakest Written Prep area into the oral and study plan.';
 window.pdTrack?.('Weak Subjects Viewed',{track:state.track,weakSubjects:weak.length,readiness:Number(d.readiness)||0});
}
async function load(){renderTracks();if(!state.session){showGate();return}text('#pdGapIntro','Loading Written Prep history…');try{renderDashboard(await fetchDashboard())}catch(e){showGate(e.message||'Unable to load Written Prep history.');const p=$('#pdGapGate p');if(p)p.textContent=e.message||'Unable to load Written Prep history.'}}
async function initAuth(){
 try{
  const billing=window.PilotDeskBilling?await window.PilotDeskBilling.ready:null;
  state.client=window.__pilotDeskSupabase||null;state.session=billing?.session||null;
  if(state.client){state.client.auth.onAuthStateChange((_e,s)=>{state.session=s||null;renderIdentity();load()})}
 }catch{state.client=null;state.session=null}
}
async function init(){state.track=savedTrack();setTrack(state.track);$$('[data-track]').forEach(b=>b.addEventListener('click',()=>{if(valid(b.dataset.track)===state.track)return;setTrack(b.dataset.track);load()}));await initAuth();renderIdentity();await load()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();