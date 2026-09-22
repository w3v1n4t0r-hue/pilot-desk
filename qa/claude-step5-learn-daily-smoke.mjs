import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const prep=read('written-prep.html');
const prepJs=read('assets/written-prep.js');
const prepCss=read('assets/written-prep.css');
const edge=read('supabase/functions/written-prep/index.ts');
const gap=read('assets/skill-gap.js');
const daily=read('daily/index.html');
const dailyJs=read('assets/daily.js');
const dailyCss=read('assets/daily.css');
const learn=read('assets/learn-shell.js');
const learnCss=read('assets/learn-2026.css');
const boot=read('assets/app-bootstrap.js');
const styles=read('assets/styles.css');
const sw=read('sw.js');

// Connected Learn surface.
for(const label of ['Written Prep','Weak Subjects','Rating Hubs','Oral Prep','Checklist Practice','ACS / FAR'])
  check(learn.includes(label),'Learn strip missing '+label);
for(const path of ['/written-prep.html','/skill-gap.html','/flight-training.html','/checklist-trainer.html','/training/acs-far-reference.html'])
  check(boot.includes("'"+path+"'"),'Learn strip is not loaded on '+path);
check(boot.includes("path.startsWith('/learn/oral-exam/')"),'Learn strip is not loaded on oral prep');
check(learnCss.includes('.pd-learn-subnav'),'Learn EFB strip styling missing');

// Written Prep: clear rating/session entry, FAA-area progress, subtle activity, grouped misses.
check(prep.includes('Pick the rating. Find the weak areas. Work them.'),'Written Prep still opens like generic marketing copy');
check(prep.includes('pd-prep-study-entry')&&prep.includes('Weak-area session')&&prep.includes('Review misses')&&prep.includes('Practice exam'),'Written Prep practice-session entry points missing');
check(prep.includes('pdPrepStudyStreak')&&prep.includes('pdPrepStreakDots'),'Subtle Written Prep study streak missing');
check(prep.includes('ACS / PTS KNOWLEDGE AREAS')&&prep.includes('pdPrepSkillMap'),'Knowledge-area progress surface missing');
check(prep.includes('Misses grouped by topic')&&prep.includes('pdPrepMissedTopics'),'Grouped missed-question view missing');
check(edge.includes('missedByArea')&&edge.includes('missedMap'),'Written Prep dashboard does not return misses by topic');
check(prepJs.includes('renderMissedTopics')&&prepJs.includes('renderStudyStreak'),'Written Prep client does not render missed topics/study activity');
check(prepJs.includes('pd-prep-review-group')&&prepJs.includes('groups.entries()'),'Completed-session misses are not grouped by topic');
check(prepJs.includes("params.get('track')||savedTrack()"),'Written Prep still ignores rating deep links');
check(gap.includes('/written-prep.html?track='),'Skill Gap does not hand the selected rating into Written Prep');
check(prepCss.includes('background:var(--accent)!important;color:#061018!important'),'Written Prep primary actions do not use the restrained accent in the final cascade');
check(prepCss.indexOf('Claude Step 5 — Written Prep')>prepCss.indexOf('WRITTEN PREP MONOCHROME'),'Step 5 Written Prep overrides are not last in the page cascade');

// Daily: 15-second briefing first, current-data boundaries, no game-show surface.
check(daily.includes('Your aviation check-in.'),'Daily hero is not a quick check-in');
check(daily.includes('id="pdDailyBrief"'),'Daily briefing surface missing');
check(daily.indexOf('id="pdDailyBrief"')<daily.indexOf('id="pdDailyCard"'),'Daily quiz still appears before the briefing');
check(daily.includes('CURRENCY REMINDERS')&&daily.includes('pdCurrencyDay')&&daily.includes('pdCurrencyNight')&&daily.includes('pdCurrencyInstrument'),'Daily currency reminder inputs missing');
check(daily.includes('PilotDesk does not determine legal currency'),'Currency reminder safety boundary missing');
check(daily.includes('SAVED ROUTE WEATHER')&&daily.includes('pdDailyRouteWeather'),'Saved-route weather briefing missing');
check(daily.includes("TODAY'S KNOWLEDGE CHECK")&&daily.includes('pdDailyQuestionPreview'),'Daily question preview missing');
check(!daily.includes('CHALLENGE A FRIEND'),'Daily still promotes social challenge/gamification');
check(!daily.includes('id="pdDailyXp"')&&!daily.includes('id="pdDailyLevel"'),'Daily still foregrounds XP/level');
check(daily.includes('No account required'),'Daily guest use is no longer explicit');

check(dailyJs.includes("const currencyKey='pd-daily-currency-reminders'"),'Daily currency reminders are not persisted');
check(dailyJs.includes('daysUntilDate')&&dailyJs.includes('days to reminder'),'Daily currency countdown missing');
check(dailyJs.includes('PilotDesk does not determine legal currency')||daily.includes('PilotDesk does not determine legal currency'),'Daily reminder is not framed as user-entered/non-authoritative');
check(dailyJs.includes("const routeWeatherKey='pd-daily-route-weather-v1'"),'Daily route-weather snapshots missing');
check(dailyJs.includes("cache:'no-store'")&&dailyJs.includes('/api/weather?station='),'Daily route weather is not fetched fresh');
check(dailyJs.includes('METAR time unavailable')&&dailyJs.includes('age>90'),'Daily does not protect against unknown/older METARs');
check(dailyJs.includes("baselineDate===utcDate(-1)?'Changes since yesterday'"),'Daily does not identify prior-day weather comparison');
check(dailyJs.includes("setText('#pdDailyQuestionPreview'"),'Daily first-question preview is not populated');
check(!dailyJs.includes('id="pdDailyShare"'),'Daily result still renders a share challenge');
check(dailyCss.indexOf('Claude Step 5 — final Daily')>dailyCss.indexOf('MONOCHROME DAILY'),'Final Daily overrides are not last in cascade');
check(dailyCss.includes('background:var(--accent)!important;color:#061018!important'),'Daily primary action does not use restrained aviation accent');

// Step 5 layer uses flat, token-driven styling.
check(!/radial-gradient|linear-gradient|backdrop-filter/i.test(learnCss),'Step 5 shared layer contains decorative SaaS effects');
check(styles.includes('@import url("/assets/learn-2026.css");'),'Step 5 shared stylesheet not loaded');
check(styles.trim().endsWith('@import url("/assets/design-tokens.css");'),'Design tokens must remain final shared CSS authority');
for(const asset of ['/assets/learn-shell.js','/assets/learn-2026.css','/assets/written-prep.js','/assets/daily.js'])
  check(sw.includes("'"+asset+"'"),'Step 5 asset is not network-first: '+asset);
check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=48,'Step 5 service-worker release version did not advance');

if(failures.length){
 console.error('Claude Step 5 Learn/Daily smoke failed ('+failures.length+')');
 failures.forEach(x=>console.error(' - '+x));
 process.exit(1);
}
console.log('Claude Step 5 Learn/Daily smoke passed.');
