import {createPublicLayers,supported,sourceDescription} from './public-layers.mjs';
const key='pd-layer-test-v1';
let definitions=[],selection={},ready=false,publicLayers=null;
const $=id=>document.getElementById(id);
const chartMapping={'us/vfr':'sectional','us/ifrlow':'low','us/ifrhigh':'high'};
const overlayMapping={radar:'radar',tfrs:'tfr',notams:'notams',pireps:'pirep',obstacles:'obstacles'};
const groups={ots:'Tracks',otseast:'Tracks',otswest:'Tracks',map:'Base map',aero:'Aeronautical',jepp:'Charts',chart:'Charts',chart2:'Charts',chartHeli:'Charts',wxImagery:'Weather',wxStations:'Weather',fuelPrices:'Fuel',lightning:'Weather',traffic:'Traffic',airSigmets:'Advisories',tfrs:'Restrictions',notams:'Restrictions',pireps:'Weather',gafor:'Weather',customAirports:'Airports'};
const defaults={wxOpacity:80,altitude:18000,'aero/hideAirspaceAbove':18000};
function store(){try{localStorage.setItem(key,JSON.stringify(selection))}catch{$('map-status').textContent='Selections changed; browser storage is unavailable.'}}
function chosen(id){return selection[id]!==undefined&&selection[id]!==false&&selection[id]!==''}
function connection(def){
  const val=selection[def.id];
  if(def.options.length&&!val)return 'Choose a mode to view its source';
  if(supported(def.id,val))return publicLayers?.status(def.id)||'Configured · '+sourceDescription(def.id,val);
  if(def.id==='chart')return chartMapping[val]?'Connected · FAA U.S. charts':'Not connected · verified regional chart tiles required';
  if(def.id==='wxImagery')return val==='radar'?'Connected · NOAA MRMS':'Not connected · '+sourceDescription(def.id,val);
  if(def.id==='wxStations')return 'Not connected · '+sourceDescription(def.id,val);
  if(overlayMapping[def.id])return 'Connected · existing PilotDesk layer';
  if(def.id==='wxOpacity')return 'Connected · weather opacity';
  return 'Not connected · '+sourceDescription(def.id,val);
}
function draw(){
  const query=$('search').value.trim().toLowerCase(),selected=$('selected-only').checked;
  $('catalog').replaceChildren();let visible=0;
  for(const def of definitions){
    const group=groups[def.id]||(def.id.startsWith('aero/')?'Aeronautical':def.id.startsWith('cultural/')?'Cultural':def.id.startsWith('mfb/')?'Military':'Map controls');
    const text=[group,def.id,def.label,...def.options.map(o=>o.label)].join(' ').toLowerCase();
    if(!text.includes(query)||(selected&&!chosen(def.id)))continue;
    visible++;
    const row=document.createElement('section');row.className='control';row.dataset.id=def.id;
    const label=document.createElement('label');label.htmlFor='control-'+def.id;
    let input;
    if(def.options.length){
      label.textContent=def.label;input=document.createElement('select');
      input.add(new Option(['aero/navlevel','aero/artcclevel'].includes(def.id)?'All levels':'Off / unselected',''));
      for(const o of def.options)input.add(new Option(o.label,o.id));
      input.value=selection[def.id]||'';
    }else if(def.id in defaults){
      label.textContent=def.label;input=document.createElement('input');
      input.type=def.id==='wxOpacity'?'range':'number';input.min='0';input.max=def.id==='wxOpacity'?'100':'60000';input.step=def.id==='wxOpacity'?'1':'500';input.value=selection[def.id]??defaults[def.id];
    }else{
      input=document.createElement('input');input.type='checkbox';input.checked=selection[def.id]===true;
      label.append(input,document.createTextNode(def.label));
    }
    input.id='control-'+def.id;input.dataset.control=def.id;
    row.append(label);if(input.type!=='checkbox')row.append(input);
    const info=document.createElement('small');info.dataset.sourceStatus=def.id;info.textContent=group+' · '+connection(def);row.append(info);
    if(input.type==='range'){const output=document.createElement('output');output.textContent=input.value+'%';row.append(output);input.addEventListener('input',()=>output.textContent=input.value+'%')}
    input.addEventListener('change',()=>{
      selection[def.id]=input.type==='checkbox'?input.checked:(def.id in defaults?Math.max(0,Math.min(Number(input.max),Number(input.value)||0)):input.value);
      store();apply();draw();document.getElementById(input.id)?.focus();
    });
    $('catalog').append(row);
  }
  $('empty').hidden=visible>0;
  const count=definitions.filter(d=>chosen(d.id)).length;
  $('summary').textContent=definitions.length+' controls · '+count+' selected · '+visible+' shown';
  $('review').replaceChildren();
  for(const def of definitions.filter(d=>chosen(d.id))){const p=document.createElement('p');const option=def.options.find(o=>o.id===selection[def.id]);p.textContent=def.label+(option?' — '+option.label:'')+' · '+connection(def);$('review').append(p)}
}
function toggle(doc,name,value){const control=doc.querySelector('[data-layer="'+name+'"]');if(!control)return false;if(control.disabled&&value)return false;if(control.checked!==value){control.checked=value;control.dispatchEvent(new Event('change',{bubbles:true}))}return true}
function mountMap(win){
  const doc=win.document,card=doc.querySelector('.rp-map-card');
  if(!card||doc.getElementById('layer-test-map-style'))return;
  const style=doc.createElement('style');style.id='layer-test-map-style';
  style.textContent='html,body{margin:0!important;padding:0!important;height:100%;overflow:hidden}body>*:not(.rp-map-card){display:none!important}.rp-map-card{position:fixed!important;inset:0!important;margin:0!important;width:100%!important;height:100%!important;border:0!important;display:flex;flex-direction:column;padding:10px!important}.rp-map-toolbar{flex-wrap:wrap;flex-shrink:0}#rpMap{flex:1;min-height:180px!important;height:auto!important}.rp-map-card>h2{display:none}';
  doc.head.append(style);doc.body.append(card);win.scrollTo(0,0);
  style.textContent+='.pd-public-marker span{display:inline-block;white-space:nowrap;background:#111114e8;color:#f5f5f5;padding:3px 6px;border:1px solid #79adf5;border-radius:3px;font:12px/1.3 system-ui,sans-serif}';
  const editor=doc.getElementById('rpEditorToggle');
  if(editor){editor.textContent='Full planner ↗';editor.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();win.open('/route-planner.html','_blank','noopener')},true)}
  win.requestAnimationFrame(()=>win.PilotDeskRoutePlanner.getMap().invalidateSize({animate:false}));
}
function apply(){
  if(!ready)return;
  const win=$('planner').contentWindow,doc=win.document;
  const chart=chartMapping[selection.chart]||'sectional';win.PilotDeskRoutePlanner.setChart(chart);
  for(const [id,name] of Object.entries(overlayMapping))toggle(doc,name,selection[id]===true);
  for(const name of ['navaids','fixes','airways'])toggle(doc,name,false);
  toggle(doc,'radar',selection.wxImagery==='radar');
  toggle(doc,'metar',false);
  const opacity=selection.wxOpacity??defaults.wxOpacity;
  for(const id of ['rpRadarOpacity','rpEfbVectorOpacity']){const input=doc.getElementById(id);if(input){input.value=Math.max(Number(input.min),opacity);input.dispatchEvent(new Event('input',{bubbles:true}))}}
  const pending=definitions.filter(d=>chosen(d.id)&&/^(?:Data|Not connected)/.test(connection(d))).length;
  const gated=selection.pireps===true&&doc.querySelector('[data-layer="pirep"]')?.disabled;
  $('map-status').textContent='PilotDesk map connected · '+pending+' selected controls awaiting data'+(gated?' · PIREPs require advanced weather access':'')+'. Live feed status appears in the planner Layers panel.';
  publicLayers?.sync(selection);
}
function updateSourceStatus(){
  for(const el of document.querySelectorAll('[data-source-status]')){const def=definitions.find(d=>d.id===el.dataset.sourceStatus);if(def)el.textContent=connection(def)}
  const selected=definitions.filter(d=>chosen(d.id));
  const blocked=selected.filter(d=>/^(?:Data|Not connected)/.test(connection(d))).length;
  const failed=selected.filter(d=>/^(?:Unavailable|Partial)/.test(connection(d))).length;
  $('map-status').textContent='PilotDesk map connected · '+blocked+' selected controls awaiting data · '+failed+' unavailable or partial feeds. Source and time appear beside each control.';
  $('review').replaceChildren();for(const def of selected){const p=document.createElement('p');p.textContent=def.label+' · '+connection(def);$('review').append(p)}
}
$('search').addEventListener('input',draw);$('selected-only').addEventListener('change',draw);
$('reset').addEventListener('click',()=>{selection={};store();$('selected-only').checked=false;apply();draw()});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,selection},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pilotdesk-layer-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('planner').addEventListener('load',()=>{const win=$('planner').contentWindow;const connect=()=>{ready=!!win.PilotDeskRoutePlanner?.getMap()&&!!win.document.querySelector('[data-layer="radar"]');if(ready){mountMap(win);publicLayers?.dispose();publicLayers=createPublicLayers(win,updateSourceStatus);apply()}else $('map-status').textContent='Map viewer unavailable. Catalogue selections remain available for review.'};win.document.addEventListener('pilotdesk:map-ready',()=>setTimeout(connect,0),{once:true});connect()});
try{definitions=await fetch('/assets/layer-catalog.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json()});let saved;try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{saved={}};for(const def of definitions){const value=saved?.[def.id];if(def.options.length&&def.options.some(o=>o.id===value))selection[def.id]=value;else if(def.id in defaults&&typeof value==='number'&&Number.isFinite(value))selection[def.id]=Math.max(0,Math.min(def.id==='wxOpacity'?100:60000,value));else if(!def.options.length&&!(def.id in defaults)&&typeof value==='boolean')selection[def.id]=value}draw();apply()}catch{$('summary').textContent='Layer catalogue could not be loaded. Reload to retry.'}
