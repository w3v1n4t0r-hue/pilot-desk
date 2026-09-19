(()=>{
'use strict';
if(window.PilotDeskBilling)return;
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const state={client:null,session:null,subscription:null,configured:null,schoolConfigured:null};
const activeStatus=s=>['active','trialing'].includes(String(s||''));
const snapshot=()=>({
  session:state.session,
  subscription:state.subscription||{plan:'free',status:'inactive',cancel_at_period_end:false,current_period_end:null},
  configured:state.configured,
  schoolConfigured:state.schoolConfigured,
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
 const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
 state.client=window.__pilotDeskSupabase||mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 window.__pilotDeskSupabase=state.client;return state.client;
}
async function config(){
 try{
  const r=await fetch(SUPABASE_URL+'/functions/v1/billing-checkout',{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});
  const d=await r.json().catch(()=>({}));state.configured=Boolean(d.configured);state.schoolConfigured=Boolean(d.schoolConfigured);
 }catch{state.configured=false;state.schoolConfigured=false}
}
async function refresh(){
 const c=await client();const {data:{session}}=await c.auth.getSession();state.session=session||null;state.subscription=null;
 if(session?.user?.id){
  const {data}=await c.from('billing_subscriptions').select('plan,status,current_period_end,cancel_at_period_end,stripe_customer_id').eq('user_id',session.user.id).maybeSingle();
  state.subscription=data||null;
 }
 if(state.configured===null)await config();
 return apply();
}
async function invoke(name,body){
 const s=await refresh();if(!s.session)throw Object.assign(new Error('Sign in to continue.'),{code:'sign_in_required'});
 const r=await fetch(SUPABASE_URL+'/functions/v1/'+name,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+s.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'Billing request failed.'),{code:d.code||'billing_error',status:r.status});return d;
}
async function checkout(plan='pro'){const d=await invoke('billing-checkout',{plan});if(!d.url)throw new Error('Checkout URL was not returned.');location.assign(d.url)}
async function portal(){const d=await invoke('billing-portal',{});if(!d.url)throw new Error('Billing portal URL was not returned.');location.assign(d.url)}
let resolveReady;const ready=new Promise(r=>resolveReady=r);
window.PilotDeskBilling={ready,refresh,checkout,portal,snapshot,isPro:()=>snapshot().isPro,isSchool:()=>snapshot().isSchool};
const init=async()=>{try{resolveReady(await refresh())}catch(e){console.warn('[PilotDesk billing]',e);resolveReady(apply())}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();