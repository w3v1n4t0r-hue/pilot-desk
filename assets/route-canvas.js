(()=>{
'use strict';
let started=false;
function boot(){
  if(started||new URLSearchParams(location.search).get('embed')==='layer-test')return;
  const RP=window.PilotDeskRoutePlanner,map=RP?.getMap(),main=document.getElementById('main-content');
  if(!map||!main)return;
  started=true;
  const card=main.querySelector('.rp-map-card'),toolbar=card?.querySelector('.rp-map-toolbar'),editor=document.getElementById('rpRouteEditor'),toggle=document.getElementById('rpEditorToggle');
  if(!card||!toolbar||!editor||!toggle)return;
  const stage=document.createElement('div');stage.className='rp-canvas-stage';
  const drawer=document.createElement('section');drawer.id='rpCanvasDrawer';drawer.className='rp-canvas-drawer';drawer.hidden=true;drawer.setAttribute('role','region');drawer.setAttribute('aria-label','Route planning');
  const head=document.createElement('div');head.className='rp-canvas-head';
  const label=document.createElement('label');label.textContent='Planning view';label.htmlFor='rpCanvasView';
  const view=document.createElement('select');view.id='rpCanvasView';
  const close=document.createElement('button');close.type='button';close.textContent='Close';close.setAttribute('aria-label','Close route planning');
  head.append(label,view,close);drawer.append(head);
  const panes=new Map();
  function pane(id,title,nodes){const section=document.createElement('div');section.className='rp-canvas-pane';section.dataset.view=id;section.hidden=true;for(const node of nodes.filter(Boolean))section.append(node);panes.set(id,section);drawer.append(section);view.add(new Option(title,id));return section}
  const title=main.querySelector('h1');if(title){title.className='rp-canvas-title';main.prepend(title)}
  const workspace=document.getElementById('rpWorkspace');
  const quick=document.createElement('div');quick.className='rp-route-quick';
  const routeInput=document.getElementById('rpRoute');routeInput.rows=2;
  quick.append(routeInput.closest('label'),document.getElementById('rpBuild'));editor.prepend(quick);
  const settings=document.createElement('div');settings.className='rp-plan-settings';settings.setAttribute('aria-label','Aircraft and departure settings');
  for(const [id,text] of [['rpTas','TAS (kt)'],['rpBurn','Burn (gal/hr)'],['rpPhase_cruiseAltitude','Altitude (ft MSL)'],['rpDepartureUtc','Departure (UTC)']]){
    const control=document.getElementById(id),field=control?.closest('label');if(!field)continue;
    if(field.firstChild?.nodeType===Node.TEXT_NODE)field.firstChild.textContent=text;
    settings.append(field);
  }
  editor.prepend(settings);
  const actions=document.createElement('div');actions.className='rp-plan-actions';actions.setAttribute('aria-label','Route actions');
  for(const id of ['rpUndo','rpRedo','rpReverse','rpClearRoute'])actions.append(document.getElementById(id));quick.after(actions);
  const more=document.createElement('details');more.className='rp-plan-more';const moreTitle=document.createElement('summary');moreTitle.textContent='More route tools';more.append(moreTitle);
  for(const node of [...editor.children])if(![settings,quick,actions].includes(node))more.append(node);editor.append(more);
  const summary=document.getElementById('rpLiveSummary');
  for(const [id,label] of [['rpSummaryEta','ETA UTC'],['rpSummaryWind','Winds']]){const cell=document.createElement('div'),name=document.createElement('small'),value=document.createElement('strong');name.textContent=label;value.id=id;value.textContent='—';cell.append(name,value);summary.append(cell)}
  const fuel=document.getElementById('rpSummaryFuel').parentElement;summary.insertBefore(fuel,document.getElementById('rpSummaryEte').parentElement);
  stage.append(card);toolbar.classList.add('rp-canvas-controls');
  main.prepend(toolbar);
  toggle.textContent='Route planner';toggle.classList.add('rp-canvas-toggle');toggle.setAttribute('aria-controls',drawer.id);toggle.setAttribute('aria-expanded','false');stage.append(toggle);
  pane('route','Flight plan',[workspace]);
  pane('navlog','Navlog',[document.getElementById('rpNavlogPanel')]);
  pane('performance','Fuel and performance',[document.getElementById('rpPerformance'),document.getElementById('rpPhaseResults')?.closest('section')]);
  pane('weather','Departure weather',[document.getElementById('rpDepartureReview')]);
  pane('navigation','Navigation',[document.getElementById('rpNavigation')]);
  pane('procedures','Procedures and route pack',[main.querySelector('.rp-procedure-section')]);
  pane('offline','Offline chart packs',[document.getElementById('rpOfflinePacks')]);
  const publicHost=pane('public','Public map layers',[]);publicHost.textContent='Loading public layers…';
  pane('sources','Sources and chart information',[card.querySelector('.rp-chart-note'),main.querySelector('.safety-strip')]);
  for(const node of [...main.children])if(node!==toolbar&&node!==title)node.hidden=true;
  main.append(stage);stage.append(drawer);
  drawer.append(summary);summary.classList.add('rp-plan-totals');
  function adoptAircraft(){const aircraft=document.getElementById('rpAircraft')?.closest('label');if(aircraft&&aircraft.parentElement!==settings){const wrap=aircraft.closest('.rp-aircraft-tools');settings.prepend(aircraft);if(wrap)more.append(wrap)}const save=document.getElementById('rpSaveFlight');if(save&&save.parentElement!==head)head.insertBefore(save,close);for(const node of [document.getElementById('rpDraftNotice'),editor.querySelector(':scope > .pd-flight-context')])if(node&&!more.contains(node))more.append(node)}
  const additions=new MutationObserver(()=>{const pin=main.querySelector(':scope > .pd-star');if(pin)panes.get('sources').prepend(pin);adoptAircraft()});additions.observe(main,{childList:true,subtree:true});adoptAircraft();
  function updateTotals(){const nav=window.pdNavlogResult,plan=window.PilotDeskRoutePerformance?.getSettings();const departure=Date.parse((plan?.departureUtc||'')+'Z');const eta=document.getElementById('rpSummaryEta');if(nav&&Number.isFinite(departure)&&Number.isFinite(nav.totalHours)){const date=new Date(departure+nav.totalHours*3600000);eta.textContent=date.toISOString().slice(11,16)+'Z';eta.title=date.toISOString()}else{eta.textContent='—';eta.removeAttribute('title')}const wind=document.getElementById('rpSummaryWind');wind.textContent=plan?.forecast?'Forecast':'Entered';wind.title=plan?.forecast?'Forecast winds; manual leg overrides take precedence.':'Entered planning winds; manual leg overrides take precedence.'}
  for(const event of ['pilotdesk:route-built','pilotdesk:route-invalidated','pilotdesk:planning-changed','pilotdesk:performance-updated'])document.addEventListener(event,updateTotals);updateTotals();
  document.body.classList.add('rp-canvas-ready');
  editor.hidden=true;workspace.classList.add('rp-editor-closed');
  let active='route';
  function show(id){
    active=panes.has(id)?id:'route';view.value=active;
    for(const [key,node] of panes)node.hidden=key!==active;
    editor.hidden=active!=='route';workspace.classList.toggle('rp-editor-closed',active!=='route');
    summary.hidden=!['route','navlog','performance'].includes(active);
    drawer.hidden=false;stage.classList.add('rp-planning-open');toggle.setAttribute('aria-expanded','true');
    for(const id of ['rpLayersPanel','rpRouteBrief']){const panel=document.getElementById(id);if(panel)panel.hidden=true}
    for(const id of ['rpLayersToggle','rpBriefToggle'])document.getElementById(id)?.setAttribute('aria-expanded','false');
    if(active==='public')document.dispatchEvent(new CustomEvent('pilotdesk:public-layers-open'));
    requestAnimationFrame(()=>{(active==='route'?routeInput:view)?.focus({preventScroll:true});panes.get(active).scrollTop=0;map.invalidateSize({pan:true,animate:false})});
  }
  function hide(returnFocus=true){drawer.hidden=true;stage.classList.remove('rp-planning-open');editor.hidden=true;toggle.setAttribute('aria-expanded','false');workspace.classList.add('rp-editor-closed');if(returnFocus)toggle.focus({preventScroll:true})}
  toggle.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();drawer.hidden?show(active):hide()},true);
  close.addEventListener('click',()=>hide());view.addEventListener('change',()=>show(view.value));
  toggle.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&drawer.hidden){event.preventDefault();show('route')}});
  document.addEventListener('pointerdown',event=>{if(!drawer.hidden&&!drawer.contains(event.target)&&!toggle.contains(event.target))hide(false)});
  const dataButton=document.createElement('button');dataButton.type='button';dataButton.className='utility-btn';dataButton.id='rpPublicLayersToggle';dataButton.textContent='Public layers';dataButton.setAttribute('aria-controls',drawer.id);dataButton.addEventListener('click',()=>show('public'));toolbar.insertBefore(dataButton,document.getElementById('rpMapStatus'));
  for(const id of ['rpLayersToggle','rpBriefToggle'])document.getElementById(id)?.addEventListener('click',()=>{if(!drawer.hidden)hide(false)});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!drawer.hidden){event.preventDefault();event.stopImmediatePropagation();hide()}},true);
  const targets={rpRouteEditor:'route',rpPlanningValues:'route',rpNavlogPanel:'navlog',rpPerformance:'performance',rpDepartureReview:'weather',rpOfflinePacks:'offline',rpNavigation:'navigation'};
  function followAnchor(){const id=location.hash.slice(1);if(targets[id]){show(targets[id]);const node=document.getElementById(id);for(let details=node?.closest('details');details;details=details.parentElement?.closest('details'))details.open=true;requestAnimationFrame(()=>node?.scrollIntoView({block:'start'}))}}
  window.addEventListener('hashchange',followAnchor);followAnchor();
  import('./route-public-layers.mjs').then(async m=>{publicHost.replaceChildren();await m.mountPublicLayers(publicHost);if(active==='public'&&!drawer.hidden)document.dispatchEvent(new CustomEvent('pilotdesk:public-layers-open'))}).catch(()=>{publicHost.textContent='Public layer controls could not load. Reload to retry.'});
  if(window.ResizeObserver){const observer=new ResizeObserver(()=>map.invalidateSize({pan:true,animate:false}));observer.observe(stage)}
  requestAnimationFrame(()=>map.invalidateSize({pan:true,animate:false}));
}
document.addEventListener('pilotdesk:map-ready',()=>queueMicrotask(boot),{once:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>queueMicrotask(boot),{once:true}):boot();
})();
