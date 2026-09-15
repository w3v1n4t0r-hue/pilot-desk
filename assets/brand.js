(()=>{
'use strict';
if(window.__pilotDeskBrandStable)return;window.__pilotDeskBrandStable=true;
const applyBrand=()=>{
  const brand=document.querySelector('.brand');if(!brand)return false;
  let mark=brand.querySelector('.brandmark');
  if(!mark){mark=document.createElement('span');mark.className='brandmark';brand.insertBefore(mark,brand.firstChild)}
  let img=mark.querySelector(':scope > img[src="/assets/icon.svg"]');
  if(!img){mark.replaceChildren();img=document.createElement('img');img.src='/assets/icon.svg';img.alt='';img.width=36;img.height=36;img.setAttribute('aria-hidden','true');mark.appendChild(img)}
  mark.setAttribute('aria-label','PilotDesk');
  const word=brand.querySelector('b'),tag=brand.querySelector('small');
  if(word)word.textContent='PilotDesk';
  if(tag)tag.textContent='FLIGHT TOOLS';
  return true;
};
if(!applyBrand()&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyBrand,{once:true});
})();
