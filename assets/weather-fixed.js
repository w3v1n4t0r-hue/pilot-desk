(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numberOrNull=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const runwayHeading=id=>{
    const m=String(id||'').toUpperCase().match(/(?:^|\D)(\d{1,2})(?:[LCR])?(?:$|\D)/);
    if(!m)return null;
    const n=Number(m[1]);
    if(n<1||n>36)return null;
    return n===36?360:n*10;
  };

  function extractRunways(ap){
    if(!ap||typeof ap!=='object')return [];
    const found=[];
    const add=(raw,length)=>{
      const id=String(raw||'').toUpperCase().trim();
      if(!id)return;
      id.split(/[\/-]/).forEach(piece=>{
        const part=piece.trim();
        const heading=runwayHeading(part);
        if(heading!=null&&!found.some(x=>x.id===part))found.push({id:part,heading,length:numberOrNull(length)});
      });
    };
    const visit=(obj,depth=0)=>{
      if(!obj||typeof obj!=='object'||depth>4)return;
      if(Array.isArray(obj)){obj.forEach(x=>visit(x,depth+1));return;}
      for(const [k,v] of Object.entries(obj)){
        const key=k.toLowerCase();
        if(v&&typeof v==='object')visit(v,depth+1);
        if(typeof v==='string'&&(key.includes('rwy')||key.includes('runway')||key.includes('ident'))&&/\d{1,2}[LCR]?/i.test(v)){
          add(v,obj.length??obj.len??obj.rwyLen??obj.runwayLength);
        }
      }
    };
    visit(ap);
    return found.slice(0,12).sort((a,b)=>a.heading-b.heading);
  }

  function componentRow(r,wd,ws,wg){
    const rel=(wd-r.heading)*Math.PI/180;
    const cross=Math.abs(ws*Math.sin(rel));
    const along=ws*Math.cos(rel);
    const gustCross=wg!=null?Math.abs(wg*Math.sin(rel)):null;
    const gustAlong=wg!=null?wg*Math.cos(rel):null;
    const length=r.length?`${Math.round(r.length).toLocaleString()} ft · `:'';
    const gust=gustCross==null?'':`<p>Gust component: ${Math.abs(gustAlong).toFixed(0)} kt ${gustAlong>=0?'headwind':'tailwind'} · ${gustCross.toFixed(0)} kt crosswind</p>`;
    return `<div class="pd-card"><div class="pd-card-head"><div><h3>Runway ${esc(r.id)}</h3><p>${esc(length)}approx. heading ${String(Math.round(r.heading)).padStart(3,'0')}°</p></div></div><div class="pd-kv"><div><small>Along runway</small><b>${Math.abs(along).toFixed(0)} kt ${along>=0?'headwind':'tailwind'}</b></div><div><small>Crosswind</small><b>${cross.toFixed(0)} kt</b></div></div>${gust}</div>`;
  }

  function airportDetails(ap,met){
    if(!ap)return '';
    const lat=numberOrNull(ap.lat??ap.latitude);
    const lon=numberOrNull(ap.lon??ap.longitude);
    const type=ap.type??ap.siteType??ap.facilityType;
    const region=ap.state??ap.region??ap.country;
    const bits=[];
    if(type)bits.push(`<div><small>Facility</small><b>${esc(type)}</b></div>`);
    if(region)bits.push(`<div><small>Region</small><b>${esc(region)}</b></div>`);
    if(lat!=null&&lon!=null)bits.push(`<div><small>Coordinates</small><b>${lat.toFixed(4)}, ${lon.toFixed(4)}</b></div>`);
    return bits.length?`<div class="pd-kv">${bits.join('')}</div>`:'';
  }

  async function lookup(form,out,id){
    const btn=form.querySelector('button[type=submit]');
    if(btn){btn.disabled=true;btn.textContent='Loading…';}
    out.innerHTML='<p>Loading current aviation weather…</p>';
    try{
      const response=await fetch('/api/weather?station='+encodeURIComponent(id),{headers:{Accept:'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||'Weather lookup failed');
      const met=data.metar,taf=data.taf,ap=data.airport;
      if(!met&&!taf&&!ap){out.innerHTML='<div class="pd-card"><h3>No current data found</h3><p>Check the station identifier and try again.</p></div>';return;}

      const wd=met?.wdir;
      const windDir=(wd==='VRB'||wd==null)?'VRB':String(wd).padStart(3,'0')+'°';
      const wind=met?`${windDir} at ${met.wspd??0} kt${met.wgst?`, gust ${met.wgst} kt`:''}`:'—';
      const altHpa=numberOrNull(met?.altim);
      const alt=altHpa==null?'—':(altHpa*0.0295299830714).toFixed(2)+' inHg';
      const elev=ap?.elev??met?.elev??'—';
      const cat=met?.fltCat?` <span class="pd-flightcat">${esc(met.fltCat)}</span>`:'';
      const wdirNum=numberOrNull(met?.wdir),wspdNum=numberOrNull(met?.wspd),wgstNum=numberOrNull(met?.wgst),oat=numberOrNull(met?.temp);
      const q=new URLSearchParams();
      if(wdirNum!=null)q.set('windDir',String(wdirNum));
      if(wspdNum!=null)q.set('windSpeed',String(wspdNum));
      if(oat!=null)q.set('oat',String(oat));

      const runways=extractRunways(ap);
      let runwayHtml='';
      if(wdirNum!=null&&wspdNum!=null&&runways.length){
        runwayHtml=`<div class="pd-panel"><h2>Runway wind components</h2><p>Calculated from the current reported wind. Runway headings are approximate; verify published runway data.</p><div class="pd-list">${runways.map(x=>componentRow(x,wdirNum,wspdNum,wgstNum)).join('')}</div></div>`;
      }else if(met){
        runwayHtml='<div class="pd-panel"><h2>Runway wind components</h2><p>Automatic runway data was not available for this station. Use the prefilled Crosswind calculator below and enter the current runway heading.</p></div>';
      }
      const partial=data.errors?.length?'<div class="notice">Some supplemental airport data could not be loaded, but the available weather is shown below.</div>':'';
      const shareUrl=`${location.origin}/weather.html?station=${encodeURIComponent(id)}`;
      out.innerHTML=`<div class="pd-card"><h3>${esc(id)}${cat}</h3><p>${esc(ap?.name||met?.name||'Current station weather')}</p><div class="pd-kv"><div><small>Wind</small><b>${esc(wind)}</b></div><div><small>Visibility</small><b>${esc(met?.visib??'—')} SM</b></div><div><small>Altimeter</small><b>${esc(alt)}</b></div><div><small>Temperature</small><b>${esc(met?.temp??'—')} °C</b></div><div><small>Dew point</small><b>${esc(met?.dewp??'—')} °C</b></div><div><small>Field elevation</small><b>${esc(elev)} ft</b></div></div>${airportDetails(ap,met)}</div>${partial}${runwayHtml}<div class="pd-panel"><h2>METAR</h2>${met?.rawOb?`<div class="pd-raw">${esc(met.rawOb)}</div>`:'<p>No current METAR returned.</p>'}</div><div class="pd-panel"><h2>TAF</h2>${taf?.rawTAF?`<div class="pd-raw">${esc(taf.rawTAF)}</div>`:'<p>No current TAF returned for this station.</p>'}</div><div class="pd-actions"><a class="pd-btn secondary" href="/calculators/crosswind/?${q}">Crosswind calculator</a><a class="pd-btn secondary" href="/calculators/density-altitude/?${q}">Density altitude</a><button class="pd-btn secondary" type="button" data-weather-share="${esc(shareUrl)}">Copy airport link</button></div>`;
      const share=out.querySelector('[data-weather-share]');
      share?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(share.dataset.weatherShare);window.toast?.('Airport link copied');}catch{window.toast?.('Copy failed');}});
      history.replaceState(null,'',`/weather.html?station=${encodeURIComponent(id)}`);
      if(window.va)try{window.va('event',{name:'Weather Lookup',data:{station:id}})}catch{}
    }catch(e){
      console.error(e);
      out.innerHTML=`<div class="pd-card"><h3>Weather lookup failed</h3><p>${esc(e.message||'Try again in a moment.')}</p></div>`;
    }finally{if(btn){btn.disabled=false;btn.textContent='Get weather';}}
  }

  function handleSubmit(e){
    const form=e.target;
    if(!(form instanceof HTMLFormElement)||form.id!=='weatherForm')return;
    e.preventDefault();e.stopImmediatePropagation();
    const out=document.getElementById('weatherOutput');if(!out)return;
    const id=String(form.elements.station?.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
    if(!/^[A-Z0-9]{3,4}$/.test(id)){out.innerHTML='<div class="pd-card"><p>Enter a valid 3- or 4-character station identifier.</p></div>';return;}
    localStorage.setItem('pd-last-airport',id);lookup(form,out,id);
  }
  document.addEventListener('submit',handleSubmit,true);
  const init=()=>{
    const form=document.getElementById('weatherForm'),out=document.getElementById('weatherOutput');if(!form||!out)return;
    const fromUrl=new URLSearchParams(location.search).get('station');
    const id=String(fromUrl||localStorage.getItem('pd-last-airport')||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
    if(id){form.elements.station.value=id;if(fromUrl&&/^[A-Z0-9]{3,4}$/.test(id))lookup(form,out,id);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
