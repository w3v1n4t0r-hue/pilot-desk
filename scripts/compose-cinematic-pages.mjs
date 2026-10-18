import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function family(route){
 if(/weather|metar|taf|cloud|(?:^|[/-])icing(?:[./-]|$)|thunderstorm|visibility|ceiling/.test(route))return 'weather';
 if(/crosswind|wind-triangle|wind-correction|heading|drift|true-airspeed|groundspeed/.test(route))return 'wind';
 if(/altitude|atmosphere|pressure|lapse|temperature|mach|oxygen/.test(route))return 'altitude';
 if(/weight|balance|moment|cg-|loading|baggage/.test(route))return 'loading';
 if(/fuel|endurance|range|time-speed|distance|reserve/.test(route))return 'fuel';
 if(/route|planner|airport|procedure|flight-brief|preflight|navigation|aircraft|poh-chart|planning/.test(route))return 'plan';
 if(/calculators|e6b|tools\.html|history/.test(route))return 'tools';
 if(/pricing|school|for-cfis/.test(route))return 'membership';
 if(/legal|privacy|terms|policy|sources|about|feedback|account|embed/.test(route))return 'reference';
 return 'learn';
}
const labels={plan:'Flight planning',tools:'Flight computers',wind:'Wind geometry',altitude:'Atmosphere',loading:'Aircraft loading',fuel:'Time and fuel',weather:'Aviation weather',learn:'Pilot knowledge',membership:'PilotDesk',reference:'PilotDesk reference'};
const svg = inner => `<svg class="pd-sc-vector" viewBox="0 0 720 600" fill="none" aria-hidden="true">${inner}</svg>`;
const ticks=Array.from({length:72},(_,i)=>`<path transform="rotate(${i*5} 360 300)" d="M360 92v${i%6===0?24:10}"/>`).join('');
const contours=Array.from({length:7},(_,i)=>`<path d="M-40 ${160+i*45}C130 ${20+i*45} 185 ${340+i*30} 355 ${180+i*36}S610 ${100+i*50} 780 ${240+i*36}"/>`).join('');
function illustration(type){
 const grid=`<g class="pd-sc-field">${contours}</g>`;
 const compass=`<g class="pd-sc-scale"><circle cx="360" cy="300" r="224"/><circle cx="360" cy="300" r="206"/>${ticks}</g>`;
 if(type==='plan')return svg(`${grid}<g class="pd-sc-plates"><path d="m118 196 145-50 145 62 166-42v250l-166 40-145-62-145 50z"/><path d="M263 146v248m145-186v248"/></g><path class="pd-sc-trace" pathLength="1" d="M158 370 294 264 408 324 538 212"/><g class="pd-sc-fix"><circle cx="158" cy="370" r="8"/><circle cx="294" cy="264" r="8"/><circle cx="408" cy="324" r="8"/><circle cx="538" cy="212" r="8"/></g>`);
 if(type==='wind')return svg(`${compass}<g class="pd-sc-runway"><rect x="341" y="130" width="38" height="340" rx="1"/><path stroke-dasharray="16 14" d="M360 150v300"/></g><g class="pd-sc-needle"><path d="M180 150 400 370m-36-4 36 4-4-36"/></g><path class="pd-sc-trace" pathLength="1" d="M180 150H400V370"/><path class="pd-sc-arc" d="M360 188a112 112 0 0 1 79 33"/>`);
 if(type==='altitude')return svg(`${grid}<g class="pd-sc-plates"><path d="m112 405 240 85 252-105-240-79z"/><path d="m112 315 240 85 252-105-240-79z"/><path d="m112 225 240 85 252-105-240-79z"/></g><path class="pd-sc-trace" pathLength="1" d="M200 408 292 338 374 287 467 174 554 140"/><g class="pd-sc-measure"><path d="M620 154v300m-12-300h24m-24 75h16m-16 75h24m-24 75h16m-16 75h24"/></g>`);
 if(type==='loading')return svg(`${grid}<g class="pd-sc-balance"><path d="M360 220v245m-70 0h140M148 230h424"/><path d="m360 186 22 38h-44z"/><path d="M196 230v132m-70 0h140M524 230v132m-70 0h140"/><path d="m136 362 17 38h86l17-38m208 0 17 38h86l17-38"/><rect x="164" y="317" width="56" height="45"/><rect x="493" y="287" width="62" height="75"/></g><path class="pd-sc-trace" pathLength="1" d="M148 230H572"/>`);
 if(type==='fuel')return svg(`${compass}<g class="pd-sc-fuel"><path d="M285 158h150v290H285z"/><path d="M285 340h150v108H285z"/><path d="M435 180h45l35 50v135c0 35 38 35 38 0v-80l-32-45"/><path d="M312 192h96v70h-96z"/></g><path class="pd-sc-trace" pathLength="1" d="M180 432a230 230 0 0 1 0-264"/><g class="pd-sc-measure"><path d="M240 200h18m-18 50h12m-12 50h18m-18 50h12m-12 50h18"/></g>`);
 if(type==='weather')return `<div class="pd-sc-weather"><div class="pd-sc-cloud pd-sc-cloud-a"></div><div class="pd-sc-cloud pd-sc-cloud-b"></div><picture><source media="(max-width:760px)" srcset="/assets/hero-scenes/weather-plate-mobile.webp" /><img src="/assets/hero-scenes/weather-plate.webp" alt="" width="720" height="600" decoding="async" fetchpriority="low" /></picture>${svg(`<g class="pd-sc-scale"><ellipse cx="360" cy="430" rx="242" ry="95"/><ellipse cx="360" cy="430" rx="170" ry="64"/><ellipse cx="360" cy="430" rx="90" ry="34"/></g><path class="pd-sc-trace" pathLength="1" d="M360 430 584 361"/>`)}</div>`;
 if(type==='tools')return `<div class="pd-sc-computer"><picture><source media="(max-width:760px)" srcset="/assets/hero-scenes/tools-plate-mobile.webp" /><img src="/assets/hero-scenes/tools-plate.webp" alt="" width="720" height="600" decoding="async" fetchpriority="low" /></picture>${svg(`<g class="pd-sc-orbit">${compass}</g><path class="pd-sc-trace" pathLength="1" d="M130 490 238 456 560 142"/>`)}</div>`;
 if(type==='learn')return `<div class="pd-sc-study"><div class="pd-sc-sheet pd-sc-sheet-back"></div><div class="pd-sc-sheet pd-sc-sheet-front"></div><picture><source media="(max-width:760px)" srcset="/assets/hero-scenes/learn-plate-mobile.webp" /><img src="/assets/hero-scenes/learn-plate.webp" alt="" width="720" height="600" decoding="async" fetchpriority="low" /></picture>${svg(`<path class="pd-sc-trace" pathLength="1" d="M176 434C250 390 278 440 350 376S480 292 566 312"/>`)}</div>`;
 if(type==='membership')return svg(`<g class="pd-sc-tier pd-sc-tier-back"><path d="m170 160 290-35v330l-290 35z"/><path d="m205 205 170-20m-170 65 200-24m-200 70 150-18m-150 71 185-22"/></g><g class="pd-sc-tier pd-sc-tier-front"><path d="m290 208 265-40v303l-265 40z"/><path class="pd-sc-trace" pathLength="1" d="m333 285 38 30 92-104"/><path d="m325 375 180-27m-180 80 130-20"/></g>`);
 return svg(`<g class="pd-sc-document pd-sc-tier-back"><path d="m190 138 286-28v352l-286 28z"/><path d="m230 205 200-20m-200 60 180-18m-180 60 200-20m-200 60 170-17m-170 60 190-19"/></g><g class="pd-sc-document pd-sc-tier-front"><path d="m300 188 246-26v320l-246 26z"/><path class="pd-sc-trace" pathLength="1" d="m335 285 43 33 88-109"/><path d="m335 380 170-18m-170 66 130-14"/></g>`);
}
export function composePage(html, route){
 if(['/', '/index.html'].includes(route)||route.startsWith('/prototypes/')||html.includes('data-pd-cinematic')||!/<main\b/.test(html))return html;
 const heading=html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);
 if(!heading)return html;
 const type=family(route),article=/^\/(guides\/|legal\/|learn\/oral-exam\/)/.test(route);
 const meta=html.match(/<meta\b(?=[^>]*name=["']description["'])(?=[^>]*content="([^"]*)")[^>]*>/i)?.[1]||'';
 const description=meta.replace(/&quot;/g,'"').replace(/&amp;/g,'&');
 const hero=`<section class="pd-sc-hero pd-sc-family-${type}" data-pd-cinematic="${type}" data-sc-act="flow"><div class="pd-sc-stage"><div class="pd-sc-backdrop" aria-hidden="true"></div><div class="pd-sc-copy"><p class="pd-sc-category">${labels[type]}</p>${heading[0]}${description?`<p class="pd-sc-description">${escape(description)}</p>`:''}<a class="pd-sc-enter" href="#pdWorkSurface">${article?'Read the guide':type==='membership'?'Explore plans':route.startsWith('/calculators/')?'Open calculator':'Open workspace'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></a></div><div class="pd-sc-art" aria-hidden="true">${illustration(type)}</div><div class="pd-sc-scene-note" aria-hidden="true">${labels[type]} · Visual study</div></div></section><div id="pdWorkSurface" class="pd-sc-work-anchor" tabindex="-1"></div>`;
 html=html.replace(heading[0],'');
 html=html.replace(/(<main\b[^>]*>)/i,'$1<div class="pd-sc-reading" aria-hidden="true"><span data-sc-progress></span></div>'+hero);
 html=html.replace(/<body\b([^>]*)>/i,(_tag,attrs)=>'<body'+(/\bclass=/.test(attrs)?attrs.replace(/class="([^"]*)"/,'class="$1 pd-sc-page"'):attrs+' class="pd-sc-page"')+'>');
 html=html.replace(/<\/head>/i,'<script defer src="/assets/scrollcraft-engine.js"></script></head>');
 return html;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let count=0;const visit=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else if(entry.name.endsWith('.html')){const before=fs.readFileSync(file,'utf8'),route='/'+path.relative('dist',file).split(path.sep).join('/'),after=composePage(before,route);if(after!==before){fs.writeFileSync(file,after);count++}}}};visit('dist');console.log(`Composed cinematic briefing scenes on ${count} pages.`);
}
