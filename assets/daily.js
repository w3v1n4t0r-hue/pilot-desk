(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null,data:null,submitted:false,started:false};
const edgeHeaders=()=>({apikey:SUPABASE_PUBLISHABLE_KEY,...(state.session?.access_token?{Authorization:`Bearer ${state.session.access_token}`}:{})});
const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const guestKey=date=>`pd-daily-guest-${date}`;
const historyKey='pd-daily-local-history';
const currencyKey='pd-daily-currency-reminders';
const routeWeatherKey='pd-daily-route-weather-v1';
const STUDY_LINKS={
 weather:[['/weather.html','Check current aviation weather'],['/guides/metar-taf.html','METAR & TAF guide'],['/guides/aviation-weather-reference.html','Weather reference']],
 performance:[['/tools.html?category=Performance','Performance calculators'],['/guides/aircraft-performance-reference.html','Aircraft performance reference'],['/weight-balance.html','Weight & balance']],
 systems:[['/guides.html?q=systems','Systems guides'],['/checklist-trainer.html','Checklist trainer'],['/flight-training.html','Training hub']],
 airport:[['/airport.html','Airport information'],['/guides.html?q=airport','Airport operations guides'],['/route-planner.html','Route planner']],
 decision:[['/skill-gap.html','See Weak Subjects'],['/learn/oral-exam/','Practice oral answers'],['/flight-training.html','Training hub']]
};
function localHistory(){try{return JSON.parse(localStorage.getItem(historyKey)||'[]')}catch{return []}}
function saveLocalHistory(date,result){
 const score=Number(result?.score),max=Number(result?.maxScore)||3;if(!date||!Number.isFinite(score))return;
 const next=[{date,score,max},...localHistory().filter(x=>x.date!==date)].slice(0,14);
 try{localStorage.setItem(historyKey,JSON.stringify(next))}catch{}
 renderWeek();
}
function renderWeek(){
 const host=$('#pdDailyWeek'),copy=$('#pdDailyWeekText');if(!host)return;
 const history=localHistory(),byDate=new Map(history.map(x=>[x.date,x]));
 const now=new Date(),days=[];
 for(let i=6;i>=0;i--){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-i));const key=d.toISOString().slice(0,10);days.push({key,label:d.toLocaleDateString(undefined,{weekday:'narrow',timeZone:'UTC'}),entry:byDate.get(key)})}
 host.innerHTML=days.map(d=>'<div class="pd-daily-day'+(d.entry?' done':'')+'" title="'+escapeHtml(d.key)+(d.entry?' · completed':'')+'"><span>'+escapeHtml(d.label)+'</span><i>'+(d.entry?'✓':'·')+'</i></div>').join('');
 const completed=days.filter(d=>d.entry).length;
 if(copy)copy.textContent=completed?completed+' of the last 7 daily checks completed on this device.':'Complete today’s check to start a local activity trail.';
}
function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function daysUntilDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return null;const target=new Date(v+'T12:00:00'),now=new Date();now.setHours(12,0,0,0);return Math.ceil((target-now)/86400000)}
function renderCurrencyReminders(){
 const data=readJson(currencyKey,{}),defs=[['day','Day passenger'],['night','Night passenger'],['instrument','Instrument']],rows=defs.map(([key,label])=>({key,label,date:data[key]||'',days:daysUntilDate(data[key])})).filter(x=>x.days!==null).sort((a,b)=>a.days-b.days),card=$('#pdDailyCurrencyCard');
 for(const [key] of defs){const input=$('#pdCurrency'+key[0].toUpperCase()+key.slice(1));if(input)input.value=data[key]||''}
 if(!rows.length){setText('#pdDailyCurrencyTitle','Not configured');setText('#pdDailyCurrencyValue','—');setText('#pdDailyCurrencyCopy','Add your own reminder dates if you want Daily to flag one that is getting close. PilotDesk does not determine legal currency from these dates.');if(card)card.dataset.state='';return}
 const x=rows[0],stateName=x.days<0?'expired':x.days<=14?'soon':'ok',value=x.days<0?`${Math.abs(x.days)} days past reminder`:x.days===0?'Reminder date today':x.days===1?'1 day to reminder':`${x.days} days to reminder`;
 setText('#pdDailyCurrencyTitle',x.label);setText('#pdDailyCurrencyValue',value);setText('#pdDailyCurrencyCopy',`Pilot-entered reminder date ${x.date}. Verify your actual logbook, applicable rules, and required experience before acting on it.`);if(card)card.dataset.state=stateName;
}
function saveCurrencyReminders(){
 const value=id=>$('#'+id)?.value||'',data={day:value('pdCurrencyDay'),night:value('pdCurrencyNight'),instrument:value('pdCurrencyInstrument')};
 try{localStorage.setItem(currencyKey,JSON.stringify(data))}catch{}renderCurrencyReminders();window.pdTrack?.('Daily Currency Reminder Saved',{configured:Object.values(data).filter(Boolean).length})
}
function utcDate(offset=0){const d=new Date();d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
function stationFromRoute(route){return String(route||'').trim().split(/\s+/).filter(x=>/^[A-Z0-9]{3,4}$/.test(x.toUpperCase())).map(x=>x.toUpperCase())}
function weatherSnapshot(){return readJson(routeWeatherKey,{today:null,previous:null})}
function weatherCompare(prev,cur){
 if(!prev)return 'No prior Daily snapshot for comparison.';
 const changes=[];if(prev.fltCat&&cur.fltCat&&prev.fltCat!==cur.fltCat)changes.push(`${prev.fltCat} → ${cur.fltCat}`);
 const pw=Number(prev.wspd),cw=Number(cur.wspd);if(Number.isFinite(pw)&&Number.isFinite(cw)&&Math.abs(cw-pw)>=5)changes.push(`wind ${pw} → ${cw} kt`);
 return changes.length?changes.join(' · '):'No major category/wind change.';
}
async function loadDailyRouteWeather(){
 const card=$('#pdDailyWeatherCard'),host=$('#pdDailyRouteWeather');if(!host)return;
 let flights=[];try{const x=JSON.parse(localStorage.getItem('pd-saved-flights')||'[]');flights=Array.isArray(x)?x:[]}catch{}
 const stations=[...new Set(flights.slice().sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0)).slice(0,3).flatMap(f=>{const p=stationFromRoute(f.route);return p.length?[p[0],p.at(-1)]:[]}))].filter(Boolean).slice(0,4);
 if(!stations.length){setText('#pdDailyWeatherTitle','No saved route airports');host.innerHTML='<p>Save a route with airport identifiers and Daily can compare its endpoint weather between check-ins.</p>';if(card)card.dataset.state='';return}
 if(!navigator.onLine){setText('#pdDailyWeatherTitle','Current weather unavailable offline');host.innerHTML='<p>PilotDesk will not reuse an older weather snapshot as current. Reconnect to check saved-route weather.</p>';if(card)card.dataset.state='';return}
 setText('#pdDailyWeatherTitle','Requesting current endpoint weather…');host.innerHTML='<p>Checking saved route endpoints from the weather source.</p>';
 const stored=weatherSnapshot(),today=utcDate(),baseline=stored.today?.date===today?stored.previous:stored.today,results={};
 await Promise.all(stations.map(async id=>{try{const r=await fetch('/api/weather?station='+encodeURIComponent(id),{headers:{Accept:'application/json'},cache:'no-store'}),j=await r.json().catch(()=>({}));if(!r.ok||!j.metar)return;const m=j.metar,obsRaw=m.obsTime??m.reportTime,d=new Date((typeof obsRaw==='number'&&obsRaw<1e12)?obsRaw*1000:obsRaw),age=Number.isFinite(d.getTime())?Math.max(0,Math.round((Date.now()-d.getTime())/60000)):null;results[id]={fltCat:m.fltCat||'—',wdir:m.wdir??null,wspd:m.wspd??null,obsTime:Number.isFinite(d.getTime())?d.toISOString():null,age}}catch{}}));
 const entries=Object.entries(results);if(!entries.length){setText('#pdDailyWeatherTitle','Endpoint weather unavailable');host.innerHTML='<p>No current endpoint METARs were returned. Open Weather to retry or verify at the source.</p>';return}
 host.innerHTML=entries.map(([id,x])=>{if(x.age==null)return `<div class="pd-daily-weather-line"><b>${id}</b><span>METAR time unavailable — do not treat as current without checking Weather.</span></div>`;if(x.age>90)return `<div class="pd-daily-weather-line"><b>${id}</b><span>Returned METAR is about ${x.age} min old — verify current conditions.</span></div>`;return `<div class="pd-daily-weather-line"><b>${id} · ${escapeHtml(x.fltCat)}</b><span>${escapeHtml(weatherCompare(baseline?.stations?.[id],x))} · ${x.age} min old</span></div>`}).join('');
 const baselineDate=baseline?.date;setText('#pdDailyWeatherTitle',baselineDate===utcDate(-1)?'Changes since yesterday':'Current saved-route endpoints');
 const next=stored.today?.date===today?{today:{date:today,stations:results},previous:stored.previous}:{today:{date:today,stations:results},previous:stored.today||stored.previous};try{localStorage.setItem(routeWeatherKey,JSON.stringify(next))}catch{}
}
function studyBucket(category=''){
 const s=String(category).toLowerCase();
 if(/weather|metar|taf|icing|ceiling|visibility/.test(s))return 'weather';
 if(/performance|weight|balance|fuel|density|crosswind|aerodynamic/.test(s))return 'performance';
 if(/system|engine|electrical|pitot|static|instrument/.test(s))return 'systems';
 if(/airport|runway|surface|airspace|operation/.test(s))return 'airport';
 return 'decision';
}
function renderNextStudy(){
 const wrap=$('#pdDailyNextStudy'),host=$('#pdDailyNextLinks'),copy=$('#pdDailyNextStudyCopy');if(!wrap||!host||!state.data)return;
 const category=state.data.challenge?.category||'',bucket=studyBucket(category),topicLinks=STUDY_LINKS[bucket]||STUDY_LINKS.decision,links=[['/skill-gap.html','See your Weak Subjects'],...topicLinks.filter(x=>x[0]!=='/skill-gap.html')].slice(0,3);
 if(copy)copy.textContent='Today’s set focused on '+(category||'aviation decision making')+'. Start with Weak Subjects, then use the topic links if you want another rep.';
 host.innerHTML=links.map(([href,label],i)=>'<a href="'+href+'" data-pd-daily-followup="'+bucket+'"'+(i===0?' data-primary="1"':'')+'>'+escapeHtml(label)+' →</a>').join('');
 wrap.hidden=false;
}

