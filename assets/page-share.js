(()=>{'use strict';
if(window.__pilotDeskPageShare)return;window.__pilotDeskPageShare=true;
const path=location.pathname;
const eligible=/^\/(guides\/|training\/|learn\/oral-exam\/|for-cfis\.html$|flight-training\.html$|e6b-flight-computer\.html$|weather\.html$|metar-decoder\.html$)/.test(path);
if(!eligible)return;
const qs=(s,r=document)=>r.querySelector(s);
const track=(name,data={})=>window.pdTrack?.(name,data);
function referralUrl(action='share'){
 const u=new URL(location.href);
 u.searchParams.set('utm_source','pilotdesk_page_share');
 u.searchParams.set('utm_medium','referral');
 u.searchParams.set('utm_campaign','organic_share');
 u.searchParams.set('utm_content',action);
 return u.toString();
}
function pageTitle(){return qs('h1')?.textContent?.trim()||document.title.replace(/\s*\|.*$/,'').trim()||'PilotDesk'}
function pageDescription(){return qs('meta[name="description"]')?.content?.trim()||'Aviation planning and training resources from PilotDesk.'}
async function copy(url,button){
 try{await navigator.clipboard.writeText(url);const old=button.textContent;button.textContent='Link copied';setTimeout(()=>button.textContent=old,1400);track('Page Link Copied',{path});}catch{}
}
async function share(button){
 const title=pageTitle(),text=pageDescription(),url=referralUrl('native-share');
 try{
  if(navigator.share){await navigator.share({title,text,url});track('Page Shared',{path,method:'native'});}
  else{await copy(url,button);track('Page Shared',{path,method:'copy'});}
 }catch(e){if(e?.name!=='AbortError')await copy(url,button)}
}
function init(){
 const main=qs('main');if(!main||qs('[data-pd-page-share]'))return;
 const h1=qs('h1',main);if(!h1)return;
 const bar=document.createElement('div');bar.className='pd-page-share';bar.dataset.pdPageShare='1';bar.setAttribute('aria-label','Share this PilotDesk resource');
 const label=document.createElement('span');label.textContent='Useful? Send it to another pilot.';
 const copyBtn=document.createElement('button');copyBtn.type='button';copyBtn.textContent='Copy link';
 const shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.textContent='Share';
 copyBtn.addEventListener('click',()=>copy(referralUrl('copy-link'),copyBtn));
 shareBtn.addEventListener('click',()=>share(shareBtn));
 bar.append(label,copyBtn,shareBtn);
 const hero=h1.closest('.pd-page-hero,.pd-flight-hero,.calc-hero')||h1.parentElement;
 hero.insertAdjacentElement('afterend',bar);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();