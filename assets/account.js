(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null,mode:'login',busy:false,recovery:new URLSearchParams(location.hash.slice(1)).get('type')==='recovery',revision:0};
const status=(msg,kind='')=>{const el=$('#pdAccountStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg};
const show=(sel,on)=>$(sel)?.classList.toggle('pd-account-hidden',!on);
const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const cleanAirport=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
const safeNext=()=>{const raw=new URL(location.href).searchParams.get('next')||'';try{const u=new URL(raw,location.origin);if(u.origin!==location.origin||!u.pathname.startsWith('/')||u.pathname==='/'||u.pathname==='/index.html'||u.pathname==='/account.html')return '';return u.pathname+u.search}catch{return ''}};
const redirectUrl=()=>{const u=new URL('/account.html',location.origin),next=safeNext();if(next)u.searchParams.set('next',next);return u.href};
const ownerView=()=>new URL(location.href).searchParams.get('owner')==='1';
const edgeHeaders=()=>({apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${state.session?.access_token||''}`});

async function loadSupabase(){
  const {getClient}=await import('/assets/supabase-client.js');state.client=await getClient();
  try{const r=await fetch(`${SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});if(r.ok){const d=await r.json();show('#pdGoogleSignIn',d?.external?.google===true);show('#pdGithubSignIn',d?.external?.github===true)}}catch{}
}
function renderSignedOut(){state.profile=null;setAuthMode('login',true);show('#pdSignedOut',true);show('#pdSignedIn',false);show('#pdOwnerMetrics',false);$('#pdAccountRoot')?.classList.remove('pd-account-disabled')}
function safeAvatarUrl(value){try{const u=new URL(String(value||''),location.origin);return u.protocol==='https:'||u.protocol==='http:'?u.href:''}catch{return ''}}
function renderAvatar(user,profile){const host=$('#pdUserAvatar');if(!host)return;const src=safeAvatarUrl(profile?.avatar_url||user?.user_metadata?.avatar_url||'');host.replaceChildren();if(src){const img=document.createElement('img');img.alt='';img.src=src;img.referrerPolicy='no-referrer';host.appendChild(img)}else host.textContent=initials(profile?.display_name||user?.user_metadata?.full_name||user?.email)}
async function fetchProfile(user){const {data,error}=await state.client.from('profiles').select('id,display_name,avatar_url,pilot_stage,home_airport,xp,level,current_streak,longest_streak,daily_completions,last_challenge_date,created_at').eq('id',user.id).maybeSingle();if(error)throw error;state.profile=data||null;if(data)state.client.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',user.id).then(()=>{});return data}

function ensureDailyCta(profile){
 const signed=$('#pdSignedIn');if(!signed)return;let box=$('#pdAccountDailyCta');if(!box){box=document.createElement('div');box.id='pdAccountDailyCta';box.className='pd-account-benefit';const stats=$('.pd-user-stats',signed);stats?.insertAdjacentElement('afterend',box)}
 const streak=Number(profile?.current_streak||0),done=Number(profile?.daily_completions||0),last=profile?.last_challenge_date||'';const today=new Date().toISOString().slice(0,10),completed=last===today;
 box.innerHTML=`<b>${completed?'Today’s PilotDesk Daily is complete':'PilotDesk Daily is ready'}</b><span>${completed?`🔥 ${streak}-day streak · ${done} saved challenge${done===1?'':'s'}`:'Three aviation questions. Save today’s XP and keep your streak moving.'}</span><div class="pd-account-actions"><a href="/daily/">${completed?'Review today’s challenge':'Play today’s challenge'} →</a></div>`;
}
function ensureWrittenPrepCta(){
 const signed=$('#pdSignedIn');if(!signed)return;let box=$('#pdAccountWrittenPrep');if(!box){box=document.createElement('div');box.id='pdAccountWrittenPrep';box.className='pd-account-benefit';const daily=$('#pdAccountDailyCta');(daily||$('.pd-user-stats',signed))?.insertAdjacentElement('afterend',box)}
 box.innerHTML='<b>Free FAA Written Prep</b><span>PPL · Instrument · CPL · CFI · CFII · ATP. Review weak subjects, missed questions and saved scores by FAA standard.</span><div class="pd-account-actions"><a href="/written-prep.html">Open my written prep →</a><a href="/skill-gap.html">Check my weak subjects →</a></div>';
}

function ensureOwnerMetric(id,label){const grid=$('#pdOwnerMetrics .pd-owner-grid');if(!grid)return null;let el=$(`#${id}`);if(el)return el;const card=document.createElement('div');card.className='pd-owner-stat';card.innerHTML=`<strong id="${id}">0</strong><span>${label}</span>`;grid.appendChild(card);return $(`#${id}`)}
function renderMetrics(d){
 const box=$('#pdOwnerMetrics');if(!box)return;show('#pdOwnerClaim',false);box.classList.remove('pd-account-hidden');
 $('#pdMetricTotal').textContent=String(d.total??0);$('#pdMetricToday').textContent=String(d.today??0);$('#pdMetric7').textContent=String(d.last7Days??0);$('#pdMetric30').textContent=String(d.last30Days??0);
 ensureOwnerMetric('pdMetricDailyToday','Daily saved today').textContent=String(d.dailyToday??0);ensureOwnerMetric('pdMetricDailyActive7','Daily pilots · 7d').textContent=String(d.dailyActive7??0);ensureOwnerMetric('pdMetricDailyTotal','Daily completions').textContent=String(d.dailyTotal??0);ensureOwnerMetric('pdMetricPerfectToday','Perfect today').textContent=String(d.perfectToday??0);
 ensureOwnerMetric('pdMetricPrepToday','Prep sessions today').textContent=String(d.writtenPrepSessionsToday??0);ensureOwnerMetric('pdMetricPrepActive7','Prep pilots · 7d').textContent=String(d.writtenPrepActive7??0);ensureOwnerMetric('pdMetricPrepTotal','Prep sessions').textContent=String(d.writtenPrepSessionsTotal??0);ensureOwnerMetric('pdMetricPrepAnswers','Prep answers').textContent=String(d.writtenPrepAnswersTotal??0);
 const total=Number(d.total||0),milestones=[10,25,50,100,250,500,1000,2500,5000,10000];const target=milestones.find(x=>x>total)||Math.ceil((total+1)/10000)*10000;$('#pdAccountMilestone').textContent=`${total} / ${target} accounts`;$('#pdAccountProgress').style.width=`${Math.min(100,Math.round((total/target)*100))}%`;
 const latest=d.lastAccountAt?` · latest account ${new Date(d.lastAccountAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}`:'';$('#pdAccountGenerated').textContent=`Updated ${new Date(d.generatedAt||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}${latest}`;
}
async function loadOwnerMetrics(){
 const box=$('#pdOwnerMetrics');if(!box||!state.session){box?.classList.add('pd-account-hidden');return}
 try{const r=await fetch(`${SUPABASE_URL}/functions/v1/owner-metrics`,{headers:edgeHeaders()});const d=await r.json().catch(()=>({}));if(r.status===403){box.classList.add('pd-account-hidden');if(ownerView()){box.classList.remove('pd-account-hidden');show('#pdOwnerClaim',true);$('#pdAccountGenerated').textContent='Owner access required'}return}if(!r.ok)throw new Error(d.error||'Unable to load account totals.');renderMetrics(d)}catch(e){box.classList.add('pd-account-hidden');console.warn('[PilotDesk owner metrics]',e)}
}
async function claimOwnerAccess(e){e?.preventDefault();if(!state.session)return;const token=$('#pdOwnerToken')?.value.trim();if(!token)return;const note=$('#pdOwnerClaimStatus');note.textContent='Checking owner key…';try{const r=await fetch(`${SUPABASE_URL}/functions/v1/owner-metrics`,{method:'POST',headers:{...edgeHeaders(),'Content-Type':'application/json'},body:JSON.stringify({claimToken:token})});const d=await r.json().catch(()=>({}));if(!r.ok){note.textContent=d.error||'That owner key was not accepted.';return}note.textContent='Owner access confirmed.';$('#pdOwnerToken').value='';renderMetrics(d)}catch{note.textContent='Could not claim owner access right now.'}}

async function renderSignedIn(session){
 const revision=state.revision;const user=session.user;show('#pdSignedOut',false);show('#pdSignedIn',true);$('#pdAccountRoot')?.classList.remove('pd-account-disabled');$('#pdUserEmail').textContent=user.email||'Signed in';
 let p=null;try{p=await fetchProfile(user)}catch(e){status('Signed in, but your profile could not be loaded yet.','warn')}
 if(revision!==state.revision||!state.session)return;
 const display=p?.display_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Pilot';$('#pdUserName').textContent=display;$('#pdDisplayName').value=p?.display_name||'';$('#pdPilotStage').value=p?.pilot_stage||'';$('#pdHomeAirport').value=p?.home_airport||'';$('#pdXp').textContent=String(p?.xp??0);$('#pdLevel').textContent=String(p?.level??1);$('#pdStreak').textContent=String(p?.current_streak??0);$('#pdBestStreak').textContent=String(p?.longest_streak??0);renderAvatar(user,p);ensureDailyCta(p);ensureWrittenPrepCta();await loadOwnerMetrics();
 if(state.recovery){$('#pdPasswordSettings')?.scrollIntoView({block:'center'});$('#pdNewPassword')?.focus();}
}
async function renderSession(session){state.session=session||null;state.revision++;if(session)await renderSignedIn(session);else renderSignedOut()}
function setAuthMode(mode,force=false){
 if(state.busy&&!force)return;state.mode=mode;
 const words={login:['Sign in','Use your email and password to return to your saved work.','Sign in'],signup:['Create account','Choose a password. Email confirmation may be required once.','Create account'],recover:['Reset password','We will email a link so you can choose a new password.','Send reset link'],magic:['Email sign-in','Use a one-time link to access your existing account.','Send sign-in link']};
 const [title,intro,button]=words[mode];$('#pdAuthHeading').textContent=title;$('#pdAuthIntro').textContent=intro;$('#pdAuthSubmit').textContent=button;
 const password=mode==='login'||mode==='signup';$('#pdAuthPasswordField').hidden=!password;$('#pdAuthPassword').required=password;$('#pdAuthPassword').minLength=mode==='signup'?12:1;$('#pdAuthPassword').autocomplete=mode==='signup'?'new-password':'current-password';$('#pdAuthPassword').value='';
 $('#pdAuthConfirmField').hidden=mode!=='signup';$('#pdAuthConfirm').required=mode==='signup';$('#pdAuthConfirm').value='';$('#pdPasswordHint').hidden=mode!=='signup';
 document.querySelectorAll('[data-auth-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.authMode===mode)));
 status('');
}
function authError(error){
 if(error?.code==='over_email_send_rate_limit'||/email.*rate|rate.*email/i.test(error?.message||''))return 'Email sending is temporarily limited. Wait before requesting another link. If you already have a confirmed account and password, choose Sign in.';
 if(error?.code==='invalid_credentials'||/invalid login credentials/i.test(error?.message||''))return 'The email or password did not match. Try again or choose Forgot password.';
 if(error?.code==='email_not_confirmed')return 'Confirm your email before signing in. Check your inbox and spam folder for the signup message.';
 if(error?.code==='weak_password')return 'Choose a stronger password with at least 12 characters.';
 return error?.message||'The account request failed. Check your connection and try again.';
}
async function runAuth(action){
 if(state.busy||!state.client)return;state.busy=true;
 const controls=[...document.querySelectorAll('#pdAccountRoot button')];controls.forEach(b=>b.disabled=true);
 try{await action()}catch(error){status(authError(error),'bad')}finally{state.busy=false;controls.forEach(b=>b.disabled=false)}
}
function returnToTool(){const next=safeNext();if(next&&!state.recovery&&!ownerView())location.assign(next)}
async function submitAuth(e){
 e.preventDefault();const mode=state.mode,email=$('#pdAuthEmail').value.trim(),password=$('#pdAuthPassword').value;
 if(mode==='signup'&&password!==$('#pdAuthConfirm').value)return status('The passwords do not match.','warn');
 await runAuth(async()=>{
  status(mode==='login'?'Signing in…':'Submitting…');
  if(mode==='login'){const {data,error}=await state.client.auth.signInWithPassword({email,password});if(error)throw error;$('#pdAuthPassword').value='';await renderSession(data.session);status('Signed in.','good');returnToTool();return}
  if(mode==='signup'){const {data,error}=await state.client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}});if(error)throw error;$('#pdAuthPassword').value='';$('#pdAuthConfirm').value='';if(data.session){await renderSession(data.session);status('Account ready.','good');returnToTool()}else status('Check your email for confirmation instructions. If you already have an account, sign in or reset your password.','good');return}
  const result=mode==='recover'?await state.client.auth.resetPasswordForEmail(email,{redirectTo:new URL('/account.html',location.origin).href}):await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectUrl(),shouldCreateUser:false}});
  if(result.error)throw result.error;status('If this address has an eligible account, an email with the next step will arrive shortly. Check your spam folder too.','good');
 });
}
async function setPassword(e){
 e.preventDefault();if(!state.session)return status('Sign in or open a valid password reset link first.','warn');
 const password=$('#pdNewPassword').value;if(password.length<12)return status('Use at least 12 characters.','warn');if(password!==$('#pdConfirmPassword').value)return status('The passwords do not match.','warn');
 await runAuth(async()=>{status('Saving password…');const {error}=await state.client.auth.updateUser({password});if(error)throw error;$('#pdSetPasswordForm').reset();state.recovery=false;try{sessionStorage.removeItem('pd-password-recovery')}catch{}status('Password saved. You can now sign in using your email and password.','good')});
}

