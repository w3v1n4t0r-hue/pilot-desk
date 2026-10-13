import { animate, inView, hover, press, stagger } from 'motion';

// Optional presentation only. It never reads or changes route-planner state.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const animations = new Set();
const cleanups = [];
function play(element, frames, options = {}) {
  if (!element || (Array.isArray(element) && !element.length) || reduced.matches || document.hidden || navigator.connection?.saveData) return;
  const animation = animate(element, frames, { duration: .28, ease: [.2, .8, .2, 1], ...options });
  animations.add(animation);
  Promise.resolve(animation.finished).then(() => animations.delete(animation), () => animations.delete(animation));
  return animation;
}
function init() {
  const home = document.body.classList.contains('pd-home-2026');
  const tools = document.body.classList.contains('pd-tools-page');
  if ((!home && !tools) || reduced.matches || navigator.connection?.saveData) return;
  if (home) {
    const copy = document.querySelector('.pd-home-hero-copy');
    if (copy) play([...copy.children], { opacity: [.4, 1], y: [18, 0] }, { duration: .5, delay: stagger(.075) });
    const preview = document.querySelector('[data-pd-preview]');
    if (preview) play(preview, { opacity: [.6, 1], y: [24, 0] }, { duration: .6, delay: .12 });
    cleanups.push(inView('[data-pd-reveal]', element => {
      play(element, { opacity: [.65, 1], y: [24, 0] }, { duration: .5 });
    }, { amount: .15 }));
    if (finePointer.matches) {
      cleanups.push(hover('[data-pd-hover]', element => {
        const icon = element.querySelector('svg');
        if (icon) play(icon, { y: -4, rotate: -5 }, { type: 'spring', bounce: .12, duration: .35 });
        return () => { if (icon) play(icon, { y: 0, rotate: 0 }, { duration: .25 }); };
      }));
      const preview = document.querySelector('[data-pd-preview]');
      if (preview) {
        let pending = 0;
        const move = event => {
          if (reduced.matches || pending) return;
          const { clientX, clientY } = event;
          pending = requestAnimationFrame(() => {
            pending = 0;
            const rect = preview.getBoundingClientRect();
            play(preview, { rotateY: (clientX - rect.left - rect.width / 2) / rect.width * 3, rotateX: -(clientY - rect.top - rect.height / 2) / rect.height * 3 }, { duration: .35 });
          });
        };
        const leave = () => play(preview, { rotateX: 0, rotateY: 0 }, { duration: .4 });
        preview.addEventListener('pointermove', move);
        preview.addEventListener('pointerleave', leave);
        cleanups.push(() => { preview.removeEventListener('pointermove', move); preview.removeEventListener('pointerleave', leave); if (pending) cancelAnimationFrame(pending); });
      }
    }
    const slider = document.getElementById('pdHomeWind');
    const vector = document.querySelector('[data-pd-wind-vector]');
    if (slider && vector) {
      const update = () => play(vector, { scale: .55 + Number(slider.value) / 40 }, { type: 'spring', bounce: .08, duration: .35 });
      slider.addEventListener('input', update);
      cleanups.push(() => slider.removeEventListener('input', update));
    }
  }
  cleanups.push(press('.pd-btn, .pd-home-command', element => {
    play(element, { scale: .985 }, { duration: .1 });
    return () => play(element, { scale: 1 }, { duration: .16 });
  }));
  if (tools) {
    const host = document.getElementById('pdToolDirectory');
    if (host) {
      let queued = 0;
      const observer = new MutationObserver(() => {
        if (queued || reduced.matches) return;
        queued = requestAnimationFrame(() => {
          queued = 0;
          play([...host.querySelectorAll('.pd-directory-group')].slice(0,8), { opacity: [.55, 1], y: [10, 0] }, { duration: .22, delay: stagger(.025) });
        });
      });
      observer.observe(host, { childList: true });
      cleanups.push(() => { observer.disconnect(); if (queued) cancelAnimationFrame(queued); });
    }
  }
}
function stop() { cleanups.splice(0).forEach(fn => fn()); animations.forEach(a => a.complete()); animations.clear(); }
reduced.addEventListener('change', event => { if (event.matches) stop(); });
window.addEventListener('pagehide', stop, { once: true });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
