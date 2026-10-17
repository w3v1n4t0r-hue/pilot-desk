import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

// Execute the actual Edge handlers with local service fixtures; never call production.
const response=(body,status=200)=>new Response(JSON.stringify(body),{status});
function handler(file,fetch,extra={}){
 let serve;
 const source=fs.readFileSync(file,'utf8').replace(/^import[^\n]+\n/gm,'');
 vm.runInNewContext(stripTypeScriptTypes(source),{Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://local.invalid':'test'},serve:h=>serve=h},fetch,Response,URL,Date,Math,console,...extra});
 return serve;
}
const post=(body)=>new Request('https://local.invalid',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)});
let failures=0;
async function test(name,fn){try{await fn();console.log(`PASS ${name}`)}catch(e){failures++;console.error(`FAIL ${name}: ${e.message}`)}}
await test('Daily rejects expired displayed challenge before grading or persistence',async()=>{
 let now='2026-10-16T23:59:59Z',writes=0;
 class Clock extends Date {constructor(...args){super(...(args.length?args:[now]))}}
 const daily=handler('supabase/functions/pilot-daily/index.ts',async(url,init={})=>{if(url.includes('/auth/'))return response({id:'user'});if(init.method==='POST')writes++;return response([])},{Date:Clock});
 const old=await (await daily(new Request('https://local.invalid'))).json();now='2026-10-17T00:00:01Z';
 const expired=await daily(post({date:old.date,challengeKey:old.challenge.key,answers:[0,0,0]}));
 assert.equal(expired.status,409);assert.equal((await expired.json()).code,'challenge_expired');assert.equal(writes,0);
});
await test('Written Prep requires displayed question and stable submission ID',async()=>{
 const q={id:'q1',options:['A','B'],correct:0};let writes=0;
 const prep=handler('supabase/functions/written-prep/index.ts',async(url,init={})=>{if(url.includes('/auth/'))return response({id:'user'});if(init.method&&init.method!=='GET')writes++;return response(url.includes('written_prep_sessions')?[{id:'s',track:'ppl',mode:'learn',question_payload:[q,q],total:2}]:[])},{banks:{ppl:[q]},trackMeta:{ppl:{}},bankManifest:{},publicSources:[]});
 assert.equal((await prep(post({action:'answer',track:'ppl',sessionId:'s',choice:0}))).status,400);assert.equal(writes,0);
});
await test('Written Prep handler delegates one transaction and keeps private keys out of next question',async()=>{
 const q={id:'q1',options:['A','B'],correct:0,result:true,answerMastery:78,explanation:'A is correct.'},next={...q,id:'q2'};let calls=0;
 const prep=handler('supabase/functions/written-prep/index.ts',async(url,init={})=>{
  if(url.includes('/auth/'))return response({id:'user'});
  if(url.endsWith('/rpc/answer_written_prep')){calls++;const p=JSON.parse(init.body);assert.equal(p.p_question_id,'q1');assert.equal(p.p_question_index,0);assert.equal(p.p_user_id,'user');return response({session:{question_payload:[q,next],score:1,mode:'learn'}})}
  assert.ok(!init.method||init.method==='GET','handler must not write outside answer RPC');return response([]);
 },{banks:{ppl:[q,next]},trackMeta:{ppl:{}},bankManifest:{},publicSources:[]});
 const body={action:'answer',track:'ppl',sessionId:'s',questionId:'q1',questionIndex:0,submissionId:'00000000-0000-4000-8000-000000000001',choice:0};
 for(let i=0;i<2;i++){const r=await prep(post(body));assert.equal(r.status,200);const d=await r.json();assert.equal(d.progress.answered,1);assert.equal(d.feedback.correct,true);assert.equal(d.nextQuestion.id,'q2');assert.equal(d.nextQuestion.correct,undefined);assert.equal(d.nextQuestion.submissionId,undefined)}
 assert.equal(calls,2);
});
await test('Browser retry reuses the exact question, request ID, and choice after a lost response',async()=>{
 const source=fs.readFileSync('assets/written-prep.js','utf8'),start=source.indexOf('async function submitAnswer('),end=source.indexOf('\nfunction nextQuestion',start);
 const state={session:{id:'s',mode:'learn'},current:{id:'q1',index:0},track:'ppl',answerAttempt:null};
 const btn={},radio={disabled:false};let selected=0,requests=[],feedback;
 const context={state,crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'},$:s=>s.includes(':checked')?{value:selected}:btn,$$:()=>[radio],notice:()=>{},markFeedback:f=>feedback=f,loadDashboard:()=>{},api:async body=>{requests.push(structuredClone(body));if(requests.length===1)throw new Error('response lost');return{done:false,feedback:{correct:true},nextQuestion:{id:'q2',index:1}}}};
 vm.runInNewContext(source.slice(start,end)+';globalThis.submit=submitAnswer;',context);
 await context.submit({preventDefault(){}});assert.equal(btn.textContent,'RETRY SAVING ANSWER');assert.equal(radio.disabled,true);
 selected=1;await context.submit({preventDefault(){}});assert.deepEqual(requests[1],requests[0]);assert.equal(requests[1].questionId,'q1');assert.equal(feedback.selected,0);assert.equal(state.pendingNext.id,'q2');
});
await test('Daily expiry reload failure offers recovery without claiming the next set loaded',async()=>{
 const source=fs.readFileSync('assets/daily.js','utf8'),start=source.indexOf('async function submit('),end=source.indexOf('\nasync function init',start);
 const old={date:'2026-10-16',challenge:{key:'old',questions:[{},{},{}]}},state={data:old,submitted:false},elements=new Map(),notes=[];let calls=0,rendered=false;
 const context={state,SUPABASE_URL:'https://local.invalid',edgeHeaders:()=>({}),document:{querySelector:()=>({value:'0'})},$:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id)},escapeHtml:s=>s,setText:(_id,text)=>notes.push(text),renderChallenge:d=>{state.data=d;rendered=true},fetch:async(_url,init={})=>{
  calls++;if(calls===1){assert.deepEqual(JSON.parse(init.body),{date:old.date,challengeKey:old.challenge.key,answers:[0,0,0]});return response({code:'challenge_expired'},409)}if(calls===2)throw new Error('offline');return response({date:'2026-10-17',challenge:{key:'new'}});
 }};
 vm.runInNewContext(source.slice(start,end)+';globalThis.submitDaily=submit;',context);
 await context.submitDaily({preventDefault(){}});assert.equal(state.data,null);assert.equal(rendered,false);assert.equal(elements.get('#pdDailySubmit').disabled,false);assert.equal(elements.get('#pdDailySubmit').textContent,'Retry loading challenge');assert.ok(!notes.some(n=>n.includes('new daily set opened')));
 await context.submitDaily({preventDefault(){}});assert.equal(rendered,true);assert.equal(state.data.date,'2026-10-17');assert.equal(calls,3);
});
if(failures)process.exitCode=1;