function setText(sel,value){const el=$(sel);if(el)el.textContent=String(value)}
function countdown(){
 const now=new Date(),next=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1));
 const sec=Math.max(0,Math.floor((next-now)/1000)),h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');
 setText('#pdDailyCountdown',`${h}:${m}:${s}`);
}
function formatDate(date){try{return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase()}catch{return date}}
async function loadSupabase(){
 const {getPilotDeskClient}=await import('/assets/supabase-client.js');
 state.client=await getPilotDeskClient();
 const {data:{session}}=await state.client.auth.getSession();state.session=session||null;
 state.client.auth.onAuthStateChange((_e,next)=>{state.session=next||null;setTimeout(()=>refreshIdentity(),0)});
}
async function refreshIdentity(){
 if(!state.session){state.profile=null;setText('#pdDailyAccountState','Guest');setText('#pdDailyProgressTitle','A small daily habit.');setText('#pdDailyProgressText','No account is required. Sign in only if you want Daily completions and study progress saved across devices.');$('#pdDailyAccountLink').textContent='Create account →';return}
 setText('#pdDailyAccountState','Signed in');$('#pdDailyAccountLink').textContent='Open my account →';$('#pdDailyAccountLink').href='/account.html';
 const {data}=await state.client.from('profiles').select('current_streak,daily_completions,last_challenge_date').eq('id',state.session.user.id).maybeSingle();
 state.profile=data||null;if(data){setText('#pdDailyProgressTitle',`${data.current_streak||0}-day Daily streak`);setText('#pdDailyProgressText',`${data.daily_completions||0} saved daily check${Number(data.daily_completions||0)===1?'':'s'}. Use the activity trail as a reminder, not a score to chase.`)}
}

