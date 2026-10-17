(() => {
  'use strict';
  if (!document.documentElement.classList.contains('pd-home-embed') || parent === window) return;
  // Links leave the embedded canvas; the full planner keeps its ordinary navigation.
  const base = document.createElement('base'); base.target = '_top'; document.head.append(base);
  let started = false;
  function boot() {
    const planner = window.PilotDeskRoutePlanner, map = planner?.getMap();
    if (started || !map) return;
    started = true;
    const route = document.getElementById('rpRoute');
    const mode = active => {
      document.documentElement.classList.toggle('pd-home-map-active', active);
      for (const handler of [map.dragging, map.scrollWheelZoom, map.touchZoom, map.doubleClickZoom, map.boxZoom, map.keyboard]) handler?.[active ? 'enable' : 'disable']();
    };
    mode(false);
    function publish() {
      const p = map.getCenter();
      const view = window.PilotDeskMapView.format({lon: ((p.lng + 180) % 360 + 360) % 360 - 180, lat: p.lat, zoom: map.getZoom(), chart: planner.getChart()});
      parent.postMessage({type: 'pilotdesk:home-state', route: route.value, view}, location.origin);
    }
    window.addEventListener('message', event => {
      if (event.origin === location.origin && event.source === parent && event.data?.type === 'pilotdesk:home-gestures' && typeof event.data.active === 'boolean') mode(event.data.active);
    });
    // No input messages or passive scroll can overwrite a user's route.
    route.addEventListener('input', publish);
    map.on('moveend', publish);
    for (const event of ['pilotdesk:route-built', 'pilotdesk:route-invalidated', 'pilotdesk:chart-changed']) document.addEventListener(event, publish);
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { mode(false); parent.postMessage({type: 'pilotdesk:home-escape'}, location.origin); } });
    publish();
  }
  document.addEventListener('pilotdesk:map-ready', () => queueMicrotask(boot), {once: true});
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot, {once: true}) : boot();
})();
