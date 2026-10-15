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
  const drawer=document.createElement('aside');drawer.id='rpCanvasDrawer';drawer.className='rp-canvas-drawer';drawer.hidden=true;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-label','Route planning');
  const head=document.createElement('div');head.className='rp-canvas-head';
  const label=document.createElement('label');label.textContent='Planning view';label.htmlFor='rpCanvasView';
  const view=document.createElement('select');view.id='rpCanvasView';
  const close=document.createElement('button');close.type='button';close.textContent='Close';close.setAttribute('aria-label','Close route planning');
  head.append(label,view,close);drawer.append(head);
  const panes=new Map();
  function pane(id,title,nodes){const section=document.createElement('div');section.className='rp-canvas-pane';section.dataset.view=id;section.hidden=true;for(const node of nodes.filter(Boolean))section.append(node);panes.set(id,section);drawer.append(section);view.add(new Option(title,id));return section}
  const title=main.querySelector('h1');if(title){title.className='rp-canvas-title';main.prepend(title)}
  const workspace=document.getElementById('rpWorkspace');
  stage.append(card);toolbar.classList.add('rp-canvas-controls');
  main.prepend(toolbar);
  toggle.textContent='Route planner';toggle.classList.add('rp-canvas-toggle');toggle.setAttribute('aria-controls',drawer.id);toggle.setAttribute('aria-expanded','false');stage.append(toggle);
  pane('route','Flight plan',[document.getElementById('rpLiveSummary'),workspace]);
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
  const additions=new MutationObserver(()=>{const pin=main.querySelector(':scope > .pd-star');if(pin)panes.get('sources').prepend(pin)});additions.observe(main,{childList:true});
  document.body.classList.add('rp-canvas-ready');
  editor.hidden=true;workspace.classList.add('rp-editor-closed');
  let active='route';
  function show(id){
    active=panes.has(id)?id:'route';view.value=active;
    for(const [key,node] of panes)node.hidden=key!==active;
    editor.hidden=active!=='route';workspace.classList.toggle('rp-editor-closed',active!=='route');
    drawer.hidden=false;toggle.setAttribute('aria-expanded','true');
    for(const id of ['rpLayersPanel','rpRouteBrief']){const panel=document.getElementById(id);if(panel)panel.hidden=true}
    for(const id of ['rpLayersToggle','rpBriefToggle'])document.getElementById(id)?.setAttribute('aria-expanded','false');
    if(active==='public')document.dispatchEvent(new CustomEvent('pilotdesk:public-layers-open'));
    requestAnimationFrame(()=>{(active==='route'?document.getElementById('rpWaypointSearch'):view)?.focus({preventScroll:true});map.invalidateSize({pan:true,animate:false})});
  }
  function hide(){drawer.hidden=true;editor.hidden=true;toggle.setAttribute('aria-expanded','false');workspace.classList.add('rp-editor-closed');toggle.focus({preventScroll:true})}
  toggle.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();drawer.hidden?show(active):hide()},true);
  close.addEventListener('click',hide);view.addEventListener('change',()=>show(view.value));
  const dataButton=document.createElement('button');dataButton.type='button';dataButton.className='utility-btn';dataButton.id='rpPublicLayersToggle';dataButton.textContent='Public layers';dataButton.setAttribute('aria-controls',drawer.id);dataButton.addEventListener('click',()=>show('public'));toolbar.insertBefore(dataButton,document.getElementById('rpMapStatus'));
  for(const id of ['rpLayersToggle','rpBriefToggle'])document.getElementById(id)?.addEventListener('click',()=>{if(!drawer.hidden){drawer.hidden=true;editor.hidden=true;toggle.setAttribute('aria-expanded','false')}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!drawer.hidden){event.preventDefault();event.stopImmediatePropagation();hide()}},true);
  const targets={rpRouteEditor:'route',rpPlanningValues:'route',rpNavlogPanel:'navlog',rpPerformance:'performance',rpDepartureReview:'weather',rpOfflinePacks:'offline',rpNavigation:'navigation'};
  function followAnchor(){const id=location.hash.slice(1);if(targets[id]){show(targets[id]);const node=document.getElementById(id);const details=node?.closest('details');if(details)details.open=true;requestAnimationFrame(()=>node?.scrollIntoView({block:'start'}))}}
  window.addEventListener('hashchange',followAnchor);followAnchor();
  import('./route-public-layers.mjs').then(async m=>{publicHost.replaceChildren();await m.mountPublicLayers(publicHost);if(active==='public'&&!drawer.hidden)document.dispatchEvent(new CustomEvent('pilotdesk:public-layers-open'))}).catch(()=>{publicHost.textContent='Public layer controls could not load. Reload to retry.'});
  if(window.ResizeObserver){const observer=new ResizeObserver(()=>map.invalidateSize({pan:true,animate:false}));observer.observe(stage)}
  requestAnimationFrame(()=>map.invalidateSize({pan:true,animate:false}));
}
document.addEventListener('pilotdesk:map-ready',()=>queueMicrotask(boot),{once:true});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>queueMicrotask(boot),{once:true}):boot();
})();
