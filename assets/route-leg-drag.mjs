// SVG route legs keep map panning elsewhere and insert a coordinate only after a drag.
export function enableLegDrag(line, map, L, onDrop, endpoints) {
  const element = line.getElement();
  if (!element) return;
  element.style.touchAction = 'none';
  element.style.cursor = 'grab';
  let cancel = () => {}, suppressUntil = 0;
  line.on('remove', () => cancel());
  line.on('preclick', event => {
    if (performance.now() < suppressUntil) L.DomEvent.stop(event.originalEvent);
  });
  element.addEventListener('click', event => {
    if (performance.now() < suppressUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  element.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || window.PilotDeskRoutePlanner?.isPlotting?.() || document.getElementById('rpMeasure')?.getAttribute('aria-pressed') === 'true') return;
    cancel();
    const start = [event.clientX, event.clientY], wasDragging = map.dragging.enabled();
    let moved = false, preview, location;
    map.dragging.disable();
    element.setPointerCapture(event.pointerId);
    event.stopPropagation();
    function move(e) {
      if (e.pointerId !== event.pointerId) return;
      if (!moved && Math.hypot(e.clientX-start[0], e.clientY-start[1]) < 6) return;
      moved = true;
      line.closePopup(); line.closeTooltip();
      location = map.mouseEventToLatLng(e);
      if (!preview) preview = L.polyline([], {color:'#c65cff', weight:3, dashArray:'6 5', interactive:false, pane:'pdRoutePane'}).addTo(map);
      preview.setLatLngs([endpoints[0], location, endpoints[1]]);
      e.preventDefault();
    }
    function finish(e) {
      if (e.pointerId !== event.pointerId) return;
      const drop = moved && e.type === 'pointerup' && location;
      if (moved) suppressUntil = performance.now() + 500;
      cancel();
      if (drop) onDrop(location);
    }
    cancel = () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', finish);
      element.removeEventListener('pointercancel', finish);
      element.removeEventListener('lostpointercapture', finish);
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      preview?.remove();
      if (wasDragging) map.dragging.enable();
      cancel = () => {};
    };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('lostpointercapture', finish);
  });
}
