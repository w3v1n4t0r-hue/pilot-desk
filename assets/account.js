(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null,billing:null};
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
 box.innerHTML=`<b>${completed?'Today’s Daily check is complete':'PilotDesk Daily is ready'}</b><span>${completed?`${done} saved Daily completion${done===1?'':'s'} · current activity streak ${streak} day${streak===1?'':'s'}`:'Saved-route weather, currency reminders, and today’s short knowledge check.'}</span><div class="pd-account-actions"><a href="/daily/">${completed?'Review Daily':'Open Daily'} →</a></div>`;
}
function ensureWrittenPrepCta(){
 const signed=$('#pdSignedIn');if(!signed)return;let box=$('#pdAccountWrittenPrep');if(!box){box=document.createElement('div');box.id='pdAccountWrittenPrep';box.className='pd-account-benefit';const daily=$('#pdAccountDailyCta');(daily||$('.pd-user-stats',signed))?.insertAdjacentElement('afterend',box)}
 box.innerHTML='<b>Free FAA Written Prep</b><span>PPL · Instrument · CPL · CFI · CFII · ATP. Review weak subjects, missed questions and saved scores by FAA standard.</span><div class="pd-account-actions"><a href="/written-prep.html">Open my written prep →</a><a href="/skill-gap.html">Check my weak subjects →</a></div>';
}

