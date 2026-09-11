import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const social={
  'e6b-flight-computer.html':'/assets/social-e6b.svg',
  'guides/pilot-math-formulas.html':'/assets/social-pilot-math.svg',
  'calculators/crosswind/index.html':'/assets/social-crosswind.svg',
  'calculators/density-altitude/index.html':'/assets/social-density-altitude.svg',
  'route-planner.html':'/assets/social-route-planner.svg',
  'weather.html':'/assets/social-weather.svg',
  'flight-planning-workspace.html':'/assets/social-route-planner.svg'
};
const brand='<span class="brandmark" aria-label="PilotDesk"><img src="/assets/icon.svg" alt="" width="38" height="38"></span>';
function addMeta(html,property,content,name=false){const attr=name?'name':'property',re=new RegExp(`<meta[^>]+${attr}=["']${property.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*>`,`i`),tag=`<meta ${attr}="${property}" content="${content}">`;return re.test(html)?html.replace(re,tag):html.replace('</head>',tag+'</head>')}
function processHtml(file){let html=fs.readFileSync(file,'utf8'),before=html,rel=path.relative(root,file).replaceAll('\\','/');
  html=html.replace(/<span class="brandmark"[^>]*>(?:PD|<svg[\s\S]*?<\/svg>|<img[\s\S]*?>)<\/span>/g,brand);
  if(!html.includes('/assets/boot.js'))html=html.replace('</head>','<script defer src="/assets/boot.js"></script></head>');
  if(social[rel]){const abs='https://www.pilot-desk.com'+social[rel];html=addMeta(html,'og:image',abs);html=addMeta(html,'twitter:card','summary_large_image',true);html=addMeta(html,'twitter:image',abs,true)}
  if(rel==='index.html'&&!html.includes('id="pdPopularNow"')){const marker='</div><section class="recent-section"><div class="category-head"><h2>Recently used</h2>';const popular='</div><section class="pd-popular" id="pdPopularNow"><div class="category-head"><h2>Popular right now</h2><span>Fast paths into PilotDesk</span></div><div class="pd-popular-grid"><a class="pd-popular-card" href="/e6b-flight-computer.html"><b>Online E6B</b><small>Wind, time, fuel &amp; altitude</small></a><a class="pd-popular-card" href="/guides/pilot-math-formulas.html"><b>Pilot Math Formulas</b><small>Formula reference</small></a><a class="pd-popular-card" href="/calculators/crosswind/"><b>Crosswind</b><small>Runway wind components</small></a><a class="pd-popular-card" href="/calculators/density-altitude/"><b>Density Altitude</b><small>Hot-and-high planning</small></a><a class="pd-popular-card" href="/flight-planning-workspace.html"><b>Planning Workspace</b><small>Wind → time → fuel → descent</small></a></div></section><section class="recent-section"><div class="category-head"><h2>Recently used</h2>';
    html=html.replace(marker,popular)
  }
  if(before!==html)fs.writeFileSync(file,html)
}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='node_modules')continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))processHtml(p)}}
walk(root);
const sitemap=path.join(root,'sitemap.xml');if(fs.existsSync(sitemap)){let xml=fs.readFileSync(sitemap,'utf8');if(!xml.includes('/flight-planning-workspace.html')){xml=xml.replace('</urlset>','<url><loc>https://www.pilot-desk.com/flight-planning-workspace.html</loc><lastmod>2026-09-11</lastmod></url>\n</urlset>');fs.writeFileSync(sitemap,xml)}}
console.log('Applied PilotDesk product upgrades to static pages.');
