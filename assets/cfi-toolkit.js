(()=>{'use strict';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const track=(name,data={})=>window.pdTrack?.(name,data);
async function copyText(text,button,done='Copied'){
  try{await navigator.clipboard.writeText(text);const old=button?.textContent;if(button)button.textContent=done;setTimeout(()=>{if(button)button.textContent=old},1400);return true}catch{return false}
}
function absolute(url){try{return new URL(url,location.origin).href}catch{return url}}
async function shareToolkit(button){
 const url=absolute('/for-cfis.html?utm_source=cfi_share&utm_medium=referral&utm_campaign=instructor_outreach');
 const payload={title:'PilotDesk CFI Toolkit',text:'Free aviation teaching tools, student scenarios, and shareable PilotDesk resources.',url};
 try{
  if(navigator.share)await navigator.share(payload);
  else await copyText(url,button,'Toolkit link copied');
  track('CFI Toolkit Shared',{source:'toolkit'});
 }catch(e){if(e?.name!=='AbortError')await copyText(url,button,'Link copied')}
}
function initScenario(card){
 const id=card.dataset.cfiScenario||'scenario';
 const prompt=card.dataset.cfiPrompt||'';
 const url=absolute(card.dataset.cfiUrl||'/for-cfis.html');
 qs('[data-cfi-copy-prompt]',card)?.addEventListener('click',async e=>{
   const ok=await copyText(prompt,e.currentTarget,'Prompt copied');
   if(ok)track('CFI Student Prompt Copied',{scenario:id});
 });
 qs('[data-cfi-copy-link]',card)?.addEventListener('click',async e=>{
   const ok=await copyText(url,e.currentTarget,'Student link copied');
   if(ok)track('CFI Student Link Copied',{scenario:id});
 });
 qs('a[href]',card)?.addEventListener('click',()=>track('CFI Scenario Opened',{scenario:id}));
}
function init(){
 qsa('[data-share-cfi]').forEach(b=>b.addEventListener('click',()=>shareToolkit(b)));
 qsa('[data-cfi-scenario]').forEach(initScenario);
 qsa('.pd-cfi-workflow-links a').forEach(a=>a.addEventListener('click',()=>track('CFI Teaching Tool Opened',{tool:(a.textContent||'').replace(/\s*→\s*$/,'').slice(0,60)})));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();