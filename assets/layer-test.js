const key='pd-layer-test-v1';
let definitions=[],selection={},ready=false;
const $=id=>document.getElementById(id);
const chartMapping={'us/vfr':'sectional','us/ifrlow':'low','us/ifrhigh':'high'};
const overlayMapping={radar:'radar',tfrs:'tfr',notams:'notams',pireps:'pirep','aero/navaids':'navaids','aero/waypoints':'fixes','aero/airways':'airways',obstacles:'obstacles'};
const groups={ots:'Tracks',otseast:'Tracks',otswest:'Tracks',map:'Base map',aero:'Aeronautical',jepp:'Charts',chart:'Charts',chart2:'Charts',chartHeli:'Charts',wxImagery:'Weather',wxStations:'Weather',fuelPrices:'Fuel',lightning:'Weather',traffic:'Traffic',airSigmets:'Advisories',tfrs:'Restrictions',notams:'Restrictions',pireps:'Weather',gafor:'Weather',customAirports:'Airports'};
const defaults={wxOpacity:80,altitude:18000,'aero/hideAirspaceAbove':18000};
function store(){try{localStorage.setItem(key,JSON.stringify(selection))}catch{$('map-status').textContent='Selections changed; browser storage is unavailable.'}}
function chosen(id){return selection[id]!==undefined&&selection[id]!==false&&selection[id]!==''}
function connection(def){
  const val=selection[def.id];
  if(def.id==='chart')return chartMapping[val]?'Connected · FAA U.S. charts':'Data connection pending';
  if(def.id==='wxImagery')return val==='radar'?'Connected · NOAA MRMS':'Data connection pending';
  if(def.id==='wxStations')return val==='category'?'Connected · AWC METARs':'Data connection pending';
  if(overlayMapping[def.id])return 'Connected · existing PilotDesk layer';
  if(def.id==='wxOpacity')return 'Connected · weather opacity';
  return 'Data connection pending';
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
      input.add(new Option('Off / unselected',''));
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
    const info=document.createElement('small');info.textContent=group+' · '+connection(def);row.append(info);
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
function apply(){
  if(!ready)return;
  const win=$('planner').contentWindow,doc=win.document;
  const chart=chartMapping[selection.chart]||'sectional';win.PilotDeskRoutePlanner.setChart(chart);
  for(const [id,name] of Object.entries(overlayMapping))toggle(doc,name,selection[id]===true);
  toggle(doc,'radar',selection.wxImagery==='radar');
  toggle(doc,'metar',selection.wxStations==='category');
  const opacity=selection.wxOpacity??defaults.wxOpacity;
  for(const id of ['rpRadarOpacity','rpEfbVectorOpacity']){const input=doc.getElementById(id);if(input){input.value=Math.max(Number(input.min),opacity);input.dispatchEvent(new Event('input',{bubbles:true}))}}
  const pending=definitions.filter(d=>chosen(d.id)&&connection(d).startsWith('Data')).length;
  const gated=selection.pireps===true&&doc.querySelector('[data-layer="pirep"]')?.disabled;
  $('map-status').textContent='PilotDesk map connected · '+pending+' selected controls awaiting data'+(gated?' · PIREPs require advanced weather access':'')+'. Live feed status appears in the planner Layers panel.';
}
$('search').addEventListener('input',draw);$('selected-only').addEventListener('change',draw);
$('reset').addEventListener('click',()=>{selection={};store();$('selected-only').checked=false;apply();draw()});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,selection},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pilotdesk-layer-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('planner').addEventListener('load',()=>{const win=$('planner').contentWindow;const connect=()=>{ready=!!win.PilotDeskRoutePlanner?.getMap()&&!!win.document.querySelector('[data-layer="radar"]');if(ready)apply();else $('map-status').textContent='Map viewer unavailable. Catalogue selections remain available for review.'};win.document.addEventListener('pilotdesk:map-ready',()=>setTimeout(connect,0),{once:true});connect()});
try{definitions=await fetch('/assets/layer-catalog.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json()});let saved;try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{saved={}};for(const def of definitions){const value=saved?.[def.id];if(def.options.length&&def.options.some(o=>o.id===value))selection[def.id]=value;else if(def.id in defaults&&typeof value==='number'&&Number.isFinite(value))selection[def.id]=Math.max(0,Math.min(def.id==='wxOpacity'?100:60000,value));else if(!def.options.length&&!(def.id in defaults)&&typeof value==='boolean')selection[def.id]=value}draw();apply()}catch{$('summary').textContent='Layer catalogue could not be loaded. Reload to retry.'}
