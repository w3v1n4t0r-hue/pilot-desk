(()=>{
'use strict';
const path=location.pathname,home=path==='/'||path==='/index.html';
const addStyle=(href,key)=>{if(document.querySelector(`link[data-${key}]`)||[...document.styleSheets].some(s=>{try{return new URL(s.href,location.href).pathname===href}catch{return false}}))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)};
const addScript=(src,key)=>{if([...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname===src}catch{return false}}))return;const s=document.createElement('script');s.src=src;s.defer=true;s.dataset[key]='1';document.head.appendChild(s)};
addStyle('/assets/home-command-center.css','pdHomeCommandCss');
if(home){addStyle('/assets/home-task-polish.css','pdHomeTaskPolish');document.documentElement.classList.add('pd-home-command-center');addScript('/assets/home-command-center.js','pdHomeCommand')}
addScript('/assets/context-widget.js','pdContextWidget');
const applyBrand=()=>{const brand=document.querySelector('.brand');if(!brand)return;let mark=brand.querySelector('.brandmark');if(!mark){mark=document.createElement('span');mark.className='brandmark';brand.insertBefore(mark,brand.firstChild)}let img=mark.querySelector(':scope > img[src="/assets/icon.svg"]');if(!img){mark.replaceChildren();img=document.createElement('img');img.src='/assets/icon.svg';img.alt='';img.width=42;img.height=42;img.setAttribute('aria-hidden','true');mark.appendChild(img)}mark.setAttribute('aria-label','PilotDesk')};
const loadGrowth=()=>{if(window.__pilotDeskGrowthSuite||[...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname==='/assets/growth-suite.js'}catch{return false}}))return;const s=document.createElement('script');s.src='/assets/growth-suite.js';s.defer=true;s.dataset.pdGrowthSuite='1';document.head.appendChild(s)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{applyBrand();loadGrowth()},{once:true});else{applyBrand();loadGrowth()}
})();
