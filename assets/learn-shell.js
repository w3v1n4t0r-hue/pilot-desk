(()=>{
'use strict';
const routes=[
 ['/written-prep.html','Written Prep'],
 ['/skill-gap.html','Weak Subjects'],
 ['/flight-training.html','Rating Hubs'],
 ['/learn/oral-exam/','Oral Prep'],
 ['/checklist-trainer.html','Checklist Practice'],
 ['/training/acs-far-reference.html','ACS / FAR']
];
const path=location.pathname;
if(!routes.some(([p])=>p.endsWith('/')?path.startsWith(p):path===p))return;
function init(){
 const main=document.querySelector('main');if(!main||document.querySelector('.pd-learn-subnav'))return;
 const nav=document.createElement('nav');nav.className='pd-learn-subnav';nav.setAttribute('aria-label','PilotDesk learning tools');
 routes.forEach(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(path===href||(href.endsWith('/')&&path.startsWith(href)))a.setAttribute('aria-current','page');nav.append(a)});
 const hero=main.querySelector('.pd-prep-hero,.pd-gap-hero,.pd-page-hero,.pd-flight-hero,.calc-hero')||main.firstElementChild;
 if(hero)hero.insertAdjacentElement('afterend',nav);else main.prepend(nav);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();