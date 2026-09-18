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
const STUDY_LINKS={
 weather:[['/weather.html','Check current aviation weather'],['/guides/metar-taf.html','METAR & TAF guide'],['/guides/aviation-weather-reference.html','Weather reference']],
 performance:[['/tools.html?category=Performance','Performance calculators'],['/guides/aircraft-performance-reference.html','Aircraft performance reference'],['/weight-balance.html','Weight & balance']],
 systems:[['/guides.html?q=systems','Systems guides'],['/checklist-trainer.html','Checklist trainer'],['/flight-training.html','Training hub']],
 airport:[['/airport.html','Airport information'],['/guides.html?q=airport','Airport operations guides'],['/route-planner.html','Route planner']],
 decision:[['/skill-gap.html','Check weak subjects'],['/learn/oral-exam/','Practice oral answers'],['/flight-training.html','Training hub']]
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
 host.innerHTML=days.map(d=>'<div class="pd-daily-day'+(d.entry?' done':'')+'" title="'+escapeHtml(d.key)+(d.entry?' · '+d.entry.score+'/'+d.entry.max:'')+'"><span>'+escapeHtml(d.label)+'</span><i>'+(d.entry?d.entry.score:'·')+'</i></div>').join('');
 const completed=days.filter(d=>d.entry).length;
 if(copy)copy.textContent=completed?completed+' of the last 7 daily challenges completed on this device.':'Complete today’s challenge to start a local activity trail.';
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
 const category=state.data.challenge?.category||'',bucket=studyBucket(category),links=STUDY_LINKS[bucket]||STUDY_LINKS.decision;
 if(copy)copy.textContent='Today’s challenge focused on '+(category||'aviation decision making')+'. Review the explanation, then take one more step while the topic is fresh.';
 host.innerHTML=links.map(([href,label])=>'<a href="'+href+'" data-pd-daily-followup="'+bucket+'">'+escapeHtml(label)+' →</a>').join('');
 wrap.hidden=false;
}

function setText(sel,value){const el=$(sel);if(el)el.textContent=String(value)}
function countdown(){
 const now=new Date(),next=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1));
 const sec=Math.max(0,Math.floor((next-now)/1000)),h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');
 setText('#pdDailyCountdown',`${h}:${m}:${s}`);
}
function formatDate(date){try{return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase()}catch{return date}}
function applyIncomingChallenge(){
 const raw=new URLSearchParams(location.search).get('challenge'),score=Number(raw);
 if(!Number.isInteger(score)||score<0||score>3)return;
 const hero=$('.pd-daily-hero'),intro=hero?.querySelector('p');
 if(intro){const target=score>=3?'match their 3/3':`beat their ${score}/3`;intro.textContent=`Another pilot challenged you to ${target}. Answer the same three daily questions, then send your score back.`}
 window.pdTrack?.('PilotDesk Daily Referral Landed',{challengeScore:score});
}

async function loadSupabase(){
 const mod=await import('https://esm.sh/@supabase/supabase-js@2.57.4');
 state.client=mod.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{session}}=await state.client.auth.getSession();state.session=session||null;
 state.client.auth.onAuthStateChange((_e,next)=>{state.session=next||null;setTimeout(()=>refreshIdentity(),0)});
}
async function refreshIdentity(){
 if(!state.session){state.profile=null;setText('#pdDailyAccountState','Guest');setText('#pdDailyXp','—');setText('#pdDailyStreak','—');setText('#pdDailyLevel','—');setText('#pdDailyProgressTitle','Play first. Sign in later.');setText('#pdDailyProgressText','No account is required to answer today’s questions. Sign in only when you want to save your score, XP and streak across devices.');$('#pdDailyAccountLink').textContent='Create a free account →';return}
 setText('#pdDailyAccountState','Signed in');$('#pdDailyAccountLink').textContent='Open my account →';$('#pdDailyAccountLink').href='/account.html';
 const {data}=await state.client.from('profiles').select('xp,level,current_streak,longest_streak,daily_completions,last_challenge_date').eq('id',state.session.user.id).maybeSingle();
 state.profile=data||null;if(data){setText('#pdDailyXp',data.xp??0);setText('#pdDailyStreak',data.current_streak??0);setText('#pdDailyLevel',data.level??1);setText('#pdDailyProgressTitle',`${data.current_streak||0}-day streak`);setText('#pdDailyProgressText',`${data.daily_completions||0} saved daily challenge${Number(data.daily_completions||0)===1?'':'s'}. Keep the streak alive by completing today’s puzzle.`)}
}

