const cleanBase=v=>String(v||'').trim().replace(/\/+$/,'');
const bearer=req=>String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
const publicKey=()=>String(process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'').trim();

module.exports=async function handler(req,res){
  if(req.method!=='DELETE'){res.setHeader('Allow','DELETE');return res.status(405).end()}
  res.setHeader('Cache-Control','private, no-store');
  const base=cleanBase(process.env.SUPABASE_URL),anon=publicKey(),service=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim(),token=bearer(req);
  if(!base||!anon||!service)return res.status(503).json({error:'Account deletion is not configured.'});
  if(!token)return res.status(401).json({error:'Sign in required.'});
  try{
    const userRes=await fetch(`${base}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}});
    if(!userRes.ok)return res.status(401).json({error:'Session expired. Sign in again.'});
    const user=await userRes.json();
    if(!user.id)return res.status(401).json({error:'Invalid account.'});
    const del=await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,{method:'DELETE',headers:{apikey:service,Authorization:`Bearer ${service}`}});
    if(!del.ok){const t=(await del.text()).slice(0,500);throw new Error(`Delete failed (${del.status}): ${t}`)}
    return res.status(204).end();
  }catch(e){
    console.error('[PilotDesk account delete]',e);
    return res.status(500).json({error:'Unable to delete the account right now.'});
  }
};
