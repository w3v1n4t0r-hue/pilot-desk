(() => {
  'use strict';
  const frame = document.getElementById('pdHomeChart');
  if (!frame) return;
  const gestures = document.getElementById('pdHomeGestures');
  const status = document.getElementById('pdHomeChartStatus');
  const context = document.getElementById('pdHomeRouteContext');
  const header = document.querySelector('body > .topbar');
  const root = document.documentElement;
  function sizeHeader() { root.style.setProperty('--home-header-height', `${Math.round(header?.getBoundingClientRect().height || 64)}px`); }
  sizeHeader();
  if (window.ResizeObserver && header) new ResizeObserver(sizeHeader).observe(header);
  let ready = false, active = false;
  const readyTimeout = setTimeout(() => { if (!ready) status.textContent = 'Chart taking longer to load. Open route planner to retry.'; }, 20000);
  function sendGestures(value) {
    active = value;
    gestures.setAttribute('aria-pressed', String(active));
    gestures.textContent = active ? 'Page scroll' : 'Explore chart';
    frame.contentWindow.postMessage({type: 'pilotdesk:home-gestures', active}, location.origin);
  }
  gestures.addEventListener('click', () => sendGestures(!active));
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'pilotdesk:home-escape') { sendGestures(false); return; }
    if (event.data.type !== 'pilotdesk:home-state') return;
    if (!ready) { ready = true; clearTimeout(readyTimeout); gestures.hidden = false; status.textContent = 'FAA sectional · Route planner'; }
    const route = typeof event.data.route === 'string' ? event.data.route.trim() : '';
    if (route.length > 20000) return;
    const view = event.data.view;
    if (typeof view !== 'string' || !/^#map=-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?\/\d+(?:\.\d+)?\/(sectional|terminal|low|high)$/.test(view)) return;
    context.textContent = route || 'Start on the chart';
    const link = new URL('/route-planner.html', location.origin);
    // An explicit route handoff survives denied storage; no scroll event edits a flight.
    if (route) link.searchParams.set('route', route);
    link.hash = view;
    document.querySelectorAll('[data-home-planner]').forEach(a => { a.href = link.pathname + link.search + link.hash; });
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && active) sendGestures(false); });
  // Keep the map mounted: returning to it preserves edits without a second startup.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = null, loading = false;
  function mountMotion() {
    if (motion || loading || document.hidden || reduced.matches || navigator.connection?.saveData) return;
    if (window.ScrollCraft) { motion = window.ScrollCraft.mount(document.getElementById('pdHomeStory')); return; }
    loading = true;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/home-scrollcraft.css'; document.head.append(css);
    const script = document.createElement('script'); script.src = '/assets/vendor/scrollcraft/scrollcraft.js';
    script.onload = () => { loading = false; mountMotion(); };
    script.onerror = () => { loading = false; };
    document.head.append(script);
  }
  function syncMotion() { if (document.hidden || reduced.matches) { motion?.destroy(); motion = null; } else mountMotion(); }
  // Optional motion is deferred below the opening chart, never on its critical path.
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { mountMotion(); observer.disconnect(); } }, {rootMargin: '0px'});
    observer.observe(document.getElementById('pdHomeStory'));
  }
  document.addEventListener('visibilitychange', () => { if (window.ScrollCraft) syncMotion(); });
  reduced.addEventListener('change', () => { if (window.ScrollCraft) syncMotion(); });
  window.addEventListener('pagehide', () => { clearTimeout(readyTimeout); motion?.destroy(); motion = null; });
  window.addEventListener('pageshow', event => { if (event.persisted && window.ScrollCraft) syncMotion(); });
})();
