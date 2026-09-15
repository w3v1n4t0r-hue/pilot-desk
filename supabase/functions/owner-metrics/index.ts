import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(!["GET","POST"].includes(req.method))return json(405,{error:"Method not allowed"});
 const base=(Deno.env.get("SUPABASE_URL")||"").replace(/\/+$/,'');const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,'').trim();if(!base||!anon||!service)return json(503,{error:"Owner metrics are not configured."});if(!token)return json(401,{error:"Sign in required."});
 try{
  const userRes=await fetch(`${base}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});if(!userRes.ok)return json(401,{error:"Session expired. Sign in again."});const user=await userRes.json();if(!user?.id)return json(401,{error:"Invalid account."});
  const adminHeaders={apikey:service,Authorization:`Bearer ${service}`};
  const isAdmin=async()=>{const r=await fetch(`${base}/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers:adminHeaders});if(!r.ok)throw new Error(`admin check ${r.status}`);const rows=await r.json();return Array.isArray(rows)&&rows.length>0};
  let admin=await isAdmin();
  if(!admin&&req.method==="POST"){
   const body=await req.json().catch(()=>({}));const claimToken=String(body?.claimToken||'').trim();if(!claimToken)return json(403,{error:"Owner access required."});
   const claimRes=await fetch(`${base}/rest/v1/admin_claim_config?select=claim_token,claimed_by&singleton=eq.true&limit=1`,{headers:adminHeaders});if(!claimRes.ok)throw new Error(`claim read ${claimRes.status}`);const rows=await claimRes.json();const claim=Array.isArray(rows)?rows[0]:null;if(!claim||claim.claimed_by||String(claim.claim_token)!==claimToken)return json(403,{error:"Owner key not accepted."});
   const insertRes=await fetch(`${base}/rest/v1/admin_users`,{method:"POST",headers:{...adminHeaders,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:user.id})});if(!insertRes.ok)throw new Error(`admin insert ${insertRes.status}`);
   const patchRes=await fetch(`${base}/rest/v1/admin_claim_config?singleton=eq.true&claimed_by=is.null`,{method:"PATCH",headers:{...adminHeaders,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify({claimed_by:user.id,claimed_at:new Date().toISOString(),claim_token:crypto.randomUUID()})});if(!patchRes.ok)throw new Error(`claim update ${patchRes.status}`);admin=true;
  }
  if(!admin)return json(403,{error:"Owner access required."});
  const exactCount=(r:Response)=>{const m=String(r.headers.get("content-range")||"").match(/\/(\d+)$/);return m?Number(m[1]):0};
  const count=async(path:string)=>{const r=await fetch(`${base}/rest/v1/${path}`,{method:"HEAD",headers:{...adminHeaders,Prefer:"count=exact"}});if(!r.ok)throw new Error(`count ${r.status} ${path}`);return exactCount(r)};
  const now=new Date(),startToday=new Date(now);startToday.setUTCHours(0,0,0,0);const d7=new Date(now.getTime()-7*86400000),d30=new Date(now.getTime()-30*86400000);const iso=(d:Date)=>encodeURIComponent(d.toISOString());const day=now.toISOString().slice(0,10);
  const [total,today,last7Days,last30Days,dailyToday,daily7,dailyTotal,perfectToday,writtenPrepSessionsToday,writtenPrepSessions7,writtenPrepSessionsTotal]=await Promise.all([
   count('profiles?select=id'),count(`profiles?select=id&created_at=gte.${iso(startToday)}`),count(`profiles?select=id&created_at=gte.${iso(d7)}`),count(`profiles?select=id&created_at=gte.${iso(d30)}`),
   count(`daily_progress?select=id&challenge_type=eq.pilot_daily&challenge_date=eq.${day}`),count(`daily_progress?select=id&challenge_type=eq.pilot_daily&completed_at=gte.${iso(d7)}`),count('daily_progress?select=id&challenge_type=eq.pilot_daily'),count(`daily_progress?select=id&challenge_type=eq.pilot_daily&challenge_date=eq.${day}&perfect=eq.true`),
   count(`written_prep_sessions?select=id&completed_at=gte.${iso(startToday)}`),count(`written_prep_sessions?select=id&completed_at=gte.${iso(d7)}`),count('written_prep_sessions?select=id&completed_at=not.is.null')
  ]);
  const activeRes=await fetch(`${base}/rest/v1/daily_progress?select=user_id&challenge_type=eq.pilot_daily&completed_at=gte.${iso(d7)}&limit=10000`,{headers:adminHeaders});let dailyActive7=0;if(activeRes.ok){const rows=await activeRes.json();dailyActive7=new Set((Array.isArray(rows)?rows:[]).map((x:any)=>x.user_id)).size}
  const prepActiveRes=await fetch(`${base}/rest/v1/written_prep_sessions?select=user_id&created_at=gte.${iso(d7)}&limit=10000`,{headers:adminHeaders});let writtenPrepActive7=0;if(prepActiveRes.ok){const rows=await prepActiveRes.json();writtenPrepActive7=new Set((Array.isArray(rows)?rows:[]).map((x:any)=>x.user_id)).size}
  const prepAnswersRes=await fetch(`${base}/rest/v1/written_prep_stats?select=total_count&limit=10000`,{headers:adminHeaders});let writtenPrepAnswersTotal=0;if(prepAnswersRes.ok){const rows=await prepAnswersRes.json();writtenPrepAnswersTotal=(Array.isArray(rows)?rows:[]).reduce((sum:number,x:any)=>sum+Number(x.total_count||0),0)}
  const latestRes=await fetch(`${base}/rest/v1/profiles?select=created_at&order=created_at.desc&limit=1`,{headers:adminHeaders});const latestRows=latestRes.ok?await latestRes.json():[];const lastAccountAt=Array.isArray(latestRows)&&latestRows[0]?.created_at?latestRows[0].created_at:null;
  return json(200,{total,today,last7Days,last30Days,dailyToday,daily7,dailyTotal,dailyActive7,perfectToday,writtenPrepSessionsToday,writtenPrepSessions7,writtenPrepSessionsTotal,writtenPrepActive7,writtenPrepAnswersTotal,lastAccountAt,generatedAt:now.toISOString()});
 }catch(error){console.error('owner-metrics',error);return json(500,{error:"Unable to load account metrics."})}
});