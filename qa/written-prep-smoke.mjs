import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const html=read('written-prep.html');
const js=read('assets/written-prep.js');
const bankWrapper=read('supabase/functions/written-prep/bank.ts');
const bankSource=read('supabase/functions/written-prep/question-bank.js');
const edge=read('supabase/functions/written-prep/index.ts');
const standardsSource=read('assets/training-standards-data.js');
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
const standardsContext={window:{}};vm.runInNewContext(standardsSource,standardsContext);const standards=standardsContext.window.PilotDeskTrainingStandards;
ok(Boolean(standards),'FAA training standards matrix must load for Written Prep authoring QA');


ok(bankManifest.legacyGeneratedFamiliesExcluded===true,'Legacy generated question families must remain excluded from the live bank');
ok(bankManifest.acsQuestionCount===110,`Expected 110 curated ACS-linked live questions; got ${bankManifest.acsQuestionCount}`);
ok(bankManifest.supplementalPtsQuestionCount===22,`Expected 22 curated CFII PTS questions; got ${bankManifest.supplementalPtsQuestionCount}`);
ok(bankManifest.totalQuestionCount===155,`Expected 155 total curated live questions; got ${bankManifest.totalQuestionCount}`);
const minimumByTrack={ppl:20,ira:22,cpl:21,cfi:24,cfii:22,atp:23,foi:23};
for(const [track,min] of Object.entries(minimumByTrack))ok(banks[track]?.length>=min,`${track.toUpperCase()} curated bank fell below ${min} questions`);

for(const [track,items] of Object.entries(banks)){
 for(const q of items){
  ok(!ids.has(q.id),`Duplicate question id ${q.id}`);ids.add(q.id);
  ok(Array.isArray(q.options)&&q.options.length===3,`${q.id} must have exactly three answer choices`);
  ok(new Set(q.options).size===3,`${q.id} contains duplicate answer choices`);
  ok(q.options.every(x=>typeof x==='string'&&x.trim().length>=2),`${q.id} contains an empty/trivial answer choice`);
  ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3,`${q.id} has invalid correct-answer index`);
  ok(['applied','advanced'].includes(q.difficulty),`${q.id} must be applied or advanced; foundation questions are not allowed in the live bank`);
  ok(q.experienceLevel===track,`${q.id} experience level does not match its track`);
  ok(typeof q.explanation==='string'&&q.explanation.length>=55,`${q.id} needs a substantive explanation`);
  ok(typeof q.reference==='string'&&q.reference.length>=12,`${q.id} needs an FAA/reference citation`);
  ok(/^https:\/\/www\.faa\.gov\//.test(q.sourceUrl||''),`${q.id} must link to an FAA source`);
  ok(['faa-sample-exact','pilotdesk-faa-parallel','pilotdesk-curated'].includes(q.source),`${q.id} uses disallowed live source type ${q.source}`);
  ok(Array.isArray(q.choiceExplanations)&&q.choiceExplanations.length===3,`${q.id} must explain all three choices`);
  ok(!q.options.some(x=>/all of the above|none of the above|obviously|joke answer/i.test(x)),`${q.id} contains a low-quality test-taking shortcut`);
  ok(!/A flight is \d+ NM|planned leg is \d+ NM|Airport elevation is \d+ ft MSL and the altimeter setting/i.test(q.prompt),`${q.id} looks like a removed numeric-template family`);
  if(q.source!=='faa-sample-exact')ok(q.authoring==='curated-manual',`${q.id} must be manually curated`);
  if(acsTracks.includes(track)){
   ok(q.standardType==='ACS',`${q.id} must be ACS-linked`);
   ok(q.standardDoc===expectedDocs[track],`${q.id} uses ${q.standardDoc}; expected ${expectedDocs[track]}`);
   ok(prefixes[track].some(p=>String(q.standardCode).startsWith(p)),`${q.id} has invalid ${track.toUpperCase()} ACS code ${q.standardCode}`);
  }else if(track==='cfii'){
   ok(q.standardType==='PTS',`${q.id} must remain PTS-linked until the FAA publishes a CFII ACS`);
   ok(q.standardDoc==='FAA-S-8081-9E',`${q.id} must reference FAA-S-8081-9E`);
  }
 }
}
for(const [track,items] of Object.entries(banks)){
 const matrixTrack=standards?.tracks?.[track];
 ok(Boolean(matrixTrack),`${track.toUpperCase()} must exist in the shared FAA coverage matrix`);
 for(const q of items){
  const code=String(q.standardCode||'');
  const mapped=matrixTrack?.clusters?.some(c=>c.codes.some(prefix=>code.startsWith(prefix)));
  ok(mapped||(track==='cfii'&&code.startsWith('PTS Area')), `${q.id} is live but does not map to the shared ${track.toUpperCase()} ACS/PTS coverage matrix`);
 }
}
ok(ids.size===all.length,'Question IDs must be globally unique');
ok(new Set(all.map(q=>q.prompt)).size===all.length,'Live Written Prep prompts must be unique');

