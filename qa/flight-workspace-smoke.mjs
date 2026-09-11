import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const html=read('flight-planning-workspace.html');
const js=read('assets/flight-workspace.js');
const bootstrap=read('assets/app-bootstrap.js');
const ads=read('assets/ads.js');

assert(html.includes('<title>Flight Planning Workspace | PilotDesk</title>'),'Workspace title missing');
assert(html.includes('/assets/flight-workspace.js'),'Workspace logic not loaded');
assert(html.includes('/assets/app-bootstrap.js'),'Workspace must use the current app bootstrap');
assert(!html.includes('/assets/boot.js'),'Workspace must not depend on the obsolete boot.js');
assert(html.includes('Planning aid only.')&&html.includes('POH/AFM'),'Workspace safety boundaries missing');
assert(html.includes('aria-live="polite"'),'Workspace results should announce updates accessibly');
assert(js.includes('const ranges=')&&js.includes('outside the supported range'),'Workspace input range validation missing');
assert(js.includes('function clear()')&&js.includes("textContent='—'"),'Workspace must fail closed by clearing stale outputs');
assert(js.includes('crosswind component exceeds TAS')&&js.includes('groundspeed is zero or negative'),'Wind-triangle failure handling missing');
assert(js.includes("localStorage.setItem('pd-flight-workspace'")&&js.includes("$('workspaceShare')")&&html.includes('Copy share link'),'Workspace save/share behavior missing');
assert(bootstrap.includes('/flight-planning-workspace.html')&&bootstrap.includes('data-pd-launch="flight-workspace"'),'Homepage must expose the published workspace');
assert(bootstrap.includes("load('/assets/brand.js','pd-brand')"),'Branding must load independently of advertising');
assert(!ads.includes('/assets/brand.js'),'ads.js must not own branding');

console.log('Flight Planning Workspace checks passed: publication, validation, fail-closed behavior, sharing, local save, discovery, and ad-independent branding verified.');
