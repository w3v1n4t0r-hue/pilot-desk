(()=>{
'use strict';
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const $=(s,r=document)=>r.querySelector(s);
const state={client:null,session:null,profile:null,data:null,submitted:false};
const edgeHeaders=()=>({apikey:SUPABASE_PUBLISHABLE_KEY,...(state.session?.access_token?{Authorization:`Bearer ${state.session.access_token}`}:{})});
const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const guestKey=date=>`pd-daily-guest-${date}`;

function setText(sel,value){const el=$(sel);if(el)el.textContent=String(value)}
function countdown(){
 const now=new Date(),next=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1));
 const sec=Math.max(0,Math.floor((next-now)/1000)),h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');
 setText('#pdDailyCountdown',`${h}:${m}:${s}`);
}
function formatDate(date){try{return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).toUpperCase()}catch{return date}}

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
 state.data=data;const c=data.challenge;
 setText('#pdDailyDate',formatDate(data.date));setText('#pdDailyCategory',c.category);setText('#pdDailyDifficulty',c.difficulty);setText('#pdDailyTitle',c.title);setText('#pdDailyDeck',c.deck);
 setText('#pdDailyAttempts',data.attemptsToday>0?data.attemptsToday:'0');
 const host=$('#pdDailyQuestions');host.innerHTML='';
 c.questions.forEach((q,idx)=>{
  const fs=document.createElement('fieldset');fs.className='pd-daily-question';fs.dataset.question=q.id;
  const legend=document.createElement('legend');legend.innerHTML=`<span class="pd-daily-qnum">QUESTION ${String(idx+1).padStart(2,'0')}</span>${escapeHtml(q.prompt)}`;fs.appendChild(legend);
  const opts=document.createElement('div');opts.className='pd-daily-options';q.options.forEach((opt,i)=>{const label=document.createElement('label');label.className='pd-daily-option';label.innerHTML=`<input type="radio" name="q${idx}" value="${i}"><span>${escapeHtml(opt)}</span>`;opts.appendChild(label)});fs.appendChild(opts);host.appendChild(fs)
 });
 host.addEventListener('change',updateSubmitState);
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
function renderResult(result,saved){
 state.submitted=true;lockAnswers(result.review);$('#pdDailySubmit').disabled=true;$('#pdDailySubmit').textContent='Completed';setText('#pdDailyFormNote',saved?'Saved to your PilotDesk account.':'Guest score — sign in to save future streaks.');
 $('#pdDailyScoreChip').hidden=false;setText('#pdDailyScore',`${result.score}/${result.maxScore}`);
 const box=$('#pdDailyResult');box.hidden=false;const perfect=result.score===result.maxScore;
 const headline=perfect?'Perfect score.':(result.review||[]).length?(result.score>0?'Challenge complete.':'Challenge complete — review it below.'):'Challenge complete.';
 const reward=saved?`+${result.xpAwarded||0} XP${result.streak?` · 🔥 ${result.streak}`:''}`:'Guest score';
 box.innerHTML=`<div class="pd-daily-result-head"><div><h3>${headline}</h3><p>${saved?'Your score, XP and streak are saved.':'Create a free account to save XP and build a daily streak.'}</p></div><div class="pd-daily-reward">${escapeHtml(reward)}</div></div><div class="pd-daily-review">${reviewHtml(result)}</div><div class="pd-daily-result-actions"><button type="button" id="pdDailyShare">Share result</button>${saved?'<a href="/account.html">View account →</a>':'<a href="/account.html?next=%2Fdaily%2F">Create account →</a>'}</div>`;
 $('#pdDailyShare')?.addEventListener('click',()=>shareResult(result));
 if(saved){setText('#pdDailyXp',result.xp??state.profile?.xp??'—');setText('#pdDailyStreak',result.streak??state.profile?.current_streak??'—');setText('#pdDailyLevel',result.level??state.profile?.level??'—');setText('#pdDailyProgressTitle',`${result.streak||0}-day streak`);setText('#pdDailyProgressText',`Today is saved. You earned ${result.xpAwarded||0} XP. Come back after the UTC reset for the next challenge.`)}
 window.pdTrack?.('PilotDesk Daily Completed',{saved:Boolean(saved),score:result.score,max:result.maxScore});
}
function renderSavedCompletion(data){
 const c=data.completion;renderResult({score:c.score,maxScore:c.max_score,xpAwarded:c.xp_awarded,perfect:c.perfect,review:[],streak:state.profile?.current_streak,xp:state.profile?.xp,level:state.profile?.level},true);lockWithoutReveal();setText('#pdDailyFormNote','Already completed today. New challenge at 00:00 UTC.');
}
async function shareResult(result){
 const streak=result.streak?` · 🔥 ${result.streak}-day streak`:'';const text=`PilotDesk Daily ${result.score}/${result.maxScore}${streak}\nhttps://www.pilot-desk.com/daily/`;
 try{if(navigator.share)await navigator.share({title:'PilotDesk Daily',text,url:'https://www.pilot-desk.com/daily/'});else{await navigator.clipboard.writeText(text);$('#pdDailyShare').textContent='Copied'}}catch{}
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
 countdown();setInterval(countdown,1000);$('#pdDailyForm')?.addEventListener('submit',submit);
 await loadSupabase();await refreshIdentity();await loadChallenge();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();