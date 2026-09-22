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

function ensureDailyCta(){document.querySelector('#pdAccountDailyCta')?.remove()}
function ensureWrittenPrepCta(){document.querySelector('#pdAccountWrittenPrep')?.remove()}

function localJson(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
const goalNames={ppl:'Private Pilot',ira:'Instrument Rating',cpl:'Commercial Pilot',multi:'Multi-Engine',cfi:'CFI',cfii:'CFII',atp:'ATP'};
const goalLinks={ppl:'/training/private-pilot.html',ira:'/training/instrument-rating.html',cpl:'/training/commercial-pilot.html',multi:'/training/multiengine.html',cfi:'/training/cfi.html',cfii:'/flight-training.html',atp:'/written-prep.html'};
function daysUntil(value){if(!value)return null;const d=new Date(value+'T12:00:00'),now=new Date();now.setHours(12,0,0,0);return Math.ceil((d-now)/86400000)}
const ACCOUNT_UI_KEY='pd-account-ui-settings';
function accountUi(){const x=localJson(ACCOUNT_UI_KEY,{});return {recent:x.recent!==false,currency:x.currency!==false,compact:x.compact===true}}
function applyAccountUi(){
 const s=accountUi(),shell=$('.pd-account-shell');$('#pdSettingRecent')?.toggleAttribute('checked',s.recent);if($('#pdSettingRecent'))$('#pdSettingRecent').checked=s.recent;if($('#pdSettingCurrency'))$('#pdSettingCurrency').checked=s.currency;if($('#pdSettingCompact'))$('#pdSettingCompact').checked=s.compact;
 $('#pdAccountRecent')?.toggleAttribute('hidden',!s.recent);$('#pdAccountCurrencyCard')?.toggleAttribute('hidden',!s.currency);shell?.classList.toggle('pd-account-compact',s.compact)
}
function saveAccountUi(){
 const s={recent:Boolean($('#pdSettingRecent')?.checked),currency:Boolean($('#pdSettingCurrency')?.checked),compact:Boolean($('#pdSettingCompact')?.checked)};try{localStorage.setItem(ACCOUNT_UI_KEY,JSON.stringify(s))}catch{}applyAccountUi()
}
function currencyRows(){
 const data=localJson('pd-daily-currency-reminders',{}),defs=[['day','Day passenger'],['night','Night passenger'],['instrument','Instrument']];
 return defs.map(([key,label])=>({key,label,date:data[key]||'',days:daysUntil(data[key])})).filter(x=>x.days!==null).sort((a,b)=>a.days-b.days)
}
function renderCurrencyOverview(){
 const rows=currencyRows(),card=$('#pdAccountCurrencyCard');if(!card)return;
 if(!rows.length){$('#pdAccountCurrencyTitle').textContent='Not configured';$('#pdAccountCurrencyValue').textContent='—';$('#pdAccountCurrencyCopy').textContent='Add your own reminder dates in Daily. PilotDesk does not determine legal currency from these dates.';card.dataset.state='';return}
 const x=rows[0],stateName=x.days<0?'expired':x.days<=14?'soon':'ok',value=x.days<0?`${Math.abs(x.days)} days past reminder`:x.days===0?'Reminder date today':x.days===1?'1 day to reminder':`${x.days} days to reminder`;
 $('#pdAccountCurrencyTitle').textContent=x.label;$('#pdAccountCurrencyValue').textContent=value;$('#pdAccountCurrencyCopy').textContent=`Pilot-entered date ${x.date}. Verify your logbook and applicable rules before relying on passenger or instrument privileges.`;card.dataset.state=stateName
}
function writtenTrack(profile){
 const valid=['ppl','ira','cpl','cfi','cfii','atp'],saved=localStorage.getItem('pd-written-track')||'',goal=String(profile?.training_goal||'');return valid.includes(saved)?saved:valid.includes(goal)?goal:'ppl'
}
async function renderPrepOverview(profile){
 const card=$('#pdAccountPrepCard'),title=$('#pdAccountPrepTitle'),value=$('#pdAccountPrepValue'),copy=$('#pdAccountPrepCopy'),link=$('#pdAccountPrepLink');if(!card||!state.session)return;
 const track=writtenTrack(profile),label={ppl:'Private Pilot',ira:'Instrument',cpl:'Commercial',cfi:'CFI',cfii:'CFII',atp:'ATP'}[track]||'Written Prep';if(link)link.href='/written-prep.html?track='+encodeURIComponent(track);
 title.textContent=label;value.textContent='…';copy.textContent='Checking saved Written Prep progress.';
 try{
  const url=new URL(SUPABASE_URL+'/functions/v1/written-prep');url.searchParams.set('track',track);url.searchParams.set('difficulty','all');
  const r=await fetch(url,{headers:edgeHeaders(),cache:'no-store'}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Study progress unavailable');
  const answers=Number(d.totalAnswers||0),weak=d.skillAreas?.[0]?.area||'No weak subject yet';value.textContent=answers?`${Number(d.accuracy||0)}% accuracy`:'No answers yet';copy.textContent=answers?`${Number(d.missed||0)} currently missed · ${Number(d.standardCoverage||0)}% of FAA elements seen · weakest: ${weak}.`:'Start a session to build subject and FAA-element progress.';card.dataset.state=answers?'ok':''
 }catch{value.textContent='Unavailable';copy.textContent='Written Prep progress could not be reached. Your saved study data was not changed.';card.dataset.state=''}
}
function relativeTime(v){
 const t=typeof v==='number'?v:new Date(v||0).getTime();if(!Number.isFinite(t)||!t)return '';const min=Math.max(0,Math.round((Date.now()-t)/60000));if(min<1)return'just now';if(min<60)return min+' min ago';const h=Math.round(min/60);if(h<24)return h+' hr ago';const d=Math.round(h/24);return d+' day'+(d===1?'':'s')+' ago'
}
function calculationHref(slug){
 const s=String(slug||'');if(s==='weight-balance-builder')return'/weight-balance.html';return s?'/calculators/'+encodeURIComponent(s)+'/':'/tools.html'
}
async function renderRecentActivity(){
 const host=$('#pdAccountRecentList');if(!host||!state.session)return;window.PilotDeskState?.render(host,{kind:'loading',title:'Loading recent activity',detail:'Checking saved calculations, flights, and tools.'});
 const items=[],calc=localJson('pd-calculation-history',[]).slice(0,4),flights=localJson('pd-saved-flights',[]).slice().sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0)).slice(0,4),recent=localJson('pd-recent',[]).slice(0,4);
 calc.forEach(x=>items.push({type:'CALCULATION · THIS DEVICE',title:x.title||'Calculator result',href:x.path||'/history.html',at:Number(x.at)||0}));
 flights.forEach(x=>items.push({type:'SAVED FLIGHT · THIS DEVICE',title:x.name||x.route||'Saved flight',href:'/route-planner.html?flight='+encodeURIComponent(x.id||''),at:Number(x.updatedAt||x.createdAt)||0}));
 recent.forEach(x=>items.push({type:'RECENT TOOL · THIS DEVICE',title:x.title||'PilotDesk tool',href:x.path||'/tools.html',at:Number(x.usedAt)||0}));
 try{
  const {data,error}=await state.client.from('saved_calculations').select('id,tool_slug,title,created_at').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(4);if(error)throw error;
  (data||[]).forEach(x=>items.push({type:'SAVED CALCULATION · ACCOUNT',title:x.title||x.tool_slug||'Saved calculation',href:calculationHref(x.tool_slug),at:new Date(x.created_at).getTime()}))
 }catch{}
 const seen=new Set(),list=items.sort((a,b)=>b.at-a.at).filter(x=>{const k=x.type+'|'+x.title+'|'+x.href;if(seen.has(k))return false;seen.add(k);return true}).slice(0,7);
 if(!list.length){window.PilotDeskState?.render(host,{kind:'empty',title:'No recent activity yet',detail:'Run a calculator or save a flight and it will show up here.',actionHref:'/tools.html',actionLabel:'Open calculators'});return}
 host.innerHTML=list.map(x=>`<a class="pd-account-recent-item" href="${x.href}"><small>${x.type}</small><b>${x.title}</b><span>${relativeTime(x.at)}</span></a>`).join('')
}
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
  {eyebrow:'DAILY · ACCOUNT',title:dailyDone?'Today complete':'Today is ready',copy:dailyDone?'Today’s short aviation check is saved.':'Route weather, reminders, and today’s short knowledge check.',href:'/daily/',cta:dailyDone?'Review Daily':'Open Daily'},
  {eyebrow:'WRITTEN PREP · ACCOUNT',title:'Keep studying',copy:'Your written-prep scores, misses, and FAA-standard progress follow your sign-in.',href:'/written-prep.html',cta:'Open Written Prep'},
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
 const display=p?.display_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Pilot';$('#pdUserName').textContent=display;$('#pdDisplayName').value=p?.display_name||'';$('#pdPilotStage').value=p?.pilot_stage||'';$('#pdHomeAirport').value=p?.home_airport||'';$('#pdXp').textContent=String(p?.xp??0);$('#pdLevel').textContent=String(p?.level??1);$('#pdStreak').textContent=String(p?.current_streak??0);$('#pdBestStreak').textContent=String(p?.longest_streak??0);renderAvatar(user,p);$('#pdTrainingGoal').value=p?.training_goal||'';$('#pdCheckrideDate').value=p?.checkride_date||'';try{renderBilling(await window.PilotDeskBilling?.refresh?.())}catch{renderBilling(null)}try{if(p?.training_goal)localStorage.setItem('pd-training-goal',p.training_goal);if(p?.checkride_date)localStorage.setItem('pd-training-date',p.checkride_date)}catch{}applyAccountUi();renderCurrencyOverview();await Promise.all([renderAccountDashboard(p),renderPrepOverview(p),renderRecentActivity()]);ensureDailyCta(p);ensureWrittenPrepCta();await loadOwnerMetrics();
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
function bind(){$('#pdMagicForm')?.addEventListener('submit',sendMagicLink);$('#pdPasswordForm')?.addEventListener('submit',signInPassword);$('#pdCreateAccountForm')?.addEventListener('submit',createAccount);$('#pdForgotPassword')?.addEventListener('click',resetPassword);$('#pdGoogleSignIn')?.addEventListener('click',signInGoogle);$('#pdProfileForm')?.addEventListener('submit',saveProfile);$('#pdSignOut')?.addEventListener('click',signOut);$('#pdDeleteAccount')?.addEventListener('click',deleteAccount);$('#pdRefreshMetrics')?.addEventListener('click',loadOwnerMetrics);$('#pdOwnerClaim')?.addEventListener('submit',claimOwnerAccess);$('#pdCloudBackupNow')?.addEventListener('click',backupDeviceToCloud);$('#pdCloudRestoreNow')?.addEventListener('click',restoreCloudToDevice);$('#pdManageBilling')?.addEventListener('click',openBillingPortal);$('#pdUpgradePro')?.addEventListener('click',upgradePro);$('#pdHomeAirport')?.addEventListener('input',e=>{e.target.value=cleanAirport(e.target.value)});['pdSettingRecent','pdSettingCurrency','pdSettingCompact'].forEach(id=>$('#'+id)?.addEventListener('change',saveAccountUi))}
async function init(){bind();show('#pdGoogleSignIn',false);$('#pdAccountRoot')?.classList.add('pd-account-disabled');status('Loading your account…');try{await loadSupabase();const {data:{session},error}=await state.client.auth.getSession();if(error)throw error;state.client.auth.onAuthStateChange((_event,next)=>{setTimeout(()=>renderSession(next),0)});status('');await renderSession(session);const qp=new URL(location.href).searchParams;if(qp.get('billing')==='success'){billingStatus('Payment completed. PilotDesk is confirming the subscription with Stripe…','good');setTimeout(async()=>{try{renderBilling(await window.PilotDeskBilling?.refresh?.());billingStatus('Subscription status refreshed.','good')}catch{}},1200)}}catch(e){console.error('[PilotDesk account init]',e);renderSignedOut();$('#pdAccountRoot')?.classList.add('pd-account-disabled');status(e.message||'Accounts are temporarily unavailable.','warn')}}
document.addEventListener('click',e=>{if(e.target?.id==='pdGithubSignIn')signInGithub()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

