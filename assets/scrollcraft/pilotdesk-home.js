/* PilotDesk's route-scoped mount for the upstream Scrollcraft engine. */
(() => {
  'use strict';
  if (!['/', '/index.html'].includes(location.pathname)) return;
  let instance;
  const activate = () => {
    const root = document.getElementById('pdScrollStory');
    if (!root || !window.ScrollCraft || instance) return;
    // The complete sequence is readable without motion. Do not run a global
    // animation loop for smaller devices, reduced motion, or data saving.
    if (matchMedia('(max-width:600px), (prefers-reduced-motion: reduce)').matches
        || navigator.connection?.saveData) return;
    instance = window.ScrollCraft.mount(root);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activate, {once:true});
  else activate();
  window.addEventListener('pagehide', () => {
    if (instance) { instance.destroy(); instance = null; }
  }, {once:true});
})();