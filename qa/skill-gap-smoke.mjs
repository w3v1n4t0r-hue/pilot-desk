import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const page=read('skill-gap.html'),client=read('assets/skill-gap.js'),css=read('assets/skill-gap.css'),edge=read('supabase/functions/pilot-skill-gap/index.ts'),migration=read('supabase/migrations/007_pilot_skill_gap.sql'),daily=read('daily/index.html'),training=read('flight-training.html'),nav=read('assets/global-nav.js'),sitemap=read('sitemap-retention.xml');
const failures=[];const need=(t,n,l)=>{if(!t.includes(n))failures.push(`${l}: missing ${n}`)};

for(const n of ['https://www.pilot-desk.com/skill-gap.html','WRITTEN PREP · WEAK SUBJECTS','This is not another quiz.','data-track="ppl"','data-track="ira"','data-track="cpl"','data-track="cfi"','data-track="cfii"','data-track="atp"','/assets/skill-gap.js'])need(page,n,'weak-subjects page');
for(const n of ["functions.invoke(name,{method:'GET'})","'written-prep?track='",'pd-written-track','missedByArea','skillAreas','Weak Subjects Viewed'])need(client,n,'weak-subjects client');
if(client.includes('/functions/v1/pilot-skill-gap'))failures.push('weak-subjects client: must not run a second diagnostic');

for(const n of ['FAA_PAR','FAA_CAX','FAA_ATM','faa-sample-derived','pilotdesk-acs','record_skill_gap_attempt','publicQuestion','ppl:[','cpl:[','atp:['])need(edge,n,'legacy skill-gap edge');
if(edge.includes('correct:q.correct')||edge.includes('correct:q.correct,'))failures.push('legacy skill-gap edge: GET publicQuestion must not expose answer keys');
for(const n of ['create table if not exists public.skill_gap_stats','alter table public.skill_gap_stats enable row level security','(select auth.uid()) = user_id','security definer','knowledge_track'])need(migration,n,'legacy skill-gap migration');

need(daily,'/skill-gap.html','daily discovery');
for(const n of ['/skill-gap.html','Weak Subjects','Written Prep history'])need(training,n,'training hub discovery');
need(nav,"'/skill-gap.html'",'global nav app coverage');
need(sitemap,'https://www.pilot-desk.com/skill-gap.html','retention sitemap');
for(const n of ['pd-gap-tracks','pd-gap-map-fill'])need(css,n,'skill-gap visual base');

if(failures.length){console.error('Weak Subjects checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Weak Subjects checks passed: Written Prep drives the review list while the legacy diagnostic backend remains secure and unused by this page.');
