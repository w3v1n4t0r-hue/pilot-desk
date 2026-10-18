(()=>{
'use strict';
const routes=[
 ['/written-prep.html','Written Prep'],
 ['/skill-gap.html','Weak Subjects'],
 ['/flight-training.html','Study by Rating'],
 ['/learn/oral-exam/','Oral Prep'],
 ['/learn/checkride-lab/','Checkride Lab'],
 ['/learn/study-plan/','Study Plan'],
 ['/learn/coverage/','Topics by FAA Standard'],
 ['/checklist-trainer.html','Checklist Practice'],
 ['/training/acs-far-reference.html','FAA Standards & Rules']
];
const path=location.pathname;
if(!routes.some(([p])=>p.endsWith('/')?path.startsWith(p):path===p))return;
function init(){
 const main=document.querySelector('main');if(!main||document.querySelector('.pd-learn-subnav'))return;
 const nav=document.createElement('nav');nav.className='pd-learn-subnav';nav.setAttribute('aria-label','PilotDesk learning tools');
 routes.forEach(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(path===href||(href.endsWith('/')&&path.startsWith(href)))a.setAttribute('aria-current','page');nav.append(a)});
 const hero=main.querySelector('.pd-prep-hero,.pd-gap-hero,.pd-page-hero,.pd-flight-hero,.pd-lab-hero,.calc-hero')||main.querySelector('h1')||main.firstElementChild;
 const intro=hero?.tagName==='H1'&&hero.nextElementSibling?.tagName==='P'?hero.nextElementSibling:hero;
 const workAnchor=main.querySelector('#pdWorkSurface');
 if(workAnchor)workAnchor.insertAdjacentElement('afterend',nav);else if(intro)intro.insertAdjacentElement('afterend',nav);else main.prepend(nav);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
