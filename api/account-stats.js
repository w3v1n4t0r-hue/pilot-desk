const cleanBase=v=>String(v||'').trim().replace(/\/+$/,'');
const bearer=req=>String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
const adminEmails=()=>String(process.env.PILOTDESK_ADMIN_EMAILS||process.env.PILOTDESK_ADMIN_EMAIL||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
const publicKey=()=>String(process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'').trim();

async function authenticatedAdmin(req){
  const base=cleanBase(process.env.SUPABASE_URL),anon=publicKey(),token=bearer(req);
  if(!base||!anon||!token)return null;
  const r=await fetch(`${base}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
  if(!r.ok)return null;
  const user=await r.json();
  const email=String(user.email||'').toLowerCase();
  if(!email||!adminEmails().includes(email))return null;
  return user;
}

function exactCount(response){
  const range=String(response.headers.get('content-range')||'');
  const m=range.match(/\/(\d+)$/);
  return m?Number(m[1]):0;
}

async function countProfiles(base,key,filter=''){
  const url=`${base}/rest/v1/profiles?select=id${filter}`;
  const r=await fetch(url,{method:'HEAD',headers:{apikey:key,Authorization:`Bearer ${key}`,Prefer:'count=exact'}});
  if(!r.ok)throw new Error(`Profile count failed (${r.status})`);
  return exactCount(r);
}

module.exports=async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end()}
  res.setHeader('Cache-Control','private, no-store');
  try{
    const user=await authenticatedAdmin(req);
    if(!user)return res.status(403).json({error:'Forbidden'});
    const base=cleanBase(process.env.SUPABASE_URL),service=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
    if(!base||!service)return res.status(503).json({error:'Account metrics are not configured.'});
    const now=new Date(),startToday=new Date(now);startToday.setUTCHours(0,0,0,0);
    const d7=new Date(now.getTime()-7*86400000),d30=new Date(now.getTime()-30*86400000);
    const filter=d=>`&created_at=gte.${encodeURIComponent(d.toISOString())}`;
    const [total,today,last7Days,last30Days]=await Promise.all([
      countProfiles(base,service),countProfiles(base,service,filter(startToday)),countProfiles(base,service,filter(d7)),countProfiles(base,service,filter(d30))
    ]);
    return res.status(200).json({total,today,last7Days,last30Days,generatedAt:now.toISOString()});
  }catch(e){
    console.error('[PilotDesk account stats]',e);
    return res.status(500).json({error:'Unable to load account metrics.'});
  }
};
