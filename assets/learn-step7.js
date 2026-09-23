(()=>{
'use strict';
if(window.__pilotDeskLearnStep7)return;window.__pilotDeskLearnStep7=true;
const path=location.pathname;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

function currentWrittenTrack(){try{return localStorage.getItem('pd-written-track')||'ppl'}catch{return'ppl'}}
function weakHref(){return '/skill-gap.html?track='+encodeURIComponent(currentWrittenTrack())}

function enhanceWrittenPrep(){
 if(path!=='/written-prep.html')return;
 const update=()=>{const a=$('#pdPrepWeakLink');if(a)a.href=weakHref()};
 update();
 $$('[data-track]').forEach(b=>b.addEventListener('click',()=>setTimeout(update,0)));
 const summary=$('#pdPrepSummary');
 if(summary)new MutationObserver(()=>{
   if(!summary.hidden&&!summary.querySelector('[data-step7-weak]')){
     const actions=summary.querySelector('.pd-prep-hero-actions');if(!actions)return;
     const a=document.createElement('a');a.className='pd-prep-secondary';a.dataset.step7Weak='1';a.href=weakHref();a.textContent='OPEN WEAK SUBJECTS';actions.insertBefore(a,actions.lastElementChild||null);
   }
 }).observe(summary,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
}

function enhanceChecklist(){
 if(path!=='/checklist-trainer.html'||$('.ct-guide-rail'))return;
 const safety=$('.safety-strip'),layout=$('.ct-layout');if(!layout)return;
 const rail=document.createElement('div');rail.className='ct-guide-rail';rail.setAttribute('aria-label','Checklist practice steps');
 rail.innerHTML='<div><span>01</span><b>Select aircraft + set</b><small>Keep procedures filed to the airplane they belong to.</small></div><div><span>02</span><b>Recall, then reveal</b><small>Use Flow mode when you want to answer before seeing the response.</small></div><div><span>03</span><b>Complete + advance</b><small>Mark the item complete and move through the set one step at a time.</small></div>';
 (safety||layout).insertAdjacentElement(safety?'afterend':'beforebegin',rail);
}

function enhanceOral(){
 if(!path.startsWith('/learn/oral-exam/'))return;
 const list=$('#pdOralList');if(!list)return;
 let strip=$('#pdOralSubjectStrip');
 if(!strip){strip=document.createElement('div');strip.id='pdOralSubjectStrip';strip.className='pd-oral-subject-strip';strip.setAttribute('aria-label','Subjects in this rating');list.insertAdjacentElement('beforebegin',strip)}
 const render=()=>{
   const items=$$('.pd-oral-item',list);strip.hidden=!items.length;
   strip.innerHTML=items.map((item,i)=>{const label=item.querySelector('summary b,.pd-oral-lock-row b')?.textContent?.replace(/^\d+\.\s*/,'')||('Subject '+(i+1));return '<button type="button" data-step7-subject="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+label+'</b></button>'}).join('');
 };
 strip.addEventListener('click',e=>{const b=e.target.closest('[data-step7-subject]');if(!b)return;$$('.pd-oral-item',list)[Number(b.dataset.step7Subject)]?.scrollIntoView({behavior:'smooth',block:'start'})});
 new MutationObserver(render).observe(list,{childList:true,subtree:false});render();
}

function slug(s){return String(s||'section').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'section'}
function enhanceGuide(){
 if(!path.startsWith('/guides/')||!path.endsWith('.html'))return;
 const main=$('main.content-page');if(!main||main.classList.contains('pd-guide-reader'))return;
 const headings=$$('h2',main);if(headings.length<2)return;
 main.classList.add('pd-guide-reader');
 const used=new Set($$('[id]').map(x=>x.id));
 headings.forEach(h=>{if(h.id)return;let base=slug(h.textContent),id=base,n=2;while(used.has(id))id=base+'-'+n++;h.id=id;used.add(id)});
 const rail=document.createElement('nav');rail.className='pd-guide-reader-rail';rail.setAttribute('aria-label','In this guide');
 rail.innerHTML='<span>IN THIS GUIDE</span>'+headings.slice(0,8).map(h=>'<a href="#'+h.id+'">'+h.textContent.trim()+'</a>').join('');
 headings[0].insertAdjacentElement('beforebegin',rail);
}

function init(){enhanceWrittenPrep();enhanceChecklist();enhanceOral();enhanceGuide()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
