const AWC_BASE='https://aviationweather.gov/api/data/';

async function getJson(product,station){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch(`${AWC_BASE}${product}?ids=${encodeURIComponent(station)}&format=json`,{
      headers:{Accept:'application/json','User-Agent':'PilotDesk/1.0 (+https://www.pilot-desk.com)'},
      signal:controller.signal
    });
    if(response.status===204)return {ok:true,data:null};
    if(!response.ok){
      const text=await response.text().catch(()=>'');
      return {ok:false,error:text.slice(0,240)||`AWC returned ${response.status}`};
    }
    const json=await response.json();
    return {ok:true,data:Array.isArray(json)?(json[0]||null):(json||null)};
  }catch(error){
    return {ok:false,error:error?.name==='AbortError'?'Aviation Weather Center request timed out.':'Aviation Weather Center request failed.'};
  }finally{clearTimeout(timer)}
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }
  const raw=String((req.query&&req.query.station)||'').trim().toUpperCase();
  const station=raw.replace(/[^A-Z0-9]/g,'').slice(0,4);
  if(!/^[A-Z0-9]{3,4}$/.test(station))return res.status(400).json({error:'Enter a valid 3- or 4-character station identifier.'});

  const results=await Promise.all([
    getJson('metar',station),
    getJson('taf',station),
    getJson('airport',station)
  ]);
  const [metarResult,tafResult,airportResult]=results;
  const errors=[];
  if(!metarResult.ok)errors.push({source:'METAR',message:metarResult.error});
  if(!tafResult.ok)errors.push({source:'TAF',message:tafResult.error});
  if(!airportResult.ok)errors.push({source:'Airport',message:airportResult.error});
  if(errors.length===3)return res.status(502).json({error:'Aviation Weather Center is temporarily unavailable.',errors});

  return res.status(200).json({
    station,
    metar:metarResult.ok?metarResult.data:null,
    taf:tafResult.ok?tafResult.data:null,
    airport:airportResult.ok?airportResult.data:null,
    errors,
    source:'Aviation Weather Center'
  });
};
