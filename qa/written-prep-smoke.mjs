import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('written-prep.html');
const js=read('assets/written-prep.js');
const bankWrapper=read('supabase/functions/written-prep/bank.ts');
const bankSource=read('supabase/functions/written-prep/question-bank.js');
const edge=read('supabase/functions/written-prep/index.ts');
const migration=read('supabase/migrations/008_written_prep.sql');
const gradingMigration=read('supabase/migrations/009_written_prep_acs_grading.sql');
const siteData=read('src/data/site.mjs');
const astroHome=read('src/pages/index.astro');
const training=read('flight-training.html');
const account=read('assets/account.js');
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg)};
const has=(text,needle,msg)=>ok(text.includes(needle),msg||`missing ${needle}`);

const mod=await import(`data:text/javascript;base64,${Buffer.from(bankSource).toString('base64')}`);
const {banks,bankManifest,trackMeta}=mod;
const acsTracks=['ppl','ira','cpl','cfi','atp'];
const expectedDocs={ppl:'FAA-S-ACS-6C',ira:'FAA-S-ACS-8C',cpl:'FAA-S-ACS-7B',cfi:'FAA-S-ACS-25',atp:'FAA-S-ACS-11A'};
const prefixes={ppl:['PA.'],ira:['IR.'],cpl:['CA.'],cfi:['FI.','AI.'],atp:['AA.']};
const all=Object.values(banks).flat();
const ids=new Set();

ok(bankManifest.acsQuestionCount>=5028,`Expected at least 5,028 ACS-linked items after FAA sample + curated figure families; got ${bankManifest.acsQuestionCount}`);
for(const track of acsTracks){const floor=['ppl','ira','cpl'].includes(track)?1005:1000;ok(banks[track]?.length>=floor,`${track.toUpperCase()} must contain at least ${floor} ACS-linked items`)}
ok(banks.cfii?.length>=250,'CFII should keep at least 250 PTS-linked supplemental items');
ok(bankManifest.totalQuestionCount>=5278,`Expected at least 5,278 total items including FAA samples, curated figure families, and CFII PTS; got ${bankManifest.totalQuestionCount}`);

for(const [track,items] of Object.entries(banks)){
 for(const q of items){
  ok(!ids.has(q.id),`Duplicate question id ${q.id}`);ids.add(q.id);
  ok(Array.isArray(q.options)&&q.options.length===3,`${q.id} must have exactly three answer choices`);
  ok(new Set(q.options).size===3,`${q.id} contains duplicate answer choices`);
  ok(q.options.every(x=>typeof x==='string'&&x.trim().length>=2),`${q.id} contains an empty/trivial answer choice`);
  ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3,`${q.id} has invalid correct-answer index`);
  ok(['foundation','applied','advanced'].includes(q.difficulty),`${q.id} has invalid difficulty`);
  ok(q.experienceLevel===track,`${q.id} experience level does not match its track`);
  ok(typeof q.explanation==='string'&&q.explanation.length>=35,`${q.id} needs a substantive explanation`);
  ok(typeof q.reference==='string'&&q.reference.length>=8,`${q.id} needs an FAA/reference citation`);
  ok(/^https:\/\/www\.faa\.gov\//.test(q.sourceUrl||''),`${q.id} must link to an FAA standard source`);
  ok(!q.options.some(x=>/all of the above|none of the above|obviously|joke answer/i.test(x)),`${q.id} contains a low-quality test-taking shortcut`);
  if(acsTracks.includes(track)){
   ok(q.standardType==='ACS',`${q.id} must be ACS-linked`);
   ok(q.standardDoc===expectedDocs[track],`${q.id} uses ${q.standardDoc}; expected ${expectedDocs[track]}`);
   ok(prefixes[track].some(p=>String(q.standardCode).startsWith(p)),`${q.id} has invalid ${track.toUpperCase()} ACS code ${q.standardCode}`);
  }else if(track==='cfii'){
   ok(q.standardType==='PTS',`${q.id} must remain PTS-linked until the FAA publishes a CFII ACS`);
   ok(q.standardDoc==='FAA-S-8081-9E',`${q.id} must reference FAA-S-8081-9E`);
  }
 }
 if(acsTracks.includes(track)){
  const foundation=items.filter(x=>x.difficulty==='foundation').length,applied=items.filter(x=>x.difficulty==='applied').length,advanced=items.filter(x=>x.difficulty==='advanced').length;
  ok(foundation>=200&&applied>=350&&advanced>=250,`${track.toUpperCase()} difficulty distribution is too narrow (${foundation}/${applied}/${advanced})`);
 }
}
const exactFaa=all.filter(q=>q.source==='faa-sample-exact');
ok(exactFaa.length>=15,`Expected at least 15 exact FAA sample items; got ${exactFaa.length}`);
for(const track of ['ppl','ira','cpl'])ok(banks[track].filter(q=>q.source==='faa-sample-exact').length>=5,`${track.toUpperCase()} must include at least five exact FAA sample questions`);
ok(exactFaa.some(q=>q.figureRef?.url&&q.figureRef?.figure),'Exact FAA sample layer must include testing-supplement figure questions');
for(const q of exactFaa){ok(Array.isArray(q.choiceExplanations)&&q.choiceExplanations.length===3,`${q.id} needs per-choice rationale`);ok(q.reviewedAt==='2026-09-22',`${q.id} must carry the current review date`)}
const figureParallel=all.filter(q=>q.source==='pilotdesk-faa-parallel');
ok(figureParallel.length>=13,`Expected at least 13 curated FAA-figure parallel items; got ${figureParallel.length}`);
for(const q of figureParallel){
 ok(q.authoring==='curated-manual',`${q.id} must be manually curated`);
 ok(Boolean(q.figureRef?.supplement&&q.figureRef?.figure&&q.figureRef?.url),`${q.id} must carry an exact FAA figure reference`);
 ok(Array.isArray(q.choiceExplanations)&&q.choiceExplanations.length===3,`${q.id} needs three per-choice rationales`);
 ok(typeof q.calibratedFrom==='string'&&q.calibratedFrom.startsWith('FAA '),`${q.id} must identify the FAA sample used for calibration`);
}
ok(ids.size===all.length,'Question IDs must be globally unique');
const uniquePrompts=new Set(all.map(q=>`${q.prompt}::${q.options.join('|')}`)).size;
ok(uniquePrompts>=1400,`Question variants are not diverse enough (${uniquePrompts} unique prompt/choice sets)`);

