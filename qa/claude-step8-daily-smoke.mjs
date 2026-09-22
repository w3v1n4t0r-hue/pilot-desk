import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};

const page=read('daily/index.html');
const client=read('assets/daily.js');
const css=read('assets/daily.css');
const sw=read('sw.js');
const sitemap=read('sitemap.xml');
const dailyMap=read('sitemap-daily.xml');

check(page.includes('pdDailyQuestionProgress')&&page.includes('pdDailyAnsweredCount'),'Daily question progress strip missing');
check(page.includes('TODAY’S THREE QUESTIONS'),'Daily question screen hierarchy missing');
check(page.includes('AFTER THE RESULT')&&page.includes('See Weak Subjects'),'Daily side handoff to Weak Subjects missing');
check(page.includes('RETURN LOOP'),'Daily return mechanic is not framed subtly');

check(client.includes("d.entry?'✓':'·'"),'Daily seven-day trail still shows scores instead of completion');
check(client.includes('data-daily-step')&&client.includes("dataset.state=state.submitted?'review':done?'answered':'open'"),'Daily progress strip is not wired to answers');
check(client.includes("String.fromCharCode(65+i)"),'Daily answer choices are missing restrained A/B/C labels');
check(client.includes('pd-daily-result-next')&&client.includes('See Weak Subjects →'),'Daily result does not lead prominently into Weak Subjects');
check(client.includes('next set after 00:00 UTC'),'Daily result is missing a subtle reason to return');
check(client.includes("[['/skill-gap.html','See your Weak Subjects']"),'Post-result study path does not start with Weak Subjects');

check(!page.includes('id="pdDailyShare"')&&!page.includes('CHALLENGE A FRIEND'),'Daily still exposes game-like sharing UI');
check(!client.includes('applyIncomingChallenge'),'Daily still changes the visible experience into a score challenge from referral parameters');

check(css.includes('Claude Step 8 — Daily'),'Step 8 Daily visual layer missing');
const step8=css.slice(css.indexOf('Claude Step 8 — Daily'));
for(const cls of ['.pd-daily-question-progress','.pd-daily-result-next','.pd-daily-result-primary','.pd-daily-return-line'])
 check(step8.includes(cls),'Step 8 Daily styling missing '+cls);
for(const bad of ['linear-gradient','radial-gradient','backdrop-filter'])
 check(!step8.includes(bad),'Step 8 Daily layer introduced SaaS decoration: '+bad);
check(css.indexOf('Claude Step 8 — Daily')>css.indexOf('Claude Step 5 — final Daily'),'Step 8 Daily overrides are not last in the cascade');

check(sw.includes("CACHE='pilotdesk-v51'"),'Service worker version did not advance for Step 8');
check(sw.includes("'/assets/daily.js'")&&sw.includes("'/assets/daily.css'"),'Daily runtime assets are not network-first');
check(sitemap.includes('<url><loc>https://www.pilot-desk.com/daily/</loc><lastmod>2026-09-22</lastmod></url>'),'Canonical sitemap Daily date is stale');
check(dailyMap.includes('<lastmod>2026-09-22</lastmod>'),'Daily sitemap date is stale');

if(failures.length){
 console.error('Claude Step 8 Daily smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Claude Step 8 Daily smoke passed: refined three-question flow, professional return loop, and results-to-Weak-Subjects handoff verified.');
