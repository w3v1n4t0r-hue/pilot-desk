(()=>{
'use strict';
if(location.pathname!=='/learn/checkride-lab/'&&location.pathname!=='/learn/checkride-lab/index.html')return;
const $=s=>document.querySelector(s),data=window.PilotDeskCheckrideData||{};
const state={access:null,track:'private',mode:'adaptive',session:null,current:null,probe:null,probeDepth:0,awaitingReview:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s.-]/g,' ').replace(/\s+/g,' ').trim();
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
function scoreAnswer(answer,q){
 const n=norm(answer),details=q.concepts.map(([label,terms])=>({label,covered:terms.some(t=>n.includes(norm(t))),terms}));
 const matched=details.filter(x=>x.covered),missing=details.filter(x=>!x.covered),score=Math.round(matched.length/Math.max(1,details.length)*100);
 return{score,matched,missing};
}
function addTurn(role,label,title,body=''){
 const host=$('#pdLabConversation'),div=document.createElement('div');div.className='pd-lab-turn '+role;
 div.innerHTML='<small>'+esc(label)+'</small><b>'+esc(title)+'</b>'+(body?'<p>'+esc(body)+'</p>':'');host.append(div);div.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
function modeLabel(){return state.mode==='mock'?'MOCK ORAL':'ADAPTIVE DRILL'}
function updateSetup(){const b=$('#pdLabStart');if(b)b.textContent=state.mode==='mock'?'Start mock oral':'Start adaptive drill';document.querySelectorAll('[data-lab-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.labMode===state.mode)))}
function selectTrack(){state.track=$('#pdLabTrack')?.value||'private';return data[state.track]}
function makeSession(){
 const t=selectTrack(),base=shuffle(t.items),target=state.mode==='mock'?base.length:Math.min(6,base.length);
 return{track:state.track,mode:state.mode,target,queue:base.slice(0,target),records:[],baseAsked:0,startedAt:Date.now(),finishedAt:null};
}
function currentProgress(){
 const s=state.session,t=data[s.track];$('#pdLabSessionMode').textContent=modeLabel();$('#pdLabSessionTitle').textContent=t.title;
 $('#pdLabCount').textContent=Math.min(s.baseAsked+1,s.target)+' / '+s.target;$('#pdLabArea').textContent=state.current?.area||state.probe?.area||'';
}
function askBase(){
 const s=state.session;if(!s.queue.length)return finish();
 state.current=s.queue.shift();state.probe=null;state.probeDepth=0;s.baseAsked++;currentProgress();
 addTurn('examiner','EXAMINER · '+state.current.area,state.current.title,state.current.prompt);
 $('#pdLabAnswer').value='';$('#pdLabAnswer').focus();
}
function askProbe(record){
 const q=record.question,missing=record.coverage.missing;
 const idx=Math.min(state.probeDepth,q.probes.length-1),prompt=q.probes[idx]||q.probes[0];
 state.probe={area:q.area,title:'Follow-up',prompt,record};state.probeDepth++;
 currentProgress();addTurn('examiner','EXAMINER · FOLLOW-UP',q.title,prompt);$('#pdLabAnswer').value='';$('#pdLabAnswer').focus();
}
function feedbackHtml(record){
 const cov=record.coverage;
 return '<h3>Coverage signal · '+cov.score+'%</h3><p class="fine">This checks whether your response mentioned PilotDesk’s curated concepts. It is not semantic examiner grading.</p><div class="pd-lab-coverage">'+record.question.concepts.map(([label])=>'<div data-state="'+(cov.matched.some(x=>x.label===label)?'covered':'missing')+'"><b>'+esc(label)+'</b><span>'+(cov.matched.some(x=>x.label===label)?'covered':'review')+'</span></div>').join('')+'</div><p><b>Source:</b> '+esc(record.question.source)+'</p><div class="pd-actions"><button class="pd-btn" type="button" id="pdLabContinue">Continue</button></div>';
}
function showReview(record){
 const box=$('#pdLabReview');box.innerHTML=feedbackHtml(record);box.hidden=false;state.awaitingReview=true;$('#pdLabAnswerForm').hidden=true;
 $('#pdLabContinue').addEventListener('click',()=>{box.hidden=true;state.awaitingReview=false;$('#pdLabAnswerForm').hidden=false;askBase()},{once:true});
}
function submitAnswer(answer){
 const s=state.session;if(!s||state.awaitingReview)return;
 if(state.probe){
  const p=state.probe,coverage=scoreAnswer(answer,p.record.question);addTurn('user','YOUR FOLLOW-UP ANSWER','Response',answer);
  p.record.probes.push({prompt:p.prompt,answer,coverage});p.record.coverage.score=Math.round((p.record.coverage.score+coverage.score)/2);
  const stillWeak=p.record.coverage.score<45&&state.probeDepth<2&&p.record.question.probes.length>state.probeDepth;
  state.probe=null;
  if(stillWeak)return askProbe(p.record);
  if(state.mode==='adaptive')return showReview(p.record);
  return askBase();
 }
 const q=state.current,coverage=scoreAnswer(answer,q),record={question:q,answer,coverage,probes:[]};s.records.push(record);
 addTurn('user','YOUR ANSWER',q.title,answer);
 const probeCount=coverage.score<45?2:coverage.score<75?1:0;
 if(probeCount&&q.probes?.length)return askProbe(record);
 if(state.mode==='adaptive')return showReview(record);
 askBase();
}
function summary(){
 const s=state.session,rows=s.records.map(r=>({area:r.question.area,title:r.question.title,score:r.coverage.score,missing:r.coverage.missing.map(x=>x.label),source:r.question.source}));
 const avg=rows.length?Math.round(rows.reduce((a,b)=>a+b.score,0)/rows.length):0,sorted=[...rows].sort((a,b)=>a.score-b.score);
 return{rows,avg,weak:sorted[0],strong:sorted.at(-1)};
}
function finish(){
 const s=state.session;if(!s)return;s.finishedAt=Date.now();$('#pdLabSession').hidden=true;$('#pdLabSummary').hidden=false;
 const x=summary(),t=data[s.track];$('#pdLabSummaryTitle').textContent=t.title+' '+(s.mode==='mock'?'mock oral':'adaptive drill');
 $('#pdLabSummaryScore').textContent=x.avg+'%';$('#pdLabStrong').textContent=x.strong?.area||'—';$('#pdLabWeak').textContent=x.weak?.area||'—';$('#pdLabAnswered').textContent=String(x.rows.length);
 $('#pdLabBreakdown').innerHTML=x.rows.map(r=>'<div class="pd-lab-breakdown-row"><b>'+esc(r.title)+'</b><strong>'+r.score+'%</strong><span>'+(r.missing.length?'Review: '+esc(r.missing.join(' · ')):'Core concepts detected')+'</span></div>').join('');
 try{localStorage.setItem('pd-checkride-last',JSON.stringify({track:s.track,mode:s.mode,finishedAt:s.finishedAt,avg:x.avg,rows:x.rows}))}catch{}
 window.pdTrack?.('Checkride Lab Completed',{track:s.track,mode:s.mode,score:x.avg});
}
function start(){
 state.session=makeSession();state.current=null;state.probe=null;state.awaitingReview=false;$('#pdLabSetup').hidden=true;$('#pdLabSummary').hidden=true;$('#pdLabSession').hidden=false;$('#pdLabConversation').replaceChildren();$('#pdLabReview').hidden=true;$('#pdLabAnswerForm').hidden=false;
 addTurn('examiner','CHECKRIDE LAB',data[state.track].title,state.mode==='mock'?'I will work across the rating. I may probe an answer before moving on. Feedback comes at the end.':'I will ask a question, probe missing concepts when useful, and show a coverage review before we move on.');
 askBase();
}
function pdfEscape(s){return String(s||'').replace(/[\\()]/g,m=>'\\'+m).replace(/[^\x20-\x7E]/g,'-')}
function wrap(text,width=92){const words=String(text||'').split(/\s+/),out=[];let line='';for(const w of words){if(!w)continue;if((line+' '+w).trim().length>width){if(line)out.push(line);line=w}else line=(line+' '+w).trim()}if(line)out.push(line);return out}
function pdfBlob(lines){
 const pages=[];for(let i=0;i<lines.length;i+=48)pages.push(lines.slice(i,i+48));if(!pages.length)pages.push(['PilotDesk Checkride Packet']);
 const objects=[];objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
 const kids=[];let n=4;
 pages.forEach(pg=>{const pageObj=n++,contentObj=n++;kids.push(pageObj+' 0 R');const body='BT\n/F1 10 Tf\n50 750 Td\n'+pg.map((l,i)=>(i?'0 -14 Td\n':'')+'('+pdfEscape(l)+') Tj').join('\n')+'\nET';objects[pageObj]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents '+contentObj+' 0 R >>';objects[contentObj]='<< /Length '+body.length+' >>\nstream\n'+body+'\nendstream'});
 objects[2]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+kids.length+' >>';
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=i+' 0 obj\n'+objects[i]+'\nendobj\n'}const xref=pdf.length;pdf+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';for(let i=1;i<objects.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return new Blob([pdf],{type:'application/pdf'})
}
function packetLines(withResults=false){
 const t=data[state.session?.track||state.track]||selectTrack(),lines=['PILOTDESK CHECKRIDE STUDY PACKET',t.title+' | '+t.standard,'Generated '+new Date().toLocaleString(),'','Use current FAA sources and aircraft-approved data. PilotDesk is a study aid, not an examiner grade.',''];
 if(withResults&&state.session){const x=summary();lines.push('SESSION DEBRIEF','Coverage signal: '+x.avg+'%','Review first: '+(x.weak?.area||'—'),'Strongest: '+(x.strong?.area||'—'),'');for(const r of state.session.records){lines.push(r.question.title+' | '+r.question.area+' | '+r.coverage.score+'%');lines.push(...wrap(r.question.prompt));lines.push('Source: '+r.question.source);if(r.coverage.missing.length)lines.push('Review: '+r.coverage.missing.map(x=>x.label).join(', '));lines.push('Your answer:');lines.push(...wrap(r.answer||''));lines.push('')}}else{lines.push('SOURCE CHECKLIST',t.standard,'14 CFR / AIM / FAA handbooks as applicable','Current charts, weather, NOTAMs, and procedures','Aircraft POH/AFM and supplements','');for(const q of t.items){lines.push(q.title+' | '+q.area);lines.push(...wrap(q.prompt));lines.push('Source: '+q.source);lines.push('Notes: _________________________________________________','________________________________________________________','')}}
 return lines;
}
function downloadPacket(withResults=false){
 const t=data[state.session?.track||state.track]||selectTrack(),blob=pdfBlob(packetLines(withResults)),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pilotdesk-'+state.track+'-checkride-'+(withResults?'debrief':'packet')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);window.pdTrack?.('Checkride Packet Downloaded',{track:state.track,results:withResults})
}
async function gate(){
 const host=$('#pdLabAccess');let access={isPro:false};try{access=await window.PilotDeskProAccess.snapshot()}catch{}state.access=access;
 if(access.isPro){host.innerHTML='<div><span class="eyebrow">'+(access.isSchool?'FLIGHT SCHOOL ACCESS':'PILOTDESK PRO')+'</span><h2>Checkride Lab available.</h2><p>Adaptive examiner practice, mock oral sessions, and PDF packets are active on this account.</p></div>';$('#pdLabSetup').hidden=false}
 else{host.innerHTML='<div class="pd-lab-lock"><div><span class="eyebrow">PILOTDESK PRO</span><h2>Checkride Lab is a Pro feature.</h2><p>Free PilotDesk still includes the oral-prep preview. Pro adds adaptive examiner conversations, full mock-orals, debriefs, and PDF study packets.</p></div><a class="pd-btn" href="/pricing.html?from=checkride-lab">View Pro plan</a></div>';$('#pdLabSetup').hidden=true}
}
function init(){
 const q=new URLSearchParams(location.search),track=q.get('track');if(data[track]){$('#pdLabTrack').value=track;state.track=track}
 document.querySelectorAll('[data-lab-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.labMode;updateSetup()}));
 $('#pdLabTrack').addEventListener('change',e=>state.track=e.target.value);$('#pdLabStart').addEventListener('click',start);
 $('#pdLabAnswerForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#pdLabAnswer').value.trim();if(v.length<4)return;submitAnswer(v)});
 $('#pdLabStop').addEventListener('click',finish);$('#pdLabAgain').addEventListener('click',()=>{$('#pdLabSummary').hidden=true;$('#pdLabSetup').hidden=false});
 $('#pdLabPacket').addEventListener('click',()=>downloadPacket(false));$('#pdLabDownloadResults').addEventListener('click',()=>downloadPacket(true));
 updateSetup();gate();document.addEventListener('pilotdesk:billing',gate);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();