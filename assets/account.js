(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null,billing:null,recoveryMode:false,redirectTimer:null,pendingEmail:''};
const status=(msg,kind='')=>{const el=$('#pdAccountStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg};
const show=(sel,on)=>$(sel)?.classList.toggle('pd-account-hidden',!on);
const initials=s=>String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';
const cleanAirport=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
const safeNext=()=>{const raw=new URL(location.href).searchParams.get('next')||'';try{const u=new URL(raw,location.origin);if(u.origin!==location.origin||!u.pathname.startsWith('/')||u.pathname==='/'||u.pathname==='/index.html')return '';return u.pathname+u.search}catch{return ''}};
const redirectUrl=()=>{const u=new URL('/account.html',location.origin),next=safeNext();if(next)u.searchParams.set('next',next);return u.href};
const ownerView=()=>new URL(location.href).searchParams.get('owner')==='1';
const edgeHeaders=()=>({apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${state.session?.access_token||''}`});
const authError=(error,action='signin')=>{
 console.warn('[PilotDesk auth]',action,error);
 const code=String(error?.code||'').toLowerCase(),message=String(error?.message||'').toLowerCase();
 if(code==='email_not_confirmed'||message.includes('email not confirmed'))return 'Confirm your email using the PilotDesk link we sent, then sign in.';
 if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit'||message.includes('rate limit'))return 'Too many attempts. Wait a few minutes, then try again.';
 if(code==='weak_password'||message.includes('password should')||message.includes('password is too weak'))return 'Choose a stronger password and try again.';
 if(code==='user_already_exists'||message.includes('already registered'))return 'This email may already have an account. Sign in or use Forgot password.';
 if(code==='otp_expired'||code==='otp_disabled'||message.includes('expired')||message.includes('invalid token'))return 'That link has expired or was already used. Request a new one below.';
 if(code==='invalid_credentials'||message.includes('invalid login credentials'))return 'That email and password did not match. Try again, reset your password, or use an email sign-in link.';
 if(code==='network_error'||error?.name==='AuthRetryableFetchError'||message.includes('failed to fetch')||message.includes('network'))return 'Could not reach PilotDesk accounts. Check your connection and try again.';
 return 'We could not complete that request. Please try again in a moment.';
};
async function withBusy(control,work){if(control?.disabled)return;const label=control?.textContent;if(control){control.disabled=true;control.setAttribute('aria-busy','true')}try{return await work()}catch(error){status(authError(error),'bad')}finally{if(control){control.disabled=false;control.removeAttribute('aria-busy');control.textContent=label}}}
function callbackError(){const url=new URL(location.href),hash=new URLSearchParams(url.hash.replace(/^#/,''));return url.searchParams.get('error_code')||hash.get('error_code')||url.searchParams.get('error')||hash.get('error')}
function showRecovery(){show('#pdSignedOut',false);show('#pdSignedIn',false);show('#pdRecoveryPanel',true);$('#pdAccountRoot')?.classList.remove('pd-account-disabled');$('#pdNewPassword')?.focus()}
function updateResend(){const button=$('#pdResendConfirmation');if(!button)return;const until=Number(sessionStorage.getItem('pd-confirm-resend-until')||0),seconds=Math.max(0,Math.ceil((until-Date.now())/1000));button.disabled=seconds>0;button.textContent=seconds?`Resend available in ${seconds}s`:'Resend confirmation email'}
function showVerification(email){state.pendingEmail=email||'';$('#pdConfirmationEmail').value=state.pendingEmail;show('#pdVerificationPanel',true);updateResend()}

async function loadSupabase(){
  const {getPilotDeskClient}=await import('/assets/supabase-client.js');
  state.client=await getPilotDeskClient();
  try{const r=await fetch(`${SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});if(r.ok){const d=await r.json();show('#pdGoogleSignIn',d?.external?.google===true);show('#pdGithubSignIn',d?.external?.github===true)}}catch{}
}
function renderSignedOut(){clearTimeout(state.redirectTimer);state.redirectTimer=null;show('#pdSignedOut',true);show('#pdSignedIn',false);show('#pdRecoveryPanel',false);show('#pdOwnerMetrics',false);$('#pdAccountRoot')?.classList.remove('pd-account-disabled')}
function safeAvatarUrl(value){try{const u=new URL(String(value||''),location.origin);return u.protocol==='https:'||u.protocol==='http:'?u.href:''}catch{return ''}}
function renderAvatar(user,profile){const host=$('#pdUserAvatar');if(!host)return;const src=safeAvatarUrl(profile?.avatar_url||user?.user_metadata?.avatar_url||'');host.replaceChildren();if(src){const img=document.createElement('img');img.alt='';img.src=src;img.referrerPolicy='no-referrer';host.appendChild(img)}else host.textContent=initials(profile?.display_name||user?.user_metadata?.full_name||user?.email)}
async function fetchProfile(user){const {data,error}=await state.client.from('profiles').select('id,display_name,avatar_url,pilot_stage,home_airport,training_goal,checkride_date,xp,level,current_streak,longest_streak,daily_completions,last_challenge_date,created_at').eq('id',user.id).maybeSingle();if(error)throw error;state.profile=data||null;if(data)state.client.from('profiles').update({last_seen_at:new Date().toISOString()}).eq('id',user.id).then(()=>{});return data}

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
function relativeTime(value){const t=new Date(value).getTime();if(!Number.isFinite(t))return'';const d=Math.max(0,Date.now()-t),m=Math.floor(d/60000);if(m<2)return'just now';if(m<60)return m+' min ago';const h=Math.floor(m/60);if(h<24)return h+' hr ago';const days=Math.floor(h/24);return days===1?'yesterday':days+' days ago'}
function calcHref(slug){if(slug==='weight-balance-builder')return'/weight-balance.html';return slug?'/calculators/'+encodeURIComponent(slug)+'/':'/tools.html'}
async function renderRecentActivity(){
 const host=$('#pdAccountRecentActivity');if(!host||!state.session)return;
 const rows=[];
 try{
  const {data,error}=await state.client.from('saved_calculations').select('id,tool_slug,title,created_at').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(4);
  if(error)throw error;
  (data||[]).forEach(x=>rows.push({time:x.created_at,title:x.title||String(x.tool_slug||'Calculation').replaceAll('-',' '),type:'CALCULATION · ACCOUNT',href:calcHref(x.tool_slug)}));
 }catch(e){console.warn('[PilotDesk recent calculations]',e)}
 const flights=localJson('pd-saved-flights',[]).slice().sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0)).slice(0,4);
 flights.forEach(x=>rows.push({time:new Date(Number(x.updatedAt||x.createdAt||Date.now())).toISOString(),title:x.name||x.route||'Saved flight',type:'FLIGHT · THIS DEVICE',href:'/route-planner.html?flight='+encodeURIComponent(x.id||'')}));
 rows.sort((a,b)=>new Date(b.time)-new Date(a.time));
 if(!rows.length){window.PilotDeskStates?.empty(host,'No recent activity yet','Save a calculation or flight and it will appear here.',{href:'/tools.html',label:'Open calculators'});return}
 host.innerHTML=rows.slice(0,5).map(x=>'<div class="pd-account-activity-row"><small>'+relativeTime(x.time)+' · '+x.type+'</small><b>'+String(x.title).replace(/[<>&]/g,'')+'</b><a href="'+x.href+'">Open →</a></div>').join('');
}
function currencyReminder(){
 const data=localJson('pd-daily-currency-reminders',{}),defs=[['day','Day passenger'],['night','Night passenger'],['instrument','Instrument']],now=new Date();now.setHours(12,0,0,0);
 const rows=defs.map(([key,label])=>{const v=data[key];if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(v||'')))return null;const d=new Date(v+'T12:00:00'),days=Math.ceil((d-now)/86400000);return{label,date:v,days}}).filter(Boolean).sort((a,b)=>a.days-b.days);
 return rows[0]||null;
}
function renderCurrencyOverview(){
 const box=$('#pdAccountCurrency');if(!box)return;const x=currencyReminder(),strong=$('strong',box),span=$('span',box);
 if(!x){strong.textContent='—';span.innerHTML='No reminder configured. <a href="/daily/">Set one in Daily →</a>';box.dataset.state='';return}
 box.dataset.state=x.days<0?'expired':x.days<=14?'soon':'ok';strong.textContent=x.days<0?Math.abs(x.days)+'d past':x.days===0?'Today':x.days+'d';span.textContent=x.label+' · pilot-entered '+x.date;
}
async function renderPrepOverview(profile){
 const box=$('#pdAccountPrep');if(!box||!state.session)return;const strong=$('strong',box),span=$('span',box),goal=profile?.training_goal||'',track=['ppl','ira','cpl','cfi','cfii','atp'].includes(goal)?goal:(goal==='multi'?'cpl':localStorage.getItem('pd-written-track')||'ppl');
 try{
  const url=new URL(SUPABASE_URL+'/functions/v1/written-prep');url.searchParams.set('track',track);url.searchParams.set('difficulty','all');
  const r=await fetch(url,{headers:edgeHeaders(),cache:'no-store'}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Written Prep unavailable');
  strong.textContent=Number(d.totalAnswers||0)?String(d.accuracy||0)+'%':'—';
  span.innerHTML=(Number(d.totalAnswers||0)?(Number(d.missed||0)+' missed · '+Number(d.coverage||0)+'% bank seen'):'No answers yet')+' · <a href="/written-prep.html?track='+encodeURIComponent(track)+'">Open prep →</a>';
 }catch(e){strong.textContent='—';span.textContent='Written Prep progress is unavailable right now.'}
}
async function renderHomeOverview(profile){renderCurrencyOverview();await Promise.all([renderRecentActivity(),renderPrepOverview(profile)])}
function renderInterfaceSettings(){
 const p=window.PilotDeskPreferences?.get?.()||{};
 if($('#pdSettingCompact'))$('#pdSettingCompact').checked=Boolean(p.compact);
 if($('#pdSettingMotion'))$('#pdSettingMotion').checked=Boolean(p.reducedMotion);
}
async function renderAccountDashboard(profile){
 const host=$('#pdAccountDashboardGrid');if(!host)return;
 const aircraft=localJson('pd-aircraft',[]),flights=localJson('pd-saved-flights',[]),pins=localJson('pd-favorites',[]);
 const home=cleanAirport(profile?.home_airport||'');
 const cards=[];
 const goal=profile?.training_goal||'',goalName=goalNames[goal]||'',days=daysUntil(profile?.checkride_date);
 if(goalName)cards.push({eyebrow:'CURRENT GOAL · ACCOUNT',title:goalName,copy:days===null?'Set a target date when you have one.':days>1?days+' days to your target date.':days===1?'Target date is tomorrow.':days===0?'Target date is today.':'Target date has passed — update it when your next milestone is scheduled.',href:goalLinks[goal]||'/flight-training.html',cta:'Continue '+goalName});
 cards.push(
  {eyebrow:'PINNED · THIS DEVICE',title:pins.length?pins.length+' pinned tool'+(pins.length===1?'':'s'):'Pin your go-to tools',copy:pins.length?'Your calculator shortcuts are ready in this browser.':'Pin calculators you use often so they are easier to find again.',href:'/tools.html',cta:'Open calculators'},
  {eyebrow:'AIRCRAFT · THIS DEVICE',title:aircraft.length?aircraft.length+' aircraft saved':'Build your local Hangar',copy:'Aircraft profiles stay on this device today. Export them when you want a backup.',href:'/aircraft.html',cta:'Open Aircraft'},
  {eyebrow:'FLIGHTS · THIS DEVICE',title:flights.length?flights.length+' saved flight'+(flights.length===1?'':'s'):'No local flights yet',copy:'Saved routes and planning numbers remain in this browser.',href:'/flights.html',cta:'Open Saved Flights'}
 );
 if(home)cards.push({eyebrow:'HOME AIRPORT · ACCOUNT',title:home,copy:'Jump back to your home-airport context and current PilotDesk tools.',href:'/airport.html?id='+encodeURIComponent(home),cta:'Open '+home});
 const cloud=await cloudCounts(state.session?.user?.id||'');
 if(cloud.aircraft||cloud.flights)cards.push({eyebrow:'CLOUD BACKUP · ACCOUNT',title:(cloud.aircraft+cloud.flights)+' backed-up item'+((cloud.aircraft+cloud.flights)===1?'':'s'),copy:cloud.aircraft+' aircraft · '+cloud.flights+' saved flights stored with your account.',href:'/pricing.html',cta:'Manage Pro'});
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

function cloudStatus(msg,kind=''){const el=$('#pdCloudBackupStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg}
function paidAccess(){return window.PilotDeskBilling?.isPro?.()===true}
function billingStatus(msg,kind=''){const el=$('#pdBillingStatus');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg}
function renderBilling(s){
 state.billing=s||window.PilotDeskBilling?.snapshot?.()||null;
 const paid=Boolean(state.billing?.isPro),school=Boolean(state.billing?.isSchool),sub=state.billing?.subscription||{};
 const title=$('#pdAccountBillingTitle'),stateEl=$('#pdBillingState'),copy=$('#pdBillingCopy'),up=$('#pdUpgradePro'),manage=$('#pdManageBilling'),cloud=$('#pdCloudPlanState');
 if(title)title.innerHTML='<span data-pd-billing-plan>'+(school?'Flight School':paid?'Pro':'Free')+'</span> plan';
 if(stateEl)stateEl.textContent=paid?(sub.cancel_at_period_end?'Cancels at period end':'Active subscription'):(sub.status&&sub.status!=='inactive'?String(sub.status).replaceAll('_',' '):'No active subscription');
 if(copy)copy.textContent=paid?(sub.cancel_at_period_end?'Your paid access remains active through the current billing period. Use billing management to reactivate or review invoices.':'Your paid plan is verified by PilotDesk billing. Full checkride prep, expanded saved planning, cloud backup, and ad-free access stay attached to this account.'):'Core PilotDesk tools remain free. Pro unlocks full interactive checkride prep, removes the Free-plan aircraft/flight cap, adds cloud backup, and removes ads while signed in.';
 up?.classList.toggle('pd-account-hidden',paid);manage?.classList.toggle('pd-account-hidden',!paid);
 if(cloud)cloud.textContent=paid?'Available on this account':'Pro required';
 const backup=$('#pdCloudBackupNow'),restore=$('#pdCloudRestoreNow');if(backup)backup.disabled=!paid;if(restore)restore.disabled=!paid;
 if(!paid)cloudStatus('Cloud backup is a PilotDesk Pro feature. Your existing device-local aircraft and saved flights are unchanged.','warn');else cloudStatus('');
}
async function openBillingPortal(){billingStatus('Opening secure billing…');try{await window.PilotDeskBilling.portal()}catch(e){billingStatus(e.message||'Unable to open billing management.','bad')}}
async function upgradePro(){billingStatus('Opening secure checkout…');try{await window.PilotDeskBilling.checkout('pro')}catch(e){billingStatus(e.message||'Unable to start checkout.','bad')}}
async function backupDeviceToCloud(){
 if(!state.session)return cloudStatus('Sign in before backing up this device.','warn');
 if(!paidAccess())return cloudStatus('PilotDesk Pro is required for cloud backup. Your local data was not changed.','warn');
 const userId=state.session.user.id,aircraft=localJson('pd-aircraft',[]),flights=localJson('pd-saved-flights',[]);
 const btn=$('#pdCloudBackupNow');if(btn)btn.disabled=true;cloudStatus('Saving this device snapshot…');
 try{
  const delA=await state.client.from('aircraft_profiles').delete().eq('user_id',userId);if(delA.error)throw delA.error;
  const delF=await state.client.from('saved_flights').delete().eq('user_id',userId);if(delF.error)throw delF.error;
  if(aircraft.length){
   const rows=aircraft.map((x,i)=>({user_id:userId,name:String(x.name||x.makeModel||x.make_model||('Aircraft '+(i+1))).slice(0,80),make_model:String(x.makeModel||x.make_model||x.type||'').slice(0,120)||null,tail_number:String(x.tailNumber||x.tail_number||'').slice(0,20)||null,data:{...x,_pilotdesk_local_id:x.id||null}}));
   const ins=await state.client.from('aircraft_profiles').insert(rows);if(ins.error)throw ins.error;
  }
  if(flights.length){
   const rows=flights.map((x,i)=>({user_id:userId,name:String(x.name||x.route||('Saved flight '+(i+1))).slice(0,120),route:String(x.route||'').slice(0,1000)||null,data:{...x,_pilotdesk_local_id:x.id||null}}));
   const ins=await state.client.from('saved_flights').insert(rows);if(ins.error)throw ins.error;
  }
  cloudStatus('Cloud backup saved: '+aircraft.length+' aircraft and '+flights.length+' saved flight'+(flights.length===1?'':'s')+'.','good');
  window.pdTrack?.('Cloud Backup Saved',{aircraft:aircraft.length,flights:flights.length});
  await renderAccountDashboard(state.profile);
 }catch(e){cloudStatus(e.message||'Cloud backup failed. Your local data was not changed.','bad')}
 finally{if(btn)btn.disabled=false}
}
async function restoreCloudToDevice(){
 if(!state.session)return cloudStatus('Sign in before restoring a backup.','warn');
 if(!paidAccess())return cloudStatus('PilotDesk Pro is required for cloud restore. Your local data was not changed.','warn');
 if(!confirm('Restore your PilotDesk cloud backup to this device? This replaces the aircraft and saved-flight lists currently stored in this browser.'))return;
 const btn=$('#pdCloudRestoreNow');if(btn)btn.disabled=true;cloudStatus('Loading your cloud backup…');
 try{
  const userId=state.session.user.id;
  const [a,f]=await Promise.all([
   state.client.from('aircraft_profiles').select('id,name,make_model,tail_number,data,updated_at').eq('user_id',userId).order('updated_at',{ascending:true}),
   state.client.from('saved_flights').select('id,name,route,data,updated_at').eq('user_id',userId).order('updated_at',{ascending:true})
  ]);
  if(a.error)throw a.error;if(f.error)throw f.error;
  const aircraft=(a.data||[]).map(row=>({...row.data,id:row.data?._pilotdesk_local_id||row.id,name:row.data?.name||row.name,makeModel:row.data?.makeModel||row.make_model||'',tailNumber:row.data?.tailNumber||row.tail_number||''}));
  const flights=(f.data||[]).map(row=>({...row.data,id:row.data?._pilotdesk_local_id||row.id,name:row.data?.name||row.name,route:row.data?.route||row.route||''}));
  localStorage.setItem('pd-aircraft',JSON.stringify(aircraft));localStorage.setItem('pd-saved-flights',JSON.stringify(flights));
  document.dispatchEvent(new CustomEvent('pilotdesk:aircraft-changed'));document.dispatchEvent(new CustomEvent('pilotdesk:flights-changed'));
  cloudStatus('Restored '+aircraft.length+' aircraft and '+flights.length+' saved flight'+(flights.length===1?'':'s')+' to this device.','good');
  window.pdTrack?.('Cloud Backup Restored',{aircraft:aircraft.length,flights:flights.length});
  await renderAccountDashboard(state.profile);
 }catch(e){cloudStatus(e.message||'Cloud restore failed.','bad')}
 finally{if(btn)btn.disabled=false}
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
 const user=session.user;show('#pdSignedOut',false);show('#pdSignedIn',true);show('#pdRecoveryPanel',false);$('#pdAccountRoot')?.classList.remove('pd-account-disabled');$('#pdUserEmail').textContent=user.email||'Signed in';
 let p=null;try{p=await fetchProfile(user)}catch(e){status('Signed in, but your profile could not be loaded yet.','warn')}
 const display=p?.display_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Pilot';$('#pdUserName').textContent=display;$('#pdDisplayName').value=p?.display_name||'';$('#pdPilotStage').value=p?.pilot_stage||'';$('#pdHomeAirport').value=p?.home_airport||'';renderAvatar(user,p);$('#pdTrainingGoal').value=p?.training_goal||'';$('#pdCheckrideDate').value=p?.checkride_date||'';try{renderBilling(await window.PilotDeskBilling?.refresh?.())}catch{renderBilling(null)}try{if(p?.training_goal)localStorage.setItem('pd-training-goal',p.training_goal);if(p?.checkride_date)localStorage.setItem('pd-training-date',p.checkride_date)}catch{}await renderAccountDashboard(p);await renderHomeOverview(p);renderInterfaceSettings();await loadOwnerMetrics();
 const next=safeNext();if(next&&!ownerView()&&!state.redirectTimer){status('Signed in. Returning you to your PilotDesk tool…','good');state.redirectTimer=setTimeout(()=>location.assign(next),450)}
}
async function renderSession(session){state.session=session||null;if(state.recoveryMode&&session)return showRecovery();if(session)await renderSignedIn(session);else renderSignedOut()}
async function sendMagicLink(e){e.preventDefault();const email=$('#pdEmail').value.trim();await withBusy(e.submitter||$('#pdMagicForm button[type="submit"]'),async()=>{status('Sending your sign-in link…','loading');const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectUrl(),shouldCreateUser:true}});if(error)return status(authError(error,'magic link'),'bad');status('Check your email for a PilotDesk sign-in link. The link may take a few minutes to arrive.','good');window.pdTrack?.('Account Magic Link Requested')})}
async function signInPassword(e){e.preventDefault();const email=$('#pdPasswordEmail').value.trim(),password=$('#pdPassword').value;await withBusy(e.submitter||$('#pdPasswordForm button[type="submit"]'),async()=>{status('Signing you in…','loading');const {error}=await state.client.auth.signInWithPassword({email,password});if(error)return status(authError(error,'password sign-in'),'bad');status('Signed in. Loading your account…','good');window.pdTrack?.('Account Password Sign In')})}
async function createAccount(e){e.preventDefault();const email=$('#pdCreateEmail').value.trim(),password=$('#pdCreatePassword').value;if(password.length<6)return status('Your password must be at least 6 characters.','warn');await withBusy(e.submitter||$('#pdCreateAccountForm button[type="submit"]'),async()=>{status('Creating your account…','loading');const {data,error}=await state.client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}});if(error)return status(authError(error,'sign up'),'bad');if(data.session){await renderSession(data.session);status('Account ready. You are signed in.','good')}else{showVerification(email);status('Check your email to confirm your PilotDesk account. If you already signed up, use Sign in or Forgot password.','good')}window.pdTrack?.('Account Created With Password')})}
async function resendConfirmation(){const email=$('#pdConfirmationEmail').value.trim();if(!$('#pdConfirmationEmail').checkValidity())return status('Enter a valid email address for the confirmation link.','warn');updateResend();const button=$('#pdResendConfirmation');if(button.disabled)return;await withBusy(button,async()=>{const {error}=await state.client.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectUrl()}});if(error)return status(authError(error,'resend confirmation'),'bad');sessionStorage.setItem('pd-confirm-resend-until',String(Date.now()+60000));status('If this account is awaiting confirmation, a new link is on its way. Check your inbox and spam folder.','good')});updateResend()}
async function requestPasswordReset(email,button){if(!email){$('#pdPasswordEmail')?.focus();return status('Enter your email first, then choose Forgot password.','warn')}await withBusy(button,async()=>{status('Sending a password reset link…','loading');const {error}=await state.client.auth.resetPasswordForEmail(email,{redirectTo:new URL('/account.html',location.origin).href});if(error)return status(authError(error,'password reset request'),'bad');status('If this email has an account, a password reset link is on its way. Check your inbox and spam folder.','good')})}
async function resetPassword(){await requestPasswordReset($('#pdPasswordEmail').value.trim(),$('#pdForgotPassword'))}
async function updatePassword(e){e.preventDefault();const password=$('#pdNewPassword').value,confirm=$('#pdConfirmPassword').value;if(password!==confirm)return status('The new passwords do not match.','warn');if(password.length<6)return status('Use at least 6 characters for your new password.','warn');await withBusy(e.submitter||$('#pdRecoveryForm button[type="submit"]'),async()=>{status('Saving your new password…','loading');const {error}=await state.client.auth.updateUser({password});if(error)return status(authError(error,'set new password'),'bad');state.recoveryMode=false;$('#pdNewPassword').value='';$('#pdConfirmPassword').value='';history.replaceState(null,'',location.pathname);await state.client.auth.signOut().catch(error=>console.warn('[PilotDesk auth] sign out after reset',error));renderSignedOut();status('Password updated. Sign in with your new password.','good')})}
async function signInGoogle(){await withBusy($('#pdGoogleSignIn'),async()=>{status('Opening Google sign-in…','loading');const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});if(error)status(authError(error,'Google sign-in'),'bad');else window.pdTrack?.('Account Google Sign In')})}
async function signInGithub(){await withBusy($('#pdGithubSignIn'),async()=>{status('Opening GitHub sign-in…','loading');const {error}=await state.client.auth.signInWithOAuth({provider:'github',options:{redirectTo:redirectUrl()}});if(error)status(authError(error,'GitHub sign-in'),'bad');else window.pdTrack?.('Account GitHub Sign In')})}
async function saveProfile(e){e.preventDefault();if(!state.session)return;const updates={display_name:$('#pdDisplayName').value.trim().slice(0,80)||null,pilot_stage:$('#pdPilotStage').value||null,home_airport:cleanAirport($('#pdHomeAirport').value)||null,training_goal:$('#pdTrainingGoal').value||null,checkride_date:$('#pdCheckrideDate').value||null};status('Saving your profile…');const {error}=await state.client.from('profiles').update(updates).eq('id',state.session.user.id);if(error)return status(error.message,'bad');try{if(updates.training_goal)localStorage.setItem('pd-training-goal',updates.training_goal);else localStorage.removeItem('pd-training-goal');if(updates.checkride_date)localStorage.setItem('pd-training-date',updates.checkride_date);else localStorage.removeItem('pd-training-date')}catch{}status('Profile saved.','good');window.pdTrack?.('Account Profile Saved',{trainingGoal:updates.training_goal||'none',hasTargetDate:updates.checkride_date?'yes':'no'});await renderSignedIn(state.session)}
async function signOut(){await state.client.auth.signOut();status('Signed out.','good');window.pdTrack?.('Account Signed Out')}
async function deleteAccount(){if(!state.session)return;const answer=prompt('This permanently deletes your PilotDesk account and saved account data. Type DELETE to continue.');if(answer!=='DELETE')return;if(!confirm('Delete this PilotDesk account permanently? This cannot be undone.'))return;status('Deleting your account…');try{const r=await fetch(`${SUPABASE_URL}/functions/v1/delete-account`,{method:'POST',headers:edgeHeaders()});const d=await r.json().catch(()=>({}));if(!r.ok)return status(d.error||'Unable to delete your account.','bad');await state.client.auth.signOut({scope:'local'}).catch(()=>{});state.session=null;state.profile=null;renderSignedOut();status('Your PilotDesk account was deleted.','good')}catch{status('Unable to delete your account right now.','bad')}}
function bind(){$('#pdAccountRetry')?.addEventListener('click',()=>location.reload());$('#pdMagicForm')?.addEventListener('submit',sendMagicLink);$('#pdPasswordForm')?.addEventListener('submit',signInPassword);$('#pdCreateAccountForm')?.addEventListener('submit',createAccount);$('#pdResendConfirmation')?.addEventListener('click',resendConfirmation);$('#pdRecoveryForm')?.addEventListener('submit',updatePassword);$('#pdForgotPassword')?.addEventListener('click',resetPassword);$('#pdChangePassword')?.addEventListener('click',()=>requestPasswordReset(state.session?.user?.email,$('#pdChangePassword')));$('#pdGoogleSignIn')?.addEventListener('click',signInGoogle);$('#pdProfileForm')?.addEventListener('submit',saveProfile);$('#pdSignOut')?.addEventListener('click',signOut);$('#pdDeleteAccount')?.addEventListener('click',deleteAccount);$('#pdRefreshMetrics')?.addEventListener('click',loadOwnerMetrics);$('#pdOwnerClaim')?.addEventListener('submit',claimOwnerAccess);$('#pdCloudBackupNow')?.addEventListener('click',backupDeviceToCloud);$('#pdCloudRestoreNow')?.addEventListener('click',restoreCloudToDevice);$('#pdManageBilling')?.addEventListener('click',openBillingPortal);$('#pdUpgradePro')?.addEventListener('click',upgradePro);$('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)});$('#pdSettingCompact')?.addEventListener('change',e=>window.PilotDeskPreferences?.set?.('compact',e.target.checked));$('#pdSettingMotion')?.addEventListener('change',e=>window.PilotDeskPreferences?.set?.('motion',e.target.checked))}
async function init(){bind();show('#pdGoogleSignIn',false);$('#pdAccountRoot')?.classList.add('pd-account-disabled');status('Loading your account…','loading');const linkError=callbackError(),url=new URL(location.href);state.recoveryMode=url.searchParams.get('type')==='recovery'||new URLSearchParams(url.hash.replace(/^#/,'')).get('type')==='recovery';setInterval(()=>{if(!$('#pdVerificationPanel')?.classList.contains('pd-account-hidden'))updateResend()},1000);try{await loadSupabase();state.client.auth.onAuthStateChange((event,next)=>{if(event==='PASSWORD_RECOVERY')state.recoveryMode=true;if(event==='SIGNED_OUT')state.recoveryMode=false;setTimeout(()=>renderSession(next),0)});const {data:{session},error}=await state.client.auth.getSession();if(error)throw error;status('');await renderSession(session);if(linkError){state.recoveryMode=false;if(!session&&['otp_expired','otp_disabled'].includes(linkError))showVerification('');status(['otp_expired','otp_disabled'].includes(linkError)?'That email link expired or was already used. For a password reset, enter your email and choose Forgot password. For confirmation, resend below.':authError({code:linkError,message:linkError},'email callback'),'bad')}else if(state.recoveryMode&&!session){state.recoveryMode=false;renderSignedOut();status('That recovery link has expired or is invalid. Enter your email and request a new password reset link.','bad')}const qp=new URL(location.href).searchParams;if(qp.get('billing')==='success'){billingStatus('Payment completed. PilotDesk is confirming the subscription with Stripe…','good');setTimeout(async()=>{try{renderBilling(await window.PilotDeskBilling?.refresh?.());billingStatus('Subscription status refreshed.','good')}catch{}},1200)}}catch(e){console.error('[PilotDesk account init]',e);renderSignedOut();$('#pdAccountRoot')?.classList.remove('pd-account-disabled');$('#pdSignedOut')?.querySelectorAll('input,button').forEach(control=>{control.disabled=true});show('#pdAccountRetry',true);status('PilotDesk accounts are temporarily unavailable. Check your connection and retry.','warn')}}
document.addEventListener('click',e=>{if(e.target?.id==='pdGithubSignIn')signInGithub()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

