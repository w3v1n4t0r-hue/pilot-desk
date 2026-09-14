module.exports=async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).end()}
  const url=String(process.env.SUPABASE_URL||'').trim();
  const anonKey=String(process.env.SUPABASE_ANON_KEY||'').trim();
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(!url||!anonKey)return res.status(503).json({enabled:false});
  return res.status(200).json({enabled:true,supabaseUrl:url,supabaseAnonKey:anonKey});
};
