import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {banks,trackMeta,publicSources,type Track,type PrepQuestion} from './bank.ts';

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
const validTrack=(v:unknown):Track=>['ppl','ira','cpl','cfi','cfii','atp'].includes(String(v))?String(v) as Track:'ppl';
const validMode=(v:unknown)=>['learn','random','missed','marked','exam'].includes(String(v))?String(v):'learn';
const nowIso=()=>new Date().toISOString();
const enc=(v:string)=>encodeURIComponent(v);

function shuffle<T>(input:T[]):T[]{const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function prepareQuestion(q:PrepQuestion){
 const indexed=q.options.map((text,index)=>({text,index}));const mixed=shuffle(indexed);
 return {...q,options:mixed.map(x=>x.text),correct:mixed.findIndex(x=>x.index===q.correct)};
}
function publicQuestion(q:any,index:number,total:number,bookmarked=false){return {id:q.id,area:q.area,prompt:q.prompt,options:q.options,source:q.source,index,total,bookmarked}}
function nextDue(streak:number,correct:boolean){const d=new Date();if(!correct){d.setMinutes(d.getMinutes()+10);return d.toISOString()}const days=streak<=1?1:streak===2?3:streak===3?7:streak===4?14:30;d.setDate(d.getDate()+days);return d.toISOString()}
function mastery(correct:number,total:number,streak:number){if(!total)return 0;return Math.min(100,Math.round(((correct/total)*72+Math.min(streak,5)*5.6)*100)/100)}

async function authUser(base:string,anon:string,req:Request){
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!token)return null;
 const r=await fetch(`${base}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});if(!r.ok)return null;const u=await r.json();return u?.id?u:null;
}
async function rest(base:string,headers:Record<string,string>,path:string,init:RequestInit={}){return fetch(`${base}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}})}
async function getStats(base:string,h:Record<string,string>,userId:string,track:Track){const r=await rest(base,h,`written_prep_stats?select=*&user_id=eq.${enc(userId)}&track=eq.${track}`);return r.ok?await r.json():[]}
async function getBookmarks(base:string,h:Record<string,string>,userId:string,track:Track){const r=await rest(base,h,`written_prep_bookmarks?select=question_id&user_id=eq.${enc(userId)}&track=eq.${track}`);return r.ok?(await r.json()).map((x:any)=>x.question_id):[]}
async function recentSessions(base:string,h:Record<string,string>,userId:string,track:Track){const r=await rest(base,h,`written_prep_sessions?select=id,mode,score,answered,total,completed_at,created_at&user_id=eq.${enc(userId)}&track=eq.${track}&completed_at=not.is.null&order=completed_at.desc&limit=8`);return r.ok?await r.json():[]}
async function activeSession(base:string,h:Record<string,string>,userId:string,track:Track){const r=await rest(base,h,`written_prep_sessions?select=*&user_id=eq.${enc(userId)}&track=eq.${track}&completed_at=is.null&order=created_at.desc&limit=1`);if(!r.ok)return null;const rows=await r.json();return rows?.[0]||null}

function buildDashboard(track:Track,stats:any[],bookmarks:string[],sessions:any[]){
 const bank=banks[track],attempted=stats.length,totalAnswers=stats.reduce((s:number,x:any)=>s+Number(x.total_count||0),0),correct=stats.reduce((s:number,x:any)=>s+Number(x.correct_count||0),0),accuracy=totalAnswers?Math.round(correct/totalAnswers*100):0,coverage=Math.round(attempted/bank.length*100),due=stats.filter((x:any)=>new Date(x.due_at)<=new Date()).length,missed=stats.filter((x:any)=>x.last_result===false).length;
 const readiness=Math.round(accuracy*.65+coverage*.35);
 const areas=new Map<string,{area:string;correct:number;total:number;mastery:number;n:number}>();
 stats.forEach((x:any)=>{const v=areas.get(x.skill_area)||{area:x.skill_area,correct:0,total:0,mastery:0,n:0};v.correct+=Number(x.correct_count||0);v.total+=Number(x.total_count||0);v.mastery+=Number(x.mastery||0);v.n++;areas.set(x.skill_area,v)});
 const skillAreas=[...areas.values()].map(v=>({area:v.area,correct:v.correct,total:v.total,percent:v.total?Math.round(v.correct/v.total*100):0,mastery:Math.round(v.mastery/Math.max(1,v.n))})).sort((a,b)=>a.mastery-b.mastery||a.area.localeCompare(b.area));
 return {track,meta:trackMeta[track],bankSize:bank.length,attempted,totalAnswers,accuracy,coverage,readiness,due,missed,bookmarked:bookmarks.length,completedSessions:sessions.length,skillAreas,recentSessions:sessions,sources:publicSources,contentReviewed:'2026-09'};
}

