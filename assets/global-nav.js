(()=>{
'use strict';
const NAV=[
  ['/', 'Calculators'],
  ['/planner.html','Planner'],
  ['/aircraft.html','Aircraft'],
  ['/weather.html','Weather'],
  ['/guides.html','Guides'],
  ['/about.html','About'],
  ['/sources.html','Sources'],
  ['/legal/privacy.html','Privacy']
];
function isCurrent(href,path){
  if(href==='/')return path==='/'||path==='/index.html'||path==='/weight-balance.html'||path.startsWith('/calculators/');
  if(href==='/planner.html')return ['/planner.html','/route-planner.html','/procedures.html','/poh-chart-studio.html','/checklist-trainer.html'].includes(path);
  if(href==='/guides.html')return path==='/guides.html'||path.startsWith('/guides/');
  return path===href;
}
function installStyle(){if(document.getElementById('pd-global-nav-style'))return;const s=document.createElement('style');s.id='pd-global-nav-style';s.textContent=`.topbar .pd-global-nav{gap:18px}.topbar .pd-global-nav a[aria-current="page"]{color:#fff}@media(max-width:1050px) and (min-width:821px){.topbar .pd-global-nav{gap:11px}.topbar .pd-global-nav a{font-size:12px}}@media(max-width:820px){.topbar{position:sticky}.topbar .menu-btn{display:block;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:8px;padding:7px 10px;font-size:18px;line-height:1;cursor:pointer}.topbar .pd-global-nav{display:none;position:absolute;left:12px;right:12px;top:calc(100% + 8px);padding:10px;background:rgba(12,14,17,.98);border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.55);grid-template-columns:1fr 1fr;gap:5px;z-index:80}.topbar .pd-global-nav.open{display:grid}.topbar .pd-global-nav a{padding:10px 11px;border-radius:7px}.topbar .pd-global-nav a:hover,.topbar .pd-global-nav a[aria-current="page"]{background:var(--panel2)}}@media(max-width:460px){.topbar .pd-global-nav{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function apply(){
  installStyle();const path=location.pathname;
  document.querySelectorAll('header.topbar').forEach(header=>{
    const nav=header.querySelector(':scope > nav');if(!nav)return;
    nav.classList.add('pd-global-nav');
    nav.replaceChildren(...NAV.map(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(isCurrent(href,path))a.setAttribute('aria-current','page');return a}));
    let menu=header.querySelector('[data-menu]');
    if(!menu){menu=document.createElement('button');menu.type='button';menu.className='menu-btn';menu.dataset.menu='';menu.setAttribute('aria-label','Open navigation');menu.setAttribute('aria-expanded','false');menu.textContent='☰';header.insertBefore(menu,nav)}
    if(!menu.dataset.pdBound){menu.dataset.pdBound='1';menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}});document.addEventListener('click',e=>{if(!header.contains(e.target)){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}})}
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
})();
