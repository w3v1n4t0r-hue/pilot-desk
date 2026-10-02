(()=>{
'use strict';
if(window.PilotDeskBilling)return;
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const state={client:null,session:null,subscription:null,configured:null,schoolConfigured:null,error:null};
let refreshSeq=0,billingBusy=false;
const activeStatus=s=>['active','trialing'].includes(String(s||''));
const snapshot=()=>({
  session:state.session,
  subscription:state.subscription||{plan:'free',status:'inactive',cancel_at_period_end:false,current_period_end:null},
  configured:state.configured,
  schoolConfigured:state.schoolConfigured,
  error:state.error,
  isPro:activeStatus(state.subscription?.status)&&['pro','school'].includes(state.subscription?.plan),
  isSchool:activeStatus(state.subscription?.status)&&state.subscription?.plan==='school'
});
function apply(){
 const s=snapshot(),root=document.documentElement;
 root.dataset.pdPlan=s.isSchool?'school':s.isPro?'pro':'free';
 root.dataset.pdAdFree=s.isPro?'1':'0';
 document.querySelectorAll('[data-pd-billing-plan]').forEach(el=>el.textContent=s.isSchool?'Flight School':s.isPro?'Pro':'Free');
 document.querySelectorAll('[data-pd-billing-status]').forEach(el=>el.textContent=String(s.subscription?.status||'inactive').replaceAll('_',' '));
 if(s.isPro)document.querySelectorAll('.ad-wrap,.adsbygoogle').forEach(el=>el.remove());
 document.dispatchEvent(new CustomEvent('pilotdesk:billing',{detail:s}));
 return s;
}
async function client(){
 if(state.client)return state.client;
 const {getPilotDeskClient}=await import('/assets/supabase-client.js');
  state.client=await getPilotDeskClient();return state.client;
}
async function config(){
 try{
  const r=await fetch(SUPABASE_URL+'/functions/v1/billing-checkout',{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});
  if(!r.ok)throw Error('Checkout availability could not be checked. Try again.');const d=await r.json().catch(()=>({}));state.configured=Boolean(d.configured);state.schoolConfigured=Boolean(d.schoolConfigured);
 }catch{state.configured=null;state.schoolConfigured=null;state.error='Billing availability could not be checked. Check your connection and retry.';}
}
async function refresh(){
 const seq=++refreshSeq,c=await client();const result=await c.auth.getSession();if(result.error)throw result.error;const session=result.data.session;
 if(seq!==refreshSeq)return snapshot();
 const previousId=state.session?.user?.id;state.session=session||null;state.error=null;
 if(previousId!==session?.user?.id||!session)state.subscription=null;
 if(session?.user?.id){
  const {data,error}=await c.from('billing_subscriptions').select('plan,status,current_period_end,cancel_at_period_end,stripe_customer_id').eq('user_id',session.user.id).maybeSingle();
  if(seq!==refreshSeq||state.session?.user?.id!==session.user.id)return snapshot();
  if(error){state.error='Subscription status is unavailable. Retry before starting checkout.';apply();throw Error(state.error);}
  state.subscription=data||null;
 }
 if(state.configured===null)await config();
 if(seq!==refreshSeq)return snapshot();return apply();
}
async function invoke(name,body){
 const s=await refresh();if(!s.session)throw Object.assign(new Error('Sign in to continue.'),{code:'sign_in_required'});
 const r=await fetch(SUPABASE_URL+'/functions/v1/'+name,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+s.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'Billing request failed.'),{code:d.code||'billing_error',status:r.status});return d;
}
async function checkout(plan='pro'){if(billingBusy)return;billingBusy=true;try{const d=await invoke('billing-checkout',{plan});navigateStripe(d.url,'checkout.stripe.com');}finally{billingBusy=false;}}
function navigateStripe(value,host){let url;try{url=new URL(value);}catch{throw Error('Secure billing URL was not returned.');}if(url.protocol!=='https:'||url.hostname!==host)throw Error('Secure billing URL could not be verified. Try again.');location.assign(url.href);}
async function portal(){if(billingBusy)return;billingBusy=true;try{const d=await invoke('billing-portal',{});navigateStripe(d.url,'billing.stripe.com');}finally{billingBusy=false;}}
let resolveReady;const ready=new Promise(r=>resolveReady=r);
window.PilotDeskBilling={ready,refresh,checkout,portal,snapshot,isPro:()=>snapshot().isPro,isSchool:()=>snapshot().isSchool};
const init=async()=>{try{const c=await client();c.auth.onAuthStateChange((_event,next)=>{refreshSeq++;if(state.session?.user?.id!==next?.user?.id)state.subscription=null;state.session=next||null;apply();setTimeout(()=>refresh().catch(()=>{}),0);});resolveReady(await refresh())}catch(e){console.warn('[PilotDesk billing]',e);resolveReady(apply())}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();