(()=>{
'use strict';

let started=false;
function boot(){
  if(started||!window.L||!window.PilotDeskRoutePlanner)return;
  started=true;
  start(window.PilotDeskRoutePlanner,window.L);
}
document.addEventListener('pilotdesk:map-ready',boot,{once:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();

function start(RP,L){
  const map=RP.getMap();
  const card=document.querySelector('.rp-map-card');
  const toolbar=document.querySelector('.rp-map-toolbar');
  if(!map||!card||!toolbar)return;

  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,d)=>Number.isFinite(Number(n))?Number(n).toFixed(d==null?0:d):'—';
  const B=window.PilotDeskRouteBrief;
  const PRO_LAYERS=new Set(['pirep','gairmet','airsigmet','cwa']);
  const hasFeature=feature=>window.PilotDeskProAccess?.isEnabled(feature)===true;
  const DEFAULTS={radar:false,metar:true,pirep:false,gairmet:false,airsigmet:false,cwa:false,tfr:true,sua:false,airspace:false,notams:true,airports:false,navaids:false,fixes:false,airways:false,obstacles:false,rings:false};
  const MIN_ZOOM={metar:3,pirep:5,gairmet:3,airsigmet:3,cwa:3,tfr:3,sua:5,airspace:6,airports:6,navaids:7,fixes:8,airways:6,obstacles:8};
  const AWC=new Set(['metar','pirep','gairmet','airsigmet','cwa','obstacles']);
  const FAA=new Set(['sua','airspace','airports','navaids','fixes','airways']);
  const WEATHER=new Set(['metar','pirep','gairmet','airsigmet','cwa']);
  const NAV=new Set(['airports','navaids','fixes','airways','obstacles']);
  const AIRSPACE=new Set(['tfr','sua','airspace']);
  const loadSaved=()=>{try{return JSON.parse(localStorage.getItem('pd-efb-layers')||'{}')}catch{return{}}};
  const saved=loadSaved();
  const state={
    enabled:Object.assign({},DEFAULTS,saved.enabled||{}),
    baseMode:saved.baseMode||'auto',
    chartOpacity:Number(saved.chartOpacity||localStorage.getItem('pd-route-chart-opacity')||.92),
    radarOpacity:Number(saved.radarOpacity||.68),
    vectorOpacity:Number(saved.vectorOpacity||.88),
    pirepFilter:['all','icing','turbulence','skyweather'].includes(saved.pirepFilter)?saved.pirepFilter:'all'
  };
  // Printed chart airport symbols and METAR dots replace the duplicate airport overlay.
  state.enabled.airports=false;
  for(const key of PRO_LAYERS)if(!hasFeature('advancedWeather'))state.enabled[key]=false;
  const briefData={},briefStatus={},briefTime={};
  const weatherMarkers=new Map();
  const data={},groups={},lastFetch={},fetchSeq={},dataTime={},dataPending={},dataStatus={},dataBounds={},notams={},briefWx={dep:null,dst:null,alt:null};
  let radarOverlay=null,notamGroup=L.layerGroup(),ringsGroup=L.layerGroup(),radarTimer=null,briefLoading=false;
  let routeContextSeq=0,notamSeq=0,radarSeq=0,radarPending=null,briefRefreshTimer=0,briefContextKey='';

  function save(){
    localStorage.setItem('pd-efb-layers',JSON.stringify({
      enabled:state.enabled,
      baseMode:state.baseMode,
      chartOpacity:state.chartOpacity,
      radarOpacity:state.radarOpacity,
      vectorOpacity:state.vectorOpacity,
      pirepFilter:state.pirepFilter
    }));
  }
  function makePane(name,z,interactive=true){
    if(map.getPane(name))return;
    const p=map.createPane(name);
    p.style.zIndex=String(z);
    if(!interactive)p.style.pointerEvents='none';
  }
  makePane('pdRadarPane',330,false);
  makePane('pdAirspacePane',350);
  makePane('pdWeatherPane',360);
  makePane('pdMetarPane',440);
  makePane('pdNavPane',370);
  makePane('pdNotamPane',450);
  notamGroup.addTo(map);
  ringsGroup.addTo(map);

  const layersButton=document.createElement('button');
  layersButton.type='button';
  layersButton.id='rpLayersToggle';
  layersButton.className='utility-btn rp-layers-toggle';
  layersButton.setAttribute('aria-expanded','false');
  layersButton.textContent='LAYERS';
  toolbar.insertBefore(layersButton,document.getElementById('rpMapStatus'));

  const briefButton=document.createElement('button');
  briefButton.type='button';
  briefButton.id='rpBriefToggle';
  briefButton.className='utility-btn';
  briefButton.setAttribute('aria-expanded','false');
  briefButton.textContent='PRO ROUTE BRIEF';
  toolbar.insertBefore(briefButton,document.getElementById('rpMapStatus'));

  const panel=document.createElement('aside');
  panel.id='rpLayersPanel';
  panel.className='rp-efb-panel rp-layers-panel';
  panel.setAttribute('aria-label','Map layers');
  panel.hidden=true;
  panel.innerHTML=[
    '<div class="rp-efb-head"><div><span class="rp-eyebrow">MAP CONTROL</span><strong>Layers</strong></div><button type="button" data-close-layers aria-label="Close layers">×</button></div>',
    '<section class="rp-layer-section"><h3>MAP SETUP</h3><div class="rp-map-setups"><button type="button" data-map-setup="navigation">Navigation</button><button type="button" data-map-setup="weather">Weather</button><button type="button" data-map-setup="saved">My setup</button><button type="button" data-map-save>Save setup</button><button type="button" data-map-refresh>Refresh layers</button></div><p id="rpSetupStatus" role="status">Save your current layers to reuse them. Weather dots mark individual reporting stations. Nearby navigation symbols are grouped; open a count or zoom in.</p></section>',
    '<section class="rp-layer-section"><h3>BASE MAP</h3>',
      baseRow('auto','TAC fallback by zoom'),
      baseRow('sectional','Sectional'),
      baseRow('terminal','TAC'),
      baseRow('low','IFR Low'),
      baseRow('high','IFR High'),
      '<label class="rp-layer-opacity"><span>Chart opacity</span><input id="rpEfbChartOpacity" type="range" min="25" max="100" step="5" value="'+Math.round(state.chartOpacity*100)+'"><output>'+Math.round(state.chartOpacity*100)+'%</output></label>',
    '</section>',
    '<section class="rp-layer-section"><h3>WEATHER</h3>',
      toggleRow('radar','Radar','NOAA MRMS'),
      toggleRow('metar','METARs','AWC'),
      '<p class="rp-metar-legend"><span style="color:#3bd779">● VFR</span> <span style="color:#58a6ff">● MVFR</span> <span style="color:#ff5555">● IFR</span> <span style="color:#ff79cb">● LIFR</span> <span style="color:#c6cbd0">● Unknown</span></p>',
      toggleRow('pirep','PIREPs','AWC'),
      '<label class="rp-pirep-filter">PIREP conditions<select id="rpPirepFilter"><option value="all">All reports</option><option value="icing">Icing</option><option value="turbulence">Turbulence</option><option value="skyweather">Sky / weather only</option></select></label>',
      '<details class="rp-symbol-legend"><summary>Chart symbols</summary><p>PIREP symbols follow the published aviation intensity legend: blue icing, orange turbulence, gray eye for sky/weather.</p>'+['icing','turbulence'].map(kind=>'<div class="rp-legend-row">'+[0,1,2,3,...(kind==='turbulence'?[4]:[])].map(level=>'<span>'+window.PilotDeskChartSymbols.weatherSvg(kind,level)+['Negative','Light','Moderate','Severe','Extreme'][level]+'</span>').join('')+'</div>').join('')+'<p>Trace icing uses the light symbol. Ranges use the strongest intensity. Red ! marks urgent or severe reports. ? means intensity unspecified. Paired symbols show icing and turbulence; numbers show reported flight level. Open a marker for the full report.</p><p>Airport: blue T = towered · magenta N = non-towered · gray ? = tower status unknown · MIX = mixed group. Tower hours are not checked. VOR: hexagon · VOR/DME: boxed hexagon · VORTAC: hexagon with TACAN marks · DME: square · NDB: dotted circle · Fix: triangle · Obstacle: mast. Purple line: planned route; pale purple: selected leg.</p></details>',
      toggleRow('gairmet','G-AIRMETs','AWC'),
      toggleRow('airsigmet','SIGMETs','AWC'),
      toggleRow('cwa','CWAs','AWC'),
      '<label class="rp-layer-opacity"><span>Weather / hazard opacity</span><input id="rpEfbVectorOpacity" type="range" min="35" max="100" step="5" value="'+Math.round(state.vectorOpacity*100)+'"><output>'+Math.round(state.vectorOpacity*100)+'%</output></label>',
    '</section>',
    '<section class="rp-layer-section"><h3>AIRSPACE</h3>',
      toggleRow('tfr','TFRs','FAA live'),
      toggleRow('sua','SUA','FAA AIS'),
      toggleRow('airspace','Class airspace','FAA AIS'),
    '</section>',
    '<section class="rp-layer-section"><h3>FLIGHT</h3>',
      toggleRow('notams','NOTAMs','FAA API'),
      toggleRow('navaids','VORs / NAVAIDs','FAA AIS'),
      toggleRow('fixes','Fixes','FAA AIS'),
      toggleRow('airways','Airways / Q routes','FAA AIS'),
      toggleRow('obstacles','Obstacles','AWC'),
      toggleRow('rings','Distance rings','Route'),
    '</section>',
    '<p class="rp-layer-foot" id="rpProWeatherAccess">Pro adds PIREPs, SIGMETs, G-AIRMETs and CWAs on the chart. <a href="/pricing.html?from=chart-weather">View Pro · $5/month</a>. METARs, radar and charts stay free.</p>',
    '<p class="rp-layer-foot">Planning display only. Confirm current weather, NOTAMs, TFRs and chart data with an official briefing source.</p>'
  ].join('');
  const mapEl=document.getElementById('rpMap');
  mapEl.appendChild(panel);

  const brief=document.createElement('aside');
  brief.id='rpRouteBrief';
  brief.className='rp-efb-panel rp-brief-panel';
  brief.setAttribute('aria-label','Route brief');
  brief.hidden=true;
  brief.innerHTML='<div class="rp-efb-head"><div><span class="rp-eyebrow">FLIGHT PLANNING</span><strong>Route Brief</strong></div><button type="button" data-close-brief aria-label="Close route brief">×</button></div><div id="rpBriefBody" class="rp-brief-body"><div class="rp-empty-state">Build a route to load route-specific weather, hazards, TFRs and NOTAM context.</div></div>';
  mapEl.appendChild(brief);

  const radarControls=document.createElement('div');
  radarControls.id='rpRadarTimeline';
  radarControls.className='rp-radar-timeline';
  radarControls.hidden=!state.enabled.radar;
  radarControls.innerHTML='<button type="button" id="rpRadarPlay" aria-label="Play radar loop">▶</button><span class="rp-radar-label">RADAR</span><input id="rpRadarTime" type="range" min="0" max="24" step="1" value="24" aria-label="Radar time"><output id="rpRadarTimeLabel">Latest</output><label><span>Opacity</span><input id="rpRadarOpacity" type="range" min="20" max="100" step="5" value="'+Math.round(state.radarOpacity*100)+'"></label>';
  mapEl.appendChild(radarControls);

  const legStrip=document.createElement('div');
  legStrip.id='rpLegStrip';
  legStrip.className='rp-leg-strip';
  legStrip.hidden=true;
  mapEl.appendChild(legStrip);

  [panel,brief,radarControls,legStrip].forEach(el=>{
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  });

  function baseRow(value,label){
    return '<label class="rp-layer-row"><span><input type="radio" name="rpEfbBase" value="'+value+'" '+(state.baseMode===value?'checked':'')+'> '+esc(label)+'</span><small data-layer-status="base-'+value+'"></small></label>';
  }
  function toggleRow(key,label,source){
    return '<label class="rp-layer-row"><span><input type="checkbox" data-layer="'+key+'" '+(state.enabled[key]?'checked':'')+(PRO_LAYERS.has(key)&&!hasFeature('advancedWeather')?' disabled':'')+'> '+esc(label)+'</span><small><span data-layer-status="'+key+'"></span><em>'+(PRO_LAYERS.has(key)?'PRO · ':'')+esc(source)+'</em></small></label>';
  }

  layersButton.addEventListener('click',()=>togglePanel(panel,layersButton));
  briefButton.addEventListener('click',()=>{togglePanel(brief,briefButton);if(!brief.hidden){renderBrief();if(!briefLoading&&RP.getPoints().length>1&&(Date.now()-Math.min(...Object.values(briefTime))>60000||!Object.keys(briefTime).length))void loadRouteContext();}});
  panel.querySelector('[data-close-layers]').addEventListener('click',()=>closePanel(panel,layersButton));
  brief.querySelector('[data-close-brief]').addEventListener('click',()=>closePanel(brief,briefButton));
  function togglePanel(el,button){
    const open=el.hidden;
    panel.hidden=true;brief.hidden=true;
    layersButton.setAttribute('aria-expanded','false');briefButton.setAttribute('aria-expanded','false');
    if(open){el.hidden=false;button.setAttribute('aria-expanded','true');el.querySelector('button')?.focus({preventScroll:true})}
  }
  function closePanel(el,button){el.hidden=true;button.setAttribute('aria-expanded','false');button.focus({preventScroll:true})}

  panel.querySelectorAll('input[name="rpEfbBase"]').forEach(input=>input.addEventListener('change',()=>{
    if(!input.checked)return;
    state.baseMode=input.value;
    save();
    if(state.baseMode==='auto')applyAutoChart();
    else setBase(state.baseMode);
  }));
  panel.querySelectorAll('[data-layer]').forEach(input=>input.addEventListener('change',()=>{
    const key=input.dataset.layer;
    state.enabled[key]=input.checked;
    save();
    toggleLayer(key,input.checked);
  }));

  const setupStatus=panel.querySelector('#rpSetupStatus');
  panel.querySelector('#rpPirepFilter').value=state.pirepFilter;
  panel.querySelector('#rpPirepFilter').addEventListener('change',e=>{
    state.pirepFilter=e.target.value;save();if(data.pirep)renderGeoLayer('pirep',data.pirep);
  });
  panel.addEventListener('click',async e=>{
    if(e.target.closest('[data-map-save]')){
      localStorage.setItem('pd-map-setup',JSON.stringify({enabled:state.enabled,baseMode:state.baseMode,pirepFilter:state.pirepFilter}));
      setupStatus.textContent='Current layers saved as My setup.';return;
    }
    const refresh=e.target.closest('[data-map-refresh]');
    if(refresh){
      refresh.disabled=true;setupStatus.textContent='Refreshing enabled layers…';
      try{const keys=Object.keys(state.enabled).filter(key=>state.enabled[key]&&endpointFor(key));for(const key of keys)delete lastFetch[key];await Promise.all(keys.map(key=>ensureData(key,false)));if(state.enabled.radar)refreshRadar();if(state.enabled.notams)await loadNotams();setupStatus.textContent='Layer refresh finished. Check each layer status for unavailable data.';}
      finally{refresh.disabled=false;}return;
    }
    const button=e.target.closest('[data-map-setup]');if(!button)return;
    const mode=button.dataset.mapSetup;let setup;
    if(mode==='saved'){try{setup=JSON.parse(localStorage.getItem('pd-map-setup')||'null')}catch{}if(!setup?.enabled){setupStatus.textContent='Choose your layers, then save a setup first.';return;}}
    else{setup={enabled:{},pirepFilter:'all',baseMode:state.baseMode};for(const key of Object.keys(DEFAULTS))setup.enabled[key]=mode==='navigation'?['navaids','fixes','airways','tfr','metar'].includes(key):['radar','metar','pirep','gairmet','airsigmet','cwa','tfr'].includes(key);}
    for(const key of Object.keys(DEFAULTS)){const on=key!=='airports'&&setup.enabled[key]===true;state.enabled[key]=on;const input=panel.querySelector('[data-layer="'+key+'"]');if(input)input.checked=on;toggleLayer(key,on);}
    state.pirepFilter=['all','icing','turbulence','skyweather'].includes(setup.pirepFilter)?setup.pirepFilter:'all';panel.querySelector('#rpPirepFilter').value=state.pirepFilter;
    if(['auto','sectional','terminal','low','high'].includes(setup.baseMode)){state.baseMode=setup.baseMode;if(state.baseMode==='auto')applyAutoChart();else setBase(state.baseMode);syncBaseRadios();}
    if(data.pirep&&state.enabled.pirep)renderGeoLayer('pirep',data.pirep);save();setupStatus.textContent=mode==='saved'?'My setup restored.':mode==='navigation'?'Navigation layers and METARs selected. Other weather overlays are hidden.':'Weather layers selected. Navigation overlays are hidden.';
  });
  mapEl.addEventListener('click',e=>{
    const button=e.target.closest('[data-map-add]');if(!button)return;
    const token=button.dataset.mapAdd,box=document.getElementById('rpRoute'),tokens=box.value.trim().split(/\s+/).filter(Boolean);
    if(tokens.length>=300){setupStatus.textContent='Keep a route to 300 points or fewer.';return;}
    if(!/^[A-Z0-9_-]{1,12},-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(token))return;
    RP.setRoute([...tokens,token].join(' '));map.closePopup();
  });
  const chartOpacity=panel.querySelector('#rpEfbChartOpacity');
  chartOpacity.addEventListener('input',()=>{
    state.chartOpacity=Number(chartOpacity.value)/100;
    chartOpacity.nextElementSibling.value=Math.round(state.chartOpacity*100)+'%';
    RP.setChartOpacity(state.chartOpacity);
    save();
  });
  RP.setChartOpacity(state.chartOpacity);

  const vectorOpacity=panel.querySelector('#rpEfbVectorOpacity');
  vectorOpacity.addEventListener('input',()=>{
    state.vectorOpacity=Number(vectorOpacity.value)/100;
    vectorOpacity.nextElementSibling.value=Math.round(state.vectorOpacity*100)+'%';
    refreshVectorStyles();
    save();
  });

  const radarSlider=radarControls.querySelector('#rpRadarTime');
  const radarTimeLabel=radarControls.querySelector('#rpRadarTimeLabel');
  const radarOpacity=radarControls.querySelector('#rpRadarOpacity');
  const radarPlay=radarControls.querySelector('#rpRadarPlay');
  radarSlider.addEventListener('input',()=>{updateRadarLabel();refreshRadar()});
  radarOpacity.addEventListener('input',()=>{
    state.radarOpacity=Number(radarOpacity.value)/100;
    if(radarOverlay)radarOverlay.setOpacity(state.radarOpacity);
    save();
  });
  radarPlay.addEventListener('click',toggleRadarPlayback);
  updateRadarLabel();

  const existingBase=document.getElementById('rpChartLayer');
  if(existingBase)existingBase.addEventListener('change',()=>{
    state.baseMode=existingBase.value;
    save();
    syncBaseRadios();
  });

  function syncBaseRadios(){
    panel.querySelectorAll('input[name="rpEfbBase"]').forEach(x=>x.checked=x.value===state.baseMode);
  }
  function setBase(key){
    if(!['sectional','terminal','low','high'].includes(key))return;
    RP.setChart(key);
    if(existingBase)existingBase.value=key;
  }
  function applyAutoChart(){
    const z=map.getZoom();
    const current=RP.getChart();
    // Keep the chosen chart family while zooming; only TAC falls back at wide scale.
    const key=current==='terminal'&&z<10?'sectional':current;
    if(RP.getChart()!==key)setBase(key);
  }

  function setLayerStatus(key,text,stateName){
    const el=panel.querySelector('[data-layer-status="'+key+'"]');
    if(!el)return;
    el.textContent=text||'';
    el.dataset.state=stateName||'';
  }
  function getBoundsString(){
    const b=map.getBounds();
    return [b.getSouth().toFixed(3),b.getWest().toFixed(3),b.getNorth().toFixed(3),b.getEast().toFixed(3)].join(',');
  }
  function roundedBoundsKey(){
    const b=map.getBounds(),q=.25,r=v=>Math.round(v/q)*q;
    return [r(b.getSouth()),r(b.getWest()),r(b.getNorth()),r(b.getEast()),Math.floor(map.getZoom())].join(',');
  }
  async function fetchJson(url,controller=new AbortController()){
    const timeout=setTimeout(()=>controller.abort(),12000);let r;try{r=await fetch(url,{cache:'no-store',signal:controller.signal})}finally{clearTimeout(timeout)}
    let j={};
    try{j=await r.json()}catch{}
    if(!r.ok){
      const e=new Error(j.error||('Request returned '+r.status));
      e.status=r.status;e.payload=j;throw e;
    }
    return j;
  }

  function metarBoundsString(){
    const b=map.getBounds(),lat=(b.getSouth()+b.getNorth())/2,lon=(b.getWest()+b.getEast())/2;
    // Keep a station query around airport close-ups; this never changes dot coordinates.
    return [Math.max(-90,Math.min(b.getSouth(),lat-.25)),Math.max(-180,Math.min(b.getWest(),lon-.25)),Math.min(90,Math.max(b.getNorth(),lat+.25)),Math.min(180,Math.max(b.getEast(),lon+.25))].map(v=>v.toFixed(3)).join(',');
  }
  function weatherBoundsContain(outer,inner){
    // Broad AWC queries can omit local stations. Always request detail after a wide view.
    return outer&&inner&&outer[2]-outer[0]<=2&&outer[3]-outer[1]<=2&&outer[0]<=inner[0]&&outer[1]<=inner[1]&&outer[2]>=inner[2]&&outer[3]>=inner[3];
  }
  function endpointFor(key){
    if(key==='airports')return null;
    const bbox=encodeURIComponent(key==='metar'?metarBoundsString():getBoundsString());
    if(key==='tfr')return '/api/tfrs?bbox='+bbox;
    if(AWC.has(key))return '/api/aviation-layers?product='+(key==='obstacles'?'obstacle':key)+'&bbox='+bbox;
    if(FAA.has(key))return '/api/faa-map-features?product='+key+'&bbox='+bbox;
    return null;
  }
  function paneFor(key){
    if(key==='metar')return 'pdMetarPane';
    if(WEATHER.has(key))return 'pdWeatherPane';
    if(AIRSPACE.has(key))return 'pdAirspacePane';
    return 'pdNavPane';
  }
  function ensureGroup(key){
    if(groups[key])return groups[key];
    groups[key]=L.layerGroup();
    if(state.enabled[key])groups[key].addTo(map);
    return groups[key];
  }

  async function ensureData(key,forBrief){
    if(PRO_LAYERS.has(key)&&!hasFeature('advancedWeather'))return null;
    const endpoint=endpointFor(key);
    if(!endpoint)return null;
    const min=MIN_ZOOM[key]||3;
    if(map.getZoom()<min&&!forBrief){
      // A pending request for the previous zoom must not restore hidden symbols.
      fetchSeq[key]=(fetchSeq[key]||0)+1;
      dataPending[key]?.controller?.abort();
      delete dataPending[key];delete lastFetch[key];
      setLayerStatus(key,'zoom '+min+'+','idle');
      const g=groups[key];if(g)g.clearLayers();
      return data[key]||null;
    }
    const stamp=key==='metar'?endpoint:getBoundsString()+','+Math.floor(map.getZoom());
    const requestBounds=key==='metar'?metarBoundsString().split(',').map(Number):null;
    // Reuse a recent station query while its coverage still contains the viewport.
    const covered=key==='metar'&&weatherBoundsContain(dataBounds[key],getBoundsString().split(',').map(Number));
    if(data[key]&&lastFetch[key]&&Date.now()-dataTime[key]<60000&&(covered||lastFetch[key]===stamp)){
      if(dataPending[key]){fetchSeq[key]=(fetchSeq[key]||0)+1;dataPending[key].controller?.abort();delete dataPending[key];}
      dataStatus[key]='available';setLayerStatus(key,String((data[key].features||[]).length),'live');
      return data[key];
    }
    if(dataPending[key]?.stamp===stamp)return dataPending[key].promise;
    dataPending[key]?.controller?.abort();
    const controller=new AbortController();
    const seq=(fetchSeq[key]||0)+1;fetchSeq[key]=seq;
    setLayerStatus(key,'loading','loading');
    dataStatus[key]='loading';
    const request=(async()=>{try{
      const j=await fetchJson(endpoint,controller);
      if(fetchSeq[key]!==seq)return null;
      data[key]=j.geojson||{type:'FeatureCollection',features:[]};
      dataBounds[key]=requestBounds;
      lastFetch[key]=stamp;dataTime[key]=Date.now();dataStatus[key]='available';
      setLayerStatus(key,String((data[key].features||[]).length),'live');
      if(state.enabled[key])renderGeoLayer(key,data[key]);
      renderBrief();
      return data[key];
    }catch(e){
      if(fetchSeq[key]!==seq)return null;
      delete data[key];delete lastFetch[key];dataStatus[key]='unavailable';
      if(e.status===400&&/Zoom in/i.test(e.message))setLayerStatus(key,'zoom in','idle');
      else setLayerStatus(key,'unavailable','error');
      {const g=groups[key];if(g)g.clearLayers()}
      renderBrief();
      return null;
    }finally{if(dataPending[key]?.seq===seq)delete dataPending[key]}})();
    dataPending[key]={stamp,seq,promise:request,controller};return request;
  }

  function toggleLayer(key,on){
    if(on&&PRO_LAYERS.has(key)&&!hasFeature('advancedWeather')){state.enabled[key]=false;const input=panel.querySelector('[data-layer="'+key+'"]');if(input)input.checked=false;return;}
    if(key==='radar'){
      radarControls.hidden=!on;
      if(on)refreshRadar();else removeRadar();
      return;
    }
    if(key==='notams'){
      if(!on)notamSeq++;
      if(on){notamGroup.addTo(map);void loadNotams()}else{map.removeLayer(notamGroup)}
      renderBrief();
      return;
    }
    if(key==='rings'){
      if(on){ringsGroup.addTo(map);renderRings()}else{ringsGroup.clearLayers();map.removeLayer(ringsGroup)}
      return;
    }
    const g=ensureGroup(key);
    if(on){
      if(!map.hasLayer(g))g.addTo(map);
      if(data[key])renderGeoLayer(key,data[key]);
      void ensureData(key,false);
    }else{
      fetchSeq[key]=(fetchSeq[key]||0)+1;
      dataPending[key]?.controller?.abort();
      delete dataPending[key];
      g.clearLayers();
      if(map.hasLayer(g))map.removeLayer(g);
    }
  }

  function field(p,names){
    for(const name of names){
      if(p&&p[name]!==undefined&&p[name]!==null&&p[name]!=='')return p[name];
    }
    return '';
  }
  function fltColor(cat){
    const c=String(cat||'').toUpperCase();
    if(c==='VFR')return '#3bd779';
    if(c==='MVFR')return '#58a6ff';
    if(c==='IFR')return '#ff5555';
    if(c==='LIFR')return '#ff79cb';
    return '#d4d4d8';
  }
  function styleFor(key,feature){
    const o=state.vectorOpacity;
    if(key==='metar')return {color:'#08080a',fillColor:window.PilotDeskChartSymbols.metarColor(feature?.properties||{}),fillOpacity:.96*o};
    if(key==='tfr')return {pane:'pdAirspacePane',color:feature?.properties?.status==='upcoming'?'#e6bd62':'#ef6f6f',weight:2.2,opacity:o,fillColor:'#e87c7c',fillOpacity:.08*o,dashArray:feature?.properties?.status==='upcoming'?'7 5':null};
    if(key==='sua')return {pane:'pdAirspacePane',color:'#d7b76c',weight:1.4,opacity:.85*o,fillColor:'#d7b76c',fillOpacity:.035*o,dashArray:'7 5'};
    if(key==='airspace')return {pane:'pdAirspacePane',color:'#c5c5ca',weight:1,opacity:.62*o,fillOpacity:0,dashArray:'4 5'};
    if(key==='airsigmet')return {pane:'pdWeatherPane',color:'#e87c7c',weight:2,opacity:o,fillColor:'#e87c7c',fillOpacity:.10*o};
    if(key==='gairmet')return {pane:'pdWeatherPane',color:'#e6bd62',weight:1.5,opacity:.9*o,fillColor:'#e6bd62',fillOpacity:.07*o,dashArray:'6 4'};
    if(key==='cwa')return {pane:'pdWeatherPane',color:'#d4d4d8',weight:1.5,opacity:.8*o,fillColor:'#d4d4d8',fillOpacity:.05*o,dashArray:'3 4'};
    if(key==='airways')return {pane:'pdNavPane',color:'#c6cbd0',weight:1.2,opacity:.72*o,dashArray:'7 4'};
    return {pane:paneFor(key),color:'#d4d4d8',weight:1.2,opacity:.8*o,fillColor:'#d4d4d8',fillOpacity:.05*o};
  }
  function pointFor(key,feature,ll){
    const p=feature.properties||{},pane=paneFor(key);
    if(p._pdMembers){const count=p._pdMembers.length,label=count+' '+key+' items; open for details';const symbol=key==='pirep'?window.PilotDeskChartSymbols.pirep(p).html:key==='metar'?'<span class="rp-cluster-cat" style="color:'+window.PilotDeskChartSymbols.metarColor(p)+'">● '+window.PilotDeskChartSymbols.metarCategory(p)+'</span>':window.PilotDeskChartSymbols.navigation(key,p).html;
      return L.marker(ll,{pane,keyboard:false,icon:L.divIcon({className:'rp-map-cluster',html:symbol+'<b>'+count+'</b>',iconSize:key==='metar'?[72,34]:[42,34],iconAnchor:key==='metar'?[36,17]:[21,17]}),title:label}).setOpacity(state.vectorOpacity);
    }
    if(key==='metar'){
      const cat=window.PilotDeskChartSymbols.metarCategory(p);
      return L.circleMarker(ll,{pane,radius:map.getZoom()<7?4:6,weight:2,color:'#08080a',fillColor:fltColor(cat),fillOpacity:.96*state.vectorOpacity});
    }
    const symbols=window.PilotDeskChartSymbols;
    const symbol=key==='pirep'?symbols.pirep(p):symbols.navigation(key,p);
    const width=symbol.width||24,icon=L.divIcon({className:'rp-map-symbol'+(key==='pirep'?' rp-pirep-symbol':''),html:symbol.html,iconSize:[width,28],iconAnchor:[width/2,14]});
    const marker=L.marker(ll,{pane,icon,interactive:true,keyboard:false});
    marker.options.title=symbol.label;marker.options.alt=symbol.label;
    return marker.setOpacity(state.vectorOpacity);
  }
  function popupFor(key,feature){
    const p=feature.properties||{};
    if(p._pdMembers){return '<div class="rp-route-popup rp-cluster-popup"><b>'+p._pdMembers.length+' nearby '+esc(key)+' items</b><p>Grouped at this zoom.'+(['metar','pirep'].includes(key)?' The symbol represents the strongest reported condition in this group.':'')+'</p>'+p._pdMembers.slice(0,50).map(f=>'<details><summary>'+esc(field(f.properties||{},['IDENT','icaoId','ident','id','NAME'])||window.PilotDeskChartSymbols.pirep(f.properties||{}).label)+'</summary>'+popupFor(key,f)+'</details>').join('')+(p._pdMembers.length>50?'<p>Showing 50 of '+p._pdMembers.length+'. Zoom in to separate more items.</p>':'')+'</div>'; }
    if(key==='tfr'){
      const id=field(p,['notamId','NOTAM_KEY']),type=field(p,['type','TYPE']),desc=field(p,['description','TITLE']);
      const status=field(p,['status']);
      const link=field(p,['detailUrl']);
      const timing=[p.effectiveStart?'Start '+p.effectiveStart+' UTC date':'',p.effectiveEnd?'End '+p.effectiveEnd+' UTC date':''].filter(Boolean).join(' · ');
      const lower=field(p,['LOWER_DESC','LOWER_VAL','LOWER']),upper=field(p,['UPPER_DESC','UPPER_VAL','UPPER']);
      const altitude=lower||upper?String(lower||'unknown')+' to '+String(upper||'unknown'):'Altitude limits: see FAA restriction';
      return '<div class="rp-route-popup"><b>'+esc(id||'FAA TFR')+'</b><br>'+esc(type)+(status?' · '+esc(status):'')+'<br>'+esc(desc)+'<br>'+esc(altitude)+(timing?'<br>'+esc(timing):'')+'<br>Confirm exact active times in the FAA restriction.'+(link?'<br><a href="'+esc(link)+'" target="_blank" rel="noopener">Open FAA restriction</a>':'')+'</div>';
    }
    if(key==='metar'){
      const id=field(p,['icaoId','id','stationId']),cat=window.PilotDeskChartSymbols.metarCategory(p),raw=field(p,['rawOb','raw_text','raw']);
      const details=window.PilotDeskChartSymbols.metarDetails(p);
      return '<div class="rp-route-popup rp-metar-popup"><div class="rp-metar-heading"><b>'+esc(id||'METAR')+'</b><strong style="color:'+window.PilotDeskChartSymbols.metarColor(p)+'">'+esc(cat)+'</strong></div><p class="rp-metar-time">'+esc(window.PilotDeskChartSymbols.reportTime(p))+'</p><dl>'+[['Wind',details.wind],['Visibility',details.visibility],['Ceiling',details.ceiling]].map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl><p class="rp-metar-raw">'+esc(raw||'Raw report unavailable')+'</p><small>Source: Aviation Weather Center · Surface observation</small></div>';
    }
    if(key==='pirep'){
      const raw=field(p,['rawOb','raw_text','raw']),level=p.fltlvl??p.fltLvl,alt=level!=null?'FL'+String(level).padStart(3,'0'):field(p,['altitude','alt']);const symbol=window.PilotDeskChartSymbols.pirep(p);
      return '<div class="rp-route-popup"><b>PIREP'+(alt?' · '+esc(alt):'')+'</b><br>'+esc(symbol.label)+'<br>'+esc(raw||'Pilot report')+'<br><small>'+esc(window.PilotDeskChartSymbols.reportTime(p))+'</small></div>';
    }
    if(key==='airsigmet'||key==='gairmet'||key==='cwa'){
      const hazard=field(p,['hazard','hazardType','type','seriesId']),raw=field(p,['rawSigmet','rawAirSigmet','cwaText','rawOb','rawText','raw']);
      return '<div class="rp-route-popup"><b>'+esc(key==='airsigmet'?'SIGMET':key==='gairmet'?'G-AIRMET':'CWA')+(hazard?' · '+esc(hazard):'')+'</b><br>'+esc(raw||'Current advisory')+'</div>';
    }
    const name=field(p,['IDENT','ident','ID','NAME','name','DESIGNATOR','designator']);
    const type=field(p,['TYPE_CODE','TYPE','type','CLASS','CLASS_B']);
    const alt=field(p,['UPPER_DESC','LOWER_DESC','UPPER_VAL','LOWER_VAL','ELEVATION','MSL','AGL']);
    const coordinates=feature.geometry?.type==='Point'?feature.geometry.coordinates:null;
    const canAdd=['airports','navaids','fixes'].includes(key)&&/^[A-Z0-9_-]{1,12}$/i.test(name)&&coordinates?.length>=2&&Number.isFinite(coordinates[0])&&Number.isFinite(coordinates[1])&&Math.abs(coordinates[0])<=180&&Math.abs(coordinates[1])<=90;
    const add=canAdd?'<br><button type="button" class="utility-btn" data-map-add="'+esc(String(name).toUpperCase()+','+coordinates[1].toFixed(5)+','+coordinates[0].toFixed(5))+'">Add to route</button>':'';
    return '<div class="rp-route-popup"><b>'+esc(name||key.toUpperCase())+'</b>'+(key==='airports'?'<br>'+esc(window.PilotDeskChartSymbols.airportStatus(p).label)+'<br><span class="rp-mini">Tower operating hours are not checked.</span>':'')+(type?'<br>'+esc(type):'')+(alt?'<br>'+esc(alt):'')+'<br><span class="rp-mini">FAA / AWC live planning data</span>'+add+'</div>';
  }
  function renderGeoLayer(key,geojson){
    if(PRO_LAYERS.has(key)&&!hasFeature('advancedWeather'))return;
    const g=ensureGroup(key);
    if(key==='metar'){
      const retained=new Set();
      for(const feature of geojson.features||[]){
        const coordinates=feature.geometry?.coordinates,p=feature.properties||{};
        if(feature.geometry?.type!=='Point'||!Array.isArray(coordinates)||!Number.isFinite(coordinates[0])||!Number.isFinite(coordinates[1])||Math.abs(coordinates[0])>180||Math.abs(coordinates[1])>90)continue;
        const id=field(p,['icaoId','id','stationId']),stamp=id+':'+coordinates.slice(0,2).join(',');
        retained.add(stamp);let marker=weatherMarkers.get(stamp);
        if(!marker){
          marker=pointFor('metar',feature,L.latLng(coordinates[1],coordinates[0]));
          marker.bindPopup(()=>popupFor('metar',marker.feature),{className:'rp-weather-popup',maxWidth:320});
          marker.bindTooltip('',{direction:'top',className:'rp-point-label'});weatherMarkers.set(stamp,marker);
        }
        marker.feature=feature;marker.setStyle(styleFor('metar',feature));marker.setRadius(map.getZoom()<7?4:6);
        marker.setTooltipContent(esc(id)+' · '+esc(window.PilotDeskChartSymbols.metarCategory(p)));
        if(!g.hasLayer(marker))g.addLayer(marker);
        if(marker.isPopupOpen())marker.setPopupContent(()=>popupFor('metar',marker.feature));
      }
      for(const [stamp,marker] of weatherMarkers)if(!retained.has(stamp)){g.removeLayer(marker);weatherMarkers.delete(stamp);}
      return;
    }
    g.clearLayers();
    const visible=(geojson.features||[]).filter(f=>key!=='airports'||window.PilotDeskMapDensity.publicAirport(f)).filter(f=>key!=='pirep'||state.pirepFilter==='all'||window.PilotDeskChartSymbols.pirep(f.properties||{}).items.some(item=>item.kind===state.pirepFilter));
    const size=map.getZoom()<10?({pirep:48,airports:44,navaids:44,fixes:44,obstacles:44}[key]||0):0;
    const priority=f=>{const p=f.properties||{};if(key==='pirep'){const v=window.PilotDeskChartSymbols.pirep(p);return (v.urgent?100:0)+Math.max(...v.items.map(x=>x.level||0));}if(key==='metar')return ({LIFR:4,IFR:3,MVFR:2,VFR:1}[window.PilotDeskChartSymbols.metarCategory(p)]||0);return 0;};
    const grouped=size?window.PilotDeskMapDensity.group(visible,c=>map.project([c[1],c[0]],map.getZoom()),size,priority):visible.map(feature=>({feature,members:[feature]}));
    const display={type:'FeatureCollection',features:grouped.map(x=>({...x.feature,properties:{...x.feature.properties,_pdMembers:x.members.length>1?x.members:null}}))};
    const layer=L.geoJSON(display,{
      pane:paneFor(key),
      filter:f=>key!=='pirep'||state.pirepFilter==='all'||window.PilotDeskChartSymbols.pirep(f.properties||{}).items.some(item=>item.kind===state.pirepFilter),
      style:f=>styleFor(key,f),
      pointToLayer:(f,ll)=>pointFor(key,f,ll),
      onEachFeature:(f,l)=>{
        l.bindPopup(()=>popupFor(key,f),key==='metar'?{className:'rp-weather-popup',maxWidth:320}:{});
        if(key==='metar'){const p=f.properties||{},id=field(p,['icaoId','id','station']);l.bindTooltip(esc(id)+' · '+esc(window.PilotDeskChartSymbols.metarCategory(p)),{direction:'top',className:'rp-point-label'});}
        if((key==='airports'||key==='navaids'||key==='fixes')&&map.getZoom()>=9){
          const name=field(f.properties||{},['IDENT','ident','ID','NAME','name']);
          if(name)l.bindTooltip(esc(name),{permanent:true,direction:'right',className:'rp-nav-label',offset:[6,0]});
        }
      }
    });
    layer.addTo(g);
    if(size&&key!=='pirep')setLayerStatus(key,grouped.length+' symbols / '+visible.length+' items','live');
    if(key==='pirep'){const features=geojson.features||[],shown=features.filter(f=>state.pirepFilter==='all'||window.PilotDeskChartSymbols.pirep(f.properties||{}).items.some(item=>item.kind===state.pirepFilter)).length;setLayerStatus(key,grouped.length+' symbols / '+shown+' reports'+(state.pirepFilter==='all'?'':' filtered'),'live');}
  }
  function resizeWeatherDots(){
    const radius=map.getZoom()<7?4:6;
    function resize(layer){if(layer.setRadius)layer.setRadius(radius);else if(layer.eachLayer)layer.eachLayer(resize);}
    if(groups.metar)resize(groups.metar);
  }
  function refreshVectorStyles(){
    function update(layer,key){
      if(layer.eachLayer){layer.eachLayer(child=>update(child,key));return;}
      if(layer.setOpacity)layer.setOpacity(state.vectorOpacity);
      if(layer.setStyle&&layer.feature)layer.setStyle(styleFor(key,layer.feature));
    }
    Object.keys(groups).forEach(key=>update(groups[key],key));
  }

  const RADAR='https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer/exportImage';
  function radarFrameTime(){
    const v=Number(radarSlider.value);
    if(v>=24)return null;
    const minutes=(24-v)*10;
    return Date.now()-minutes*60000;
  }
  function radarUrl(bounds,time){
    const size=map.getSize(),params=new URLSearchParams({
      bbox:[bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth()].join(','),
      bboxSR:'4326',
      imageSR:'4326',
      size:[Math.max(320,Math.min(1200,size.x)),Math.max(320,Math.min(900,size.y))].join(','),
      format:'png32',
      transparent:'true',
      interpolation:'RSP_BilinearInterpolation',
      f:'image'
    });
    if(time)params.set('time',String(time));
    return RADAR+'?'+params.toString();
  }
  function refreshRadar(){
    if(!state.enabled.radar||document.hidden)return;
    const b=map.getBounds(),url=radarUrl(b,radarFrameTime()),seq=++radarSeq;
    if(radarPending)map.removeLayer(radarPending);
    const next=L.imageOverlay(url,b,{pane:'pdRadarPane',opacity:0,interactive:false});
    radarPending=next;setLayerStatus('radar','loading','loading');
    next.on('load',()=>{
      if(seq!==radarSeq||!state.enabled.radar){map.removeLayer(next);return}
      if(radarOverlay)map.removeLayer(radarOverlay);
      radarOverlay=next;radarPending=null;next.setOpacity(state.radarOpacity);
      radarTimeLabel.value=(Number(radarSlider.value)===24?'Latest request':new Date(radarFrameTime()).toISOString().slice(11,16)+'Z');
      setLayerStatus('radar','loaded','live');
    });
    next.on('error',()=>{map.removeLayer(next);if(seq===radarSeq){radarPending=null;setLayerStatus('radar','unavailable','error');radarTimeLabel.value='Unavailable';if(radarOverlay){map.removeLayer(radarOverlay);radarOverlay=null}}});
    next.addTo(map);
  }
  function removeRadar(){
    radarSeq++;if(radarPending){map.removeLayer(radarPending);radarPending=null}
    if(radarOverlay){map.removeLayer(radarOverlay);radarOverlay=null}
    if(radarTimer){clearInterval(radarTimer);radarTimer=null;radarPlay.textContent='▶'}
    setLayerStatus('radar','','');
  }
  function updateRadarLabel(){
    const v=Number(radarSlider.value);
    radarTimeLabel.value=v>=24?'Latest':'-'+((24-v)*10)+' min';
  }
  function toggleRadarPlayback(){
    if(radarTimer){
      clearInterval(radarTimer);radarTimer=null;radarPlay.textContent='▶';return;
    }
    if(Number(radarSlider.value)>=24)radarSlider.value='12';
    radarPlay.textContent='■';
    radarTimer=setInterval(()=>{
      let v=Number(radarSlider.value)+1;
      if(v>24)v=12;
      radarSlider.value=String(v);
      updateRadarLabel();
      refreshRadar();
    },950);
  }

  function renderRings(){
    ringsGroup.clearLayers();
    if(!state.enabled.rings)return;
    const pts=RP.getPoints();
    if(!pts.length)return;
    const centers=pts.length>1?[pts[0],pts[pts.length-1]]:[pts[0]];
    centers.forEach(p=>{
      [10,25,50].forEach(nm=>{
        L.circle([p.lat,p.lon],{pane:'pdNavPane',radius:nm*1852,color:'#d4d4d8',weight:1,opacity:.4,fillOpacity:0,dashArray:'4 6',interactive:false}).addTo(ringsGroup)
          .bindTooltip(nm+' NM',{permanent:false,className:'rp-nav-label'});
      });
    });
  }

  async function loadNotams(forBrief=false){
    const seq=++notamSeq;notamGroup.clearLayers();for(const id of Object.keys(notams))delete notams[id];
    if(!state.enabled.notams&&!forBrief)return;
    const pts=RP.getPoints();
    const candidates=B.airportCandidates(pts,window.PilotDeskRoutePerformance?.getSettings()?.alternateAirport).slice(0,8);
    if(!candidates.length){setLayerStatus('notams','route','idle');renderBrief();return}
    setLayerStatus('notams','loading','loading');
    let configured=true,total=0,failed=false;
    await Promise.all(candidates.map(async p=>{
      const id=String(p.id).toUpperCase();
      try{
        const j=await B.requestNotams(id);
        if(seq!==notamSeq)return;notams[id]=j;total+=Number(j.count||0);
        if(Number(j.count||0)>0&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)){
          const icon=L.divIcon({className:'rp-notam-marker',html:'<span>!</span><b>'+Number(j.count||0)+'</b>',iconSize:[30,22],iconAnchor:[15,11]});
          L.marker([p.lat,p.lon],{pane:'pdNotamPane',icon}).addTo(notamGroup).bindPopup(notamPopup(id,j));
        }
      }catch(e){
        if(seq!==notamSeq)return;failed=true;const payload=e.payload||{};
        notams[id]={...payload,error:e.message};
        if(payload.configured===false)configured=false;
      }
    }));
    if(seq!==notamSeq)return;setLayerStatus('notams',!configured?'unavailable':failed?'partial':String(total),failed||!configured?'error':'live');
    renderBrief();
  }
  function notamPopup(id,j){
    if(j.error||j.configured===false)return '<div class="rp-route-popup"><b>'+esc(id)+' NOTAMs unavailable</b><p>Check FAA NOTAM Search. No absence of notices is implied.</p></div>';
    const counts=j.counts||{};
    const summary=Object.keys(counts).filter(k=>counts[k]).map(k=>k+' '+counts[k]).join(' · ');
    const rows=(j.notams||[]).slice(0,6).map(n=>'<div class="rp-notam-item"><b>'+esc(n.category||'NOTAM')+(n.number?' · '+esc(n.number):'')+'</b><span>'+esc(n.text||'')+'</span></div>').join('');
    return '<div class="rp-route-popup rp-notam-popup"><b>'+esc(id)+' NOTAMs · '+Number(j.count||0)+'</b>'+(summary?'<br>'+esc(summary):'')+rows+'<a href="https://notams.aim.faa.gov/notamSearch/" target="_blank" rel="noopener">Open FAA NOTAM Search</a></div>';
  }

  async function loadBriefWeather(seq){
    const pts=RP.getPoints(),settings=window.PilotDeskRoutePerformance?.getSettings()||{};
    if(pts.length<2)return;
    const ids=[B.isAirport(pts[0])?B.stationId(pts[0].id):'',B.isAirport(pts.at(-1))?B.stationId(pts.at(-1).id):'',B.stationId(settings.alternateAirport)];
    const pending=new Map();
    const request=id=>{if(!id)return Promise.resolve({error:'Not an airport endpoint.'});if(!pending.has(id))pending.set(id,RP.getWeather(id,true).catch(e=>({station:id,error:e.message})));return pending.get(id);};
    const result=await Promise.all(ids.map(request));
    if(seq!==routeContextSeq)return;
    [briefWx.dep,briefWx.dst,briefWx.alt]=result;
    renderBrief();
  }

  function relationToRoute(feature){return B.relationToRoute(feature,RP.getPoints());}

  function destinationNotam(){
    const pts=RP.getPoints(),dst=pts.length?String(pts[pts.length-1].id||'').toUpperCase():'';
    return notams[dst]||null;
  }
  function relevantFeatures(key,nearNm){
    const fc=briefData[key],features=(fc&&fc.features)||[];
    return features.map(f=>({feature:f,relation:relationToRoute(f)})).filter(x=>x.relation.intersects||(nearNm!=null&&x.relation.distanceNm<=nearNm));
  }

  function renderBrief(){
    const body=document.getElementById('rpBriefBody');
    if(!body)return;
    if(!hasFeature('routeBrief')){body.innerHTML='<div class="rp-empty-state"><span class="rp-eyebrow">PILOTDESK PRO · $5 / MONTH</span><h3>Review the route in one place.</h3><p>Pro combines endpoint and alternate weather, route advisory intersections, TFR and NOTAM context, fuel margin and ETA.</p><ul><li>Compare hazards with your planned route.</li><li>Review destination and alternate context.</li><li>Keep fuel, time and source timestamps together.</li></ul><p><a href="/pricing.html?from=route-brief">Unlock Pro route planning →</a></p><p><a href="/flight-brief.html">Use the free Flight Brief</a> · <a href="https://aviationweather.gov/" target="_blank" rel="noopener">Official weather</a></p><small>This is a feature preview, not a current briefing. Basic charts, navlog, METARs, radar and official sources remain free.</small></div>';return;}
    const pts=RP.getPoints();
    if(pts.length<2){
      body.innerHTML='<div class="rp-empty-state">Build a route to load route-specific weather, hazards, TFRs and NOTAM context.</div>';
      return;
    }
    const dep=pts[0].id,dst=pts[pts.length-1].id,settings=window.PilotDeskRoutePerformance?.getSettings()||{},alternate=B.stationId(settings.alternateAirport);
    const departure=B.dateValue(settings.departureUtc?settings.departureUtc+'Z':null)?.getTime()??null,arrival=departure!==null&&Number.isFinite(window.pdNavlogResult?.totalHours)?departure+window.pdNavlogResult.totalHours*3600000:null;
    const airportRows=B.airportCandidates(pts,alternate),cwaRel=relevantFeatures('cwa',0);
    const tfrRel=relevantFeatures('tfr',10);
    const tfrHit=tfrRel.filter(x=>x.relation.intersects);
    const sigRel=relevantFeatures('airsigmet',0);
    const gairRel=relevantFeatures('gairmet',0);
    const dstNotam=destinationNotam();
    const dstCat=String((briefWx.dst&&briefWx.dst.metar&&(briefWx.dst.metar.fltCat||briefWx.dst.metar.flightCategory))||'').toUpperCase();
    const flags=[];
    if(tfrHit.length)flags.push(['danger','TFR INTERSECTION']);
    else if(tfrRel.length)flags.push(['warn','TFR NEAR ROUTE']);
    if(sigRel.length)flags.push(['danger','SIGMET INTERSECTION']);
    if(gairRel.length)flags.push(['warn','G-AIRMET INTERSECTION']);
    if(cwaRel.length)flags.push(['warn','CWA INTERSECTION']);
    if([[pts[0],briefWx.dep],[pts.at(-1),briefWx.dst]].some(([p,w])=>B.isAirport(p)&&(!w?.metar||!w?.taf))||(alternate&&(!briefWx.alt?.metar||!briefWx.alt?.taf)))flags.push(['warn','WEATHER COVERAGE INCOMPLETE']);
    if(dstCat==='IFR'||dstCat==='LIFR')flags.push(['warn','DESTINATION '+dstCat]);
    if(airportRows.some(p=>!notams[p.id]||notams[p.id].error||notams[p.id].configured===false)||airportRows.length>8)flags.push(['warn','NOTAM COVERAGE INCOMPLETE']);
    if(dstNotam&&!dstNotam.error&&Number(dstNotam.count||0))flags.push(['info','DESTINATION NOTAM · '+Number(dstNotam.count||0)]);
    const missing=['tfr','airsigmet','gairmet','cwa'].filter(key=>briefStatus[key]!=='available'||Date.now()-briefTime[key]>60000);
    if(missing.length)flags.push(['warn','ADVISORY COVERAGE INCOMPLETE']);
    if(!flags.length&&!briefLoading)flags.push(['info','NO FLAGS IN LOADED DATA']);
    const notamText=(airportRows.length>8?'Coverage limited to eight airports, including departure, destination and alternate. Check the remaining route airports separately. ':'')+(briefLoading?'Loading airport notices…':airportRows.length+' airport'+(airportRows.length===1?'':'s')+' requested. Unavailable coverage is shown for each airport.');
    const hazards=[
      sigRel.length?sigRel.length+' SIGMET route intersection'+(sigRel.length===1?'':'s'):null,
      gairRel.length?gairRel.length+' G-AIRMET route intersection'+(gairRel.length===1?'':'s'):null,
      tfrRel.length?tfrRel.length+' TFR route/near-route item'+(tfrRel.length===1?'':'s'):null,
      cwaRel.length?cwaRel.length+' CWA route intersection'+(cwaRel.length===1?'':'s'):null
    ].filter(Boolean).join(' · ')||(missing.length?'Route advisory coverage is incomplete. No clear-route conclusion is available.':'No route intersections detected in loaded advisory data.');
    const openDetails=new Set([...body.querySelectorAll('[data-brief-detail][open]')].map(el=>el.dataset.briefDetail));
    body.innerHTML=[
      '<div class="rp-brief-route"><span>'+esc(dep)+'</span><i>→</i><span>'+esc(dst)+'</span></div>',
      '<p class="rp-brief-meta" role="status">'+(briefLoading?'Updating route briefing…':'Route briefing loaded. Review product times and any unavailable coverage.')+'</p>',
      '<div class="rp-brief-flags">'+flags.map(x=>'<span data-kind="'+x[0]+'">'+esc(x[1])+'</span>').join('')+'</div>',
      briefSection('Time & fuel',fuelReview()),
      briefSection('Alternate planning',alternateReview()),
      B.weatherHtml('Departure',B.isAirport(pts[0])?B.stationId(dep):'',briefWx.dep,departure,window.PilotDeskChartSymbols),
      briefSection('Enroute hazards',hazards),
      briefSection('TFRs',tfrRel.length?hazardsPart(tfrRel):briefStatus.tfr==='available'?'No route/near-route TFR geometry detected in loaded FAA data.':'Route TFR coverage unavailable.'),
      B.weatherHtml('Destination',B.isAirport(pts.at(-1))?B.stationId(dst):'',briefWx.dst,arrival,window.PilotDeskChartSymbols),
      alternate?B.weatherHtml('Alternate',alternate,briefWx.alt,null,window.PilotDeskChartSymbols):'',
      briefSection('NOTAMs',notamText),
      ...airportRows.slice(0,8).map(p=>B.notamHtml(p,notams[p.id],departure,arrival)),
      ...['airsigmet','gairmet','cwa','tfr'].map(key=>B.advisoryHtml(key,key==='tfr'?tfrRel: key==='airsigmet'?sigRel:key==='gairmet'?gairRel:cwaRel,briefStatus[key],briefTime[key],departure,arrival)),
      briefSection('Data coverage',['tfr','airsigmet','gairmet','cwa'].map(key=>key.toUpperCase()+': '+(briefStatus[key]==='available'?'route area retrieved '+B.stamp(briefTime[key]||null)+(Date.now()-briefTime[key]>60000?' · Earlier retrieval; refresh before use':''):briefStatus[key]||'not loaded')).join(' · ')),
      '<button type="button" class="utility-btn" data-refresh-brief '+(briefLoading?'disabled':'')+'>'+(briefLoading?'Updating route data…':'Refresh route data')+'</button>',
      '<div class="rp-brief-source">Horizontal intersections are approximate; altitude, effective times and full route legality are not validated. Automatic flags describe data relationships only; they are not a go/no-go decision. <a href="https://www.1800wxbrief.com/" target="_blank" rel="noopener">Official briefing</a></div>'
    ].join('');
    body.querySelectorAll('[data-brief-detail]').forEach(el=>{el.open=openDetails.has(el.dataset.briefDetail);});
  }
  function briefSection(title,text){return '<section class="rp-brief-section"><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p></section>'}
  function hazardsPart(items){
    return items.slice(0,4).map(x=>{
      const p=x.feature.properties||{},id=field(p,['notamId','NOTAM_KEY'])||'TFR',d=x.relation.intersects?'intersects route':fmt(x.relation.distanceNm,1)+' NM from route';
      return String(id)+' · '+d;
    }).join(' · ');
  }

  brief.addEventListener('click',e=>{if(!e.target.closest('[data-refresh-brief]'))return;for(const key of Object.keys(lastFetch))delete lastFetch[key];void loadRouteContext()});

  async function loadRouteAdvisory(key,seq){
    const bbox=window.PilotDeskMapDensity.routeBounds(RP.getPoints());briefStatus[key]='loading';
    if(!bbox){delete briefData[key];briefStatus[key]='unsupported route area';return;}
    try{const j=await B.requestLayer(key,bbox);
      if(seq!==routeContextSeq)return;briefData[key]=j.geojson||{type:'FeatureCollection',features:[]};briefStatus[key]=j.partial||j.possiblyTruncated?'partial':'available';briefTime[key]=Date.parse(j.fetchedAt)||0;renderBrief();
    }catch{if(seq!==routeContextSeq)return;delete briefData[key];briefStatus[key]='unavailable';renderBrief();}
  }
  function alternateReview(){const s=window.PilotDeskRoutePerformance?.getSettings()||{};return s.alternateAirport?String(s.alternateAirport).toUpperCase()+' · '+(s.alternateNotes||'No alternate notes entered.')+' · Pilot-entered; requirements and suitability are not checked.':'No alternate airport entered. Review whether one is required; the planner does not decide this for you.';}
  function fuelReview(){
    const nav=window.pdNavlogResult,s=window.PilotDeskRoutePerformance?.getSettings()||{};
    if(!nav)return 'Rebuild the route to update time and fuel.';
    try{const p=window.PilotDeskRoutePerformance.getFuelPlan(nav),eta=p.arrival===null?'Departure time not entered':new Date(p.arrival).toISOString().slice(0,16).replace('T',' ')+' UTC';
      return 'Trip '+fmt(p.trip,1)+' US gal · Total with entered allowances '+fmt(p.required,1)+' US gal · Margin '+(p.margin===null?'fuel on board not entered':fmt(p.margin,1)+' US gal')+' · Destination ETA '+eta+'. Regulatory fuel requirements are not checked.';
    }catch(e){return 'Fuel plan incomplete: '+e.message;}
  }
  async function loadRouteContext(){
    if(!hasFeature('routeBrief')){briefLoading=false;renderBrief();return;}
    const pts=RP.getPoints();
    if(pts.length<2){renderBrief();return}
    clearTimeout(briefRefreshTimer);briefContextKey=B.planningKey(pts,window.PilotDeskRoutePerformance?.getSettings()||{});
    const seq=++routeContextSeq;
    briefWx.dep=null;briefWx.dst=null;briefWx.alt=null;
    notamSeq++;for(const id of Object.keys(notams))delete notams[id];notamGroup.clearLayers();
    for(const key of Object.keys(briefData))delete briefData[key];
    for(const key of ['tfr','airsigmet','gairmet','cwa'])briefStatus[key]='loading';
    briefLoading=true;renderBrief();
    await Promise.all([
      loadBriefWeather(seq),
      ...['tfr','airsigmet','gairmet','cwa'].map(key=>loadRouteAdvisory(key,seq)),
      loadNotams(true)
    ]);
    if(seq!==routeContextSeq)return;
    briefLoading=false;renderBrief();renderRings();
  }

  function showLeg(leg){
    if(!leg){legStrip.hidden=true;return}
    const pts=RP.getPoints(),dep=pts.length?String(pts[0].id||'').toUpperCase():'',dst=pts.length?String(pts[pts.length-1].id||'').toUpperCase():'';
    const to=String(leg.to||'').toUpperCase(),from=String(leg.from||'').toUpperCase();
    const wxData=to===dst?briefWx.dst:(from===dep?briefWx.dep:null);
    const wx=String((wxData&&wxData.metar&&(wxData.metar.fltCat||wxData.metar.flightCategory))||'—').toUpperCase();
    const notice=notams[to];
    const count=notice&&!notice.error&&notice.configured!==false?String(Number(notice.count||0)):'—';
    legStrip.hidden=false;
    legStrip.innerHTML=[
      '<div class="rp-leg-strip-route"><span>'+esc(leg.from)+'</span><i>→</i><span>'+esc(leg.to)+'</span></div>',
      metric('TC',fmt(leg.course,0)+'°'),
      metric('WCA',fmt(leg.wca,1)+'°'),
      metric('MH',fmt(leg.mag,0)+'°'),
      metric('GS',fmt(leg.gs,0)+' kt'),
      metric('ETE',fmt(Number(leg.hours)*60,0)+' min'),
      metric('FUEL',fmt(leg.legFuel,1)+' gal'),
      metric('WX',wx),
      metric('NOTAM',count)
    ].join('');
  }
  function metric(label,value){return '<div><small>'+label+'</small><b>'+value+'</b></div>'}

  let moveTimer=null;
  map.on('zoomend',()=>{
    if(state.baseMode==='auto')applyAutoChart();
    syncBaseRadios();resizeWeatherDots();for(const key of Object.keys(groups))if(key!=='metar'&&state.enabled[key]&&data[key])renderGeoLayer(key,data[key]);
  });
  map.on('moveend',()=>{
    clearTimeout(moveTimer);
    moveTimer=setTimeout(()=>{
      if(state.enabled.radar)refreshRadar();
      Object.keys(state.enabled).forEach(key=>{
        if(state.enabled[key]&&endpointFor(key))void ensureData(key,false);
      });
    },320);
  });
  document.addEventListener('pilotdesk:route-invalidated',()=>{routeContextSeq++;notamSeq++;clearTimeout(briefRefreshTimer);briefContextKey='';briefLoading=false;briefWx.dep=null;briefWx.dst=null;briefWx.alt=null;for(const key of Object.keys(briefData))delete briefData[key];for(const key of Object.keys(briefStatus))delete briefStatus[key];for(const key of Object.keys(notams))delete notams[key];notamGroup.clearLayers();legStrip.hidden=true;renderBrief()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(radarTimer)toggleRadarPlayback()}else if(state.enabled.radar)refreshRadar()});
  document.addEventListener('pilotdesk:route-built',()=>{clearTimeout(briefRefreshTimer);briefRefreshTimer=setTimeout(loadRouteContext,120);});
  document.addEventListener('pilotdesk:leg-selected',e=>showLeg(e.detail&&e.detail.leg));
  document.addEventListener('pilotdesk:planning-changed',()=>{
    const pts=RP.getPoints(),key=B.planningKey(pts,window.PilotDeskRoutePerformance?.getSettings()||{});
    if(pts.length<2||key===briefContextKey){renderBrief();return;}
    routeContextSeq++;notamSeq++;clearTimeout(briefRefreshTimer);briefContextKey=key;briefWx.dep=null;briefWx.dst=null;briefWx.alt=null;
    for(const key of Object.keys(notams))delete notams[key];notamGroup.clearLayers();
    for(const key of Object.keys(briefData))delete briefData[key];
    for(const key of ['tfr','airsigmet','gairmet','cwa'])briefStatus[key]='loading';
    briefLoading=true;renderBrief();briefRefreshTimer=setTimeout(loadRouteContext,650);
  });
  document.addEventListener('pilotdesk:performance-updated',renderBrief);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(!panel.hidden)closePanel(panel,layersButton);
    if(!brief.hidden)closePanel(brief,briefButton);
  });

  let paidWeather=false,paidBrief=false;
  function syncProAccess(){
    const weather=hasFeature('advancedWeather'),route=hasFeature('routeBrief');
    for(const key of PRO_LAYERS){
      const input=panel.querySelector('[data-layer="'+key+'"]');
      if(input)input.disabled=!weather;
      if(!weather){state.enabled[key]=false;if(input)input.checked=false;toggleLayer(key,false);}
      else if(!paidWeather&&saved.enabled?.[key]===true){state.enabled[key]=true;if(input)input.checked=true;toggleLayer(key,true);}
    }
    panel.querySelector('#rpPirepFilter').disabled=!weather;
    const accessNote=panel.querySelector('#rpProWeatherAccess');
    if(accessNote)accessNote.hidden=weather;
    if(!route){routeContextSeq++;clearTimeout(briefRefreshTimer);briefLoading=false;briefWx.dep=null;briefWx.dst=null;briefWx.alt=null;for(const key of Object.keys(briefData))delete briefData[key];}
    else if(!paidBrief&&RP.getPoints().length>1)void loadRouteContext();
    paidWeather=weather;paidBrief=route;renderBrief();
  }
  document.addEventListener('pilotdesk:billing',syncProAccess);
  window.PilotDeskBilling?.ready?.then(syncProAccess);
  syncProAccess();
  if(state.baseMode==='auto')applyAutoChart();else setBase(state.baseMode);
  Object.keys(state.enabled).forEach(key=>{if(state.enabled[key])toggleLayer(key,true)});
  setTimeout(()=>{
    if(RP.getPoints().length>1)void loadRouteContext();
  },250);
}
})();
