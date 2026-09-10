module.exports=async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).end()}
  let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}b=b||{};
  const clean={kind:String(b.kind||'error').slice(0,40),message:String(b.message||'Unknown error').slice(0,500),stack:String(b.stack||'').slice(0,1500),path:String(b.path||'/').slice(0,300)};
  console.error('[PilotDesk client error]',clean);
  res.setHeader('Cache-Control','no-store');return res.status(204).end();
};
