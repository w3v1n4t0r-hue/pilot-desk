(()=>{
'use strict';
if(location.pathname!=='/learn/study-plan/'&&location.pathname!=='/learn/study-plan/index.html')return;
const $=s=>document.querySelector(s),data=window.PilotDeskTrainingStandards,KEY='pd-study-plan-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={ppl:'Private Pilot',ira:'Instrument Rating',cpl:'Commercial Pilot',multi:'Multi-Engine Add-On',cfi:'CFI',cfii:'CFII',atp:'ATP / Type Rating'};
const oralTrack=k=>k==='ppl'?'private':k==='ira'?'instrument':k==='cpl'?'commercial':k;
let access={isPro:false},written=null,currentPlan=null;
function read(k,d){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function today(){return new Date().toISOString().slice(0,10)}
function defaultDate(){const d=new Date();d.setDate(d.getDate()+13);return d.toISOString().slice(0,10)}
function dayCount(target){const a=new Date(today()+'T12:00:00'),b=new Date((target||defaultDate())+'T12:00:00'),n=Math.ceil((b-a)/86400000)+1;return Math.max(3,Math.min(30,Number.isFinite(n)?n:14))}
function figureUrl(track){const k=track==='ppl'?'pplSupplement':track==='ira'||track==='cfii'?'iraSupplement':track==='cpl'||track==='multi'?'cplSupplement':track==='cfi'?'cfiSupplement':'atpSupplement';return data.FAA[k]}
async function writtenDashboard(track){
 const t=data.tracks[track];if(!t?.knowledgeTest)return null;
 try{
  const snap=window.PilotDeskBilling.snapshot(),token=snap.session?.access_token;if(!token)return null;
  const url='https://hqqgcfiaxcrzyuhtkzqg.supabase.co/functions/v1/written-prep?track='+encodeURIComponent(track)+'&difficulty=all';
  const r=await fetch(url,{headers:{apikey:'sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ',Authorization:'Bearer '+token}});
  if(!r.ok)return null;return await r.json()
 }catch{return null}
}
function oralHistory(track){
 const key=oralTrack(track);return read('pd-checkride-history-v1',[]).filter(x=>x.track===key).slice(0,12)
}
function clusterSignals(track,t){
 const scores=new Map(t.clusters.map(c=>[c.id,{written:[],oral:[],attempted:false}]));
 if(written){
  for(const a of written.skillAreas||[]){const c=data.matchCluster(track,{area:a.area});if(c){const v=scores.get(c.id);v.written.push(Number(a.mastery)||0);v.attempted=true}}
  for(const a of written.standardBreakdown||[]){const c=data.matchCluster(track,{standardCode:a.key||a.label});if(c){const v=scores.get(c.id);v.written.push(Number(a.mastery)||0);v.attempted=true}}
 }
 for(const session of oralHistory(track))for(const row of session.rows||[]){const c=data.matchCluster(track,{area:row.area});if(c){const v=scores.get(c.id);v.oral.push(Number(row.score)||0);v.attempted=true}}
 return t.clusters.map(c=>{
  const v=scores.get(c.id),w=v.written.length?Math.min(...v.written):null,o=v.oral.length?Math.min(...v.oral):null;
  const priority=(w==null?18:Math.max(0,85-w))+(o==null?10:Math.max(0,85-o))+(!v.attempted?20:0)+(c.figures.length?5:0);
  return{...c,written:w,oral:o,attempted:v.attempted,priority}
 }).sort((a,b)=>b.priority-a.priority);
}
function task(id,type,title,detail,href=''){return{id,type,title,detail,href,done:false}}
function makeTasks(track,cluster,dayIndex,minutes){
 const t=data.tracks[track],tasks=[];
 const source=cluster.sources.find(x=>/^https?:/.test(x))||t.standardUrl;
 tasks.push(task(cluster.id+'-source-'+dayIndex,'SOURCE','Read the controlling source',cluster.title+' · '+cluster.codes.join(' · '),source));
 if(cluster.figures.length){const f=cluster.figures[dayIndex%cluster.figures.length],fig=f.figures[dayIndex%f.figures.length];tasks.push(task(cluster.id+'-figure-'+dayIndex,'FAA FIGURE','Work '+f.supplement+' · Figure '+fig,'Read the figure first, then explain what inputs, limits, or procedure details the FAA expects you to extract.',figureUrl(track)))}
 if(t.knowledgeTest)tasks.push(task(cluster.id+'-written-'+dayIndex,'WRITTEN','Written Prep · '+cluster.title,'Choose All Questions, Missed, or Weak Subjects. Explain why the correct answer fits.','/written-prep.html?track='+encodeURIComponent(track)+'#pdPrepApp'));
 tasks.push(task(cluster.id+'-oral-'+dayIndex,'ORAL','Explain it without notes',cluster.title+' · use examiner follow-up practice and verify the answer in the listed source.','/learn/checkride-lab/?track='+encodeURIComponent(oralTrack(track))));
 const limit=minutes<=30?2:minutes<=45?3:4;return tasks.slice(0,limit)
}
function buildPlan(track,target,minutes){
 const t=data.tracks[track],days=dayCount(target),ranked=clusterSignals(track,t),rows=[];
 for(let i=0;i<days;i++){
  const primary=ranked[i%ranked.length],secondary=ranked[(i+Math.ceil(ranked.length/2))%ranked.length];
  let tasks=makeTasks(track,primary,i,minutes);
  if(minutes>=60&&secondary.id!==primary.id)tasks.push(task(secondary.id+'-cross-'+i,'CROSS-CHECK','Second subject · '+secondary.title,'Short source review or oral explanation to prevent studying one area in isolation.',secondary.sources.find(x=>/^https?:/.test(x))||t.standardUrl));
  const d=new Date();d.setDate(d.getDate()+i);
  rows.push({date:d.toISOString().slice(0,10),primary:primary.title,signal:{written:primary.written,oral:primary.oral},tasks})
 }
 const id=track+'-'+target+'-'+Date.now();return{id,track,target,minutes,createdAt:Date.now(),days:rows}
}
function restoreDone(plan){
 const old=read(KEY,null);if(!old||old.track!==plan.track||old.target!==plan.target)return plan;
 const done=new Set((old.days||[]).flatMap(d=>(d.tasks||[]).filter(t=>t.done).map(t=>t.id)));
 for(const d of plan.days)for(const t of d.tasks)t.done=done.has(t.id);return plan
}
function signalText(s){const out=[];if(s.written!=null)out.push('Written '+s.written+'%');if(s.oral!=null)out.push('Oral coverage '+s.oral+'%');return out.length?out.join(' · '):'Unattempted / baseline coverage'}
function render(plan){
 currentPlan=plan;write(KEY,plan);const t=data.tracks[plan.track],ranked=clusterSignals(plan.track,t);
 $('#pdStudyOutput').hidden=false;$('#pdStudySummaryEyebrow').textContent=t.short+' · '+t.standard;$('#pdStudySummaryTitle').textContent=names[plan.track]+' study plan';
 $('#pdStudySummaryCopy').textContent=(plan.track==='multi'?t.note+' ':'')+'Priority is based on low or unattempted PilotDesk practice first, then source/figure coverage. Rebuild after new results.';
 $('#pdStudyDays').textContent=plan.days.length;$('#pdStudyDaily').textContent=plan.minutes+' min';$('#pdStudyPriority').textContent=ranked[0]?.title||'—';
 $('#pdStudyDaysList').innerHTML=plan.days.map((d,i)=>'<article class="pd-study-day"><div class="pd-study-day-head"><div><small>DAY '+String(i+1).padStart(2,'0')+' · '+esc(d.date)+'</small><b>'+esc(d.primary)+'</b></div><span>'+esc(signalText(d.signal))+'</span></div>'+d.tasks.map(t=>'<label class="pd-study-task '+(t.done?'done':'')+'"><input type="checkbox" data-task="'+esc(t.id)+'" '+(t.done?'checked':'')+'><div><b>'+esc(t.type)+'</b><span>'+esc(t.title)+'</span></div><div><span>'+esc(t.detail)+'</span></div>'+(t.href?'<a href="'+esc(t.href)+'" target="'+(/^https?:/.test(t.href)?'_blank':'_self')+'" rel="noopener">Open →</a>':'')+'</label>').join('')+'</article>').join('');
 $('#pdStudyDaysList').querySelectorAll('[data-task]').forEach(ch=>ch.addEventListener('change',()=>{for(const d of currentPlan.days)for(const t of d.tasks)if(t.id===ch.dataset.task)t.done=ch.checked;ch.closest('.pd-study-task')?.classList.toggle('done',ch.checked);write(KEY,currentPlan)}));
 $('#pdStudyOral').href='/learn/checkride-lab/?track='+encodeURIComponent(oralTrack(plan.track));const w=$('#pdStudyWritten');w.hidden=!t.knowledgeTest;if(t.knowledgeTest)w.href='/written-prep.html?track='+encodeURIComponent(plan.track)+'#pdPrepApp';
 $('#pdStudyOutput').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
async function build(){
 const track=$('#pdStudyTrack').value,target=$('#pdStudyDate').value||defaultDate(),minutes=Number($('#pdStudyMinutes').value)||45;
 $('#pdStudySourceState').textContent='Reading current PilotDesk training history…';written=await writtenDashboard(track);
 const oh=oralHistory(track);const bits=[];if(written)bits.push('Written Prep history');if(oh.length)bits.push(oh.length+' Checkride Lab session'+(oh.length===1?'':'s'));if(!bits.length)bits.push('FAA coverage matrix baseline');
 $('#pdStudySourceState').textContent='Using '+bits.join(' + ')+'.';render(restoreDone(buildPlan(track,target,minutes)));window.pdTrack?.('Study Plan Built',{track,days:currentPlan.days.length})
}
async function gate(){
 try{access=await window.PilotDeskProAccess.snapshot()}catch{}
 const host=$('#pdStudyAccess');
 if(access.isPro){host.innerHTML='<span class="eyebrow">'+(access.isSchool?'FLIGHT SCHOOL ACCESS':'PILOTDESK PRO')+'</span><h2>Study planner available.</h2><p>Written Prep, Checkride Lab history, ACS/PTS coverage, and FAA figure families can be combined into one schedule.</p>';$('#pdStudySetup').hidden=false}
 else{host.innerHTML='<div class="pd-study-lock"><div><span class="eyebrow">PILOTDESK PRO</span><h2>Source-based study planning is a Pro feature.</h2><p>Free Written Prep and public FAA references remain available.</p></div><a class="pd-btn" href="/pricing.html?from=study-plan">View Pro plan</a></div>';$('#pdStudySetup').hidden=true}
}
function init(){
 const q=new URLSearchParams(location.search),track=q.get('track');if(data.tracks[track])$('#pdStudyTrack').value=track;$('#pdStudyDate').value=q.get('date')||defaultDate();
 $('#pdStudyTrack').addEventListener('change',e=>{$('#pdStudyCoverage').href='/learn/coverage/?track='+encodeURIComponent(e.target.value)});
 $('#pdStudyCoverage').href='/learn/coverage/?track='+encodeURIComponent($('#pdStudyTrack').value);
 $('#pdBuildStudyPlan').addEventListener('click',build);$('#pdStudyPrint').addEventListener('click',()=>print());gate();document.addEventListener('pilotdesk:billing',gate);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();