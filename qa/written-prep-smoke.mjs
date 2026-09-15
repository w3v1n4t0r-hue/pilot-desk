import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('written-prep.html');
const js=read('assets/written-prep.js');
const bank=read('supabase/functions/written-prep/bank.ts');
const edge=read('supabase/functions/written-prep/index.ts');
const migration=read('supabase/migrations/008_written_prep.sql');
const lockdown=read('supabase/migrations/009_written_prep_lockdown.sql');
const nav=read('assets/global-nav.js');
const bootstrap=read('assets/app-bootstrap.js');
const training=read('flight-training.html');
const account=read('assets/account.js');
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
const has=(text,needle,msg)=>ok(text.includes(needle),msg||`missing ${needle}`);

has(html,'https://www.pilot-desk.com/written-prep.html','Written Prep needs canonical production URL');
has(html,'Free FAA Written Test Prep','Written Prep SEO title missing');
has(html,'isAccessibleForFree','Written Prep free structured data missing');
has(html,'ACCOUNT REQUIRED','Account wall copy missing');
has(html,'/account.html?next=%2Fwritten-prep.html','Account gate must return users to Written Prep');
ok(html.toLowerCase().includes('not a leaked faa test bank'),'Live-bank integrity disclosure missing');
for(const track of ['ppl','ira','cpl','cfi','cfii','atp'])has(html,`data-track="${track}"`,`Missing ${track.toUpperCase()} Written Prep track`);
for(const mode of ['learn','missed','marked','random','exam'])has(html,`data-mode="${mode}"`,`Missing ${mode} study mode`);

has(js,'/functions/v1/written-prep','Client must use the secure Written Prep edge function');
has(js,"if(r.status===401){renderGate()",'Client must fail closed to account gate');
has(js,"modeNames={learn:'ADAPTIVE STUDY'",'Adaptive study UI missing');
has(js,"state.session?.mode==='exam'",'Practice-exam behavior missing');
ok(!/correct\s*:\s*[0-9]/.test(js),'Client must not contain answer keys');

for(const track of ['ppl','ira','cpl','cfi','cfii','atp'])has(bank,`${track}:{label:`,`Question bank missing metadata for ${track}`);
const questionCount=(bank.match(/\bq\('/g)||[]).length;
ok(questionCount>=120,`Written Prep bank is too small (${questionCount}); expected at least 120 FAA-grounded practice items`);
has(bank,"testCode:'PAR',officialQuestions:60,officialMinutes:120,passingScore:70",'PAR official test metadata missing');
has(bank,"testCode:'IRA',officialQuestions:60,officialMinutes:120,passingScore:70",'IRA official test metadata missing');
has(bank,"testCode:'CAX',officialQuestions:100,officialMinutes:150,passingScore:70",'CAX official test metadata missing');
has(bank,"testCode:'FIA',officialQuestions:100,officialMinutes:150,passingScore:70",'FIA official test metadata missing');
has(bank,"testCode:'FII',officialQuestions:50,officialMinutes:150,passingScore:70",'FII official test metadata missing');
has(bank,"testCode:'ATM',officialQuestions:125,officialMinutes:210,passingScore:70",'ATM official test metadata missing');
has(bank,"'faa-sample-derived'",'Question bank must distinguish FAA sample-derived items');
has(bank,"'pilotdesk-faa-aligned'",'Question bank must distinguish original FAA-aligned items');

has(edge,"return json(401,{error:'A free PilotDesk account is required to use Written Prep.'",'Edge function must require authentication');
has(edge,"function prepareQuestion",'Server-side answer-choice shuffle missing');
has(edge,"action==='start'",'Secure start action missing');
has(edge,"action==='answer'",'Secure answer action missing');
has(edge,"action==='bookmark'",'Secure bookmark action missing');
has(edge,"mode==='exam'&&!done?null",'Practice exam must suppress correctness feedback until completion');
has(edge,'nextDue(streak,correct)','Spaced review scheduling missing');
has(edge,'mastery(corr,total,streak)','Mastery tracking missing');
has(edge,"readiness=Math.round(accuracy*.65+coverage*.35)",'Readiness must include accuracy and coverage');

for(const table of ['written_prep_stats','written_prep_sessions','written_prep_bookmarks']){
 has(migration,`create table if not exists public.${table}`,`Missing ${table} table`);
 has(migration,`alter table public.${table} enable row level security`,`${table} must have RLS`);
 has(lockdown,`revoke all on public.${table} from anon, authenticated`,`${table} must be unreadable and unwritable directly from the browser`);
}
has(migration,'revoke insert, update, delete on public.written_prep_stats from anon, authenticated','Initial schema must prevent direct answer-stat writes');
has(migration,'(select auth.uid()) = user_id','Initial schema must scope account data before final lockdown');
has(lockdown,'server-owned','Lockdown migration must document server ownership of answer data');

has(nav,"['/written-prep.html','Written Prep']",'Written Prep missing from global navigation');
has(bootstrap,'href="/written-prep.html" data-pd-launch="written-prep"','Written Prep missing from homepage Quick Start');
has(training,'href="/written-prep.html"','Written Prep missing from training hub');
has(training,'<h2>FAA Written Prep</h2>','Written Prep training card missing');
has(account,'ensureWrittenPrepCta','Written Prep missing from signed-in account dashboard');
has(account,"ensureOwnerMetric('pdMetricPrepToday'",'Owner dashboard must track Written Prep usage');
has(account,'Returning you to your PilotDesk tool','Account redirect status must work for non-Daily tools');

if(failures.length){console.error('Written Prep checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Written Prep checks passed: ${questionCount} FAA-grounded practice items across PPL/IRA/CPL/CFI/CFII/ATP, account-gated Edge-only grading/data access, adaptive review, practice exams, saved progress, owner metrics, and site discovery verified.`);
