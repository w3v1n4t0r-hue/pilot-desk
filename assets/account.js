(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null};
const status=(msg,kind='')=>{const el=$('#pdAccountStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg};
const show=(sel,on)=>$(sel)?.classList.toggle('pd-account-hidden',!on);
const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const cleanAirport=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
const redirectUrl=()=>new URL('/account.html',location.origin).href;
const ownerView=()=>new URL(location.href).searchParams.get('owner')==='1';

async function loadSupabase(){
  const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
  state.client=mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  try{
    const r=await fetch(`${SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});
    if(r.ok){const d=await r.json();show('#pdGoogleSignIn',d?.external?.google===true)}
  }catch{}
}

function renderSignedOut(){
  show('#pdSignedOut',true);show('#pdSignedIn',false);show('#pdOwnerMetrics',false);
  $('#pdAccountRoot')?.classList.remove('pd-account-disabled');
}

function safeAvatarUrl(value){
  try{const u=new URL(String(value||''),location.origin);return u.protocol==='https:'||u.protocol==='http:'?u.href:''}catch{return ''}
}
function renderAvatar(user,profile){
  const host=$('#pdUserAvatar');if(!host)return;
  const src=safeAvatarUrl(profile?.avatar_url||user?.user_metadata?.avatar_url||'');
  host.replaceChildren();
  if(src){const img=document.createElement('img');img.alt='';img.src=src;img.referrerPolicy='no-referrer';host.appendChild(img)}
  else host.textContent=initials(profile?.display_name||user?.user_metadata?.full_name||user?.email);
}

async function fetchProfile(user){
  const {data,error}=await state.client.from('profiles').select('id,display_name,avatar_url,pilot_stage,home_airport,xp,level,current_streak,longest_streak,created_at').eq('id',user.id).maybeSingle();
  if(error)throw error;
  state.profile=data||null;
  if(data)state.client.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',user.id).then(()=>{});
  return data;
}

function renderMetrics(d){
  const box=$('#pdOwnerMetrics');if(!box)return;
  show('#pdOwnerClaim',false);box.classList.remove('pd-account-hidden');
  $('#pdMetricTotal').textContent=String(d.total??0);
  $('#pdMetricToday').textContent=String(d.today??0);
  $('#pdMetric7').textContent=String(d.last_7_days??0);
  $('#pdMetric30').textContent=String(d.last_30_days??0);
  const total=Number(d.total||0),milestones=[10,25,50,100,250,500,1000,2500,5000,10000];
  const target=milestones.find(x=>x>total)||Math.ceil((total+1)/10000)*10000;
  $('#pdAccountMilestone').textContent=`${total} / ${target} accounts`;
  $('#pdAccountProgress').style.width=`${Math.min(100,Math.round((total/target)*100))}%`;
  $('#pdAccountGenerated').textContent=`Updated ${new Date(d.generated_at||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
}

async function loadOwnerMetrics(){
  const box=$('#pdOwnerMetrics');if(!box||!ownerView()||!state.session){box?.classList.add('pd-account-hidden');return}
  box.classList.remove('pd-account-hidden');
  try{
    const {data,error}=await state.client.rpc('get_account_growth_metrics');
    if(error)throw error;
    const d=Array.isArray(data)?data[0]:data;
    if(d)renderMetrics(d);
  }catch(e){
    show('#pdOwnerClaim',true);
    $('#pdAccountGenerated').textContent='Owner access required';
    console.warn('[PilotDesk owner metrics]',e);
  }
}

async function claimOwnerAccess(e){
  e?.preventDefault();if(!state.session)return;
  const token=$('#pdOwnerToken')?.value.trim();
  if(!token)return;
  const note=$('#pdOwnerClaimStatus');note.textContent='Checking owner key…';
  const {data,error}=await state.client.rpc('claim_pilotdesk_admin',{p_token:token});
  if(error||data!==true){note.textContent='That owner key was not accepted.';return}
  note.textContent='Owner access confirmed.';$('#pdOwnerToken').value='';await loadOwnerMetrics();
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
  await loadOwnerMetrics();
}

async function renderSession(session){state.session=session||null;if(session)await renderSignedIn(session);else renderSignedOut()}

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
  e.preventDefault();if(!state.session)return;
  const updates={display_name:$('#pdDisplayName').value.trim().slice(0,80)||null,pilot_stage:$('#pdPilotStage').value||null,home_airport:cleanAirport($('#pdHomeAirport').value)||null};
  status('Saving your profile…');
  const {error}=await state.client.from('profiles').update(updates).eq('id',state.session.user.id);
  if(error)return status(error.message,'bad');
  status('Profile saved.','good');window.pdTrack?.('Account Profile Saved');await renderSignedIn(state.session);
}

async function signOut(){await state.client.auth.signOut();status('Signed out.','good');window.pdTrack?.('Account Signed Out')}

async function deleteAccount(){
  if(!state.session)return;
  const answer=prompt('This permanently deletes your PilotDesk account and synced account data. Type DELETE to continue.');
  if(answer!=='DELETE')return;
  if(!confirm('Delete this PilotDesk account permanently? This cannot be undone.'))return;
  status('Deleting your account…');
  try{
    const r=await fetch(`${SUPABASE_URL}/functions/v1/delete-account`,{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${state.session.access_token}`}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)return status(d.error||'Unable to delete your account.','bad');
    await state.client.auth.signOut({scope:'local'}).catch(()=>{});
    state.session=null;state.profile=null;renderSignedOut();status('Your PilotDesk account was deleted.','good');
  }catch(e){status('Unable to delete your account right now.','bad')}
}

function bind(){
  $('#pdMagicForm')?.addEventListener('submit',sendMagicLink);
  $('#pdGoogleSignIn')?.addEventListener('click',signInGoogle);
  $('#pdProfileForm')?.addEventListener('submit',saveProfile);
  $('#pdSignOut')?.addEventListener('click',signOut);
  $('#pdDeleteAccount')?.addEventListener('click',deleteAccount);
  $('#pdRefreshMetrics')?.addEventListener('click',loadOwnerMetrics);
  $('#pdOwnerClaimForm')?.addEventListener('submit',claimOwnerAccess);
  $('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)});
}

async function init(){
  bind();show('#pdGoogleSignIn',false);$('#pdAccountRoot')?.classList.add('pd-account-disabled');status('Loading secure account services…');
  try{
    await loadSupabase();
    const {data:{session},error}=await state.client.auth.getSession();if(error)throw error;
    state.client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>renderSession(next),0)});
    status('');await renderSession(session);
  }catch(e){console.error('[PilotDesk account init]',e);renderSignedOut();$('#pdAccountRoot')?.classList.add('pd-account-disabled');status(e.message||'Accounts are temporarily unavailable.','warn')}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
