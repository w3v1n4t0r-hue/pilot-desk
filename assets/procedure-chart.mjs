const same = (a,b) => a && b && Math.abs(a.lat-b.lat)<.00001 && Math.abs(a.lon-b.lon)<.00001;
const point = leg => leg?.point && Number.isFinite(leg.point.lat) && Number.isFinite(leg.point.lon) ? leg.point : null;

// Only resolved IF/TF/DF geometry is drawn. Course, arc, vector and hold legs
// require their own path terminators; connecting their fixes would invent a route.
export function chartGeometry(groups) {
  const segments=[], fixes=[], omitted=[];
  for (const group of groups) {
    let segment=[], missed=false;
    const flush=()=>{if(segment.length>1)segments.push(segment);segment=[]};
    for (const leg of group.legs||[]) {
      missed ||= !!leg.missed;
      if (missed) { flush(); continue; }
      const p=point(leg);
      if (!p || !['IF','TF','DF'].includes(leg.path)) {flush();omitted.push(leg.path||'unresolved');continue;}
      if (leg.path==='IF') flush();
      if (!same(segment.at(-1),p)) segment.push(p);
      if (!fixes.some(f=>same(f,p)&&f.id===p.id)) fixes.push({...p,altitude1:leg.altitude1,altitude2:leg.altitude2,altitudeDescription:leg.altitudeDescription,speed:leg.speed});
    }
    flush();
  }
  return {segments,fixes,omitted};
}

const overlays=new WeakMap();
function node(tag,text){const n=document.createElement(tag);if(text)n.textContent=text;return n;}
export function procedureLabel(id,type){
  const rnav=type==='PF'&&/^R(\d{2}[LRC]?)-?([A-Z])?$/.exec(id);
  return rnav?`RNAV (GPS)${rnav[2]?' '+rnav[2]:''} RWY ${rnav[1]} · ${id}`:id;
}
export async function mountProcedureChart(host, airport) {
  host.className='rp-procedure-chart';
  host.append(node('h3','Load procedure on chart'));
  const status=node('p','Loading FAA coded procedures…');status.setAttribute('role','status');host.append(status);
  try {
    const data=await window.PilotDeskRouteNavigation.request('procedures',airport);
    if (!host.isConnected) return;
    const groups=data.procedures||[], source=data.source||{};
    if (!groups.length) {status.textContent='No coded procedures available for this airport.';return;}
    const form=node('div'), type=node('select'), procedure=node('select'), transition=node('select');
    for(const [control,label] of [[type,'Procedure type'],[procedure,'Procedure'],[transition,'Transition']]){control.setAttribute('aria-label',label);const wrapper=node('label',label);wrapper.append(control);form.append(wrapper);}
    const names={PD:'Departure',PE:'Arrival',PF:'Approach'};
    for(const key of ['PF','PD','PE'])if(groups.some(g=>g.type===key))type.add(new Option(names[key],key));
    const load=node('button','Load on chart'), clear=node('button','Remove from chart');load.type=clear.type='button';
    const map=window.PilotDeskRoutePlanner.getMap(), L=window.L;
    let selected=[];
    function describe(){
      const candidates=groups.filter(g=>g.type===type.value&&g.id===procedure.value);
      const common=candidates.filter(g=>!g.transition), entry=candidates.find(g=>g.key===transition.value);
      selected=entry?[entry,...common.filter(g=>g.key!==entry.key)]:common;
      // The segment list is separate: never draw a connector across a discontinuity.
      const geometry=chartGeometry(selected);
      const start=Date.parse(source.validFrom), end=Date.parse(source.validUntil);
      const expired=!Number.isFinite(start)||!Number.isFinite(end)||Date.now()>=end||Date.now()<start;
      load.disabled=expired||!geometry.segments.length;
      status.textContent=expired?'Coded procedure data is outside its effective period. Chart loading is unavailable.':`${geometry.segments.length} resolved fix segment${geometry.segments.length===1?'':'s'}. ${geometry.omitted.length?'Gaps: unsupported '+[...new Set(geometry.omitted)].join(', ')+'. ':''}Missed approach, holds, vectors and arcs are not plotted. Open the FAA plate for the complete procedure.`;
    }
    function transitions(){
      transition.replaceChildren();
      const candidates=groups.filter(g=>g.type===type.value&&g.id===procedure.value), entries=candidates.filter(g=>g.transition);
      if(candidates.some(g=>!g.transition))transition.add(new Option('Common segment only',''));
      for(const g of entries)transition.add(new Option(g.transition+(entries.filter(e=>e.transition===g.transition).length>1?' · '+g.routeType:''),g.key));
      describe();
    }
    function procedures(){procedure.replaceChildren();for(const id of [...new Set(groups.filter(g=>g.type===type.value).map(g=>g.id))].sort())procedure.add(new Option(procedureLabel(id,type.value),id));transitions();}
    type.onchange=procedures;procedure.onchange=transitions;transition.onchange=describe;
    clear.onclick=()=>{overlays.get(map)?.get(airport)?.remove();overlays.get(map)?.delete(airport);status.textContent='Procedure removed from chart.';};
    load.onclick=()=>{
      describe();if(load.disabled)return;
      const geometry=chartGeometry(selected), layer=L.layerGroup(), notice=L.control({position:'topright'});
      notice.onAdd=()=>{
        const box=node('div');box.className='rp-procedure-notice';
        box.append(node('strong',airport+' · '+procedure.value),node('span','Fix segments only · see FAA plate'));
        const dismiss=node('button','Clear procedure');dismiss.type='button';dismiss.onclick=()=>{layer.remove();overlays.get(map)?.delete(airport);};box.append(dismiss);
        L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);return box;
      };
      layer.on('add',()=>notice.addTo(map));layer.on('remove',()=>notice.remove());
      for(const segment of geometry.segments)L.polyline(segment.map(p=>[p.lat,p.lon]),{color:'#61d8f5',weight:4,opacity:.95}).addTo(layer);
      for(const fix of geometry.fixes){
        const label=node('span',fix.id);
        L.circleMarker([fix.lat,fix.lon],{radius:4,color:'#061419',fillColor:'#61d8f5',fillOpacity:1,weight:1.5}).bindTooltip(label,{permanent:true,direction:'top',className:'rp-procedure-fix'}).addTo(layer);
      }
      if(!overlays.has(map))overlays.set(map,new Map());
      overlays.get(map).get(airport)?.remove();overlays.get(map).set(airport,layer);layer.addTo(map);
      const panel=host.closest('.rp-airport-panel'), reserved=innerWidth>700?(panel?.getBoundingClientRect().width||0)+35:55;
      map.fitBounds(L.latLngBounds(geometry.segments.flat().map(p=>[p.lat,p.lon])),{paddingTopLeft:[55,55],paddingBottomRight:[reserved,55],maxZoom:11});
      document.dispatchEvent(new CustomEvent('pilotdesk:procedure-plotted',{detail:{airport,id:procedure.value,transition:transition.selectedOptions[0]?.textContent,segments:geometry.segments.length,omitted:geometry.omitted}}));
    };
    host.append(form,load,clear,node('p',`FAA CIFP · ${source.cycle||''} · ${source.validFrom||''} — ${source.validUntil||''}`));procedures();
  }catch(error){if(host.isConnected)status.textContent='Coded procedures unavailable: '+error.message;}
}
