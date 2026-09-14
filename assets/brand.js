(()=>{
'use strict';
if(window.__pilotDeskBrandStable)return;window.__pilotDeskBrandStable=true;
const applyBrand=()=>{
  const brand=document.querySelector('.brand');if(!brand)return false;
  let mark=brand.querySelector('.brandmark');
  if(!mark){mark=document.createElement('span');mark.className='brandmark';brand.insertBefore(mark,brand.firstChild)}
  let img=mark.querySelector(':scope > img[src="/assets/icon.svg"]');
  if(!img){mark.replaceChildren();img=document.createElement('img');img.src='/assets/icon.svg';img.alt='';img.width=42;img.height=42;img.setAttribute('aria-hidden','true');mark.appendChild(img)}
  mark.setAttribute('aria-label','PilotDesk');
  const word=brand.querySelector('b'),tag=brand.querySelector('small');
  if(word)word.textContent='PILOT DESK';
  if(tag)tag.textContent='DESK // OPS';
  return true;
};
const loadGrowth=()=>{
  if(window.__pilotDeskGrowthSuite||[...document.scripts].some(s=>{try{return new URL(s.src,location.href).pathname==='/assets/growth-suite.js'}catch{return false}}))return;
  const s=document.createElement('script');s.src='/assets/growth-suite.js';s.async=true;s.dataset.pdGrowthSuite='1';document.head.appendChild(s);
};
if(!applyBrand()&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyBrand,{once:true});
const later=()=>setTimeout(loadGrowth,1200);
if(document.readyState==='complete')later();else addEventListener('load',later,{once:true});
})();