function renderChallenge(data){
 state.data=data;const c=data.challenge;renderWeek();
 setText('#pdDailyDate',formatDate(data.date));setText('#pdDailyCategory',c.category);setText('#pdDailyDifficulty',c.difficulty);setText('#pdDailyTitle',c.title);setText('#pdDailyDeck',c.deck);
 setText('#pdDailyAttempts',data.attemptsToday>0?data.attemptsToday:'0');
 const host=$('#pdDailyQuestions');host.innerHTML='';
 c.questions.forEach((q,idx)=>{
  const fs=document.createElement('fieldset');fs.className='pd-daily-question';fs.dataset.question=q.id;
  const legend=document.createElement('legend');legend.innerHTML=`<span class="pd-daily-qnum">QUESTION ${String(idx+1).padStart(2,'0')}</span>${escapeHtml(q.prompt)}`;fs.appendChild(legend);
  const opts=document.createElement('div');opts.className='pd-daily-options';q.options.forEach((opt,i)=>{const label=document.createElement('label');label.className='pd-daily-option';label.innerHTML=`<input type="radio" name="q${idx}" value="${i}"><span>${escapeHtml(opt)}</span>`;opts.appendChild(label)});fs.appendChild(opts);host.appendChild(fs)
 });
 host.addEventListener('change',()=>{updateSubmitState();if(!state.started){state.started=true;window.pdTrack?.('PilotDesk Daily Started',{category:c.category,difficulty:c.difficulty})}});
 $('#pdDailySubmit').disabled=false;setText('#pdDailyFormNote','Answer all three questions.');updateSubmitState();
 if(data.completion){renderSavedCompletion(data);return}
 if(!state.session){try{const saved=JSON.parse(localStorage.getItem(guestKey(data.date))||'null');if(saved?.score!=null&&saved?.review)renderResult(saved,false)}catch{}}
}
function updateSubmitState(){if(state.submitted||state.data?.completion){$('#pdDailySubmit').disabled=true;return}const total=state.data?.challenge?.questions?.length||0,answered=[...document.querySelectorAll('#pdDailyQuestions fieldset')].filter((_,i)=>document.querySelector(`input[name="q${i}"]:checked`)).length;$('#pdDailySubmit').disabled=answered!==total;setText('#pdDailyFormNote',answered===total?'Ready to score.':`${answered}/${total} answered`)}
function lockAnswers(review){
 review?.forEach((r,idx)=>{const group=document.querySelectorAll(`input[name="q${idx}"]`);group.forEach((input,i)=>{input.disabled=true;const label=input.closest('.pd-daily-option');if(i===r.correctIndex)label.dataset.state='correct';else if(r.selected===i&&!r.correct)label.dataset.state='wrong'});const wrap=group[0]?.closest('.pd-daily-options');if(wrap)wrap.setAttribute('aria-disabled','true')});
}
function lockWithoutReveal(){document.querySelectorAll('#pdDailyQuestions input').forEach(input=>{input.disabled=true});document.querySelectorAll('.pd-daily-options').forEach(wrap=>wrap.setAttribute('aria-disabled','true'))}
function reviewHtml(result){
 const questions=state.data?.challenge?.questions||[];
 return (result.review||[]).map((r,i)=>`<div class="pd-daily-review-item"><strong>${r.correct?'✓':'Review'} Question ${i+1}: ${escapeHtml(questions[i]?.options?.[r.correctIndex]||'')}</strong><span>${escapeHtml(r.explanation||'')}</span></div>`).join('');
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
 state.submitted=true;lockAnswers(result.review);$('#pdDailySubmit').disabled=true;$('#pdDailySubmit').textContent='Completed';setText('#pdDailyFormNote',saved?'Saved to your PilotDesk account.':'Guest score — sign in to save future streaks.');
 $('#pdDailyScoreChip').hidden=false;setText('#pdDailyScore',`${result.score}/${result.maxScore}`);
 const box=$('#pdDailyResult');box.hidden=false;const perfect=result.score===result.maxScore;
 const headline=perfect?'Perfect score.':(result.review||[]).length?(result.score>0?'Challenge complete.':'Challenge complete — review it below.'):'Challenge complete.';
 const reward=saved?`+${result.xpAwarded||0} XP${result.streak?` · 🔥 ${result.streak}`:''}`:'Guest score';
 box.innerHTML=`<div class="pd-daily-result-head"><div><h3>${headline}</h3><p>${saved?'Your score, XP and streak are saved.':'Create a free account to save XP and build a daily streak.'}</p></div><div class="pd-daily-reward">${escapeHtml(reward)}</div></div><div class="pd-daily-review">${reviewHtml(result)}</div><div class="pd-daily-result-actions"><button type="button" id="pdDailyShare">Challenge another pilot</button>${saved?'<a href="/account.html">View account →</a>':'<a href="/account.html?next=%2Fdaily%2F">Create account →</a>'}</div>`;
 $('#pdDailyShare')?.addEventListener('click',()=>shareResult(result));
 if(saved){setText('#pdDailyXp',result.xp??state.profile?.xp??'—');setText('#pdDailyStreak',result.streak??state.profile?.current_streak??'—');setText('#pdDailyLevel',result.level??state.profile?.level??'—');setText('#pdDailyProgressTitle',`${result.streak||0}-day streak`);setText('#pdDailyProgressText',`Today is saved. You earned ${result.xpAwarded||0} XP. Come back after the UTC reset for the next challenge.`)}
 saveLocalHistory(state.data?.date,result);renderNextStudy();
 window.pdTrack?.('PilotDesk Daily Completed',{saved:Boolean(saved),score:result.score,max:result.maxScore,category:state.data?.challenge?.category||'unknown'});
}
function renderSavedCompletion(data){
 const c=data.completion;renderResult({score:c.score,maxScore:c.max_score,xpAwarded:c.xp_awarded,perfect:c.perfect,review:[],streak:state.profile?.current_streak,xp:state.profile?.xp,level:state.profile?.level},true);lockWithoutReveal();setText('#pdDailyFormNote','Already completed today. New challenge at 00:00 UTC.');
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
 try{const r=await fetch(`${SUPABASE_URL}/functions/v1/pilot-daily`,{method:'POST',headers:{...edgeHeaders(),'Content-Type':'application/json'},body:JSON.stringify({answers})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to score challenge.');if(!d.saved){try{localStorage.setItem(guestKey(d.date),JSON.stringify(d))}catch{}}renderResult(d,Boolean(d.saved));if(d.saved)await refreshIdentity()}catch(err){$('#pdDailySubmit').disabled=false;$('#pdDailySubmit').textContent='Submit answers';setText('#pdDailyFormNote',err.message||'Unable to score right now.');state.submitted=false;updateSubmitState()}
}
async function loadChallenge(){
 try{const r=await fetch(`${SUPABASE_URL}/functions/v1/pilot-daily`,{headers:edgeHeaders()});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load today’s challenge.');renderChallenge(d)}catch(err){$('#pdDailyQuestions').innerHTML=`<div class="pd-daily-error">${escapeHtml(err.message||'PilotDesk Daily is temporarily unavailable.')}</div>`;setText('#pdDailyFormNote','Try again shortly.')}
}
async function init(){
 countdown();setInterval(countdown,1000);renderWeek();$('#pdDailyForm')?.addEventListener('submit',submit);applyIncomingChallenge();
 await loadSupabase();await refreshIdentity();await loadChallenge();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();