(()=>{
'use strict';
if(location.pathname!=='/learn/coverage/'&&location.pathname!=='/learn/coverage/index.html')return;
const data=window.PilotDeskTrainingStandards,$=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));
if(!data)return;
const order=['ppl','ira','cpl','multi','cfi','cfii','atp'];let current='ppl';
function sourceName(s){try{const u=new URL(s);return u.hostname==='www.faa.gov'?'FAA source':s}catch{return s}}
function supplementUrl(track){return data.FAA[track==='ppl'?'pplSupplement':track==='ira'||track==='cfii'?'iraSupplement':track==='cpl'||track==='multi'?'cplSupplement':track==='cfi'?'cfiSupplement':'atpSupplement']}
function figureHtml(track,entry){const url=supplementUrl(track);return entry.figures.map(f=>'<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(entry.supplement)+' · Fig '+esc(f)+' ↗</a>').join('')}
function renderTabs(){const host=$('#pdCoverageTabs');host.innerHTML=order.map(k=>{const t=data.tracks[k];return '<button type="button" data-track="'+k+'" aria-pressed="'+String(k===current)+'">'+esc(t.short)+'</button>'}).join('');host.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{current=b.dataset.track;const u=new URL(location.href);u.searchParams.set('track',current);history.replaceState(null,'',u);render()}))}
function render(){
 const t=data.getTrack(current);document.title=t.title+' FAA '+t.standardType+' Coverage Matrix | PilotDesk';
 $('#pdCoverageShort').textContent=t.short+' · '+t.standardType;$('#pdCoverageTitle').textContent=t.title;$('#pdCoverageStandard').innerHTML='<a href="'+esc(t.standardUrl)+'" target="_blank" rel="noopener">'+esc(t.standard)+' ↗</a>';
 $('#pdCoverageTarget').textContent=t.questionTarget+'+';$('#pdCoverageType').textContent=t.standardType;$('#pdCoverageTest').textContent=t.testCode;
 const note=$('#pdCoverageNote');if(t.note){note.hidden=false;note.textContent=t.note}else note.hidden=true;
 const host=$('#pdCoverageGrid');host.innerHTML=t.clusters.map((c,i)=>'<article class="pd-coverage-row"><div><small>CLUSTER</small><b>'+String(i+1).padStart(2,'0')+'</b></div><div><small>SUBJECT</small><b>'+esc(c.title)+'</b><span class="pd-coverage-codes">'+esc(c.codes.join(' · '))+'</span></div><div><small>CONTROLLING / STUDY SOURCES</small><span>'+c.sources.map(s=>/^https?:/.test(s)?'<a href="'+esc(s)+'" target="_blank" rel="noopener">'+esc(sourceName(s))+' ↗</a>':esc(s)).join(' · ')+'</span></div><div class="pd-coverage-figures"><small>FAA FIGURE FAMILIES / ORAL CROSSWALK</small>'+(c.figures.length?c.figures.map(x=>figureHtml(current,x)).join(''):'<span>No fixed testing-supplement figure assigned to this cluster.</span>')+(c.oral.length?'<span>Checkride Lab: '+esc(c.oral.join(' · '))+'</span>':'')+'</div></article>').join('');
 const written=$('#pdCoverageWritten');if(t.knowledgeTest){const key=current==='multi'?'cpl':current;written.hidden=false;written.href='/written-prep.html?track='+encodeURIComponent(key)+'#pdPrepApp'}else written.hidden=true;
 const oralTrack=current==='ppl'?'private':current==='ira'?'instrument':current==='cpl'?'commercial':current;$('#pdCoverageOral').href='/learn/checkride-lab/?track='+encodeURIComponent(oralTrack);
 $('#pdCoveragePlan').href='/learn/study-plan/?track='+encodeURIComponent(current);document.querySelectorAll('#pdCoverageTabs [data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===current)));
}
function init(){const q=new URLSearchParams(location.search).get('track');if(order.includes(q))current=q;renderTabs();render()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();