const exactFaa=all.filter(q=>q.source==='faa-sample-exact');
ok(exactFaa.length>=20,`Expected at least 20 exact FAA sample items; got ${exactFaa.length}`);
ok(exactFaa.some(q=>q.figureRef?.url&&q.figureRef?.figure),'Exact FAA sample layer must include testing-supplement figure questions');

const figureParallel=all.filter(q=>q.source==='pilotdesk-faa-parallel');
ok(figureParallel.length===10,`Expected 10 manually curated FAA-figure parallel live items after removing foundation variants; got ${figureParallel.length}`);
for(const q of figureParallel){
 ok(Boolean(q.figureRef?.supplement&&q.figureRef?.figure&&q.figureRef?.url),`${q.id} must carry an exact FAA figure reference`);
 ok(typeof q.calibratedFrom==='string'&&q.calibratedFrom.startsWith('FAA '),`${q.id} must identify the FAA sample used for calibration`);
}
const figureQuestions=all.filter(q=>q.figureRef?.url&&q.figureRef?.figure);
ok(figureQuestions.length>=23,`At least 23 live questions should require an official FAA figure; got ${figureQuestions.length}`);
// Preserve the existing official-figure layer while adding distinct non-figure scenarios.
const newScenarios=all.filter(q=>q.reviewedAt==='2026-10-04'&&q.id.startsWith('curated-')&&!q.id.includes('-expansion-'));
const expanded=all.filter(q=>q.id.includes('-expansion-'));
ok(expanded.length===83,'All-track release must add 83 separately authored questions');
ok(bankManifest.handbookQuestionCount===23&&banks.foi.every(q=>q.standardType==='Handbook'&&q.standardCode.startsWith('AIH.')),'FOI must use handbook chapter references rather than invented ACS codes');
ok(newScenarios.length===24,'Expansion must add 24 distinct original scenarios');
for(const track of ['ppl','ira','cpl','cfi','cfii','atp'])ok(newScenarios.filter(q=>q.experienceLevel===track).length===4,`${track} must gain four original scenarios`);
has(html,'not a complete exam bank','Limited coverage must remain visible before sign-in');
has(js,'does not cover the complete syllabus','Timed practice must disclose coverage limits');

has(html,'Choose your test and a study session.','Written Prep should explain the practice flow');
ok(!html.includes('5,000'),'Written Prep must not market the removed generated-volume bank');
ok(!html.includes('data-difficulty="foundation"'),'Foundation difficulty must not be exposed');
has(html,'data-difficulty="applied"','Applied difficulty filter missing');
has(html,'data-difficulty="advanced"','Advanced difficulty filter missing');
ok(html.includes('data-difficulty="all"')&&html.includes('data-difficulty="applied"'),'Question difficulty filters should be available');
has(html,'FII · PTS','CFII written-test track must be identified as PTS-based');
has(html,'id="pdPrepStandard"','Per-question standard badge missing');
has(html,'id="pdPrepGrade"','Practice grade UI missing');
has(html,'ACCOUNT REQUIRED','Account wall copy missing');
has(html,'/account.html?next=%2Fwritten-prep.html','Account gate must return users to Written Prep');
for(const track of ['ppl','ira','cpl','cfi','cfii','atp','foi'])has(html,`data-track="${track}"`,`Missing ${track.toUpperCase()} Written Prep track`);
for(const mode of ['learn','missed','marked','random','exam'])has(html,`data-mode="${mode}"`,`Missing ${mode} study mode`);

