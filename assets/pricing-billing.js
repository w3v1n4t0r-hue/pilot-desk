(()=>{
'use strict';
const $=s=>document.querySelector(s);
const note=(msg,kind='')=>{const el=$('#pdPricingBillingStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg};
async function render(){
 const b=window.PilotDeskBilling;if(!b)return;const s=await b.ready;
 const pro=$('#pdStartPro'),school=$('#pdStartSchool');
 if(s.isPro){
  if(pro){pro.textContent=s.isSchool?'Included with Flight School':'Manage Pro';pro.dataset.action='portal'}
  if(school&&s.isSchool){school.textContent='Manage Flight School';school.dataset.action='portal'}
  note(s.subscription.cancel_at_period_end?'Your paid plan remains active until the current billing period ends.':'Your PilotDesk '+(s.isSchool?'Flight School':'Pro')+' subscription is active.','good');
 }else if(!s.configured){
  if(pro){pro.setAttribute('aria-disabled','true');pro.classList.add('disabled')}
  note('The PilotDesk paid product is installed, but Stripe checkout is not connected yet. No card can be charged until billing credentials are added.','warn');
 }else note('Secure Stripe checkout is available. Sign in first so Pro stays attached to your PilotDesk account.');
 if(school&&!s.schoolConfigured&&!s.isSchool){school.setAttribute('aria-disabled','true');school.classList.add('disabled')}
}
document.addEventListener('click',async e=>{
 const btn=e.target.closest('[data-pd-checkout-plan],[data-action="portal"]');if(!btn)return;
 e.preventDefault();if(btn.getAttribute('aria-disabled')==='true')return;
 try{
  btn.setAttribute('aria-busy','true');note('Opening secure billing…');
  if(btn.dataset.action==='portal')await window.PilotDeskBilling.portal();else await window.PilotDeskBilling.checkout(btn.dataset.pdCheckoutPlan||'pro');
 }catch(err){
  if(err.code==='sign_in_required'){location.assign('/account.html?next=%2Fpricing.html');return}
  note(err.message||'Unable to open billing.','bad');btn.removeAttribute('aria-busy');
 }
});
const q=new URL(location.href).searchParams;if(q.get('billing')==='cancelled')note('Checkout was canceled. Nothing was charged.','warn');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();