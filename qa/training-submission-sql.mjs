// Optional real PostgreSQL verification, without adding a production dependency.
// Set PGLITE_MODULE_PATH to an installed @electric-sql/pglite/dist/index.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PGLITE_MODULE_PATH;
if(!modulePath){console.log('SKIP training SQL: set PGLITE_MODULE_PATH to run PostgreSQL checks.');process.exit(0)}
const {PGlite}=await import(pathToFileURL(modulePath).href);
const db=new PGlite();
try{
 await db.exec(`create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$select null::uuid$$;
 create role anon; create role authenticated; create role service_role bypassrls;`);
 for(const file of ['008_written_prep.sql','009_written_prep_acs_grading.sql','20261017030512_atomic_training_answers.sql'])await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));
 await db.exec('grant usage on schema public to service_role; grant all on all tables in schema public to service_role;');
 const user='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
 await db.query('insert into auth.users values ($1),($2)',[user,other]);
 const question=id=>({id,area:'Weather',options:['A','B'],correct:0,difficulty:'applied',standardCode:'TEST',standardDoc:'FAA'});
 const makeSession=async(id,n=2)=>db.query(`insert into public.written_prep_sessions(id,user_id,track,mode,total,question_payload) values($1,$2,'ppl','learn',$3,$4::jsonb)`,[id,user,n,JSON.stringify(Array.from({length:n},(_,i)=>question(`q${i}`)))]);
 const sid='00000000-0000-4000-8000-000000000010',rid='00000000-0000-4000-8000-000000000020',rid2='00000000-0000-4000-8000-000000000021';
 const answer=async(session=sid,index=0,id=rid,choice=0,owner=user)=>{
  const result=await db.query('select public.answer_written_prep($1,$2,$3,$4,$5,$6,$7) as answer',[owner,session,'ppl',`q${index}`,index,id,choice]);return result.rows[0].answer;
 };
 const stat=async()=> (await db.query(`select sum(total_count)::integer as total,sum(correct_count)::integer as correct from public.written_prep_stats`)).rows[0];
 await makeSession(sid);
 await db.exec('set role service_role');
 assert.equal((await answer(sid,0,rid,0,other)).status,404);
 const first=await answer();assert.equal(first.session.current_index,1);assert.equal(first.session.score,1);
 const retry=await answer();assert.deepEqual(retry,first);assert.deepEqual(await stat(),{total:1,correct:1});
 assert.equal((await answer(sid,0,rid2)).code,'stale_question');assert.equal((await answer(sid,1,rid)).code,'submission_conflict');
 const last=await answer(sid,1,rid2,1);assert.ok(last.session.completed_at);assert.equal(last.session.score,1);
 assert.deepEqual(await answer(sid,1,rid2,1),last);assert.deepEqual(await stat(),{total:2,correct:1});
 const old=await answer();assert.equal(old.session.current_index,1);assert.equal(old.session.score,1);
 assert.equal((await answer(sid,1,'00000000-0000-4000-8000-000000000022')).code,'session_complete');
 console.log('PASS PostgreSQL: ownership, question binding, original retry, stale tab, final retry, exact stats');
 await db.exec('reset role');
 const second='00000000-0000-4000-8000-000000000011';await makeSession(second,1);
 await db.exec(`create function public.reject_test_session_update() returns trigger language plpgsql as $$begin raise exception 'fixture write failure'; end$$;
 create trigger test_rollback before update on public.written_prep_sessions for each row execute function public.reject_test_session_update(); set role service_role;`);
 await assert.rejects(answer(second));assert.deepEqual(await stat(),{total:2,correct:1});
 assert.equal((await db.query('select current_index from public.written_prep_sessions where id=$1',[second])).rows[0].current_index,0);
 console.log('PASS PostgreSQL: failure rolls back both answer statistics and session advancement');
 await db.exec('reset role; drop trigger test_rollback on public.written_prep_sessions; set role service_role;');
 await answer(second);assert.deepEqual(await stat(),{total:3,correct:2});
 console.log('PASS PostgreSQL: shared-question statistics increment across sessions');
 for(const role of ['anon','authenticated']){
  await db.exec(`reset role; set role ${role}`);await assert.rejects(answer());
 }
 console.log('PASS PostgreSQL: anonymous and authenticated clients cannot execute grading RPC');
}finally{await db.close()}
