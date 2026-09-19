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
const safeNext=()=>{const raw=new URL(location.href).searchParams.get('next')||'';try{const u=new URL(raw,location.origin);if(u.origin!==location.origin||!u.pathname.startsWith('/')||u.pathname==='/'||u.pathname==='/index.html')return '';return u.pathname+u.search}catch{return ''}};
const redirectUrl=()=>{const u=new URL('/account.html',location.origin),next=safeNext();if(next)u.searchParams.set('next',next);return u.href};
const ownerView=()=>new URL(location.href).searchParams.get('owner')==='1';
const edgeHeaders=()=>({apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${state.session?.access_token||''}`});

async function loadSupabase(){
  const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
  state.client=window.__pilotDeskSupabase||mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});window.__pilotDeskSupabase=state.client;
  try{const r=await fetch(`${SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});if(r.ok){const d=await r.json();show('#pdGoogleSignIn',d?.external?.google===true);show('#pdGithubSignIn',d?.external?.github===true)}}catch{}
}
function renderSignedOut(){show('#pdSignedOut',true);show('#pdSignedIn',false);show('#pdOwnerMetrics',false);$('#pdAccountRoot')?.classList.remove('pd-account-disabled')}
function safeAvatarUrl(value){try{const u=new URL(String(value||''),location.origin);return u.protocol==='https:'||u.protocol==='http:'?u.href:''}catch{return ''}}
function renderAvatar(user,profile){const host=$('#pdUserAvatar');if(!host)return;const src=safeAvatarUrl(profile?.avatar_url||user?.user_metadata?.avatar_url||'');host.replaceChildren();if(src){const img=document.createElement('img');img.alt='';img.src=src;img.referrerPolicy='no-referrer';host.appendChild(img)}else host.textContent=initials(profile?.display_name||user?.user_metadata?.full_name||user?.email)}
async function fetchProfile(user){const {data,error}=await state.client.from('profiles').select('id,display_name,avatar_url,pilot_stage,home_airport,training_goal,checkride_date,xp,level,current_streak,longest_streak,daily_completions,last_challenge_date,created_at').eq('id',user.id).maybeSingle();if(error)throw error;state.profile=data||null;if(data)state.client.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',user.id).then(()=>{});return data}

function ensureDailyCta(profile){
 const signed=$('#pdSignedIn');if(!signed)return;let box=$('#pdAccountDailyCta');if(!box){box=document.createElement('div');box.id='pdAccountDailyCta';box.className='pd-account-benefit';const stats=$('.pd-user-stats',signed);stats?.insertAdjacentElement('afterend',box)}
 const streak=Number(profile?.current_streak||0),done=Number(profile?.daily_completions||0),last=profile?.last_challenge_date||'';const today=new Date().toISOString().slice(0,10),completed=last===today;
 box.innerHTML=`<b>${completed?'Today’s PilotDesk Daily is complete':'PilotDesk Daily is ready'}</b><span>${completed?`🔥 ${streak}-day streak · ${done} saved challenge${done===1?'':'s'}`:'Three aviation questions. Save today’s XP and keep your streak moving.'}</span><div class="pd-account-actions"><a href="/daily/">${completed?'Review today’s challenge':'Play today’s challenge'} →</a></div>`;
}
function ensureWrittenPrepCta(){
 const signed=$('#pdSignedIn');if(!signed)return;let box=$('#pdAccountWrittenPrep');if(!box){box=document.createElement('div');box.id='pdAccountWrittenPrep';box.className='pd-account-benefit';const daily=$('#pdAccountDailyCta');(daily||$('.pd-user-stats',signed))?.insertAdjacentElement('afterend',box)}
 box.innerHTML='<b>Free FAA Written Prep</b><span>PPL · Instrument · CPL · CFI · CFII · ATP. Review weak subjects, missed questions and saved scores by FAA standard.</span><div class="pd-account-actions"><a href="/written-prep.html">Open my written prep →</a><a href="/skill-gap.html">Check my weak subjects →</a></div>';
}

function localJson(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
const goalNames={ppl:'Private Pilot',ira:'Instrument Rating',cpl:'Commercial Pilot',multi:'Multi-Engine',cfi:'CFI',cfii:'CFII',atp:'ATP'};
const goalLinks={ppl:'/training/private-pilot.html',ira:'/training/instrument-rating.html',cpl:'/training/commercial-pilot.html',multi:'/training/multiengine.html',cfi:'/training/cfi.html',cfii:'/flight-training.html',atp:'/written-prep.html'};
function daysUntil(value){if(!value)return null;const d=new Date(value+'T12:00:00'),now=new Date();now.setHours(12,0,0,0);return Math.ceil((d-now)/86400000)}
async function cloudCounts(userId){
 try{
  const [a,f]=await Promise.all([
   state.client.from('aircraft_profiles').select('id',{count:'exact',head:true}).eq('user_id',userId),
   state.client.from('saved_flights').select('id',{count:'exact',head:true}).eq('user_id',userId)
  ]);
  return {aircraft:a.count||0,flights:f.count||0};
 }catch{return {aircraft:0,flights:0}}
}
async function renderAccountDashboard(profile){
 const host=$('#pdAccountDashboardGrid');if(!host)return;
 const aircraft=localJson('pd-aircraft',[]),flights=localJson('pd-saved-flights',[]),pins=localJson('pd-favorites',[]);
 const today=new Date().toISOString().slice(0,10),dailyDone=profile?.last_challenge_date===today;
 const home=cleanAirport(profile?.home_airport||'');
 const cards=[];
 const goal=profile?.training_goal||'',goalName=goalNames[goal]||'',days=daysUntil(profile?.checkride_date);
 if(goalName)cards.push({eyebrow:'CURRENT GOAL · ACCOUNT',title:goalName,copy:days===null?'Set a target date when you have one.':days>1?days+' days to your target date.':days===1?'Target date is tomorrow.':days===0?'Target date is today.':'Target date has passed — update it when your next milestone is scheduled.',href:goalLinks[goal]||'/flight-training.html',cta:'Continue '+goalName});
 cards.push(
  {eyebrow:'DAILY · ACCOUNT',title:dailyDone?'Today complete':'Today is ready',copy:dailyDone?((profile?.current_streak||0)+'-day streak saved to your account.'):'Three questions to keep the streak moving.',href:'/daily/',cta:dailyDone?'Review Daily':'Play Daily'},
  {eyebrow:'WRITTEN PREP · ACCOUNT',title:'Keep studying',copy:'Your written-prep scores, misses, and FAA-standard progress follow your sign-in.',href:'/written-prep.html',cta:'Open Written Prep'},
  {eyebrow:'PINNED · THIS DEVICE',title:pins.length?pins.length+' pinned tool'+(pins.length===1?'':'s'):'Pin your go-to tools',copy:pins.length?'Your calculator shortcuts are ready in this browser.':'Pin calculators you use often so they are easier to find again.',href:'/tools.html',cta:'Open calculators'},
  {eyebrow:'AIRCRAFT · THIS DEVICE',title:aircraft.length?aircraft.length+' aircraft saved':'Build your local Hangar',copy:'Aircraft profiles stay on this device today. Export them when you want a backup.',href:'/aircraft.html',cta:'Open Aircraft'},
  {eyebrow:'FLIGHTS · THIS DEVICE',title:flights.length?flights.length+' saved flight'+(flights.length===1?'':'s'):'No local flights yet',copy:'Saved routes and planning numbers remain in this browser.',href:'/flights.html',cta:'Open Saved Flights'}
 );
 if(home)cards.push({eyebrow:'HOME AIRPORT · ACCOUNT',title:home,copy:'Jump back to your home-airport context and current PilotDesk tools.',href:'/airport.html?id='+encodeURIComponent(home),cta:'Open '+home});
 const cloud=await cloudCounts(state.session?.user?.id||'');
 if(cloud.aircraft||cloud.flights)cards.push({eyebrow:'CLOUD WORKSPACE · ACCOUNT',title:(cloud.aircraft+cloud.flights)+' synced item'+((cloud.aircraft+cloud.flights)===1?'':'s'),copy:cloud.aircraft+' aircraft · '+cloud.flights+' saved flights stored with your account.',href:'/pricing.html',cta:'See sync plans'});
 host.replaceChildren();
 for(const card of cards){
  const a=document.createElement('a');a.className='pd-account-dashboard-card';a.href=card.href;a.dataset.pdAccountAction=card.cta;
  const small=document.createElement('small');small.textContent=card.eyebrow;
  const b=document.createElement('b');b.textContent=card.title;
  const span=document.createElement('span');span.textContent=card.copy;
  const em=document.createElement('em');em.textContent=card.cta+' →';
  a.append(small,b,span,em);host.append(a);
 }
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
 const user=session.user;show('#pdSignedOut',false);show('#pdSignedIn',true);$('#pdAccountRoot')?.classList.remove('pd-account-disabled');$('#pdUserEmail').textContent=user.email||'Signed in';
 let p=null;try{p=await fetchProfile(user)}catch(e){status('Signed in, but your profile could not be loaded yet.','warn')}
 const display=p?.display_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Pilot';$('#pdUserName').textContent=display;$('#pdDisplayName').value=p?.display_name||'';$('#pdPilotStage').value=p?.pilot_stage||'';$('#pdHomeAirport').value=p?.home_airport||'';$('#pdXp').textContent=String(p?.xp??0);$('#pdLevel').textContent=String(p?.level??1);$('#pdStreak').textContent=String(p?.current_streak??0);$('#pdBestStreak').textContent=String(p?.longest_streak??0);renderAvatar(user,p);$('#pdTrainingGoal').value=p?.training_goal||'';$('#pdCheckrideDate').value=p?.checkride_date||'';await renderAccountDashboard(p);ensureDailyCta(p);ensureWrittenPrepCta();await loadOwnerMetrics();
 const next=safeNext();if(next&&!ownerView()){status('Signed in. Returning you to your PilotDesk tool…','good');setTimeout(()=>location.assign(next),450)}
}
async function renderSession(session){state.session=session||null;if(session)await renderSignedIn(session);else renderSignedOut()}
async function sendMagicLink(e){e.preventDefault();const email=$('#pdEmail').value.trim();if(!email)return status('Enter your email address.','warn');status('Sending your sign-in link…');const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectUrl(),shouldCreateUser:true}});if(error)return status(error.message,'bad');status('Check your email. Your PilotDesk sign-in link is on the way.','good');window.pdTrack?.('Account Magic Link Requested')}
async function signInPassword(e){e.preventDefault();const email=$('#pdPasswordEmail').value.trim(),password=$('#pdPassword').value;if(!email||!password)return status('Enter your email and password.','warn');status('Signing you in…');const {error}=await state.client.auth.signInWithPassword({email,password});if(error){const message=/invalid login credentials/i.test(error.message)?'That email and password did not match. Use Forgot password or email sign-in if you need to recover access.':error.message;return status(message,'bad')}window.pdTrack?.('Account Password Sign In')}
async function createAccount(e){e.preventDefault();const email=$('#pdCreateEmail').value.trim(),password=$('#pdCreatePassword').value;if(password.length<6)return status('Your password must be at least 6 characters.','warn');status('Creating your account…');const {data,error}=await state.client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}});if(error)return status(error.message,'bad');if(data.session)await renderSession(data.session);else status('Account created. Check your email once to confirm it, then you can sign in with your password.','good');window.pdTrack?.('Account Created With Password')}
async function resetPassword(){const email=$('#pdPasswordEmail').value.trim();if(!email)return status('Enter your email first, then choose Forgot password.','warn');status('Sending a password reset link…');const {error}=await state.client.auth.resetPasswordForEmail(email,{redirectTo:new URL('/account.html',location.origin).href});if(error)return status(error.message,'bad');status('Check your email for a password reset link.','good')}
async function signInGoogle(){status('Opening Google sign-in…');const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});if(error)status(error.message,'bad');else window.pdTrack?.('Account Google Sign In')}
async function signInGithub(){status('Opening GitHub sign-in…');const {error}=await state.client.auth.signInWithOAuth({provider:'github',options:{redirectTo:redirectUrl()}});if(error)status(error.message,'bad');else window.pdTrack?.('Account GitHub Sign In')}
async function saveProfile(e){e.preventDefault();if(!state.session)return;const updates={display_name:$('#pdDisplayName').value.trim().slice(0,80)||null,pilot_stage:$('#pdPilotStage').value||null,home_airport:cleanAirport($('#pdHomeAirport').value)||null,training_goal:$('#pdTrainingGoal').value||null,checkride_date:$('#pdCheckrideDate').value||null};status('Saving your profile…');const {error}=await state.client.from('profiles').update(updates).eq('id',state.session.user.id);if(error)return status(error.message,'bad');status('Profile saved.','good');window.pdTrack?.('Account Profile Saved');await renderSignedIn(state.session)}
async function signOut(){await state.client.auth.signOut();status('Signed out.','good');window.pdTrack?.('Account Signed Out')}
async function deleteAccount(){if(!state.session)return;const answer=prompt('This permanently deletes your PilotDesk account and saved account data. Type DELETE to continue.');if(answer!=='DELETE')return;if(!confirm('Delete this PilotDesk account permanently? This cannot be undone.'))return;status('Deleting your account…');try{const r=await fetch(`${SUPABASE_URL}/functions/v1/delete-account`,{method:'POST',headers:edgeHeaders()});const d=await r.json().catch(()=>({}));if(!r.ok)return status(d.error||'Unable to delete your account.','bad');await state.client.auth.signOut({scope:'local'}).catch(()=>{});state.session=null;state.profile=null;renderSignedOut();status('Your PilotDesk account was deleted.','good')}catch{status('Unable to delete your account right now.','bad')}}
function bind(){$('#pdMagicForm')?.addEventListener('submit',sendMagicLink);$('#pdPasswordForm')?.addEventListener('submit',signInPassword);$('#pdCreateAccountForm')?.addEventListener('submit',createAccount);$('#pdForgotPassword')?.addEventListener('click',resetPassword);$('#pdGoogleSignIn')?.addEventListener('click',signInGoogle);$('#pdProfileForm')?.addEventListener('submit',saveProfile);$('#pdSignOut')?.addEventListener('click',signOut);$('#pdDeleteAccount')?.addEventListener('click',deleteAccount);$('#pdRefreshMetrics')?.addEventListener('click',loadOwnerMetrics);$('#pdOwnerClaim')?.addEventListener('submit',claimOwnerAccess);$('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)})}
async function init(){bind();show('#pdGoogleSignIn',false);$('#pdAccountRoot')?.classList.add('pd-account-disabled');status('Loading your account…');try{await loadSupabase();const {data:{session},error}=await state.client.auth.getSession();if(error)throw error;state.client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>renderSession(next),0)});status('');await renderSession(session)}catch(e){console.error('[PilotDesk account init]',e);renderSignedOut();$('#pdAccountRoot')?.classList.add('pd-account-disabled');status(e.message||'Accounts are temporarily unavailable.','warn')}}
document.addEventListener('click',e=>{if(e.target?.id==='pdGithubSignIn')signInGithub()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

