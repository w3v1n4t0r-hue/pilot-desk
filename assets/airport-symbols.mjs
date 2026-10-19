import {symbolSvg,visibleAirports} from './airport-symbol-core.mjs';
const instances=new WeakMap();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dataPromise;
function data(){return dataPromise??=fetch('/data/airports/symbols.json',{signal:AbortSignal.timeout(12000)}).then(r=>{if(!r.ok)throw Error('Airport symbols unavailable');return r.json()}).then(j=>{if(j.schema!==1||!Array.isArray(j.records))throw Error('Airport symbol format unavailable');return j}).catch(e=>{dataPromise=null;throw e})}
export function airportOverlay(map,L){
 if(instances.has(map))return instances.get(map);
 const pane=map.getPane('pdAirportPane')||map.createPane('pdAirportPane');pane.style.zIndex='450';
 const group=L.layerGroup().addTo(map),markers=new Map(),icons=new Map(),records=new Map();let ids=['aero'],revision=0,timer,weatherFrame=0,status='';
 const note=L.control({position:'bottomleft'});note.onAdd=()=>{const node=L.DomUtil.create('div','pd-airport-status');node.setAttribute('role','status');return node};note.addTo(map);
 const setStatus=text=>{status=text;note.getContainer().textContent=text;note.getContainer().hidden=!text};
 function weatherStations(){
  const stations=new Set();map.eachLayer(layer=>{const p=layer.feature?.properties||{},kind=layer.options?.icon?.options?.className||'';
   if(!/pd-metar-map|pd-flight-category/.test(kind)&&!p.fltCat&&!p.fltcat)return;
   const id=p.icaoId||p.stationId||p.station||String(layer.options?.title||'').match(/^[A-Z0-9]{3,7}(?=\s|$)/)?.[0];if(id)stations.add(id);
  });return stations;
 }
 function weatherVisibility(){
  const stations=weatherStations();
  for(const [id,marker] of markers){const node=marker.getElement();if(!node)continue;const hidden=stations.has(id);node.style.display=hidden?'none':'';node.tabIndex=hidden?-1:0;node.setAttribute('aria-hidden',String(hidden))}
  map.eachLayer(layer=>{const node=layer.getElement?.(),plot=node?.querySelector('.pd-metar-plot');if(!plot)return;
   const p=layer.feature?.properties||{},id=p.icaoId||p.stationId||p.station||String(layer.options?.title||'').match(/^[A-Z0-9]{3,7}(?=\s|$)/)?.[0],airport=records.get(id);if(!airport)return;
   const position=layer.getLatLng?.();if(position&&(position.lat!==airport.lat||position.lng!==airport.lon))layer.setLatLng([airport.lat,airport.lon]);
   if(plot.querySelector('[data-pd-airport-center]'))return;
   const sky=plot.querySelector('.pd-metar-sky');if(!sky)return;
   const icon=new DOMParser().parseFromString(symbolSvg(airport),'image/svg+xml').documentElement;
   icon.setAttribute('x','-16');icon.setAttribute('y','-16');icon.setAttribute('width','32');icon.setAttribute('height','32');icon.setAttribute('data-pd-airport-center',id);
   sky.setAttribute('transform','translate(0 24) scale(.6)');sky.parentNode.append(document.importNode(icon,true));
  });
 }
 function refreshWeather(){if(!records.size&&weatherStations().size){void update();return}weatherVisibility()}
 function weatherChange(event){const p=event.layer?.feature?.properties||{},kind=event.layer?.options?.icon?.options?.className||'';if(!weatherFrame&&(/pd-metar-map|pd-flight-category/.test(kind)||p.fltCat||p.fltcat))weatherFrame=requestAnimationFrame(()=>{weatherFrame=0;refreshWeather()})}
 async function update(){
  const token=++revision;
  if((!ids.length&&!weatherStations().size)||map.getZoom()<5){group.clearLayers();markers.clear();setStatus('');return}
  try{
   const source=await data();if(token!==revision)return;
   if(!records.size)for(const a of source.records)records.set(a.id,a);
   const b=map.getBounds(),west=b.getWest(),east=b.getEast();
   const candidates=visibleAirports(source.records,{south:b.getSouth(),north:b.getNorth(),west,east},map.getZoom(),ids),visible=candidates.slice(0,350),wanted=new Set(visible.map(a=>a.id));
   for(const [id,marker] of markers)if(!wanted.has(id)){group.removeLayer(marker);markers.delete(id)}
   for(const a of visible){if(markers.has(a.id))continue;
    let icon=icons.get(a.id);if(!icon){icon=L.divIcon({className:'pd-airport-marker',html:'<span class="pd-airport-ident">'+escape(a.id)+'</span>'+symbolSvg(a),iconSize:[44,44],iconAnchor:[22,22]});icons.set(a.id,icon);if(icons.size>700)icons.delete(icons.keys().next().value)}
    const marker=L.marker([a.lat,a.lon],{icon,pane:'pdAirportPane',bubblingMouseEvents:false,title:a.id+' · '+(a.tower?'Towered':'Non-towered')+' airport',alt:a.id+' airport information',riseOnHover:false});
    marker.on('click',event=>{if(window.PilotDeskRoutePlanner?.isPlotting?.()||document.getElementById('rpMeasure')?.getAttribute('aria-pressed')==='true'){map.fire('click',{latlng:marker.getLatLng(),originalEvent:event.originalEvent});return}import('./airport-panel.mjs').then(m=>m.openAirport(a.id)).catch(()=>setStatus('Airport information unavailable. Try again.'))});
    group.addLayer(marker);markers.set(a.id,marker);
    marker.getElement()?.addEventListener('keydown',event=>{if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();event.stopPropagation();marker.fire('click',{latlng:marker.getLatLng(),originalEvent:event})});
   }
   weatherVisibility();
   const stale=Date.now()>=Date.parse(source.expires)?' · Expired':'';
   setStatus('FAA airports · '+source.effective+stale+(candidates.length>visible.length?' · Zoom in for more airports':''));
  }catch{if(token!==revision)return;group.clearLayers();markers.clear();setStatus('Airport symbols unavailable · move map to retry')}
 }
 function move(){revision++;clearTimeout(timer);timer=setTimeout(update,120)}
 const observer=new MutationObserver(changes=>{if(changes.some(c=>c.target.closest?.('.pd-metar-map')||[...c.addedNodes].some(n=>n.matches?.('.pd-metar-map')||n.querySelector?.('.pd-metar-plot')))){if(!weatherFrame)weatherFrame=requestAnimationFrame(()=>{weatherFrame=0;refreshWeather()})}});
 observer.observe(map.getContainer(),{childList:true,subtree:true});
 map.on('moveend',move);map.on('layeradd layerremove',weatherChange);map.on('unload',()=>{revision++;clearTimeout(timer);cancelAnimationFrame(weatherFrame);observer.disconnect();map.off('moveend',move);map.off('layeradd layerremove',weatherChange);instances.delete(map)});
 const api={sync(value){ids=value.slice();return update()},start:()=>update(),status:()=>status};instances.set(map,api);
 let state={};try{state=JSON.parse(localStorage.getItem('pd-layer-test-v1')||'{}')||{}}catch{}
 ids=state.aero===false?Object.keys(state).filter(k=>k.startsWith('aero/')&&['airports','heli','privateAP','seaplane','other'].includes(k.split('/')[1])&&state[k]===true):['aero'];
 return api;
}
export async function syncAirportOverlay(map,L,ids){
 if(!ids.length&&!instances.has(map))return '';
 const overlay=airportOverlay(map,L);await overlay.sync(ids);return overlay.status();
}
