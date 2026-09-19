(()=>{
'use strict';
/* PilotDesk is intentionally a dark monochrome product. Older saved theme
   preferences are normalized so returning users do not get a light/red flash. */
try{localStorage.setItem('pd-theme','dark')}catch{}
document.documentElement.dataset.pdTheme='dark';
document.documentElement.style.colorScheme='dark';
})();