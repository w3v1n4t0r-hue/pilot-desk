(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null};
const status=(msg,kind='')=>{const el=$('#pdAccountStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg};
const show=(sel,on)=>$(sel)?.classList.toggle('pd-account-hidden',!on);
const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const cleanAirport=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
const redirectUrl=()=>new URL('/account.html',location.origin).href;

async function getConfig(){
  const r=await fetch('/api/public-config',{headers:{Accept:'application/json'}});
  if(!r.ok)return {enabled:false};
  return r.json();
}

async function loadSupabase(){
  const cfg=await getConfig();
  if(!cfg.enabled||!cfg.supabaseUrl||!cfg.supabaseAnonKey)throw new Error('PilotDesk accounts are finishing setup. Try again shortly.');
  const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
  state.client=mod.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}

function renderSignedOut(){
  show('#pdSignedOut',true);show('#pdSignedIn',false);show('#pdOwnerMetrics',false);
  $('#pdAccountRoot')?.classList.remove('pd-account-disabled');
}

function renderAvatar(user,profile){
  const host=$('#pdUserAvatar');if(!host)return;
  const src=profile?.avatar_url||user?.user_metadata?.avatar_url||'';
  host.innerHTML=src?`<img alt="" src="${String(src).replace(/"/g,'&quot;')}">`:initials(profile?.display_name||user?.user_metadata?.full_name||user?.email);
}

async function fetchProfile(user){
  const {data,error}=await state.client.from('profiles').select('id,display_name,avatar_url,pilot_stage,home_airport,xp,level,current_streak,longest_streak,created_at').eq('id',user.id).maybeSingle();
  if(error)throw error;
  state.profile=data||null;
  if(data){
    state.client.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',user.id).then(()=>{});
  }
  return data;
}

async function loadOwnerMetrics(token){
  const box=$('#pdOwnerMetrics');if(!box)return;
  box.classList.add('pd-account-hidden');
  try{
    const r=await fetch('/api/account-stats',{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
    if(!r.ok)return;
    const d=await r.json();
    box.classList.remove('pd-account-hidden');
    $('#pdMetricTotal').textContent=String(d.total??0);
    $('#pdMetricToday').textContent=String(d.today??0);
    $('#pdMetric7').textContent=String(d.last7Days??0);
    $('#pdMetric30').textContent=String(d.last30Days??0);
    const milestones=[10,25,50,100,250,500,1000,2500,5000,10000];
    const target=milestones.find(x=>x>(d.total||0))||Math.ceil(((d.total||0)+1)/10000)*10000;
    const pct=Math.min(100,Math.round(((d.total||0)/target)*100));
    $('#pdAccountMilestone').textContent=`${d.total||0} / ${target} accounts`;
    $('#pdAccountProgress').style.width=`${pct}%`;
    $('#pdAccountGenerated').textContent=`Updated ${new Date(d.generatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
  }catch(e){console.warn('[PilotDesk owner metrics]',e)}
}

async function renderSignedIn(session){
  const user=session.user;
  show('#pdSignedOut',false);show('#pdSignedIn',true);
  $('#pdAccountRoot')?.classList.remove('pd-account-disabled');
  $('#pdUserEmail').textContent=user.email||'Signed in';
  let p=null;
  try{p=await fetchProfile(user)}catch(e){status('Signed in, but your profile could not be loaded yet.','warn')}
  const display=p?.display_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Pilot';
  $('#pdUserName').textContent=display;
  $('#pdDisplayName').value=p?.display_name||'';
  $('#pdPilotStage').value=p?.pilot_stage||'';
  $('#pdHomeAirport').value=p?.home_airport||'';
  $('#pdXp').textContent=String(p?.xp??0);
  $('#pdLevel').textContent=String(p?.level??1);
  $('#pdStreak').textContent=String(p?.current_streak??0);
  $('#pdBestStreak').textContent=String(p?.longest_streak??0);
  renderAvatar(user,p);
  await loadOwnerMetrics(session.access_token);
}

async function renderSession(session){
  state.session=session||null;
  if(session)await renderSignedIn(session);else renderSignedOut();
}

async function sendMagicLink(e){
  e.preventDefault();
  const email=$('#pdEmail').value.trim();
  if(!email)return status('Enter your email address.','warn');
  status('Sending your sign-in link…');
  const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectUrl(),shouldCreateUser:true}});
  if(error)return status(error.message,'bad');
  status('Check your email. Your PilotDesk sign-in link is on the way.','good');
  window.pdTrack?.('Account Magic Link Requested');
}

async function signInGoogle(){
  status('Opening Google sign-in…');
  const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});
  if(error)status(error.message,'bad');
  else window.pdTrack?.('Account Google Sign In');
}

async function saveProfile(e){
  e.preventDefault();
  if(!state.session)return;
  const updates={display_name:$('#pdDisplayName').value.trim().slice(0,80)||null,pilot_stage:$('#pdPilotStage').value||null,home_airport:cleanAirport($('#pdHomeAirport').value)||null};
  status('Saving your profile…');
  const {error}=await state.client.from('profiles').update(updates).eq('id',state.session.user.id);
  if(error)return status(error.message,'bad');
  status('Profile saved.','good');
  window.pdTrack?.('Account Profile Saved');
  await renderSignedIn(state.session);
}

async function signOut(){
  await state.client.auth.signOut();
  status('Signed out.','good');
  window.pdTrack?.('Account Signed Out');
}

async function deleteAccount(){
  if(!state.session)return;
  const answer=prompt('This permanently deletes your PilotDesk account and synced account data. Type DELETE to continue.');
  if(answer!=='DELETE')return;
  const ok=confirm('Delete this PilotDesk account permanently? This cannot be undone.');
  if(!ok)return;
  status('Deleting your account…');
  const r=await fetch('/api/delete-account',{method:'DELETE',headers:{Authorization:`Bearer ${state.session.access_token}`}});
  if(!r.ok){let d={};try{d=await r.json()}catch{}return status(d.error||'Unable to delete your account.','bad')}
  await state.client.auth.signOut({scope:'local'}).catch(()=>{});
  state.session=null;state.profile=null;renderSignedOut();status('Your PilotDesk account was deleted.','good');
}

function bind(){
  $('#pdMagicForm')?.addEventListener('submit',sendMagicLink);
  $('#pdGoogleSignIn')?.addEventListener('click',signInGoogle);
  $('#pdProfileForm')?.addEventListener('submit',saveProfile);
  $('#pdSignOut')?.addEventListener('click',signOut);
  $('#pdDeleteAccount')?.addEventListener('click',deleteAccount);
  $('#pdRefreshMetrics')?.addEventListener('click',()=>state.session&&loadOwnerMetrics(state.session.access_token));
  $('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)});
}

async function init(){
  bind();
  $('#pdAccountRoot')?.classList.add('pd-account-disabled');
  status('Loading secure account services…');
  try{
    await loadSupabase();
    const {data:{session},error}=await state.client.auth.getSession();
    if(error)throw error;
    state.client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>renderSession(next),0)});
    status('');
    await renderSession(session);
  }catch(e){
    console.error('[PilotDesk account init]',e);
    renderSignedOut();
    $('#pdAccountRoot')?.classList.add('pd-account-disabled');
    status(e.message||'Accounts are temporarily unavailable.','warn');
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