has(html,'5,000+ ACS-linked','Written Prep must advertise the expanded ACS question bank accurately');
has(html,'exactly three answer choices','Three-choice exam format disclosure missing');
has(html,'FAA-S-8081-9E','CFII PTS disclosure missing');
has(html,'data-difficulty="foundation"','Foundation difficulty filter missing');
has(html,'data-difficulty="applied"','Applied difficulty filter missing');
has(html,'data-difficulty="advanced"','Advanced difficulty filter missing');
has(html,'id="pdPrepStandard"','Per-question standard badge missing');
has(html,'id="pdPrepGrade"','Practice grade UI missing');
has(html,'ACCOUNT REQUIRED','Account wall copy missing');
has(html,'/account.html?next=%2Fwritten-prep.html','Account gate must return users to Written Prep');
ok(html.toLowerCase().includes('not a leaked faa test bank'),'Live-bank integrity disclosure missing');
for(const track of ['ppl','ira','cpl','cfi','cfii','atp'])has(html,`data-track="${track}"`,`Missing ${track.toUpperCase()} Written Prep track`);
for(const mode of ['learn','missed','marked','random','exam'])has(html,`data-mode="${mode}"`,`Missing ${mode} study mode`);

has(js,'/functions/v1/written-prep','Client must use secure Written Prep edge function');
has(js,"if(r.status===401){renderGate()",'Client must fail closed to account gate');
has(js,'pd-written-difficulty','Difficulty selection must persist');
has(js,"difficulty:state.difficulty",'Study sessions must send selected difficulty');
has(js,"text('#pdPrepStandard'",'Question UI must render the ACS/PTS element');
has(js,"return 'FAA SAMPLE'",'Exact FAA sample questions must be visibly labeled');
has(js,'renderFigureRef(q)','FAA testing-supplement figure handoff missing');
has(js,'pd-prep-choice-rationale','Per-choice rationale rendering missing');
has(js,"text('#pdPrepGrade'",'Dashboard must render practice grade');
has(js,"modeNames={learn:'WEAK-AREA REVIEW'",'Weak-area review label missing');
ok(!/correct\s*:\s*[0-9]/.test(js),'Client must not contain answer keys');