async function dashboard(base:string,h:Record<string,string>,userId:string,track:Track){const [stats,bookmarks,sessions,active]=await Promise.all([getStats(base,h,userId,track),getBookmarks(base,h,userId,track),recentSessions(base,h,userId,track),activeSession(base,h,userId,track)]);const d:any=buildDashboard(track,stats,bookmarks,sessions);if(active){const payload=Array.isArray(active.question_payload)?active.question_payload:[];const q=payload[active.current_index];if(q)d.activeSession={id:active.id,mode:active.mode,index:active.current_index,total:active.total,score:active.score,answered:active.answered,question:publicQuestion(q,active.current_index,active.total,bookmarks.includes(q.id))}}return d}

function selectQuestions(track:Track,mode:string,stats:any[],bookmarks:string[]){
 const bank=banks[track];const statsMap=new Map(stats.map((x:any)=>[x.question_id,x]));let pool=[...bank];
 if(mode==='missed')pool=bank.filter(q=>statsMap.get(q.id)?.last_result===false);
 if(mode==='marked')pool=bank.filter(q=>bookmarks.includes(q.id));
 if(mode==='learn')pool.sort((a,b)=>{const A:any=statsMap.get(a.id),B:any=statsMap.get(b.id);const ad=A?new Date(A.due_at).getTime():0,bd=B?new Date(B.due_at).getTime():0;const aDue=!A||ad<=Date.now(),bDue=!B||bd<=Date.now();if(aDue!==bDue)return aDue?-1:1;if(!A!==!B)return !A?-1:1;return Number(A?.mastery||0)-Number(B?.mastery||0)});
 else pool=shuffle(pool);
 const limit=mode==='learn'?15:mode==='exam'?Math.min(25,pool.length):Math.min(20,pool.length);
 return pool.slice(0,limit).map(prepareQuestion);
}