has(js,'/functions/v1/written-prep','Client must use secure Written Prep edge function');
has(js,"if(r.status===401){renderGate()",'Client must fail closed to account gate');
has(js,"const safeDifficulty=v=>['all','applied','advanced']",'Client must reject stale foundation difficulty');
has(js,"difficulty:state.difficulty",'Study sessions must send selected difficulty');
has(js,"text('#pdPrepStandard'",'Question UI must render the ACS/PTS element');
has(js,"return 'FAA SAMPLE'",'Exact FAA sample questions must be visibly labeled');
has(js,"return 'FAA FIGURE'",'FAA-figure parallel questions must be visibly labeled');
has(js,"return 'PRACTICE ITEM'",'Non-figure practice questions must have a clear label');
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
has(bankWrapper,"'pilotdesk-curated'",'Typed bank must distinguish manually curated questions');
has(bankWrapper,"authoring?:'curated-manual'",'Typed bank must expose manual-curation provenance');
has(bankWrapper,'figureRef?:','Typed bank must support FAA figure references');
has(bankWrapper,'choiceExplanations?:','Typed bank must support per-choice rationales');

for(const [track,meta] of Object.entries({ppl:['PAR',60,120],ira:['IRA',60,120],cpl:['CAX',100,150],cfi:['FIA',100,150],cfii:['FII',50,150],atp:['ATM',125,210],foi:['FOI',50,90]})){
 const [code,count,minutes]=meta;ok(trackMeta[track].testCode===code&&trackMeta[track].officialQuestions===count&&trackMeta[track].officialMinutes===minutes&&trackMeta[track].passingScore===70,`${track.toUpperCase()} official test metadata mismatch`);
}

has(edge,"return json(401,{error:'A free PilotDesk account is required to use Written Prep.'",'Edge function must require authentication');
has(edge,'function prepareQuestion','Server answer-choice shuffle missing');
has(edge,"['applied','advanced'].includes(String(v))",'Server must reject foundation difficulty');
has(edge,'standardCode:q.standardCode','Question payload must include standards element');
has(edge,'figureRef:q.figureRef||null','Question payload must include FAA figure references');
has(edge,'choiceExplanations:choiceRationales(qq,track)','Answer feedback must include per-choice rationales');
has(edge,'standardBreakdown','Dashboard must grade by standards element');
has(edge,'difficultyBreakdown','Dashboard must grade by difficulty');
has(edge,'passingScore:trackMeta[track].passingScore','Session result must use track passing score');
has(edge,"grade:grade(percent)",'Sessions must receive a letter grade');
has(edge,"mode==='exam'&&!done?null",'Practice exam must suppress correctness feedback until completion');
has(edge,'nextDue(streak,correct)','Review scheduling missing');
has(edge,'mastery(corr,total,streak)','Mastery tracking missing');
has(edge,'Math.min(trackMeta[track].officialQuestions,pool.length)','Practice exam must cap cleanly at the reviewed pool size');

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
has(astroHome,'href="/flight-training.html"','Homepage must link to the Learn hub');
has(astroHome,'href="/written-prep.html"','Written Prep must remain directly discoverable on the homepage');
has(training,'href="/written-prep.html"','Written Prep missing from training hub');
has(account,'renderPrepOverview','Written Prep progress missing from signed-in account home base');
has(account,"ensureOwnerMetric('pdMetricPrepToday'",'Owner dashboard must track Written Prep usage');

