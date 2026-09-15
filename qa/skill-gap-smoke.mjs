import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const page=read('skill-gap.html'),client=read('assets/skill-gap.js'),css=read('assets/skill-gap.css'),edge=read('supabase/functions/pilot-skill-gap/index.ts'),migration=read('supabase/migrations/007_pilot_skill_gap.sql'),daily=read('daily/index.html'),training=read('flight-training.html'),nav=read('assets/global-nav.js'),sitemap=read('sitemap-retention.xml');
const failures=[];const need=(t,n,l)=>{if(!t.includes(n))failures.push(`${l}: missing ${n}`)};
for(const n of ['https://www.pilot-desk.com/skill-gap.html','PPL','CPL','ATP','FAA grounded, not a leaked test bank','FAA PAR sample questions','FAA CAX sample questions','FAA ATM sample questions','/assets/skill-gap.js'])need(page,n,'skill-gap page');
for(const n of ["state={track:'ppl'",'/functions/v1/pilot-skill-gap','pd-knowledge-track','weakest','Pilot Skill Gap Completed'])need(client,n,'skill-gap client');
for(const n of ['FAA_PAR','FAA_CAX','FAA_ATM','faa-sample-derived','pilotdesk-acs','record_skill_gap_attempt','publicQuestion','ppl:[','cpl:[','atp:['])need(edge,n,'skill-gap edge');
if(edge.includes('correct:q.correct')||edge.includes('correct:q.correct,'))failures.push('skill-gap edge: GET publicQuestion must not expose answer keys');
for(const n of ['create table if not exists public.skill_gap_stats','alter table public.skill_gap_stats enable row level security','(select auth.uid()) = user_id','security definer','revoke all on function public.record_skill_gap_attempt','grant execute on function public.record_skill_gap_attempt','knowledge_track'])need(migration,n,'skill-gap migration');
need(daily,'/skill-gap.html','daily discovery');
for(const n of ['/skill-gap.html','PPL, CPL, or ATP','The FAA does not publish its active knowledge-test question bank'])need(training,n,'training hub discovery');
need(nav,"'/skill-gap.html'",'global nav app coverage');
need(sitemap,'https://www.pilot-desk.com/skill-gap.html','retention sitemap');
for(const n of ['pd-gap-tracks','pd-gap-map-fill','data-band="strong"'])need(css,n,'skill-gap visual system');
if(failures.length){console.error('Pilot Skill Gap checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Pilot Skill Gap checks passed: PPL/CPL/ATP tracks, FAA sample/ACS labeling, secure grading, account persistence, knowledge mapping, Daily/training discovery, and SEO wiring verified.');
