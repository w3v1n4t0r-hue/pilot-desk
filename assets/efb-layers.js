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
  const DEFAULTS={radar:true,metar:true,pirep:false,gairmet:false,airsigmet:false,cwa:false,tfr:true,sua:false,airspace:false,notams:true,airports:true,navaids:false,fixes:false,airways:false,obstacles:false,rings:false};
  const MIN_ZOOM={metar:5,pirep:5,gairmet:3,airsigmet:3,cwa:3,tfr:3,sua:5,airspace:6,airports:6,navaids:7,fixes:8,airways:6,obstacles:8};
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
    vectorOpacity:Number(saved.vectorOpacity||.88)
  };
  const data={},groups={},lastFetch={},fetchSeq={},notams={},briefWx={dep:null,dst:null};
  let radarOverlay=null,notamGroup=L.layerGroup(),ringsGroup=L.layerGroup(),radarTimer=null,briefLoading=false;
  let routeContextSeq=0;

  function save(){
    localStorage.setItem('pd-efb-layers',JSON.stringify({
      enabled:state.enabled,
      baseMode:state.baseMode,
      chartOpacity:state.chartOpacity,
      radarOpacity:state.radarOpacity,
      vectorOpacity:state.vectorOpacity
    }));
  }
  function makePane(name,z){
    if(map.getPane(name))return;
    const p=map.createPane(name);
    p.style.zIndex=String(z);
    p.style.pointerEvents='none';
  }
  makePane('pdRadarPane',330);
  makePane('pdAirspacePane',350);
  makePane('pdWeatherPane',360);
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
  briefButton.textContent='ROUTE BRIEF';
  toolbar.insertBefore(briefButton,document.getElementById('rpMapStatus'));

  const panel=document.createElement('aside');
  panel.id='rpLayersPanel';
  panel.className='rp-efb-panel rp-layers-panel';
  panel.setAttribute('aria-label','Map layers');
  panel.hidden=true;
  panel.innerHTML=[
    '<div class="rp-efb-head"><div><span class="rp-eyebrow">MAP CONTROL</span><strong>Layers</strong></div><button type="button" data-close-layers aria-label="Close layers">×</button></div>',
    '<section class="rp-layer-section"><h3>BASE MAP</h3>',
      baseRow('auto','Auto by zoom'),
      baseRow('sectional','Sectional'),
      baseRow('terminal','TAC'),
      baseRow('low','IFR Low'),
      baseRow('high','IFR High'),
      '<label class="rp-layer-opacity"><span>Chart opacity</span><input id="rpEfbChartOpacity" type="range" min="25" max="100" step="5" value="'+Math.round(state.chartOpacity*100)+'"><output>'+Math.round(state.chartOpacity*100)+'%</output></label>',
    '</section>',
    '<section class="rp-layer-section"><h3>WEATHER</h3>',
      toggleRow('radar','Radar','NOAA MRMS'),
      toggleRow('metar','METARs','AWC'),
      toggleRow('pirep','PIREPs','AWC'),
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
      toggleRow('airports','Airports','FAA AIS'),
      toggleRow('navaids','VORs / NAVAIDs','FAA AIS'),
      toggleRow('fixes','Fixes','FAA AIS'),
      toggleRow('airways','Airways / Q routes','FAA AIS'),
      toggleRow('obstacles','Obstacles','AWC'),
      toggleRow('rings','Distance rings','Route'),
    '</section>',
    '<p class="rp-layer-foot">Planning display only. Confirm current weather, NOTAMs, TFRs and chart data with an official briefing source.</p>'
  ].join('');
  card.appendChild(panel);

  const brief=document.createElement('aside');
  brief.id='rpRouteBrief';
  brief.className='rp-efb-panel rp-brief-panel';
  brief.setAttribute('aria-label','Route brief');
  brief.hidden=true;
  brief.innerHTML='<div class="rp-efb-head"><div><span class="rp-eyebrow">ROUTE INTELLIGENCE</span><strong>Route Brief</strong></div><button type="button" data-close-brief aria-label="Close route brief">×</button></div><div id="rpBriefBody" class="rp-brief-body"><div class="rp-empty-state">Build a route to load route-specific weather, hazards, TFRs and NOTAM context.</div></div>';
  card.appendChild(brief);

  const radarControls=document.createElement('div');
  radarControls.id='rpRadarTimeline';
  radarControls.className='rp-radar-timeline';
  radarControls.hidden=!state.enabled.radar;
  radarControls.innerHTML='<button type="button" id="rpRadarPlay" aria-label="Play radar loop">▶</button><span class="rp-radar-label">RADAR</span><input id="rpRadarTime" type="range" min="0" max="24" step="1" value="24" aria-label="Radar time"><output id="rpRadarTimeLabel">Latest</output><label><span>Opacity</span><input id="rpRadarOpacity" type="range" min="20" max="100" step="5" value="'+Math.round(state.radarOpacity*100)+'"></label>';
  card.appendChild(radarControls);

  const legStrip=document.createElement('div');
  legStrip.id='rpLegStrip';
  legStrip.className='rp-leg-strip';
  legStrip.hidden=true;
  card.appendChild(legStrip);

  function baseRow(value,label){
    return '<label class="rp-layer-row"><span><input type="radio" name="rpEfbBase" value="'+value+'" '+(state.baseMode===value?'checked':'')+'> '+esc(label)+'</span><small data-layer-status="base-'+value+'"></small></label>';
  }
  function toggleRow(key,label,source){
    return '<label class="rp-layer-row"><span><input type="checkbox" data-layer="'+key+'" '+(state.enabled[key]?'checked':'')+'> '+esc(label)+'</span><small><span data-layer-status="'+key+'"></span><em>'+esc(source)+'</em></small></label>';
  }

  layersButton.addEventListener('click',()=>togglePanel(panel,layersButton));
  briefButton.addEventListener('click',()=>togglePanel(brief,briefButton));
  panel.querySelector('[data-close-layers]').addEventListener('click',()=>closePanel(panel,layersButton));
  brief.querySelector('[data-close-brief]').addEventListener('click',()=>closePanel(brief,briefButton));
  function togglePanel(el,button){
    const open=el.hidden;
    panel.hidden=true;brief.hidden=true;
    layersButton.setAttribute('aria-expanded','false');briefButton.setAttribute('aria-expanded','false');
    if(open){el.hidden=false;button.setAttribute('aria-expanded','true')}
  }
  function closePanel(el,button){el.hidden=true;button.setAttribute('aria-expanded','false')}

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
    const key=z<=5?'high':z<=7?'low':'sectional';
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
  async function fetchJson(url){
    const r=await fetch(url,{cache:'no-store'});
    let j={};
    try{j=await r.json()}catch{}
    if(!r.ok){
      const e=new Error(j.error||('Request returned '+r.status));
      e.status=r.status;e.payload=j;throw e;
    }
    return j;
  }

  function endpointFor(key){
    const bbox=encodeURIComponent(getBoundsString());
    if(key==='tfr')return '/api/tfrs?bbox='+bbox;
    if(AWC.has(key))return '/api/aviation-layers?product='+(key==='obstacles'?'obstacle':key)+'&bbox='+bbox;
    if(FAA.has(key))return '/api/faa-map-features?product='+key+'&bbox='+bbox;
    return null;
  }
  function paneFor(key){
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
    const endpoint=endpointFor(key);
    if(!endpoint)return null;
    const min=MIN_ZOOM[key]||3;
    if(map.getZoom()<min&&!forBrief){
      setLayerStatus(key,'zoom '+min+'+','idle');
      const g=groups[key];if(g)g.clearLayers();
      return data[key]||null;
    }
    const stamp=roundedBoundsKey();
    if(data[key]&&lastFetch[key]===stamp)return data[key];
    const seq=(fetchSeq[key]||0)+1;fetchSeq[key]=seq;
    setLayerStatus(key,'loading','loading');
    try{
      const j=await fetchJson(endpoint);
      if(fetchSeq[key]!==seq)return null;
      data[key]=j.geojson||{type:'FeatureCollection',features:[]};
      lastFetch[key]=stamp;
      setLayerStatus(key,String((data[key].features||[]).length),'live');
      if(state.enabled[key])renderGeoLayer(key,data[key]);
      renderBrief();
      return data[key];
    }catch(e){
      if(fetchSeq[key]!==seq)return null;
      if(e.status===400&&/Zoom in/i.test(e.message))setLayerStatus(key,'zoom in','idle');
      else setLayerStatus(key,'unavailable','error');
      if(!forBrief){const g=groups[key];if(g)g.clearLayers()}
      renderBrief();
      return null;
    }
  }

  function toggleLayer(key,on){
    if(key==='radar'){
      radarControls.hidden=!on;
      if(on)refreshRadar();else removeRadar();
      return;
    }
    if(key==='notams'){
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
    if(c==='VFR')return '#5fd18b';
    if(c==='MVFR')return '#68a7f5';
    if(c==='IFR')return '#e87c7c';
    if(c==='LIFR')return '#c78af7';
    return '#d4d4d8';
  }
  function styleFor(key,feature){
    const o=state.vectorOpacity;
    if(key==='tfr')return {pane:'pdAirspacePane',color:'#ef6f6f',weight:2.2,opacity:o,fillColor:'#e87c7c',fillOpacity:.08*o,dashArray:null};
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
    if(key==='metar'){
      const cat=field(p,['fltCat','flightCategory','flight_category']);
      return L.circleMarker(ll,{pane,radius:5,weight:1.5,color:'#08080a',fillColor:fltColor(cat),fillOpacity:.96*state.vectorOpacity});
    }
    if(key==='pirep')return L.circleMarker(ll,{pane,radius:4,weight:1.5,color:'#0a0a0b',fillColor:'#e6bd62',fillOpacity:.9*state.vectorOpacity});
    if(key==='obstacles')return L.circleMarker(ll,{pane,radius:3,weight:1.2,color:'#e6bd62',fillColor:'#09090b',fillOpacity:1});
    const klass=key==='airports'?'airport':key==='navaids'?'navaid':key==='fixes'?'fix':'nav';
    const icon=L.divIcon({className:'rp-map-symbol rp-map-symbol-'+klass,html:'<span></span>',iconSize:[12,12],iconAnchor:[6,6]});
    return L.marker(ll,{pane,icon,interactive:true});
  }
  function popupFor(key,feature){
    const p=feature.properties||{};
    if(key==='tfr'){
      const id=field(p,['notamId','NOTAM_KEY']),type=field(p,['type','TYPE']),desc=field(p,['description','TITLE']);
      const status=field(p,['status']);
      const link=field(p,['detailUrl']);
      return '<div class="rp-route-popup"><b>'+esc(id||'FAA TFR')+'</b><br>'+esc(type)+(status?' · '+esc(status):'')+'<br>'+esc(desc)+(link?'<br><a href="'+esc(link)+'" target="_blank" rel="noopener">Open FAA restriction</a>':'')+'</div>';
    }
    if(key==='metar'){
      const id=field(p,['icaoId','id','stationId']),cat=field(p,['fltCat','flightCategory']),raw=field(p,['rawOb','raw_text','raw']);
      return '<div class="rp-route-popup"><b>'+esc(id||'METAR')+'</b>'+(cat?' · '+esc(cat):'')+'<br>'+esc(raw||'Observation available')+'</div>';
    }
    if(key==='pirep'){
      const raw=field(p,['rawOb','raw_text','raw']),alt=field(p,['fltLvl','altitude','alt']);
      return '<div class="rp-route-popup"><b>PIREP'+(alt?' · '+esc(alt):'')+'</b><br>'+esc(raw||'Pilot report')+'</div>';
    }
    if(key==='airsigmet'||key==='gairmet'||key==='cwa'){
      const hazard=field(p,['hazard','hazardType','type','seriesId']),raw=field(p,['rawAirSigmet','rawOb','rawText','raw']);
      return '<div class="rp-route-popup"><b>'+esc(key==='airsigmet'?'SIGMET':key==='gairmet'?'G-AIRMET':'CWA')+(hazard?' · '+esc(hazard):'')+'</b><br>'+esc(raw||'Current advisory')+'</div>';
    }
    const name=field(p,['IDENT','ident','ID','NAME','name','DESIGNATOR','designator']);
    const type=field(p,['TYPE_CODE','TYPE','type','CLASS','CLASS_B']);
    const alt=field(p,['UPPER_DESC','LOWER_DESC','UPPER_VAL','LOWER_VAL','ELEVATION','MSL','AGL']);
    return '<div class="rp-route-popup"><b>'+esc(name||key.toUpperCase())+'</b>'+(type?'<br>'+esc(type):'')+(alt?'<br>'+esc(alt):'')+'<br><span class="rp-mini">FAA / AWC live planning data</span></div>';
  }
  function renderGeoLayer(key,geojson){
    const g=ensureGroup(key);
    g.clearLayers();
    const layer=L.geoJSON(geojson,{
      pane:paneFor(key),
      style:f=>styleFor(key,f),
      pointToLayer:(f,ll)=>pointFor(key,f,ll),
      onEachFeature:(f,l)=>{
        l.bindPopup(popupFor(key,f));
        if((key==='airports'||key==='navaids'||key==='fixes')&&map.getZoom()>=9){
          const name=field(f.properties||{},['IDENT','ident','ID','NAME','name']);
          if(name)l.bindTooltip(esc(name),{permanent:true,direction:'right',className:'rp-nav-label',offset:[6,0]});
        }
      }
    });
    layer.addTo(g);
  }
  function refreshVectorStyles(){
    Object.keys(groups).forEach(key=>{
      groups[key].eachLayer(child=>{
        if(child.eachLayer)child.eachLayer(l=>{if(l.setStyle&&l.feature)l.setStyle(styleFor(key,l.feature))});
        else if(child.setStyle&&child.feature)child.setStyle(styleFor(key,child.feature));
      });
    });
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
      size:[Math.max(600,Math.min(1800,size.x*2)),Math.max(400,Math.min(1400,size.y*2))].join(','),
      format:'png32',
      transparent:'true',
      interpolation:'RSP_BilinearInterpolation',
      f:'image'
    });
    if(time)params.set('time',String(time));
    return RADAR+'?'+params.toString();
  }
  function refreshRadar(){
    if(!state.enabled.radar)return;
    const b=map.getBounds(),url=radarUrl(b,radarFrameTime());
    if(radarOverlay)map.removeLayer(radarOverlay);
    radarOverlay=L.imageOverlay(url,b,{pane:'pdRadarPane',opacity:state.radarOpacity,interactive:false});
    radarOverlay.addTo(map);
    setLayerStatus('radar',Number(radarSlider.value)===24?'live':'history','live');
  }
  function removeRadar(){
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

  async function loadNotams(){
    notamGroup.clearLayers();
    if(!state.enabled.notams)return;
    const pts=RP.getPoints();
    const candidates=pts.filter(p=>/^[A-Z0-9]{4}$/.test(String(p.id||''))).slice(0,8);
    if(!candidates.length){setLayerStatus('notams','route','idle');renderBrief();return}
    setLayerStatus('notams','loading','loading');
    let configured=true,total=0;
    await Promise.all(candidates.map(async p=>{
      const id=String(p.id).toUpperCase();
      try{
        const j=await fetchJson('/api/notams?station='+encodeURIComponent(id));
        notams[id]=j;total+=Number(j.count||0);
        if(Number(j.count||0)>0){
          const icon=L.divIcon({className:'rp-notam-marker',html:'<span>!</span><b>'+Number(j.count||0)+'</b>',iconSize:[30,22],iconAnchor:[15,11]});
          L.marker([p.lat,p.lon],{pane:'pdNotamPane',icon}).addTo(notamGroup).bindPopup(notamPopup(id,j));
        }
      }catch(e){
        const payload=e.payload||{};
        notams[id]=payload;
        if(payload.configured===false)configured=false;
      }
    }));
    setLayerStatus('notams',configured?String(total):'setup','live');
    renderBrief();
  }
  function notamPopup(id,j){
    const counts=j.counts||{};
    const summary=Object.keys(counts).filter(k=>counts[k]).map(k=>k+' '+counts[k]).join(' · ');
    const rows=(j.notams||[]).slice(0,6).map(n=>'<div class="rp-notam-item"><b>'+esc(n.category||'NOTAM')+(n.number?' · '+esc(n.number):'')+'</b><span>'+esc(n.text||'')+'</span></div>').join('');
    return '<div class="rp-route-popup rp-notam-popup"><b>'+esc(id)+' NOTAMs · '+Number(j.count||0)+'</b>'+(summary?'<br>'+esc(summary):'')+rows+'<a href="https://notams.aim.faa.gov/notamSearch/" target="_blank" rel="noopener">Open FAA NOTAM Search</a></div>';
  }

  async function loadBriefWeather(seq){
    const pts=RP.getPoints();
    if(pts.length<2)return;
    const dep=String(pts[0].id||''),dst=String(pts[pts.length-1].id||'');
    const request=id=>/^[A-Z0-9]{3,4}$/.test(id)?fetchJson('/api/weather?station='+encodeURIComponent(id)).catch(e=>({station:id,error:e.message})):Promise.resolve(null);
    const result=await Promise.all([request(dep),request(dst)]);
    if(seq!==routeContextSeq)return;
    briefWx.dep=result[0];briefWx.dst=result[1];
  }

  function flattenRings(geometry){
    if(!geometry)return[];
    if(geometry.type==='Polygon')return geometry.coordinates||[];
    if(geometry.type==='MultiPolygon')return (geometry.coordinates||[]).flat();
    return[];
  }
  function xy(coord,lat0){
    return {x:Number(coord[0])*Math.cos(lat0*Math.PI/180)*60,y:Number(coord[1])*60};
  }
  function orient(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
  function intersects(a,b,c,d){
    const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
    return ((o1===0||o2===0||o1*o2<0)&&(o3===0||o4===0||o3*o4<0));
  }
  function pointInRing(point,ring){
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=Number(ring[i][0]),yi=Number(ring[i][1]),xj=Number(ring[j][0]),yj=Number(ring[j][1]);
      const cross=((yi>point[1])!==(yj>point[1]))&&(point[0]<(xj-xi)*(point[1]-yi)/((yj-yi)||1e-12)+xi);
      if(cross)inside=!inside;
    }
    return inside;
  }
  function pointSegDistanceNm(p,a,b){
    const lat0=(Number(p[1])+Number(a[1])+Number(b[1]))/3;
    const P=xy(p,lat0),A=xy(a,lat0),B=xy(b,lat0);
    const dx=B.x-A.x,dy=B.y-A.y,l2=dx*dx+dy*dy;
    if(!l2)return Math.hypot(P.x-A.x,P.y-A.y);
    const t=Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/l2));
    return Math.hypot(P.x-(A.x+t*dx),P.y-(A.y+t*dy));
  }
  function relationToRoute(feature){
    const pts=RP.getPoints();
    if(pts.length<2)return {intersects:false,distanceNm:Infinity};
    const route=pts.map(p=>[Number(p.lon),Number(p.lat)]);
    const rings=flattenRings(feature&&feature.geometry);
    if(!rings.length)return {intersects:false,distanceNm:Infinity};
    for(const ring of rings){
      if(route.some(p=>pointInRing(p,ring)))return {intersects:true,distanceNm:0};
      for(let i=0;i<route.length-1;i++){
        const lat0=(route[i][1]+route[i+1][1])/2,A=xy(route[i],lat0),B=xy(route[i+1],lat0);
        for(let j=0;j<ring.length-1;j++){
          if(intersects(A,B,xy(ring[j],lat0),xy(ring[j+1],lat0)))return {intersects:true,distanceNm:0};
        }
      }
    }
    let min=Infinity;
    for(const ring of rings)for(const v of ring)for(let i=0;i<route.length-1;i++)min=Math.min(min,pointSegDistanceNm(v,route[i],route[i+1]));
    return {intersects:false,distanceNm:min};
  }

  function wxSummary(x){
    if(!x)return 'Unavailable';
    if(x.error)return 'Unavailable';
    const m=x.metar||{},cat=m.fltCat||m.flightCategory||'';
    const raw=m.rawOb||m.raw_text||'METAR available';
    return (cat?cat+' · ':'')+raw;
  }
  function destinationNotam(){
    const pts=RP.getPoints(),dst=pts.length?String(pts[pts.length-1].id||'').toUpperCase():'';
    return notams[dst]||null;
  }
  function relevantFeatures(key,nearNm){
    const fc=data[key],features=(fc&&fc.features)||[];
    return features.map(f=>({feature:f,relation:relationToRoute(f)})).filter(x=>x.relation.intersects||(nearNm!=null&&x.relation.distanceNm<=nearNm));
  }

  function renderBrief(){
    const body=document.getElementById('rpBriefBody');
    if(!body)return;
    const pts=RP.getPoints();
    if(pts.length<2){
      body.innerHTML='<div class="rp-empty-state">Build a route to load route-specific weather, hazards, TFRs and NOTAM context.</div>';
      return;
    }
    const dep=pts[0].id,dst=pts[pts.length-1].id;
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
    if(dstCat==='IFR'||dstCat==='LIFR')flags.push(['warn','DESTINATION '+dstCat]);
    if(dstNotam&&Number(dstNotam.count||0))flags.push(['info','DESTINATION NOTAM · '+Number(dstNotam.count||0)]);
    if(!flags.length&&!briefLoading)flags.push(['ok','NO AUTOMATIC ROUTE FLAGS']);
    const notamText=dstNotam?(dstNotam.configured===false?'FAA NOTAM API needs server credentials.':Number(dstNotam.count||0)+' current notices returned.'):'Not yet loaded.';
    const hazards=[
      sigRel.length?sigRel.length+' SIGMET route intersection'+(sigRel.length===1?'':'s'):null,
      gairRel.length?gairRel.length+' G-AIRMET route intersection'+(gairRel.length===1?'':'s'):null,
      tfrRel.length?tfrRel.length+' TFR route/near-route item'+(tfrRel.length===1?'':'s'):null
    ].filter(Boolean).join(' · ')||'No route intersections detected in currently loaded advisory data.';
    body.innerHTML=[
      '<div class="rp-brief-route"><span>'+esc(dep)+'</span><i>→</i><span>'+esc(dst)+'</span></div>',
      '<div class="rp-brief-flags">'+flags.map(x=>'<span data-kind="'+x[0]+'">'+esc(x[1])+'</span>').join('')+'</div>',
      briefSection('Departure weather',wxSummary(briefWx.dep)),
      briefSection('Enroute hazards',hazards),
      briefSection('TFRs',tfrRel.length?hazardsPart(tfrRel):'No route/near-route TFR geometry detected in loaded FAA data.'),
      briefSection('Destination weather',wxSummary(briefWx.dst)),
      briefSection('NOTAMs',notamText),
      '<div class="rp-brief-source">Automatic flags describe data relationships only; they are not a go/no-go decision. <a href="https://www.1800wxbrief.com/" target="_blank" rel="noopener">Official briefing</a></div>'
    ].join('');
  }
  function briefSection(title,text){return '<section class="rp-brief-section"><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p></section>'}
  function hazardsPart(items){
    return items.slice(0,4).map(x=>{
      const p=x.feature.properties||{},id=field(p,['notamId','NOTAM_KEY'])||'TFR',d=x.relation.intersects?'intersects route':fmt(x.relation.distanceNm,1)+' NM from route';
      return String(id)+' · '+d;
    }).join(' · ');
  }

  async function loadRouteContext(){
    const pts=RP.getPoints();
    if(pts.length<2){renderBrief();return}
    const seq=++routeContextSeq;
    briefLoading=true;renderBrief();
    await Promise.all([
      loadBriefWeather(seq),
      ensureData('tfr',true),
      ensureData('airsigmet',true),
      ensureData('gairmet',true),
      state.enabled.notams?loadNotams():Promise.resolve()
    ]);
    if(seq!==routeContextSeq)return;
    briefLoading=false;renderBrief();renderRings();
  }

  function showLeg(leg){
    if(!leg){legStrip.hidden=true;return}
    legStrip.hidden=false;
    legStrip.innerHTML=[
      '<div class="rp-leg-strip-route"><span>'+esc(leg.from)+'</span><i>→</i><span>'+esc(leg.to)+'</span></div>',
      metric('TC',fmt(leg.course,0)+'°'),
      metric('MH',fmt(leg.mag,0)+'°'),
      metric('GS',fmt(leg.gs,0)+' kt'),
      metric('ETE',fmt(Number(leg.hours)*60,0)+' min'),
      metric('FUEL',fmt(leg.legFuel,1)+' gal')
    ].join('');
  }
  function metric(label,value){return '<div><small>'+label+'</small><b>'+value+'</b></div>'}

  let moveTimer=null;
  map.on('zoomend',()=>{
    if(state.baseMode==='auto')applyAutoChart();
    syncBaseRadios();
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
  document.addEventListener('pilotdesk:route-built',()=>setTimeout(loadRouteContext,120));
  document.addEventListener('pilotdesk:leg-selected',e=>showLeg(e.detail&&e.detail.leg));
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(!panel.hidden)closePanel(panel,layersButton);
    if(!brief.hidden)closePanel(brief,briefButton);
  });

  if(state.baseMode==='auto')applyAutoChart();else setBase(state.baseMode);
  Object.keys(state.enabled).forEach(key=>{if(state.enabled[key])toggleLayer(key,true)});
  setTimeout(()=>{
    if(RP.getPoints().length>1)void loadRouteContext();
  },250);
}
})();
