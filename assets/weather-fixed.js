(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numberOrNull=v=>{const n=Number(v);return Number.isFinite(n)?n:null};

  async function lookup(form,out,id){
    const btn=form.querySelector('button[type=submit]');
    if(btn){btn.disabled=true;btn.textContent='Loading…'}
    out.innerHTML='<p>Loading current aviation weather…</p>';
    try{
      const r=await fetch('/api/weather?station='+encodeURIComponent(id),{headers:{Accept:'application/json'}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Weather lookup failed');
      const met=d.metar,taf=d.taf,ap=d.airport;
      if(!met&&!taf&&!ap){
        out.innerHTML='<div class="pd-card"><h3>No current data found</h3><p>Check the station identifier and try again.</p></div>';
        return;
      }

      const wd=met?.wdir;
      const windDir=(wd==='VRB'||wd==null)?'VRB':String(wd).padStart(3,'0')+'°';
      const wind=met?`${windDir} at ${met.wspd??0} kt${met.wgst?`, gust ${met.wgst} kt`:''}`:'—';
      const altHpa=numberOrNull(met?.altim);
      const alt=altHpa==null?'—':(altHpa*0.0295299830714).toFixed(2)+' inHg';
      const elev=ap?.elev??met?.elev??'—';
      const cat=met?.fltCat?` <span class="pd-flightcat">${esc(met.fltCat)}</span>`:'';
      const q=new URLSearchParams();
      const wdirNum=numberOrNull(met?.wdir),wspdNum=numberOrNull(met?.wspd);
      if(wdirNum!=null)q.set('windDir',String(wdirNum));
      if(wspdNum!=null)q.set('windSpeed',String(wspdNum));
      const oat=numberOrNull(met?.temp);
      if(oat!=null)q.set('oat',String(oat));

      const partial=d.errors?.length?`<div class="notice">Some supplemental airport data could not be loaded, but the available weather is shown below.</div>`:'';
      out.innerHTML=`<div class="pd-card"><h3>${esc(id)}${cat}</h3><p>${esc(ap?.name||met?.name||'Current station weather')}</p><div class="pd-kv"><div><small>Wind</small><b>${esc(wind)}</b></div><div><small>Visibility</small><b>${esc(met?.visib??'—')} SM</b></div><div><small>Altimeter</small><b>${esc(alt)}</b></div><div><small>Temperature</small><b>${esc(met?.temp??'—')} °C</b></div><div><small>Dew point</small><b>${esc(met?.dewp??'—')} °C</b></div><div><small>Field elevation</small><b>${esc(elev)} ft</b></div></div></div>${partial}<div class="pd-panel"><h2>METAR</h2>${met?.rawOb?`<div class="pd-raw">${esc(met.rawOb)}</div>`:'<p>No current METAR returned.</p>'}</div><div class="pd-panel"><h2>TAF</h2>${taf?.rawTAF?`<div class="pd-raw">${esc(taf.rawTAF)}</div>`:'<p>No current TAF returned for this station.</p>'}</div><div class="pd-actions"><a class="pd-btn secondary" href="/calculators/crosswind/?${q}">Crosswind calculator</a><a class="pd-btn secondary" href="/calculators/density-altitude/?${q}">Density altitude</a></div>`;
    }catch(e){
      console.error(e);
      out.innerHTML=`<div class="pd-card"><h3>Weather lookup failed</h3><p>${esc(e.message||'Try again in a moment.')}</p></div>`;
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Get weather'}
    }
  }

  function handleSubmit(e){
    const form=e.target;
    if(!(form instanceof HTMLFormElement)||form.id!=='weatherForm')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const out=document.getElementById('weatherOutput');
    if(!out)return;
    const id=String(form.elements.station?.value||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);
    if(!/^[A-Z0-9]{3,4}$/.test(id)){
      out.innerHTML='<div class="pd-card"><p>Enter a valid 3- or 4-character station identifier.</p></div>';
      return;
    }
    localStorage.setItem('pd-last-airport',id);
    lookup(form,out,id);
  }

  document.addEventListener('submit',handleSubmit,true);
  const init=()=>{
    const form=document.getElementById('weatherForm');
    if(!form)return;
    const last=localStorage.getItem('pd-last-airport');
    if(last&&!form.elements.station.value)form.elements.station.value=last;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
