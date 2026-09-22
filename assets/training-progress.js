(()=>{'use strict';
const $=s=>document.querySelector(s);
const names={ppl:'Private Pilot',ira:'Instrument Rating',cpl:'Commercial Pilot',multi:'Multi-Engine',cfi:'CFI',cfii:'CFII',atp:'ATP'};
const links={ppl:'/training/private-pilot.html',ira:'/training/instrument-rating.html',cpl:'/training/commercial-pilot.html',multi:'/training/multiengine.html',cfi:'/training/cfi.html',cfii:'/training/cfii.html',atp:'/training/atp.html'};
const prep={ppl:'ppl',ira:'ira',cpl:'cpl',multi:'cpl',cfi:'cfi',cfii:'cfii',atp:'atp'};
const oral={ppl:'private',ira:'instrument',cpl:'commercial',multi:'multi',cfi:'cfi',cfii:'cfii'};
const get=(k)=>{try{return localStorage.getItem(k)||''}catch{return''}};
const set=(k,v)=>{try{if(v)localStorage.setItem(k,v);else localStorage.removeItem(k)}catch{}};
function daysUntil(v){if(!v)return null;const d=new Date(v+'T12:00:00'),n=new Date();n.setHours(12,0,0,0);return Math.ceil((d-n)/86400000)}
function render(){
 const goal=get('pd-training-goal'),date=get('pd-training-date'),name=names[goal]||'';
 const g=$('#pdTrainingGoalLocal'),d=$('#pdTrainingDateLocal');if(g)g.value=goal;if(d)d.value=date;
 const next=$('#pdTrainingNext'),count=$('#pdTrainingCountdown');
 if(!name){if(next)next.hidden=true;if(count)count.hidden=true;return}
 if(next)next.hidden=false;
 $('#pdTrainingNextTitle').textContent=name;
 const days=daysUntil(date);
 $('#pdTrainingNextCopy').textContent=days===null?'No target date set yet.':days>1?days+' days until your target date.':days===1?'Your target date is tomorrow.':days===0?'Your target date is today.':'Your saved target date has passed. Update it when you schedule the next milestone.';
 const a=$('#pdTrainingRatingLink');if(a)a.href=links[goal]||'/flight-training.html';
 const w=$('#pdTrainingWrittenLink');if(w)w.href='/written-prep.html?track='+encodeURIComponent(prep[goal]||goal);
 const o=$('#pdTrainingOralLink');if(o)o.href=oral[goal]?'/learn/oral-exam/?track='+encodeURIComponent(oral[goal]):'/learn/oral-exam/';
 if(count&&days!==null){count.hidden=false;$('#pdTrainingDays').textContent=String(days)}else if(count)count.hidden=true;
 document.querySelectorAll('.pd-training-ratings a').forEach(x=>x.classList.toggle('is-current-training',x.getAttribute('href')===links[goal]));
}
function save(){
 const goal=$('#pdTrainingGoalLocal')?.value||'',date=$('#pdTrainingDateLocal')?.value||'';
 set('pd-training-goal',goal);set('pd-training-date',date);
 window.pdTrack?.('Training Focus Saved',{goal:goal||'none',hasDate:date?'yes':'no'});
 render();
}
$('#pdTrainingSaveLocal')?.addEventListener('click',save);
document.querySelectorAll('.pd-training-ratings a').forEach(a=>a.addEventListener('click',()=>{const pair=Object.entries(links).find(([,href])=>href===a.getAttribute('href'));if(pair){set('pd-training-goal',pair[0]);window.pdTrack?.('Training Rating Opened',{goal:pair[0]})}}));
render();
})();