function sessionSummary(s:any,payload:any[]){
 const answered=payload.filter(x=>typeof x.result==='boolean');const areas=new Map<string,{area:string;correct:number;total:number}>();answered.forEach(x=>{const v=areas.get(x.area)||{area:x.area,correct:0,total:0};v.total++;if(x.result)v.correct++;areas.set(x.area,v)});const areaResults=[...areas.values()].map(v=>({...v,percent:Math.round(v.correct/v.total*100)})).sort((a,b)=>a.percent-b.percent);return {id:s.id,mode:s.mode,score:Number(s.score||0),total:Number(s.total||payload.length),percent:s.total?Math.round(Number(s.score||0)/Number(s.total)*100):0,areaResults,weakestArea:areaResults[0]?.area||null,review:answered.filter(x=>!x.result).map(x=>({id:x.id,area:x.area,prompt:x.prompt,selected:x.selected,correctIndex:x.correct,correctAnswer:x.options[x.correct],explanation:x.explanation,reference:x.reference,source:x.source,sourceUrl:x.sourceUrl||null}))}}

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});if(!['GET','POST'].includes(req.method))return json(405,{error:'Method not allowed'});
 const base=(Deno.env.get('SUPABASE_URL')||'').replace(/\/+$/,'');const anon=Deno.env.get('SUPABASE_ANON_KEY')||'';const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!base||!anon||!service)return json(503,{error:'Written Prep is not configured.'});
 const user=await authUser(base,anon,req);if(!user)return json(401,{error:'A free PilotDesk account is required to use Written Prep.',code:'account_required'});
 const h={apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'};
 if(req.method==='GET'){const u=new URL(req.url),track=validTrack(u.searchParams.get('track'));return json(200,await dashboard(base,h,user.id,track))}
 let body:any;try{body=await req.json()}catch{return json(400,{error:'Invalid JSON'})}const action=String(body?.action||'');const track=validTrack(body?.track);
 try{
  if(action==='start'){
   const mode=validMode(body?.mode);const [stats,bookmarks]=await Promise.all([getStats(base,h,user.id,track),getBookmarks(base,h,user.id,track)]);const questions=selectQuestions(track,mode,stats,bookmarks);if(!questions.length)return json(409,{error:mode==='missed'?'You have no missed questions in this track yet.':mode==='marked'?'You have no marked questions in this track yet.':'No questions are available for this mode.'});
   const ins=await rest(base,h,'written_prep_sessions?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({user_id:user.id,track,mode,question_payload:questions,current_index:0,score:0,answered:0,total:questions.length})});if(!ins.ok)return json(500,{error:'Unable to start a study session.'});const rows=await ins.json(),s=rows[0];
   return json(200,{session:{id:s.id,track,mode,index:0,total:s.total,simulatedMinutes:mode==='exam'?Math.max(15,Math.round(trackMeta[track].officialMinutes*s.total/trackMeta[track].officialQuestions)):null,officialTest:trackMeta[track],question:publicQuestion(questions[0],0,questions.length,bookmarks.includes(questions[0].id))}})
  }
  if(action==='answer'){
   const sessionId=String(body?.sessionId||''),choice=Number(body?.choice);if(!sessionId||!Number.isInteger(choice))return json(400,{error:'Choose an answer first.'});const sr=await rest(base,h,`written_prep_sessions?select=*&id=eq.${enc(sessionId)}&user_id=eq.${enc(user.id)}&limit=1`);if(!sr.ok)return json(500,{error:'Unable to load session.'});const rows=await sr.json(),s=rows[0];if(!s)return json(404,{error:'Study session not found.'});if(s.completed_at)return json(409,{error:'This study session is already complete.'});
   const payload=Array.isArray(s.question_payload)?s.question_payload:[],idx=Number(s.current_index||0),q:any=payload[idx];if(!q)return json(409,{error:'No unanswered question remains.'});if(choice<0||choice>=q.options.length)return json(400,{error:'Invalid answer choice.'});const correct=choice===q.correct;q.selected=choice;q.result=correct;q.answeredAt=nowIso();
   const statRes=await rest(base,h,`written_prep_stats?select=*&user_id=eq.${enc(user.id)}&track=eq.${track}&question_id=eq.${enc(q.id)}&limit=1`);const statRows=statRes.ok?await statRes.json():[],old=statRows[0]||null,total=Number(old?.total_count||0)+1,corr=Number(old?.correct_count||0)+(correct?1:0),streak=correct?Number(old?.correct_streak||0)+1:0,m=mastery(corr,total,streak);
   const up=await rest(base,h,'written_prep_stats?on_conflict=user_id,track,question_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:user.id,track,question_id:q.id,skill_area:q.area,correct_count:corr,total_count:total,correct_streak:streak,last_result:correct,mastery:m,due_at:nextDue(streak,correct),last_seen_at:nowIso(),updated_at:nowIso()})});if(!up.ok)return json(500,{error:'Unable to save answer progress.'});
   const nextIdx=idx+1,newScore=Number(s.score||0)+(correct?1:0),done=nextIdx>=payload.length,completedAt=done?nowIso():null;const patch=await rest(base,h,`written_prep_sessions?id=eq.${enc(sessionId)}&user_id=eq.${enc(user.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({question_payload:payload,current_index:nextIdx,score:newScore,answered:nextIdx,completed_at:completedAt,updated_at:nowIso()})});if(!patch.ok)return json(500,{error:'Unable to advance study session.'});const pr=await patch.json(),updated=pr[0]||{...s,score:newScore,answered:nextIdx,total:payload.length};
   const bookmarks=await getBookmarks(base,h,user.id,track);const feedback=s.mode==='exam'&&!done?null:{correct,selected:choice,correctIndex:q.correct,correctAnswer:q.options[q.correct],explanation:q.explanation,reference:q.reference,source:q.source,sourceUrl:q.sourceUrl||null,mastery:m};
   if(done){const d=await dashboard(base,h,user.id,track);return json(200,{done:true,feedback,summary:sessionSummary(updated,payload),dashboard:d})}
   return json(200,{done:false,feedback,nextQuestion:publicQuestion(payload[nextIdx],nextIdx,payload.length,bookmarks.includes(payload[nextIdx].id)),progress:{score:newScore,answered:nextIdx,total:payload.length}})
  }
  if(action==='bookmark'){
   const questionId=String(body?.questionId||''),marked=Boolean(body?.marked);if(!banks[track].some(q=>q.id===questionId))return json(400,{error:'Unknown question.'});if(marked){const r=await rest(base,h,'written_prep_bookmarks?on_conflict=user_id,track,question_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:user.id,track,question_id:questionId})});if(!r.ok)return json(500,{error:'Unable to mark question.'})}else{const r=await rest(base,h,`written_prep_bookmarks?user_id=eq.${enc(user.id)}&track=eq.${track}&question_id=eq.${enc(questionId)}`,{method:'DELETE'});if(!r.ok)return json(500,{error:'Unable to unmark question.'})}return json(200,{ok:true,marked})
  }
  if(action==='discard'){
   const sessionId=String(body?.sessionId||'');if(!sessionId)return json(400,{error:'Session required.'});const r=await rest(base,h,`written_prep_sessions?id=eq.${enc(sessionId)}&user_id=eq.${enc(user.id)}&completed_at=is.null`,{method:'DELETE'});return r.ok?json(200,{ok:true}):json(500,{error:'Unable to discard session.'})
  }
  return json(400,{error:'Unknown action.'});
 }catch(error){console.error('written-prep',error);return json(500,{error:'Written Prep is temporarily unavailable.'})}
});
