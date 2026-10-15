import {stationModes,stationLabel,number,airportCategory,airspaceBelow,navLevel,hazardMatches,safeBounds,faaQueryUrl} from './public-layer-core.mjs';
const WEATHER={
  radarcomp:{url:'https://opengeo.ncep.noaa.gov/geoserver/conus/ows',layer:'conus_cref_qcd',label:'NOAA CONUS composite reflectivity'},
  radar_lowest_tilt:{url:'https://opengeo.ncep.noaa.gov/geoserver/conus/ows',layer:'conus_bref_qcd',label:'NOAA CONUS base reflectivity mosaic'},
  satellite:{url:'https://nowcoast.noaa.gov/geoserver/observations/satellite/ows',layer:'global_visible_imagery_mosaic',label:'NOAA visible imagery · daylight alternative'},
  satelliteir:{url:'https://nowcoast.noaa.gov/geoserver/observations/satellite/ows',layer:'global_longwave_imagery_mosaic',label:'NOAA longwave IR · grayscale alternative'},
  lightning:{url:'https://nowcoast.noaa.gov/geoserver/wms',layer:'lightning_detection:ldn_lightning_strike_density',label:'NOAA lightning density · not individual strikes'},
};
const FAA_IDS={
  'aero/airports':'airports','aero/heli':'airports','aero/privateAP':'airports','aero/seaplane':'airports','aero/other':'airports',
  'aero/airspace':'airspace','aero/controlled':'airspace','aero/classE':'airspace','aero/modeC':'airspace',
  'aero/adiz':'boundaries','aero/artcc':'boundaries','aero/artcc_firs':'boundaries','aero/atc_sectors':'boundaries',
  'aero/suaMoa':'sua','mfb/mtr_instrument':'mtr','mfb/mtr_visual':'mtr','mfb/mtr_wplabels':'mtr',
  'aero/airways':'airways','aero/navaids':'navaids','aero/waypoints':'fixes',
};
const CONTROLS=new Set(['aero','aero/hideAirspaceAbove','aero/navlevel','aero/artcclevel','altitude']);
const REASONS={traffic:'A traffic provider with permitted redistribution is required',fuelPrices:'A public fuel-price feed has not been verified',jepp:'Licensed chart access is required',chart2:'These chart products need a verified tile source',chartHeli:'These chart products need a verified tile source',gafor:'A regional public GAFOR geometry/feed is required',customAirports:'Import user airport data to supply this layer','mfb/mtr_slow':'FAA MTR feed does not include slow routes','mfb/ars':'A public refueling-route feed has not been verified','aero/gridmora':'Licensed MORA/LSALT data is required','aero/pja':'A public parachute-area geometry feed has not been verified','aero/trsa':'A public TRSA geometry feed has not been verified','aero/artcc_fisas':'A public FISA geometry feed has not been verified','aero/vfr':'A complete public VFR-elements feed has not been verified',ots:'A public organized-track feed has not been verified',otseast:'Requires an organized-track feed',otswest:'Requires an organized-track feed',coverage:'Radar coverage geometry has not been verified','aero/theme':'A themed aeronautical basemap renderer is required','aero/quick-toggles':'Select the individual connected filters below'};
export function supported(id,value){return id==='map'||id==='lightning'||id==='windsAloft'||id==='wxStations'&&(stationModes.has(value)||value==='windsaloft')||id==='wxImagery'&&(value in WEATHER||value==='observedTurbulence')||id in FAA_IDS||id.startsWith('cultural/')||id==='place_labels'||id==='terrain/peaks_passes'||id==='airSigmets'||id.startsWith('airSigmets/')||CONTROLS.has(id)}
export function sourceDescription(id,value){
  if(id==='map')return value==='aerial'?'USGS aerial imagery · U.S. coverage':'OpenStreetMap street tiles';
  if(id==='windsAloft')return 'AWC / NWS station wind forecasts';
  if(id==='wxStations')return value==='windsaloft'?'AWC/NWS CONUS station forecasts':'AWC station observations';
  if(id==='lightning')return WEATHER.lightning.label;
  if(id==='wxImagery')return WEATHER[value]?.label||(value==='observedTurbulence'?'AWC turbulence PIREPs · report locations only':value?.includes('global')?'Global gridded forecast integration requires a provider':'Public gridded forecast integration is not connected');
  if(id==='mfb/mtr_wplabels')return 'FAA MTR route identifiers · waypoint names unavailable';
  if(id==='aero/atc_sectors')return 'FAA boundary sector attributes · incomplete sector coverage';
  if(id in FAA_IDS)return 'FAA airspace and navigation data';
  if(id.startsWith('cultural/')||id==='place_labels'||id==='terrain/peaks_passes')return 'OpenStreetMap / Overpass · close-up detail';
  if(id==='airSigmets'||id.startsWith('airSigmets/'))return 'AWC SIGMET / G-AIRMET / CWA advisories';
  if(CONTROLS.has(id))return 'Local filter for connected public layers';
  return REASONS[id]||'A permitted public data connection is still required';
}
export function createPublicLayers(win,onStatus){
  const L=win.L,map=win.PilotDeskRoutePlanner.getMap(),groups=new Map(),states=new Map(),cache=new Map();
  let selection={},generation=0,controller=null,timer=0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const set=(id,text)=>{states.set(id,text);onStatus()};
  function clear(){for(const g of groups.values())map.removeLayer(g);groups.clear()}
  async function load(url,signal){
    const old=cache.get(url);if(old&&Date.now()-old.at<60000)return old.data;
    const params=new URL(url,'https://www.pilot-desk.com').searchParams;let r,j;
    if(params.get('adapter')==='faa'){
      const direct=faaQueryUrl(params.get('product'),params.get('bbox').split(',').map(Number));
      try{
        r=await fetch(direct,{signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])});const geojson=await r.json();
        if(!r.ok||geojson.error){const error=Error((r.status===429||geojson.error?.code===429)?'FAA request limit reached. Try again later.':'FAA map service unavailable.');error.sourceResponse=true;throw error}
        j={geojson,sourceUrl:direct.split('/query?')[0],fetchedAt:new Date().toISOString(),possiblyTruncated:geojson.exceededTransferLimit===true||geojson.features?.length>=2000};
      }catch(error){if(signal.aborted||error.name==='AbortError'||error.sourceResponse)throw error;r=await fetch(url,{signal});j=await r.json()}
    }else{r=await fetch(url,{signal});j=await r.json()}
    if(!r.ok)throw Error(j.error||'Public feed unavailable.');if(j.geojson?.type!=='FeatureCollection'||!Array.isArray(j.geojson.features))throw Error('Public feed returned unreadable geometry.');cache.set(url,{at:Date.now(),data:j});if(cache.size>40)cache.delete(cache.keys().next().value);return j;
  }
  function popup(feature){const p=feature.properties||{},box=win.document.createElement('div');const head=win.document.createElement('strong');head.textContent=p.NAME||p.name||p.site||p.station||p.IDENT||'Map feature';box.append(head);for(const [key,value] of Object.entries(p).filter(([k,v])=>!k.startsWith('_')&&v!==null&&typeof v!=='object').slice(0,18)){const row=win.document.createElement('div');row.textContent=key+': '+String(value).slice(0,400);box.append(row)}return box}
  function render(key,data,options={}){
    const group=L.geoJSON(data.geojson,{attribution:options.attribution||'Public FAA / AWC data',style:()=>({color:options.color||'#79adf5',weight:2,opacity:(selection.wxOpacity??80)/100,fillOpacity:.06}),filter:f=>(!options.filter||options.filter(f))&&(!options.label||options.label(f.properties||{})!==null),pointToLayer:(f,ll)=>{if(options.winds&&win.PilotDeskMetar){const p=f.properties||{},label=options.label(p),symbol=win.PilotDeskMetar.wind({speed:p.speed,gust:null,direction:p.direction,variable:p.variable});return L.marker(ll,{icon:L.divIcon({className:'pd-wind-marker',html:'<svg viewBox="-24 -46 48 64" aria-hidden="true">'+symbol+'</svg><span>'+esc(label)+'</span>',iconSize:[82,62],iconAnchor:[41,28]}),title:label+' · '+p.altitude+' ft MSL'})}if(options.station&&win.PilotDeskMetar&&map.getZoom()>=8){const m=win.PilotDeskMetar.model(f.properties||{});return L.marker(ll,{icon:L.divIcon({className:'pd-metar-map',html:m.html,iconSize:[90.75,77],iconAnchor:[41.25,35.75]}),title:m.label})}const label=options.label?.(f.properties||{});return label?L.marker(ll,{icon:L.divIcon({className:'pd-public-marker',html:'<span>'+esc(label)+'</span>',iconSize:null}),title:String(label)}):L.circleMarker(ll,{radius:5,color:options.color||'#79adf5',weight:2,fillOpacity:.8})},onEachFeature:(f,l)=>{if(options.winds){const p=f.properties||{};l.bindPopup('<b>Winds aloft · '+esc(p.altitude)+' ft MSL</b><p>'+esc(options.label(p))+'</p><p>'+(p.interpolated?'Interpolated from ':'Station ')+esc((p.sources||[]).join(', '))+'</p><p>Valid '+esc(data.validAt||'—')+'</p>')}else if(options.station){const box=win.document.createElement('div'),plot=win.document.createElement('div'),raw=win.document.createElement('p');plot.dataset.pdMetar=JSON.stringify(f.properties||{});raw.textContent=f.properties?.rawOb||f.properties?.raw||'';box.append(plot,raw);l.bindPopup(box)}else l.bindPopup(popup(f));if(options.tooltip&&f.properties?.IDENT)l.bindTooltip(esc(f.properties.IDENT),{permanent:true})}});group.addTo(map);groups.set(key,group);return group;
  }
  function active(id){return selection[id]===true}
  function stamp(data){const t=data.sourceUpdatedAt||data.validAt||data.fetchedAt,label=data.sourceUpdatedAt?'source updated':data.validAt?'forecast valid':'retrieved';return t?' · '+label+' '+new Date(t).toISOString().slice(0,16).replace('T',' ')+'Z':''}
  async function dataset(key,ids,url,options,token,signal){ids.forEach(id=>set(id,'Loading · '+sourceDescription(id,selection[id])));try{const data=await load(url,signal);if(token!==generation)return;const group=render(key,data,options);const count=group.getLayers().length;ids.forEach(id=>set(id,(data.possiblyTruncated||data.partial?'Partial · '+count+' features':count?'Available · '+count+' features':data.geojson.features.length?'No features match the selected filters':'No features in this map area')+stamp(data)+(data.validTo?' · valid to '+data.validTo:'')))}catch(error){if(token!==generation||error.name==='AbortError')return;ids.forEach(id=>set(id,'Unavailable · '+error.message))}}
  async function tiles(key,source,ids,token,product,signal){
    ids.forEach(id=>set(id,'Loading · '+source.label));
    try{const response=await fetch('/api/aviation-layers?adapter=imagery&product='+product,{signal}),meta=await response.json();if(!response.ok||!Number.isFinite(Date.parse(meta.frameTime)))throw Error(meta.error||'Public imagery metadata unavailable.');if(token!==generation)return;
      const old=Date.now()-Date.parse(meta.frameTime)>(product.startsWith('radar')?30*60000:4*3600000);
      const layer=L.tileLayer.wms(source.url,{layers:source.layer,time:meta.frameTime,format:'image/png',transparent:true,version:'1.3.0',opacity:(selection.wxOpacity??80)/100,attribution:'NOAA / NWS',zIndex:340,updateWhenIdle:true,keepBuffer:0});groups.set(key,layer);let failed=false;
      layer.on('tileerror',()=>{if(token!==generation)return;failed=true;ids.forEach(id=>set(id,'Unavailable or partial · '+source.label))});layer.on('load',()=>{if(token===generation&&!failed)ids.forEach(id=>set(id,(old?'Partial · older frame':'Available')+' · '+source.label+' · frame '+meta.frameTime))});layer.addTo(map);
    }catch(error){if(token===generation&&error.name!=='AbortError')ids.forEach(id=>set(id,'Unavailable · '+error.message))}
  }
  async function refresh(){
    const token=++generation;controller?.abort();controller=new AbortController();const signal=controller.signal;clear();states.clear();
    const b=safeBounds(map.getBounds());if(!b){for(const id of Object.keys(selection).filter(id=>selection[id]&&supported(id,selection[id])))set(id,'Unavailable · pan away from wrapped longitude bounds');onStatus();return}
    const bounds=encodeURIComponent(b.map(v=>v.toFixed(4)).join(',')),lat=(b[0]+b[2])/2,lon=(b[1]+b[3])/2,stationBounds=encodeURIComponent([Math.max(-85,Math.min(b[0],lat-.25)),Math.max(-180,Math.min(b[1],lon-.25)),Math.min(85,Math.max(b[2],lat+.25)),Math.min(180,Math.max(b[3],lon+.25))].map(v=>v.toFixed(4)).join(',')),requests=[];
    if(selection.map){const aerial=selection.map==='aerial';const layer=L.tileLayer(aerial?'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}':'https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:aerial?'USGS The National Map':'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',zIndex:325,maxNativeZoom:aerial?19:19,updateWhenIdle:true,keepBuffer:0});groups.set('base',layer);layer.on('tileerror',()=>token===generation&&set('map','Unavailable or partial · '+sourceDescription('map',selection.map)));layer.on('load',()=>token===generation&&!states.get('map')?.startsWith('Unavailable')&&set('map','Available · '+sourceDescription('map',selection.map)));set('map','Loading · '+sourceDescription('map',selection.map));layer.addTo(map)}
    if(WEATHER[selection.wxImagery])requests.push(tiles('weather',WEATHER[selection.wxImagery],['wxImagery'],token,selection.wxImagery,signal));
    if(active('lightning'))requests.push(tiles('lightning',WEATHER.lightning,['lightning'],token,'lightning',signal));
    if(stationModes.has(selection.wxStations)){const mode=selection.wxStations;requests.push(dataset('stations',['wxStations'],'/api/aviation-layers?product=metar&bbox='+stationBounds,{station:mode==='category',label:p=>{const value=stationLabel(p,mode),time=Date.parse(p.obsTime);return value===null?null:(Number.isFinite(time)&&Date.now()-time>2*3600000?'STALE ':'')+value},color:'#70c9a1'},token,signal))}
    if(selection.windsAloft||selection.wxStations==='windsaloft')requests.push(dataset('winds',[selection.windsAloft?'windsAloft':'wxStations'],'/api/aviation-layers?adapter=winds&bbox='+bounds+'&altitude='+(selection.altitude??18000),{winds:true,label:p=>(p.variable?'VRB':String(Math.round(p.direction)).padStart(3,'0')+'°')+' '+Math.round(p.speed)+' kt'},token,signal));
    if(selection.wxImagery==='observedTurbulence')requests.push(dataset('turbulence-reports',['wxImagery'],'/api/aviation-layers?product=pirep&bbox='+bounds,{filter:f=>f.properties?.tbInt!==null&&f.properties?.tbInt!==undefined||/\/TB\b/.test(f.properties?.rawOb||''),color:'#e8b05f'},token,signal));
    const advisoryIds=['airSigmets',...Object.keys(selection).filter(k=>k.startsWith('airSigmets/'))].filter(active);
    if(advisoryIds.length){const filter=f=>hazardMatches(f.properties||{},advisoryIds.filter(id=>id.includes('/')));for(const product of ['sigmet','gairmet','cwa'])requests.push(dataset('advisory-'+product,advisoryIds.map(id=>id+'@'+product),'/api/aviation-layers?product='+product+'&bbox='+bounds,{filter,color:'#e8b05f'},token,signal))}
    const desired=new Map();for(const [id,product] of Object.entries(FAA_IDS))if(active(id)){if(!desired.has(product))desired.set(product,[]);desired.get(product).push(id)}
    if(active('aero')&&!desired.has('airports'))desired.set('airports',['aero']);
    for(const [product,ids] of desired){
      const filter=f=>{const p=f.properties||{};if(product==='airports')return ids.includes('aero')||ids.some(id=>id==='aero/'+airportCategory(p));if(['airways','navaids','fixes'].includes(product))return !selection['aero/navlevel']||navLevel(p,selection['aero/navlevel']);if(!airspaceBelow(p,selection['aero/hideAirspaceAbove']??18000))return false;if(product==='airspace')return ids.includes('aero/airspace')||ids.some(id=>id==='aero/classE'?p.CLASS==='E':id==='aero/modeC'?p.TYPE_CODE==='MODE-C':['A','B','C','D'].includes(p.CLASS));if(product==='mtr')return ids.includes('mfb/mtr_wplabels')||ids.some(id=>id.endsWith('instrument')?number(p.MTR_TYPE)===0:number(p.MTR_TYPE)===1);if(product==='boundaries')return ids.some(id=>id==='aero/adiz'?p.TYPE_CODE==='ADIZ':id==='aero/atc_sectors'?!!p.SECTOR:['ARTCC','FIR','ACC'].includes(p.TYPE_CODE))&&(!selection['aero/artcclevel']||p.LEVEL_===(selection['aero/artcclevel']==='high'?'U':'L')||p.LEVEL_==='B');return true};
      const label=product==='airports'?p=>p.IDENT||p.ICAO_ID||null:undefined;
      requests.push(dataset('faa-'+product,ids,'/api/aviation-layers?adapter=faa&product='+product+'&bbox='+bounds,{filter,label,tooltip:product==='mtr'&&active('mfb/mtr_wplabels'),color:product==='mtr'?'#c3a6ff':'#79adf5'},token,signal));
    }
    const cultural=Object.keys(selection).filter(id=>selection[id]===true&&(id.startsWith('cultural/')||id==='place_labels'||id==='terrain/peaks_passes'));
    requests.push((async()=>{for(const id of cultural){if(token!==generation)break;const product=id.split('/').at(-1);await dataset(id,[id],'/api/aviation-layers?adapter=cultural&product='+product+'&bbox='+bounds,{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',label:id==='place_labels'||id==='terrain/peaks_passes'?p=>p.name||p.ele||null:undefined,color:'#9ac9a0'},token,signal)}})());
    await Promise.allSettled(requests);if(token===generation)onStatus();
  }
  const move=()=>{generation++;controller?.abort();clearTimeout(timer);timer=setTimeout(refresh,500)};
  win.document.addEventListener('pilotdesk:metar-units-changed',move);win.document.addEventListener('pilotdesk:metar-ready',move);
  map.on('moveend',move);const polling=setInterval(()=>{if(Object.values(selection).some(v=>v===true||typeof v==='string'&&v))refresh()},300000);
  return {sync(value){generation++;controller?.abort();selection={...value};clearTimeout(timer);timer=setTimeout(refresh,150)},status(id){if(id==='airSigmets'||id.startsWith('airSigmets/')){const products=['sigmet','gairmet','cwa'].map(p=>states.get(id+'@'+p)).filter(Boolean);if(products.length)return products.some(s=>s.startsWith('Unavailable')||s.startsWith('Partial'))?'Partial or unavailable · '+products.join('; '):products.some(s=>s.startsWith('Loading'))?'Loading advisory packages':products.join('; ')}return states.get(id)},dispose(){generation++;controller?.abort();clearTimeout(timer);clearInterval(polling);map.off('moveend',move);win.document.removeEventListener('pilotdesk:metar-units-changed',move);win.document.removeEventListener('pilotdesk:metar-ready',move);clear()}};
}
