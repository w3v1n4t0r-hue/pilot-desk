'use strict';
const {Readable}=require('node:stream');
const UA='PilotDesk/2.3 (+https://www.pilot-desk.com)';
const FORWARD=['content-type','content-length','content-range','accept-ranges','etag','last-modified'];
const safeRange=v=>typeof v==='string'&&/^bytes=\d*-\d*$/.test(v.trim())?v.trim():null;
module.exports=async function handler(req,res){
  res.setHeader('X-Robots-Tag','noindex');
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.setHeader('Cache-Control','no-store');return res.status(405).send('Method not allowed')}
  const cycle=String(req.query?.cycle||'').trim(),file=String(req.query?.file||'').trim().toUpperCase();
  if(!/^\d{4}$/.test(cycle)||!/^[A-Z0-9_.-]+\.PDF$/.test(file)||file.includes('..')){res.setHeader('Cache-Control','no-store');return res.status(400).send('Invalid procedure reference.')}
  const requestedRange=req.headers.range;if(requestedRange&&!safeRange(requestedRange)){res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');return res.status(416).send('Unsupported byte range.')}
  const url=`https://aeronav.faa.gov/d-tpp/${cycle}/${encodeURIComponent(file)}`,c=new AbortController(),timer=setTimeout(()=>c.abort(),18000),headers={Accept:'application/pdf','User-Agent':UA};
  if(requestedRange)headers.Range=safeRange(requestedRange);
  try{
    const r=await fetch(url,{method:req.method,headers,signal:c.signal,redirect:'follow'});
    if(!(r.ok||r.status===206)){res.setHeader('Cache-Control','no-store');if(r.status===416){res.setHeader('Accept-Ranges','bytes');return res.status(416).end()}return res.status(502).send(`FAA procedure PDF returned ${r.status}.`)}
    const type=(r.headers.get('content-type')||'').toLowerCase();if(type&&!type.includes('pdf')&&req.method!=='HEAD'){res.setHeader('Cache-Control','no-store');return res.status(502).send('FAA response was not a PDF.')}
    for(const h of FORWARD){const v=r.headers.get(h);if(v)res.setHeader(h,v)}
    res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="${file}"`);res.setHeader('Accept-Ranges',r.headers.get('accept-ranges')||'bytes');res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');res.setHeader('X-Content-Type-Options','nosniff');res.statusCode=r.status===206?206:200;
    if(req.method==='HEAD'||!r.body)return res.end();
    if(typeof Readable.fromWeb==='function'){const stream=Readable.fromWeb(r.body);stream.on('error',()=>{if(!res.headersSent)res.statusCode=502;res.end()});stream.pipe(res);return}
    const buf=Buffer.from(await r.arrayBuffer());return res.end(buf)
  }catch(e){if(!res.headersSent){res.setHeader('Cache-Control','no-store');return res.status(502).send(e?.name==='AbortError'?'FAA procedure PDF request timed out.':'FAA procedure PDF request failed.')}res.end()}
  finally{clearTimeout(timer)}
};