has(bankWrapper,"standardCode:string",'Typed bank must expose standard code');
has(bankWrapper,"difficulty:Difficulty",'Typed bank must expose difficulty');
has(bankWrapper,"experienceLevel:Track",'Typed bank must expose experience level');
has(bankWrapper,"bankManifest",'Typed bank must expose bank manifest');
has(bankWrapper,"'faa-sample-exact'",'Typed bank must distinguish exact FAA sample questions');
has(bankWrapper,"'pilotdesk-faa-parallel'",'Typed bank must distinguish curated FAA-figure parallel questions');
has(bankWrapper,"authoring?:'curated-manual'",'Typed bank must expose manual-curation provenance');
has(bankWrapper,'figureRef?:','Typed bank must support FAA figure references');
has(bankWrapper,'choiceExplanations?:','Typed bank must support per-choice rationales');
for(const [track,meta] of Object.entries({ppl:['PAR',60,120],ira:['IRA',60,120],cpl:['CAX',100,150],cfi:['FIA',100,150],cfii:['FII',50,150],atp:['ATM',125,210]})){
 const [code,count,minutes]=meta;ok(trackMeta[track].testCode===code&&trackMeta[track].officialQuestions===count&&trackMeta[track].officialMinutes===minutes&&trackMeta[track].passingScore===70,`${track.toUpperCase()} official test metadata mismatch`);
}

has(edge,"return json(401,{error:'A free PilotDesk account is required to use Written Prep.'",'Edge function must require authentication');
has(edge,'function prepareQuestion','Server answer-choice shuffle missing');
has(edge,'validDifficulty','Difficulty filter must be enforced by the grading service');
has(edge,'standardCode:q.standardCode','Question payload must include standards element');
has(edge,'figureRef:q.figureRef||null','Question payload must include FAA figure references');
has(edge,'choiceExplanations:Array.isArray(qq.choiceExplanations)','Answer feedback must include per-choice rationales');
has(edge,'standardBreakdown','Dashboard must grade by standards element');
has(edge,'difficultyBreakdown','Dashboard must grade by difficulty');
has(edge,'passingScore:trackMeta[track].passingScore','Session result must use track passing score');
has(edge,"grade:grade(percent)",'Sessions must receive a letter grade');
has(edge,"mode==='exam'&&!done?null",'Practice exam must suppress correctness feedback until completion');
has(edge,'nextDue(streak,correct)','Review scheduling missing');
has(edge,'mastery(corr,total,streak)','Mastery tracking missing');
has(edge,'Math.min(60,pool.length)','Practice exam should support a 60-question simulation');

for(const table of ['written_prep_stats','written_prep_sessions','written_prep_bookmarks']){
 has(migration,`create table if not exists public.${table}`,`Missing ${table} table`);
 has(migration,`alter table public.${table} enable row level security`,`${table} must have RLS`);
}
has(migration,'revoke insert, update, delete on public.written_prep_stats from anon, authenticated','Clients must not write their own answer stats');
has(migration,'(select auth.uid()) = user_id','Written Prep reads must be user-scoped');
has(gradingMigration,'standard_code text','Standards-element persistence migration missing');
has(gradingMigration,'difficulty text','Difficulty persistence migration missing');
has(gradingMigration,'revoke insert, update, delete on public.written_prep_sessions from anon, authenticated','Session mutation must remain protected');

has(siteData,"['/written-prep.html', 'Written Prep'",'Written Prep missing from shared global navigation');
has(siteData,"['/written-prep.html', 'Study for a Written'",'Written Prep missing from shared homepage primary actions');
has(astroHome,'homeActions.slice(0,3).map','Astro homepage must render the shared primary action model');
has(astroHome,"data-pd-launch={index === 2 ? 'written-prep' : undefined}",'Written Prep primary action marker missing from Astro homepage renderer');
has(training,'href="/written-prep.html"','Written Prep missing from training hub');
has(account,'renderPrepOverview','Written Prep progress missing from signed-in account home base');
has(account,"ensureOwnerMetric('pdMetricPrepToday'",'Owner dashboard must track Written Prep usage');

if(failures.length){console.error('Written Prep checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Written Prep checks passed: ${bankManifest.acsQuestionCount.toLocaleString()} ACS-linked practice items + ${bankManifest.supplementalPtsQuestionCount} CFII PTS items; three choices each, difficulty tiers, secure grading, standards links, weak-area review, and account persistence verified.`);