function localJson(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function localSetting(key,fallback='1'){try{return localStorage.getItem(key)??fallback}catch{return fallback}}
function renderState(host,opts){const target=typeof host==='string'?$(host):host;if(!target)return;const api=window.PilotDeskState;if(api?.render)return api.render(target,opts);const k=opts.kind||'empty';target.innerHTML=`<div class="pd-state pd-state-${k}"><span class="pd-state-instrument" aria-hidden="true"><i></i><i></i><i></i></span><div><b>${String(opts.title||'')}</b><span>${String(opts.detail||'')}</span>${opts.actionLabel&&opts.actionHref?`<a class="pd-state-action" href="${opts.actionHref}">${opts.actionLabel} →</a>`:''}</div></div>`}
function relativeTime(ts){const n=Number(ts);if(!Number.isFinite(n))return'';const d=Math.max(0,Date.now()-n),m=Math.floor(d/60000),h=Math.floor(m/60),days=Math.floor(h/24);return m<2?'just now':m<60?`${m} min ago`:h<24?`${h} hr ago`:days===1?'yesterday':`${days} days ago`}
function trainingPrepTrack(profile){const map={ppl:'ppl',ira:'ira',cpl:'cpl',multi:'cpl',cfi:'cfi',cfii:'cfii',atp:'atp'};if(localSetting('pd-setting-goal-study','1')==='1'&&map[profile?.training_goal])return map[profile.training_goal];try{return ['ppl','ira','cpl','cfi','cfii','atp'].includes(localStorage.getItem('pd-written-track'))?localStorage.getItem('pd-written-track'):'ppl'}catch{return'ppl'}}
function renderRecentActivity(){
 const host=$('#pdAccountRecentActivity');if(!host)return;if(localSetting('pd-setting-device-activity','1')!=='1'){renderState(host,{kind:'empty',title:'Device activity hidden',detail:'Turn “Show device activity” back on under Settings to see recent local work.'});return}
 const rec=localJson('pd-recent',[]).map(x=>({title:x.title||'Calculator',href:x.path||'/tools.html',at:Number(x.usedAt)||0,type:'CALCULATOR'}));
 const flights=localJson('pd-saved-flights',[]).map(x=>({title:x.name||x.route||'Saved flight',href:'/route-planner.html?flight='+encodeURIComponent(x.id||''),at:Number(x.updatedAt||x.createdAt)||0,type:'FLIGHT'}));
 const items=[...rec,...flights].filter(x=>x.at).sort((a,b)=>b.at-a.at).slice(0,4);
 if(!items.length){renderState(host,{kind:'empty',title:'No recent device activity',detail:'Use a calculator or save a flight and it will appear here.',actionLabel:'Open calculators',actionHref:'/tools.html'});return}
 host.innerHTML='<div class="pd-account-panel-head"><div><small>RECENT ACTIVITY</small><h3>Continue from this device</h3></div><a href="/history.html">History →</a></div><div class="pd-account-activity-list">'+items.map(x=>`<a href="${x.href}"><span><b>${x.title}</b><small>${x.type}</small></span><em>${relativeTime(x.at)}</em></a>`).join('')+'</div>';
}
function daysUntilReminder(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return null;const t=new Date(v+'T12:00:00'),n=new Date();n.setHours(12,0,0,0);return Math.ceil((t-n)/86400000)}
function renderCurrencyReminder(){
 const host=$('#pdAccountCurrency');if(!host)return;const data=localJson('pd-daily-currency-reminders',{}),defs=[['day','Day passenger'],['night','Night passenger'],['instrument','Instrument']],rows=defs.map(([key,label])=>({label,date:data[key],days:daysUntilReminder(data[key])})).filter(x=>x.days!==null).sort((a,b)=>a.days-b.days);
 if(!rows.length){renderState(host,{kind:'empty',title:'No currency reminders set',detail:'Daily can hold pilot-entered reminder dates without claiming legal currency.',actionLabel:'Set reminders in Daily',actionHref:'/daily/'});return}
 const x=rows[0],value=x.days<0?`${Math.abs(x.days)} days past reminder`:x.days===0?'Reminder date today':x.days===1?'1 day to reminder':`${x.days} days to reminder`,kind=x.days<0?'error':x.days<=14?'warning':'empty';
 host.innerHTML=`<div class="pd-account-panel-head"><div><small>CURRENCY REMINDER</small><h3>${x.label}</h3></div><strong class="pd-account-panel-value">${value}</strong></div><p>Pilot-entered date ${x.date}. Verify your actual logbook, applicable rules, and required experience.</p><a class="pd-account-panel-link" href="/daily/">Review reminders →</a>`;host.dataset.state=kind;
}
async function renderPrepProgress(profile){
 const host=$('#pdAccountPrepProgress');if(!host||!state.session)return;const track=trainingPrepTrack(profile),names={ppl:'Private',ira:'Instrument',cpl:'Commercial',cfi:'CFI',cfii:'CFII',atp:'ATP'};
 renderState(host,{kind:'loading',title:'Loading Written Prep',detail:'Reading saved '+(names[track]||track.toUpperCase())+' progress.'});
 try{const url=new URL(SUPABASE_URL+'/functions/v1/written-prep');url.searchParams.set('track',track);url.searchParams.set('difficulty','all');const r=await fetch(url,{headers:edgeHeaders(),cache:'no-store'}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Written Prep progress is unavailable.');
 const answered=Number(d.totalAnswers||0),accuracy=Number(d.accuracy||0),missed=Number(d.missed||0),weak=d.skillAreas?.[0]?.area||'No measured weak subject yet';
 if(!answered){renderState(host,{kind:'empty',title:(names[track]||track.toUpperCase())+' Written Prep',detail:'No saved answers yet for this rating.',actionLabel:'Start a session',actionHref:'/written-prep.html?track='+encodeURIComponent(track)});return}
 host.innerHTML=`<div class="pd-account-panel-head"><div><small>WRITTEN PREP · ${(names[track]||track).toUpperCase()}</small><h3>${accuracy}% accuracy</h3></div><strong class="pd-account-panel-value">${missed} missed</strong></div><p>Lowest measured subject: <b>${weak}</b>. ${answered} saved answer${answered===1?'':'s'}.</p><a class="pd-account-panel-link" href="/written-prep.html?track=${encodeURIComponent(track)}">Continue Written Prep →</a>`;
 }catch(e){renderState(host,{kind:'error',title:'Written Prep unavailable',detail:e.message||'Could not load saved study progress.',actionLabel:'Open Written Prep',actionHref:'/written-prep.html?track='+encodeURIComponent(track)})}
}
function renderAccountSettings(){
 const reduce=$('#pdSettingReduceMotion'),activity=$('#pdSettingDeviceActivity'),goal=$('#pdSettingGoalStudy');if(reduce)reduce.checked=localSetting('pd-setting-reduce-motion','0')==='1';if(activity)activity.checked=localSetting('pd-setting-device-activity','1')==='1';if(goal)goal.checked=localSetting('pd-setting-goal-study','1')==='1';
}
function saveAccountSetting(key,value){try{localStorage.setItem(key,value?'1':'0')}catch{}}

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
 const cards=[],studyTrack=trainingPrepTrack(profile);
 const goal=profile?.training_goal||'',goalName=goalNames[goal]||'',days=daysUntil(profile?.checkride_date);
 if(goalName)cards.push({eyebrow:'CURRENT GOAL · ACCOUNT',title:goalName,copy:days===null?'Set a target date when you have one.':days>1?days+' days to your target date.':days===1?'Target date is tomorrow.':days===0?'Target date is today.':'Target date has passed — update it when your next milestone is scheduled.',href:goalLinks[goal]||'/flight-training.html',cta:'Continue '+goalName});
 cards.push(
  {eyebrow:'DAILY · ACCOUNT',title:dailyDone?'Today complete':'Today is ready',copy:dailyDone?'Today’s Daily check is saved to your account.':'Saved-route weather, currency reminders, and today’s short knowledge check.',href:'/daily/',cta:dailyDone?'Review Daily':'Play Daily'},
  {eyebrow:'WRITTEN PREP · ACCOUNT',title:'Keep studying',copy:'Your written-prep scores, misses, and FAA-standard progress follow your sign-in.',href:'/written-prep.html?track='+encodeURIComponent(studyTrack),cta:'Open Written Prep'},
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
 if(copy)copy.textContent=paid?(sub.cancel_at_period_end?'Your paid access remains active through the current billing period. Use billing management to reactivate or review invoices.':'Your paid plan is verified by PilotDesk billing. Pro cloud backup and ad-free access stay attached to this account.'):'Core PilotDesk tools remain free. Pro adds aircraft and saved-flight cloud backup plus an ad-free signed-in experience.';
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
 const user=session.user;show('#pdSignedOut',false);show('#pdSignedIn',true);$('#pdAccountRoot')?.classList.remove('pd-account-disabled');$('#pdUserEmail').textContent=user.email||'Signed in';
 let p=null;try{p=await fetchProfile(user)}catch(e){status('Signed in, but your profile could not be loaded yet.','warn')}
 const display=p?.display_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Pilot';$('#pdUserName').textContent=display;$('#pdDisplayName').value=p?.display_name||'';$('#pdPilotStage').value=p?.pilot_stage||'';$('#pdHomeAirport').value=p?.home_airport||'';renderAvatar(user,p);$('#pdTrainingGoal').value=p?.training_goal||'';$('#pdCheckrideDate').value=p?.checkride_date||'';try{renderBilling(await window.PilotDeskBilling?.refresh?.())}catch{renderBilling(null)}renderAccountSettings();renderRecentActivity();renderCurrencyReminder();await renderPrepProgress(p);try{if(p?.training_goal)localStorage.setItem('pd-training-goal',p.training_goal);if(p?.checkride_date)localStorage.setItem('pd-training-date',p.checkride_date)}catch{}await renderAccountDashboard(p);await loadOwnerMetrics();
 const next=safeNext();if(next&&!ownerView()){status('Signed in. Returning you to your PilotDesk tool…','good');setTimeout(()=>location.assign(next),450)}
}
async function renderSession(session){state.session=session||null;if(session)await renderSignedIn(session);else renderSignedOut()}
async function sendMagicLink(e){e.preventDefault();const email=$('#pdEmail').value.trim();if(!email)return status('Enter your email address.','warn');status('Sending your sign-in link…');const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectUrl(),shouldCreateUser:true}});if(error)return status(error.message,'bad');status('Check your email. Your PilotDesk sign-in link is on the way.','good');window.pdTrack?.('Account Magic Link Requested')}
async function signInPassword(e){e.preventDefault();const email=$('#pdPasswordEmail').value.trim(),password=$('#pdPassword').value;if(!email||!password)return status('Enter your email and password.','warn');status('Signing you in…');const {error}=await state.client.auth.signInWithPassword({email,password});if(error){const message=/invalid login credentials/i.test(error.message)?'That email and password did not match. Use Forgot password or email sign-in if you need to recover access.':error.message;return status(message,'bad')}window.pdTrack?.('Account Password Sign In')}
async function createAccount(e){e.preventDefault();const email=$('#pdCreateEmail').value.trim(),password=$('#pdCreatePassword').value;if(password.length<6)return status('Your password must be at least 6 characters.','warn');status('Creating your account…');const {data,error}=await state.client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}});if(error)return status(error.message,'bad');if(data.session)await renderSession(data.session);else status('Account created. Check your email once to confirm it, then you can sign in with your password.','good');window.pdTrack?.('Account Created With Password')}
async function resetPassword(){const email=$('#pdPasswordEmail').value.trim();if(!email)return status('Enter your email first, then choose Forgot password.','warn');status('Sending a password reset link…');const {error}=await state.client.auth.resetPasswordForEmail(email,{redirectTo:new URL('/account.html',location.origin).href});if(error)return status(error.message,'bad');status('Check your email for a password reset link.','good')}
async function signInGoogle(){status('Opening Google sign-in…');const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});if(error)status(error.message,'bad');else window.pdTrack?.('Account Google Sign In')}
async function signInGithub(){status('Opening GitHub sign-in…');const {error}=await state.client.auth.signInWithOAuth({provider:'github',options:{redirectTo:redirectUrl()}});if(error)status(error.message,'bad');else window.pdTrack?.('Account GitHub Sign In')}
async function saveProfile(e){e.preventDefault();if(!state.session)return;const updates={display_name:$('#pdDisplayName').value.trim().slice(0,80)||null,pilot_stage:$('#pdPilotStage').value||null,home_airport:cleanAirport($('#pdHomeAirport').value)||null,training_goal:$('#pdTrainingGoal').value||null,checkride_date:$('#pdCheckrideDate').value||null};status('Saving your profile…');const {error}=await state.client.from('profiles').update(updates).eq('id',state.session.user.id);if(error)return status(error.message,'bad');try{if(updates.training_goal)localStorage.setItem('pd-training-goal',updates.training_goal);else localStorage.removeItem('pd-training-goal');if(updates.checkride_date)localStorage.setItem('pd-training-date',updates.checkride_date);else localStorage.removeItem('pd-training-date')}catch{}status('Profile saved.','good');window.pdTrack?.('Account Profile Saved',{trainingGoal:updates.training_goal||'none',hasTargetDate:updates.checkride_date?'yes':'no'});await renderSignedIn(state.session)}
async function signOut(){await state.client.auth.signOut();status('Signed out.','good');window.pdTrack?.('Account Signed Out')}
async function deleteAccount(){if(!state.session)return;const answer=prompt('This permanently deletes your PilotDesk account and saved account data. Type DELETE to continue.');if(answer!=='DELETE')return;if(!confirm('Delete this PilotDesk account permanently? This cannot be undone.'))return;status('Deleting your account…');try{const r=await fetch(`${SUPABASE_URL}/functions/v1/delete-account`,{method:'POST',headers:edgeHeaders()});const d=await r.json().catch(()=>({}));if(!r.ok)return status(d.error||'Unable to delete your account.','bad');await state.client.auth.signOut({scope:'local'}).catch(()=>{});state.session=null;state.profile=null;renderSignedOut();status('Your PilotDesk account was deleted.','good')}catch{status('Unable to delete your account right now.','bad')}}
function bind(){$('#pdMagicForm')?.addEventListener('submit',sendMagicLink);$('#pdPasswordForm')?.addEventListener('submit',signInPassword);$('#pdCreateAccountForm')?.addEventListener('submit',createAccount);$('#pdForgotPassword')?.addEventListener('click',resetPassword);$('#pdGoogleSignIn')?.addEventListener('click',signInGoogle);$('#pdProfileForm')?.addEventListener('submit',saveProfile);$('#pdSignOut')?.addEventListener('click',signOut);$('#pdDeleteAccount')?.addEventListener('click',deleteAccount);$('#pdRefreshMetrics')?.addEventListener('click',loadOwnerMetrics);$('#pdOwnerClaim')?.addEventListener('submit',claimOwnerAccess);$('#pdCloudBackupNow')?.addEventListener('click',backupDeviceToCloud);$('#pdCloudRestoreNow')?.addEventListener('click',restoreCloudToDevice);$('#pdManageBilling')?.addEventListener('click',openBillingPortal);$('#pdUpgradePro')?.addEventListener('click',upgradePro);$('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)});$('#pdSettingReduceMotion')?.addEventListener('change',e=>{saveAccountSetting('pd-setting-reduce-motion',e.target.checked);window.PilotDeskState?.applyMotionPreference?.()});$('#pdSettingDeviceActivity')?.addEventListener('change',e=>{saveAccountSetting('pd-setting-device-activity',e.target.checked);renderRecentActivity()});$('#pdSettingGoalStudy')?.addEventListener('change',async e=>{saveAccountSetting('pd-setting-goal-study',e.target.checked);await renderAccountDashboard(state.profile);await renderPrepProgress(state.profile)})}
async function init(){bind();show('#pdGoogleSignIn',false);$('#pdAccountRoot')?.classList.add('pd-account-disabled');status('Loading your account…');try{await loadSupabase();const {data:{session},error}=await state.client.auth.getSession();if(error)throw error;state.client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>renderSession(next),0)});status('');await renderSession(session);const qp=new URL(location.href).searchParams;if(qp.get('billing')==='success'){billingStatus('Payment completed. PilotDesk is confirming the subscription with Stripe…','good');setTimeout(async()=>{try{renderBilling(await window.PilotDeskBilling?.refresh?.());billingStatus('Subscription status refreshed.','good')}catch{}},1200)}}catch(e){console.error('[PilotDesk account init]',e);renderSignedOut();$('#pdAccountRoot')?.classList.add('pd-account-disabled');status(e.message||'Accounts are temporarily unavailable.','warn')}}
document.addEventListener('click',e=>{if(e.target?.id==='pdGithubSignIn')signInGithub()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