function renderChallenge(data){
 state.data=data;const c=data.challenge;renderWeek();
 setText('#pdDailyDate',formatDate(data.date));setText('#pdDailyCategory',c.category);setText('#pdDailyDifficulty',c.difficulty);setText('#pdDailyTitle',c.title);setText('#pdDailyDeck',c.deck);
 setText('#pdDailyAttempts',data.attemptsToday>0?data.attemptsToday:'0');setText('#pdDailyQuestionTitle',c.category||'Today’s question');setText('#pdDailyQuestionPreview',c.questions?.[0]?.prompt||'Open today’s check below.');
 const host=$('#pdDailyQuestions');host.innerHTML='';
 c.questions.forEach((q,idx)=>{
  const fs=document.createElement('fieldset');fs.className='pd-daily-question';fs.dataset.question=q.id;
  const legend=document.createElement('legend');legend.innerHTML=`<span class="pd-daily-qnum">QUESTION ${String(idx+1).padStart(2,'0')}</span>${escapeHtml(q.prompt)}`;fs.appendChild(legend);
  const opts=document.createElement('div');opts.className='pd-daily-options';q.options.forEach((opt,i)=>{const label=document.createElement('label');label.className='pd-daily-option';label.innerHTML=`<input type="radio" name="q${idx}" value="${i}"><i>${String.fromCharCode(65+i)}</i><span>${escapeHtml(opt)}</span>`;opts.appendChild(label)});fs.appendChild(opts);host.appendChild(fs)
 });
 host.addEventListener('change',()=>{updateSubmitState();if(!state.started){state.started=true;window.pdTrack?.('PilotDesk Daily Started',{category:c.category,difficulty:c.difficulty})}});
 $('#pdDailySubmit').disabled=false;setText('#pdDailyFormNote','Answer all three questions.');updateSubmitState();
 if(data.completion){renderSavedCompletion(data);return}
 if(!state.session){try{const saved=JSON.parse(localStorage.getItem(guestKey(data.date))||'null');if(saved?.score!=null&&saved?.review)renderResult(saved,false)}catch{}}
}
function updateSubmitState(){
 const fields=[...document.querySelectorAll('#pdDailyQuestions fieldset')],total=state.data?.challenge?.questions?.length||fields.length||3;
 const answered=fields.filter((_,i)=>document.querySelector(`input[name="q${i}"]:checked`)).length;
 setText('#pdDailyAnsweredCount',`${answered} / ${total}`);
 document.querySelectorAll('[data-daily-step]').forEach((el,i)=>{const done=Boolean(document.querySelector(`input[name="q${i}"]:checked`));el.dataset.state=state.submitted?'review':done?'answered':'open'});
 fields.forEach((el,i)=>el.dataset.state=document.querySelector(`input[name="q${i}"]:checked`)?'answered':'open');
 if(state.submitted||state.data?.completion){$('#pdDailySubmit').disabled=true;return}
 $('#pdDailySubmit').disabled=answered!==total;setText('#pdDailyFormNote',answered===total?'All three answered. Check the set.':`${answered}/${total} answered`)
}
function lockAnswers(review){
 review?.forEach((r,idx)=>{const group=document.querySelectorAll(`input[name="q${idx}"]`);group.forEach((input,i)=>{input.disabled=true;const label=input.closest('.pd-daily-option');if(i===r.correctIndex)label.dataset.state='correct';else if(r.selected===i&&!r.correct)label.dataset.state='wrong'});const wrap=group[0]?.closest('.pd-daily-options');if(wrap)wrap.setAttribute('aria-disabled','true')});
}
function lockWithoutReveal(){document.querySelectorAll('#pdDailyQuestions input').forEach(input=>{input.disabled=true});document.querySelectorAll('.pd-daily-options').forEach(wrap=>wrap.setAttribute('aria-disabled','true'))}
function reviewHtml(result){
 const questions=state.data?.challenge?.questions||[];
 return (result.review||[]).map((r,i)=>`<div class="pd-daily-review-item" data-state="${r.correct?'correct':'review'}"><strong><span>Q${String(i+1).padStart(2,'0')}</span>${r.correct?'Correct':'Review this one'}</strong><p>${escapeHtml(questions[i]?.options?.[r.correctIndex]||'')}</p><small>${escapeHtml(r.explanation||'')}</small></div>`).join('');
}
function scoreGrid(result){
 const score=Math.max(0,Math.min(Number(result.maxScore)||0,Number(result.score)||0));
 const max=Math.max(score,Number(result.maxScore)||3);
 return `${'🟩'.repeat(score)}${'⬛'.repeat(Math.max(0,max-score))}`;
}
function referralUrl(result){
 const score=Math.max(0,Math.min(Number(result.maxScore)||3,Number(result.score)||0));
 const url=new URL('/daily/',location.origin);
 url.searchParams.set('challenge',String(score));
 url.searchParams.set('utm_source','pilotdesk_daily_share');
 url.searchParams.set('utm_medium','referral');
 url.searchParams.set('utm_campaign','daily_challenge');
 url.searchParams.set('utm_content',`${score}-of-${Number(result.maxScore)||3}`);
 return url.toString();
}
function renderResult(result,saved){
 state.submitted=true;lockAnswers(result.review);$('#pdDailySubmit').disabled=true;$('#pdDailySubmit').textContent='Completed';setText('#pdDailyFormNote',saved?'Saved to your PilotDesk account.':'Guest result — sign in only if you want future completions saved.');
 $('#pdDailyScoreChip').hidden=false;setText('#pdDailyScore',`${result.score}/${result.maxScore}`);updateSubmitState();
 const box=$('#pdDailyResult');box.hidden=false;const perfect=result.score===result.maxScore,streak=Number(result.streak)||0;
 const headline=perfect?'All three correct.':result.score>0?'Today’s set is complete.':'Today’s set is complete — review the explanations.';
 const saveLabel=saved?'Saved to account':'Guest result';
 const returnCopy=saved&&streak>0?`${streak}-day Daily streak · next set after 00:00 UTC`:'Next set after 00:00 UTC';
 box.innerHTML=`<div class="pd-daily-result-head"><div><span class="eyebrow">TODAY’S RESULT</span><h3>${headline}</h3><p>Review each explanation below. Then use Weak Subjects to see what your Written Prep history already says needs another pass.</p></div><div class="pd-daily-reward">${escapeHtml(saveLabel)}</div></div><div class="pd-daily-review">${reviewHtml(result)}</div><div class="pd-daily-result-next"><div><span>WHAT NEXT</span><b>Take the result somewhere useful.</b><small>Weak Subjects is the focused follow-up. It shows only the areas already flagged by your Written Prep history.</small></div><a class="pd-daily-result-primary" href="/skill-gap.html">See Weak Subjects →</a></div><div class="pd-daily-result-actions"><a href="/written-prep.html">Open Written Prep</a><a href="/learn/oral-exam/">Oral Prep</a>${saved?'<a href="/account.html">Account</a>':'<a href="/account.html?next=%2Fdaily%2F">Save future completions</a>'}</div><div class="pd-daily-return-line"><span>RETURN</span><strong>${escapeHtml(returnCopy)}</strong></div>`;
 if(saved){setText('#pdDailyProgressTitle',streak>0?`${streak}-day Daily streak`:'Today is saved');setText('#pdDailyProgressText','Today is complete. The next three-question set opens after the UTC reset.')}
 saveLocalHistory(state.data?.date,result);renderNextStudy();
 window.pdTrack?.('PilotDesk Daily Completed',{saved:Boolean(saved),score:result.score,max:result.maxScore,category:state.data?.challenge?.category||'unknown'});
}
function renderSavedCompletion(data){
 const c=data.completion;renderResult({score:c.score,maxScore:c.max_score,perfect:c.perfect,review:[],streak:state.profile?.current_streak},true);lockWithoutReveal();setText('#pdDailyFormNote','Already completed today. New challenge at 00:00 UTC.');
}
async function makeDailyShareCard(result){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#08090b';ctx.fillRect(0,0,1080,1080);ctx.strokeStyle='#34383f';ctx.lineWidth=3;ctx.fillStyle='#0d1014';ctx.beginPath();ctx.roundRect(54,54,972,972,28);ctx.fill();ctx.stroke();
 ctx.fillStyle='#9ea4ad';ctx.font='700 26px Arial, sans-serif';ctx.fillText('PILOTDESK DAILY',96,126);
 ctx.fillStyle='#f2f4f7';ctx.font='800 86px Arial, sans-serif';ctx.fillText(String(result.score)+'/'+String(result.maxScore),96,254);
 ctx.font='700 70px Arial, sans-serif';ctx.fillText(scoreGrid(result),96,365);
 ctx.fillStyle='#d7b45c';ctx.font='700 28px Arial, sans-serif';const streak=result.streak?result.streak+'-DAY STREAK':'DAILY AVIATION CHALLENGE';ctx.fillText(streak,96,434);
 ctx.fillStyle='#c5c7cc';ctx.font='34px Arial, sans-serif';ctx.fillText('Three questions. Two minutes. Every day.',96,548);
 ctx.fillStyle='#8f939b';ctx.font='26px Arial, sans-serif';ctx.fillText('Think you can beat this score?',96,620);
 ctx.fillStyle='#f2f4f7';ctx.font='700 28px Arial, sans-serif';ctx.fillText('pilot-desk.com/daily',96,892);
 ctx.fillStyle='#737a84';ctx.font='22px Arial, sans-serif';ctx.fillText('Free aviation training challenge · no sign-in required',96,944);
 return new Promise(resolve=>canvas.toBlob(resolve,'image/png',0.92));
}
async function shareResult(result){
 const streak=result.streak?`\n🔥 ${result.streak}-day streak`:'';
 const url=referralUrl(result);
 const text=`PilotDesk Daily ${result.score}/${result.maxScore}\n${scoreGrid(result)}${streak}\n\nThink you can beat it?`;
 try{
  const blob=await makeDailyShareCard(result),file=blob?new File([blob],'pilotdesk-daily.png',{type:'image/png'}):null;
  const canFileShare=file&&navigator.canShare?.({files:[file]});
  window.pdTrack?.('PilotDesk Daily Shared',{score:result.score,max:result.maxScore,streak:result.streak||0,method:canFileShare?'image':'link'});
  if(navigator.share&&canFileShare)await navigator.share({title:'PilotDesk Daily — beat my score',text,url,files:[file]});
  else if(navigator.share)await navigator.share({title:'PilotDesk Daily — beat my score',text,url});
  else{await navigator.clipboard.writeText(`${text}\n${url}`);$('#pdDailyShare').textContent='Challenge link copied'}
 }catch(e){if(e?.name!=='AbortError'){try{await navigator.clipboard.writeText(`${text}\n${url}`);$('#pdDailyShare').textContent='Challenge link copied'}catch{}}}
}
async function submit(e){
 e.preventDefault();if(state.submitted||!state.data)return;const answers=state.data.challenge.questions.map((_,i)=>Number(document.querySelector(`input[name="q${i}"]:checked`)?.value));if(answers.some(x=>!Number.isInteger(x)))return;
 $('#pdDailySubmit').disabled=true;$('#pdDailySubmit').textContent='Scoring…';setText('#pdDailyFormNote','Checking today’s answers…');
 try{const r=await fetch(`${SUPABASE_URL}/functions/v1/pilot-daily`,{method:'POST',headers:{...edgeHeaders(),'Content-Type':'application/json'},body:JSON.stringify({answers})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to score challenge.');if(!d.saved){try{localStorage.setItem(guestKey(d.date),JSON.stringify(d))}catch{}}renderResult(d,Boolean(d.saved));if(d.saved)await refreshIdentity()}catch(err){$('#pdDailySubmit').disabled=false;$('#pdDailySubmit').textContent='Check all three';setText('#pdDailyFormNote',err.message||'Unable to score right now.');state.submitted=false;updateSubmitState()}
}
async function loadChallenge(){
 try{const r=await fetch(`${SUPABASE_URL}/functions/v1/pilot-daily`,{headers:edgeHeaders()});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load today’s challenge.');renderChallenge(d)}catch(err){$('#pdDailyQuestions').innerHTML=`<div class="pd-daily-error">${escapeHtml(err.message||'PilotDesk Daily is temporarily unavailable.')}</div>`;setText('#pdDailyFormNote','Try again shortly.')}
}
async function init(){
 countdown();setInterval(countdown,1000);renderWeek();renderCurrencyReminders();$('#pdCurrencySave')?.addEventListener('click',saveCurrencyReminders);$('#pdDailyForm')?.addEventListener('submit',submit);
 const weatherPromise=loadDailyRouteWeather();await loadSupabase();await refreshIdentity();await loadChallenge();await weatherPromise;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();