async function signInGoogle(){status('Opening Google sign-in…');const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});if(error)status(error.message,'bad');else window.pdTrack?.('Account Google Sign In')}
async function signInGithub(){status('Opening GitHub sign-in…');const {error}=await state.client.auth.signInWithOAuth({provider:'github',options:{redirectTo:redirectUrl()}});if(error)status(error.message,'bad');else window.pdTrack?.('Account GitHub Sign In')}
async function saveProfile(e){e.preventDefault();if(!state.session)return;const updates={display_name:$('#pdDisplayName').value.trim().slice(0,80)||null,pilot_stage:$('#pdPilotStage').value||null,home_airport:cleanAirport($('#pdHomeAirport').value)||null};status('Saving your profile…');const {error}=await state.client.from('profiles').update(updates).eq('id',state.session.user.id);if(error)return status(error.message,'bad');status('Profile saved.','good');window.pdTrack?.('Account Profile Saved');await renderSignedIn(state.session)}
async function signOut(){await runAuth(async()=>{const {error}=await state.client.auth.signOut();if(error)throw error;state.recovery=false;try{sessionStorage.removeItem('pd-password-recovery')}catch{}await renderSession(null);status('Signed out. You can sign back in below.','good')})}
async function deleteAccount(){if(!state.session)return;const answer=prompt('This permanently deletes your PilotDesk account and saved account data. Type DELETE to continue.');if(answer!=='DELETE')return;if(!confirm('Delete this PilotDesk account permanently? This cannot be undone.'))return;status('Deleting your account…');try{const r=await fetch(`${SUPABASE_URL}/functions/v1/delete-account`,{method:'POST',headers:edgeHeaders()});const d=await r.json().catch(()=>({}));if(!r.ok)return status(d.error||'Unable to delete your account.','bad');await state.client.auth.signOut({scope:'local'}).catch(()=>{});state.session=null;state.profile=null;renderSignedOut();status('Your PilotDesk account was deleted.','good')}catch{status('Unable to delete your account right now.','bad')}}
function bind(){
 $('#pdAuthForm')?.addEventListener('submit',submitAuth);
 $('#pdSetPasswordForm')?.addEventListener('submit',setPassword);
 document.querySelectorAll('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authMode)));
 $('#pdGoogleSignIn')?.addEventListener('click',()=>runAuth(signInGoogle));
 $('#pdGithubSignIn')?.addEventListener('click',()=>runAuth(signInGithub));
 $('#pdProfileForm')?.addEventListener('submit',saveProfile);$('#pdSignOut')?.addEventListener('click',signOut);$('#pdDeleteAccount')?.addEventListener('click',deleteAccount);$('#pdRefreshMetrics')?.addEventListener('click',loadOwnerMetrics);$('#pdOwnerClaim')?.addEventListener('submit',claimOwnerAccess);$('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)})
}
async function init(){bind();show('#pdGoogleSignIn',false);$('#pdAccountRoot')?.classList.add('pd-account-disabled');status('Loading your account…');try{try{state.recovery=state.recovery||sessionStorage.getItem('pd-password-recovery')==='1'}catch{}await loadSupabase();const {data:{session},error}=await state.client.auth.getSession();if(error)throw error;state.client.auth.onAuthStateChange((event,next)=>{if(event==='PASSWORD_RECOVERY'){state.recovery=true;try{sessionStorage.setItem('pd-password-recovery','1')}catch{}}setTimeout(()=>renderSession(next).catch(()=>status('Unable to refresh your account. Reload and try again.','bad')),0)});status('');await renderSession(session)}catch(e){console.error('[PilotDesk account init]',e);renderSignedOut();$('#pdAccountRoot')?.classList.add('pd-account-disabled');status(e.message||'Accounts are temporarily unavailable.','warn')}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