// Execute answer feedback with DOM doubles: a single element has no forEach.
const optionRows=Array.from({length:3},()=>({dataset:{},input:{disabled:false}}));
const feedbackBox={hidden:true,dataset:{},innerHTML:''};
const feedbackContext={
 $:(selector,row)=>selector==='input'?row.input:selector==='#pdPrepFeedback'?feedbackBox:optionRows[0],
 $$:()=>optionRows,esc:value=>String(value??''),
};
vm.runInNewContext(js.slice(js.indexOf('function markFeedback'),js.indexOf('async function startMode')),feedbackContext);
feedbackContext.markFeedback({correct:false,selected:0,correctIndex:2,correctAnswer:'third',explanation:'Explanation',choiceExplanations:['first rationale','second rationale','third rationale'],sourceUrl:'https://www.faa.gov/'});
ok(optionRows.every(row=>row.input.disabled),'Submitting an answer must disable every option');
ok(optionRows[0].dataset.state==='wrong'&&optionRows[2].dataset.state==='correct','Feedback must mark selected and correct options');
ok(!feedbackBox.hidden&&feedbackBox.innerHTML.includes('third rationale'),'Feedback must display all rationales without a client runtime exception');

const {stripTypeScriptTypes}=await import('node:module');
const helpers=edge.slice(edge.indexOf('function shuffle'),edge.indexOf('function publicQuestion'));
const helperContext={banks,Math:Object.create(Math)};
vm.runInNewContext(stripTypeScriptTypes(helpers),helperContext);
for(const q of all){
 for(const [r1,r2] of [[0,0],[0,.99],[.4,0],[.4,.99],[.99,0],[.99,.99]]){
  const random=[r1,r2];helperContext.Math.random=()=>random.shift();
  const prepared=helperContext.prepareQuestion(q);
  ok(prepared.options[prepared.correct]===q.options[q.correct],`${q.id}: shuffle changed the answer key`);
  for(let i=0;i<3;i++)ok(prepared.choiceExplanations[i]===q.choiceExplanations[q.options.indexOf(prepared.options[i])],`${q.id}: shuffled explanation mismatch`);
  const legacy={...prepared,choiceExplanations:q.choiceExplanations};
  const repaired=helperContext.choiceRationales(legacy,q.experienceLevel);
  ok(repaired.every((r,i)=>r===prepared.choiceExplanations[i]),`${q.id}: saved-session rationale repair failed`);
 }
}

helperContext.Math.random=Math.random;
helperContext.trackMeta=trackMeta;
helperContext.grade=v=>v>=90?'A':v>=80?'B':v>=70?'C':'F';
vm.runInNewContext(stripTypeScriptTypes(edge.slice(edge.indexOf('function selectQuestions'),edge.indexOf('Deno.serve'))),helperContext);
vm.runInNewContext(stripTypeScriptTypes(edge.slice(edge.indexOf('function publicQuestion'),edge.indexOf('function nextDue'))),helperContext);
for(const [track,bank] of Object.entries(banks)){
 const first=bank[0],stats=[{question_id:first.id,last_result:false,mastery:0,due_at:new Date(0).toISOString()}];
 for(const mode of ['learn','random','exam','missed','marked']){
  const questions=helperContext.selectQuestions(track,mode,'all',stats,[first.id]);
  ok(questions.length>0&&new Set(questions.map(q=>q.id)).size===questions.length,`${track}/${mode}: empty or repeated session`);
  if(mode==='missed'||mode==='marked')ok(questions.length===1&&questions[0].id===first.id,`${track}/${mode}: incorrect review pool`);
  if(mode==='exam')ok(questions.length===Math.min(trackMeta[track].officialQuestions,bank.length),`${track}: timed set has the wrong question count`);
  const publicItem=helperContext.publicQuestion(questions[0],0,questions.length);
  ok(!('correct' in publicItem)&&!('choiceExplanations' in publicItem),`${track}/${mode}: public question leaks the answer key`);
 }
 const topic=bank[0].area;
 const topicSet=helperContext.selectQuestions(track,'learn','all',[],[],topic);
 ok(topicSet.length>0&&topicSet.every(q=>q.area===topic),`${track}: subject study must use only the chosen subject`);
 const mixedExam=helperContext.selectQuestions(track,'exam','all',[],[],topic);
 ok(mixedExam.length===Math.min(trackMeta[track].officialQuestions,bank.length),`${track}: timed practice must cover the mixed bank despite a subject selection`);
 ok(helperContext.selectQuestions(track,'random','all',[],[],'nonexistent').length===0,`${track}: an unknown topic must not silently use the whole bank`);
 const advanced=helperContext.selectQuestions(track,'random','advanced',[],[]);
 ok(advanced.every(q=>q.difficulty==='advanced'),`${track}: difficulty filter must restrict the session`);
}

