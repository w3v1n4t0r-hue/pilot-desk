(()=>{'use strict';
const root=document.querySelector('.oral-study');if(!root)return;
const key='pd-oral-'+root.dataset.track;let marks={};let available=true;
try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))marks=saved}catch{available=false}
const cards=[...root.querySelectorAll('.oral-topic')],search=document.querySelector('#oralSearch'),filter=document.querySelector('#oralFilter');
function render(){let shown=0;const q=search.value.trim().toLowerCase();for(const card of cards){const mark=marks[card.id]||'';card.querySelectorAll('[data-mark]').forEach(b=>b.setAttribute('aria-pressed',String(!!b.dataset.mark&&b.dataset.mark===mark)));const matches=card.textContent.toLowerCase().includes(q)&&(filter.value==='all'||(filter.value==='unmarked'?!mark:mark===filter.value));card.hidden=!matches;if(matches)shown++}document.querySelector('#oralCount').textContent=`${shown} of ${cards.length} questions · ${cards.filter(c=>marks[c.id]==='understood').length} marked understood`;document.querySelector('#oralEmpty').hidden=shown!==0;if(!available)document.querySelector('#oralStorage').textContent='Device storage is unavailable. Your review marks will last for this visit only.'}
root.addEventListener('click',e=>{const b=e.target.closest('[data-mark]');if(!b)return;const id=b.closest('.oral-topic').id;if(b.dataset.mark)marks[id]=b.dataset.mark;else delete marks[id];try{localStorage.setItem(key,JSON.stringify(marks))}catch{available=false}render()});
search.addEventListener('input',render);filter.addEventListener('change',render);
document.querySelector('#oralPrint').addEventListener('click',()=>{const closed=[...root.querySelectorAll('details:not([open])')];closed.forEach(d=>d.open=true);window.addEventListener('afterprint',()=>closed.forEach(d=>d.open=false),{once:true});window.print()});
function revealHash(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}const card=cards.find(c=>c.id===id);if(!card)return;search.value='';filter.value='all';render();card.scrollIntoView({block:'start'})}window.addEventListener('hashchange',revealHash);render();if(location.hash)revealHash();
try{localStorage.setItem('pd-oral-last',JSON.stringify({path:location.pathname,title:document.querySelector('h1').textContent}))}catch{}
})();
