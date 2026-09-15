(()=>{
'use strict';
if(!['/','/index.html'].includes(location.pathname))return;
const SUPABASE_URL='https://hqqgcfiaxcrzyuhtkzqg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Mj4GgPXqlild6Z_4k47Ypg_TeUvlyfQ';
const q=s=>document.querySelector(s);
function countdown(){const el=q('#pdHomeDailyReset');if(!el)return;const now=new Date(),next=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1)),sec=Math.max(0,Math.floor((next-now)/1000));el.textContent=`${String(Math.floor(sec/3600)).padStart(2,'0')}:${String(Math.floor(sec%3600/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function install(){
 if(q('#pdHomeDaily'))return;
 const quick=q('#pdQuickStart'),hero=q('.hero');if(!quick&&!hero)return;
 const s=document.createElement('section');s.id='pdHomeDaily';s.className='pd-home-daily';s.setAttribute('aria-label','PilotDesk Daily challenge');
 s.innerHTML='<a class="pd-home-daily-card" href="/daily/" aria-label="Play today\'s PilotDesk Daily aviation challenge"><div class="pd-home-daily-rail"><span class="pd-home-daily-live"><i aria-hidden="true"></i> NEW DAILY CHALLENGE</span><span id="pdHomeDailyCategory">AVIATION // TODAY</span></div><div class="pd-home-daily-body"><div class="pd-home-daily-copy"><span class="pd-home-daily-kicker">3 QUESTIONS · ABOUT 2 MINUTES · NO LOGIN REQUIRED</span><h2 id="pdHomeDailyTitle">PilotDesk Daily</h2><p id="pdHomeDailyDeck">A fresh aviation puzzle every day. Play now, then create an account only if you want to save XP, badges and your streak.</p><div class="pd-home-daily-benefits"><span>METARs</span><span>Weather</span><span>Performance</span><span>ADM</span><span>Systems</span></div></div><div class="pd-home-daily-readout"><div><strong id="pdHomeDailyAttempts">—</strong><span>COMPLETED TODAY</span></div><div><strong id="pdHomeDailyReset">--:--:--</strong><span>NEXT PUZZLE UTC</span></div></div></div><div class="pd-home-daily-footer"><strong>Play today\'s pilot challenge</strong><span>START →</span></div></a>';(quick||hero).insertAdjacentElement('afterend',s);
 countdown();setInterval(countdown,1000);load();
}
async function load(){try{const r=await fetch(`${SUPABASE_URL}/functions/v1/pilot-daily`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY}});if(!r.ok)return;const d=await r.json();q('#pdHomeDailyTitle').textContent=d.challenge?.title||'PilotDesk Daily';q('#pdHomeDailyDeck').textContent=d.challenge?.deck||'Three aviation questions. Play free; sign in only to save XP and streaks.';q('#pdHomeDailyCategory').textContent=`${d.challenge?.category||'AVIATION'} // ${d.challenge?.difficulty||'DAILY'}`.toUpperCase();q('#pdHomeDailyAttempts').textContent=String(d.attemptsToday??0)}catch{}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,150)},{once:true});else install();
})();