has(js,'startTimer(a.simulatedMinutes,a.createdAt)','Resuming timed practice must retain elapsed wall time');
has(edge,'s.track!==track','Answers must reject a mismatched session track');
// Execute the authenticated handler against an isolated in-memory REST transport.
let handler;const storedSessions=new Map(),storedStats=[],testUser='qa-user';
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const fakeFetch=async(url,init={})=>{
 const u=new URL(url),method=init.method||'GET',name=u.pathname.split('/').at(-1);
 if(u.pathname==='/auth/v1/user')return response(init.headers?.Authorization==='Bearer qa-token'?{id:testUser}:{},init.headers?.Authorization==='Bearer qa-token'?200:401);
 if(name==='written_prep_sessions'){
  if(method==='POST'){const row={...JSON.parse(init.body),id:`session-${storedSessions.size}`,created_at:new Date().toISOString()};storedSessions.set(row.id,row);return response([row])}
  const id=u.searchParams.get('id')?.replace(/^eq\./,'');
  if(id){const row=storedSessions.get(id);if(method==='PATCH'){Object.assign(row,JSON.parse(init.body));return response([row])}return response(row?[row]:[])}
  return response([]);
 }
 if(name==='written_prep_stats'){if(method==='POST'){storedStats.push(JSON.parse(init.body));return response(null)}return response(storedStats.filter(r=>r.track===u.searchParams.get('track')?.replace(/^eq\./,'')))}
 if(name==='written_prep_bookmarks')return response([]);
 throw new Error(`Unmocked transport ${method} ${u.pathname}`);
};
const runtime={banks,trackMeta,publicSources:mod.publicSources,bankManifest,Response,Request,URL,Date,Math,console,fetch:fakeFetch,Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://qa.invalid':'qa-key'},serve:h=>{handler=h}}};
vm.runInNewContext(stripTypeScriptTypes(edge.split('\n').slice(2).join('\n')),runtime);
const invoke=async(body,token='qa-token')=>handler(new Request('https://qa.invalid/functions/v1/written-prep',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)}));
ok((await invoke({action:'start',track:'foi'},'invalid')).status===401,'Live handler must reject invalid authentication');
for(const track of Object.keys(banks)){
 const topic=banks[track][0].area,start=await invoke({action:'start',track,mode:'learn',topic}),data=await start.json();
 ok(start.status===200&&data.session?.question.area===topic,`${track}: authenticated subject session failed`);
 const saved=storedSessions.get(data.session.id),item=saved.question_payload[0];
 const wrongTrack=track==='ppl'?'foi':'ppl';
 ok((await invoke({action:'answer',track:wrongTrack,sessionId:saved.id,choice:item.correct})).status===404,`${track}: mismatched track must fail before a stat write`);
 const answered=await invoke({action:'answer',track,sessionId:saved.id,choice:item.correct}),result=await answered.json();
 ok(answered.status===200&&result.feedback?.correct===true,`${track}: authenticated grading failed`);
 ok(result.feedback?.choiceExplanations?.[item.correct].startsWith('Correct.'),`${track}: feedback rationale order failed`);
 ok(storedStats.at(-1)?.user_id===testUser&&storedStats.at(-1)?.track===track,`${track}: answer persistence must use authenticated owner and track`);
}

if(failures.length){console.error('Written Prep checks failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Written Prep checks passed: ${bankManifest.totalQuestionCount} curated live questions; generated template families excluded, ${figureQuestions.length} FAA-figure items, exact FAA samples, per-choice rationales, secure grading, standards mapping, and account persistence verified.`);
