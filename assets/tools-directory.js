(()=>{'use strict';

const CATEGORY_ORDER=['Featured','Flight Planning','Atmosphere & Weather','Performance','Maneuvers & Turns','Navigation','Weight & Balance','Conversions'];
const CATEGORY_SLUGS={
  'Flight Planning':['crosswind','wind-triangle','time-speed-distance','fuel-required','endurance-range','top-of-descent','three-degree-descent','holding-leg-distance'],
  'Atmosphere & Weather':['pressure-altitude','density-altitude','isa-temperature','cloud-base','speed-of-sound','mach-number'],
  'Performance':['true-airspeed','climb-gradient','fpm-to-gradient','gradient-angle','glide-range','maneuvering-speed-weight','accelerated-stall','hydroplaning','wing-loading','power-loading','obstacle-gradient'],
  'Maneuvers & Turns':['pivotal-altitude','standard-rate-bank','load-factor','turn-radius','rate-of-turn'],
  'Navigation':['reciprocal-heading','true-magnetic','arc-distance','great-circle-distance','dms-decimal','nm-per-minute'],
  'Weight & Balance':['moment-cg','percent-mac','ballast','fuel-weight'],
  'Conversions':['speed-conversion','distance-conversion','temperature-conversion','weight-conversion','volume-conversion','pressure-conversion','vertical-speed-conversion']
};
const ALIASES={
  'crosswind':'wind component runway headwind tailwind',
  'wind-triangle':'groundspeed ground speed heading wind correction wca course tas',
  'time-speed-distance':'time speed distance tsd distance speed time',
  'fuel-required':'fuel burn trip fuel reserve gallons gph',
  'endurance-range':'fuel endurance range hours distance',
  'top-of-descent':'top of descent tod descent planning',
  'three-degree-descent':'3 degree descent rate fpm groundspeed gs times 5',
  'holding-leg-distance':'holding hold leg distance time groundspeed',
  'pressure-altitude':'pressure altitude altimeter setting elevation',
  'density-altitude':'density altitude da oat temperature pressure altitude',
  'isa-temperature':'isa standard atmosphere temperature altitude',
  'cloud-base':'cloud base dewpoint dew point spread ceiling estimate',
  'speed-of-sound':'speed of sound temperature',
  'mach-number':'mach true airspeed tas temperature',
  'true-airspeed':'true airspeed tas cas calibrated airspeed 2 percent rule',
  'climb-gradient':'climb gradient ft/nm feet per nautical mile fpm',
  'fpm-to-gradient':'fpm climb gradient ft/nm feet per nautical mile',
  'gradient-angle':'gradient angle percent slope ft/nm',
  'glide-range':'glide distance glide ratio range emergency',
  'maneuvering-speed-weight':'maneuvering speed va weight',
  'accelerated-stall':'accelerated stall speed bank angle load factor',
  'hydroplaning':'hydroplaning speed tire pressure wet runway',
  'wing-loading':'wing loading weight area',
  'power-loading':'power loading horsepower weight',
  'obstacle-gradient':'obstacle climb gradient clearance ft/nm',
  'pivotal-altitude':'pivotal altitude eights on pylons groundspeed gs squared',
  'standard-rate-bank':'standard rate turn rate 1 bank angle 3 degrees second',
  'load-factor':'load factor g bank angle stall',
  'turn-radius':'turn radius bank angle tas diameter',
  'rate-of-turn':'rate of turn turn rate bank angle tas',
  'reciprocal-heading':'reciprocal heading course 180 opposite',
  'true-magnetic':'true magnetic heading variation east west',
  'arc-distance':'dme arc distance radius degrees',
  'great-circle-distance':'great circle distance latitude longitude bearing',
  'dms-decimal':'coordinates dms decimal degrees latitude longitude',
  'nm-per-minute':'nautical miles per minute nm minute groundspeed seconds per nm',
  'moment-cg':'cg center gravity moment arm weight moment 1000',
  'percent-mac':'percent mac cg lemac mean aerodynamic chord',
  'ballast':'ballast required cg weight arm',
  'fuel-weight':'fuel weight gallons avgas jet a pounds',
  'speed-conversion':'knots mph kmh speed conversion',
  'distance-conversion':'nm miles km feet distance conversion',
  'temperature-conversion':'celsius fahrenheit kelvin temperature',
  'weight-conversion':'pounds kg ounces weight conversion',
  'volume-conversion':'gallons liters quarts volume',
  'pressure-conversion':'inhg hpa kpa pressure altimeter',
  'vertical-speed-conversion':'fpm feet second meters second vertical speed'
};
const DESCRIPTIONS={
  'crosswind':'Split reported wind into crosswind and headwind/tailwind components.',
  'density-altitude':'Calculate density altitude from pressure altitude and temperature.',
  'fuel-required':'Calculate trip fuel, reserve fuel, and fuel margin.',
  'wind-triangle':'Solve heading, groundspeed, and wind-correction angle.',
  'climb-gradient':'Convert an ft/NM climb requirement into required FPM.',
  'fpm-to-gradient':'Convert vertical speed and groundspeed into climb gradient.',
  'glide-range':'Estimate still-air glide distance from altitude and glide ratio.',
  'pivotal-altitude':'Calculate pivotal altitude from groundspeed.',
  'standard-rate-bank':'Find bank angle for a standard-rate / rate 1 turn.',
  'moment-cg':'Solve station moment and loaded center of gravity.',
  'turn-radius':'Calculate turn radius from true airspeed and bank angle.',
  'rate-of-turn':'Calculate turn rate, turn time, and radius.',
  'true-airspeed':'Estimate true airspeed with the common 2% training rule.',
  'three-degree-descent':'Find FPM for a 3° descent from groundspeed.',
  'top-of-descent':'Estimate top-of-descent distance, rate, and time.'
};
const slugOf=x=>{
  if(x.href==='/weight-balance.html')return 'weight-balance';
  if(x.href==='/e6b-flight-computer.html')return 'e6b';
  return x.href.split('/').filter(Boolean).pop()||'';
};
const categoryOf=x=>{
  const slug=slugOf(x);
  if(slug==='weight-balance')return 'Featured';
  if(slug==='e6b')return 'Featured';
  for(const [group,slugs] of Object.entries(CATEGORY_SLUGS))if(slugs.includes(slug))return group;
  return x.group&&x.group!=='Flight math'?x.group:'Other';
};
const read=(key,fallback=[])=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
const norm=s=>String(s||'').toLowerCase().replace(/[°&/]/g,' ').replace(/[^a-z0-9.+-]+/g,' ').trim();
const dedupe=items=>[...new Map(items.map(x=>[x.href,x])).values()];
function relativeUsed(ts){const n=Number(ts||0);if(!n)return 'Recently used';const days=Math.max(0,Math.floor((Date.now()-n)/86400000));if(days===0)return 'Last used today';if(days===1)return 'Last used yesterday';return 'Last used '+days+' days ago'}
function toolIcon(category,slug){const common='viewBox="0 0 24 24" aria-hidden="true"';if(slug==='weight-balance')return `<svg ${common}><path d="M12 4v16M5 8h14M7 8l-3 6h6L7 8Zm10 0-3 6h6l-3-6ZM8 20h8"/></svg>`;if(category==='Flight Planning')return `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="m12 5 2.1 4.9L19 12l-4.9 2.1L12 19l-2.1-4.9L5 12l4.9-2.1Z"/></svg>`;if(category==='Atmosphere & Weather')return `<svg ${common}><path d="M4 7h11M4 12h16M4 17h12"/><path d="m16 5 2 2-2 2"/></svg>`;if(category==='Performance')return `<svg ${common}><path d="M5 18 10 8l3 6 3-9 3 13"/><path d="M4 20h16"/></svg>`;if(category==='Maneuvers & Turns')return `<svg ${common}><path d="M6 12a6 6 0 1 1 6 6"/><path d="m6 8v4h4"/></svg>`;if(category==='Navigation')return `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="m15 7-2 6-6 2 2-6 6-2Z"/></svg>`;if(category==='Weight & Balance')return `<svg ${common}><path d="M12 5v14M6 9h12M7 9l-3 5h6L7 9Zm10 0-3 5h6l-3-5Z"/></svg>`;if(category==='Conversions')return `<svg ${common}><path d="M7 7h10l-2-2m2 2-2 2M17 17H7l2 2m-2-2 2-2"/></svg>`;return `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M8 12h8M12 8v8"/></svg>`}

function init(){
  const host=document.getElementById('pdToolDirectory');
  const input=document.getElementById('pdToolDirectorySearch');
  const groupSelect=document.getElementById('pdToolDirectoryGroup');
  const count=document.getElementById('pdToolCount');
  const clear=document.getElementById('pdToolClear');
  const chips=document.getElementById('pdToolChips');
  const personal=document.getElementById('pdToolPersonal');
  const personalGrid=document.getElementById('pdToolPersonalGrid');
  if(!host||!input||!groupSelect)return;

  const inventory=(window.PILOTDESK_INVENTORY||window.PILOTDESK_NAV?.inventory||[]).filter(x=>x.type==='Calculator');
  const featured=[
    {title:'Weight & Balance',href:'/weight-balance.html',group:'Featured'},
    {title:'E6B Flight Computer',href:'/e6b-flight-computer.html',group:'Featured'}
  ];
  const items=dedupe([...featured,...inventory]).map(x=>{
    const slug=slugOf(x),category=categoryOf(x);
    const search=norm([x.title,category,slug,ALIASES[slug]||''].join(' '));
    return {...x,slug,category,search};
  });

  for(const category of CATEGORY_ORDER.filter(c=>items.some(x=>x.category===c))){
    const option=document.createElement('option');
    option.value=category;option.textContent=category;groupSelect.append(option);
  }

  const params=new URLSearchParams(location.search);
  input.value=params.get('q')||'';
  groupSelect.value=params.get('category')||'';

  const makeChip=(label,value)=>{
    const b=document.createElement('button');
    b.type='button';b.className='pd-tool-chip';b.dataset.category=value;b.textContent=label;
    b.addEventListener('click',()=>{
      groupSelect.value=groupSelect.value===value?'':value;
      render();
      groupSelect.focus({preventScroll:true});
      window.pdTrack?.('Tool Directory Filter',{category:groupSelect.value||'all'});
    });
    return b;
  };
  ['Flight Planning','Performance','Navigation','Weight & Balance','Conversions'].forEach(c=>{
    if(items.some(x=>x.category===c))chips?.append(makeChip(c,c));
  });

  function itemByPath(path){return items.find(x=>x.href===path||x.href.replace(/\/$/,'')===String(path||'').replace(/\/$/,''))}
  function renderPersonal(){
    if(!personal||!personalGrid)return;
    const recentRaw=read('pd-recent',[]);
    const recent=recentRaw.map(x=>{const item=itemByPath(x.path);return item?{...item,usedAt:x.usedAt||0}:null}).filter(Boolean).slice(0,8);
    personalGrid.replaceChildren();
    if(!recent.length){personal.hidden=true;return}
    personal.hidden=false;
    for(const x of recent){
      const a=document.createElement('a');a.className='pd-tool-personal-card';a.href=x.href;
      a.innerHTML=`<span class="pd-directory-icon">${toolIcon(x.category,x.slug)}</span><span class="pd-tool-personal-copy"><small data-last-used>${relativeUsed(x.usedAt)}</small><b>${x.title}</b><span>${x.category}</span></span>`;
      a.addEventListener('click',()=>window.pdTrack?.('Tool Directory Open',{tool:x.slug,source:'recent'}));
      personalGrid.append(a);
    }
  }

  const recentByPath=new Map(read('pd-recent',[]).map(x=>[String(x.path||'').replace(/\/$/,''),x]));
  function cardFor(x){
    const a=document.createElement('a');a.className='tool-card pd-directory-card';a.href=x.href;
    const icon=document.createElement('span');icon.className='pd-directory-icon';icon.innerHTML=toolIcon(x.category,x.slug);
    const copy=document.createElement('span');copy.className='pd-directory-card-copy';
    const row=document.createElement('span');row.className='pd-directory-card-topline';
    const meta=document.createElement('small');meta.className='pd-directory-card-meta';meta.textContent=x.category;
    row.append(meta);
    const recent=recentByPath.get(x.href.replace(/\/$/,''));
    if(recent){const used=document.createElement('small');used.className='pd-directory-last-used';used.textContent=relativeUsed(recent.usedAt);row.append(used)}
    const title=document.createElement('b');title.textContent=x.title;
    const desc=document.createElement('p');
    desc.textContent=DESCRIPTIONS[x.slug]||(
      x.slug==='weight-balance'?'Build and check an aircraft loading scenario.':
      x.slug==='e6b'?'Run common E6B flight-planning calculations in one place.':
      'Open this aviation calculator and see the formula, inputs, and result.'
    );
    copy.append(row,title,desc);a.append(icon,copy);
    a.addEventListener('click',()=>window.pdTrack?.('Tool Directory Open',{tool:x.slug,source:'directory'}));
    return a;
  }

  let timer;
  function render(){
    const q=norm(input.value),selected=groupSelect.value||'';
    const tokens=q.split(' ').filter(Boolean);
    const matches=items.filter(x=>(!selected||x.category===selected)&&tokens.every(t=>x.search.includes(t)));
    host.replaceChildren();

    for(const category of CATEGORY_ORDER.concat(['Other'])){
      const groupItems=matches.filter(x=>x.category===category);
      if(!groupItems.length)continue;
      const section=document.createElement('section');section.className='category pd-directory-group';
      const head=document.createElement('div');head.className='category-head';
      const h=document.createElement('h2');h.textContent=category==='Featured'?'Featured tools':category;
      const n=document.createElement('span');n.textContent=`${groupItems.length} tool${groupItems.length===1?'':'s'}`;
      head.append(h,n);
      const grid=document.createElement('div');grid.className='grid pd-directory-grid';
      groupItems.forEach(x=>grid.append(cardFor(x)));
      section.append(head,grid);host.append(section);
    }

    count.textContent=`${matches.length} of ${items.length} tools`;
    clear.hidden=!q&&!selected;
    [...chips?.querySelectorAll('.pd-tool-chip')||[]].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===selected)));

    const url=new URL(location.href);
    q?url.searchParams.set('q',input.value.trim()):url.searchParams.delete('q');
    selected?url.searchParams.set('category',selected):url.searchParams.delete('category');
    history.replaceState(null,'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams.toString():''));

    if(!matches.length){
      const empty=document.createElement('div');empty.className='pd-empty-state';
      empty.innerHTML='<h2>No calculator matched</h2><p>Try a broader term such as wind, fuel, altitude, CG, descent, or conversion.</p><button class="utility-btn" type="button">Show all tools</button>';
      empty.querySelector('button').addEventListener('click',reset);
      host.append(empty);
    }
  }
  function reset(){input.value='';groupSelect.value='';render();input.focus()}
  function trackSearch(){clearTimeout(timer);timer=setTimeout(()=>{if(input.value.trim())window.pdTrack?.('Tool Directory Search',{active:'yes',category:groupSelect.value||'all'})},600)}

  input.addEventListener('input',()=>{render();trackSearch()});
  groupSelect.addEventListener('change',()=>{render();window.pdTrack?.('Tool Directory Filter',{category:groupSelect.value||'all'})});
  clear?.addEventListener('click',reset);
  addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement?.tagName||'')){e.preventDefault();input.focus()}});
  renderPersonal();render();
}
if(window.PILOTDESK_INVENTORY||window.PILOTDESK_NAV?.inventory)init();else{const s=document.createElement('script');s.src='/assets/inventory-data.js';s.onload=init;document.head.append(s)}
})();
