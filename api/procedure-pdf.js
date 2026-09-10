'use strict';
const UA='PilotDesk/2.2 (+https://www.pilot-desk.com)';
module.exports=async function handler(req,res){
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.setHeader('Cache-Control','no-store');return res.status(405).send('Method not allowed')}
  const cycle=String(req.query?.cycle||'').trim(),file=String(req.query?.file||'').trim().toUpperCase();
  if(!/^\d{4}$/.test(cycle)||!/^[A-Z0-9_.-]+\.PDF$/.test(file)||file.includes('..')){res.setHeader('Cache-Control','no-store');return res.status(400).send('Invalid procedure reference.')}
  const url=`https://aeronav.faa.gov/d-tpp/${cycle}/${encodeURIComponent(file)}`,c=new AbortController(),timer=setTimeout(()=>c.abort(),15000);
  try{
    const r=await fetch(url,{headers:{Accept:'application/pdf','User-Agent':UA},signal:c.signal});
    if(!r.ok){res.setHeader('Cache-Control','no-store');return res.status(502).send(`FAA procedure PDF returned ${r.status}.`)}
    const type=(r.headers.get('content-type')||'').toLowerCase();if(!type.includes('pdf')){res.setHeader('Cache-Control','no-store');return res.status(502).send('FAA response was not a PDF.')}
    const len=Number(r.headers.get('content-length')||0);if(len>4_000_000){res.setHeader('Cache-Control','no-store');res.setHeader('Location',url);return res.status(302).end()}
    const buf=Buffer.from(await r.arrayBuffer());if(buf.length>4_000_000){res.setHeader('Cache-Control','no-store');res.setHeader('Location',url);return res.status(302).end()}
    res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="${file}"`);res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');res.setHeader('X-Content-Type-Options','nosniff');return res.status(200).send(buf)
  }catch(e){res.setHeader('Cache-Control','no-store');return res.status(502).send(e?.name==='AbortError'?'FAA procedure PDF request timed out.':'FAA procedure PDF request failed.')}
  finally{clearTimeout(timer)}
};
