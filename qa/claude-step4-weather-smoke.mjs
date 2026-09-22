import fs from 'node:fs';

const failures=[];
const check=(ok,msg)=>{if(!ok)failures.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');

const page=read('weather.html');
const wx=read('assets/weather-fixed.js');
const extra=read('assets/weather-extra.js');
const css=read('assets/weather.css');
const api=read('api/weather.js');
const offline=read('assets/offline-weather.js');
const journey=read('assets/flight-journey.js');
const sw=read('sw.js');

// Favorites are a first-class entry point, above the manual lookup.
check(page.includes('id="weatherFavorites"'),'Weather favorite-airports list missing');
check(page.indexOf('id="weatherFavorites"')<page.indexOf('id="weatherForm"'),'Favorite airports are not front-and-center');
check(page.includes('Your regular weather checks'),'Favorite-airport returning-user copy missing');
check(wx.includes("const FAV_KEY='pd-favorite-airports'"),'Weather favorites do not share the airport favorite store');
check(wx.includes('renderFavorites()')&&wx.includes('toggleFavorite(station,name)'),'Weather favorite rendering/toggle behavior missing');
check(wx.includes('data-weather-favorite'),'Favorite airport quick-load action missing');
check(wx.includes("id=\"weatherFavorite\""),'Current station cannot be saved/removed as a favorite');

// Pilot-grade product timestamps.
for(const marker of ['RETRIEVED','RAW OBSERVATION','OBSERVED','RAW FORECAST','ISSUED','DECODED METAR','BASED ON METAR'])
  check(wx.includes(marker),'Weather briefing timestamp/product marker missing: '+marker);
check(wx.includes('function zulu('),'Aviation weather timestamps are not normalized to Zulu');
check(wx.includes('wx-time-stamp'),'Visible weather timestamp component missing');
check(wx.includes('OBS TIME UNAVAILABLE')&&wx.includes('ISSUE TIME UNAVAILABLE'),'Missing-time states are not explicit');
check(wx.includes('obsUnknown')&&wx.includes('tafUnknown'),'Unknown product ages are not treated separately from fresh products');
check(wx.includes('Observation time unavailable.')&&wx.includes('TAF issue time was unavailable.'),'Missing source time does not create an explicit warning');
check(css.includes('.wx-time-stamp')&&css.includes('.wx-time-stamp.is-missing'),'Timestamp and missing-time visual states missing');

// Briefing hierarchy: raw text first, decoded rows next, then derived planning context.
check(wx.indexOf('RAW OBSERVATION')<wx.indexOf('DECODED METAR'),'Decoded weather appears before the raw report');
check(wx.includes('wx-brief-table')&&wx.includes("briefRow('Wind'")&&wx.includes("briefRow('Ceiling'"),'Dense decoded METAR briefing rows missing');
check(css.includes('.wx-product .pd-raw')&&css.includes('ui-monospace'),'Raw METAR/TAF are not styled as coded aviation text');
check(css.includes('.wx-brief-row'),'Decoded briefing table styling missing');
check(wx.includes('Runway wind components')&&wx.includes("stamp('METAR OBS'"),'Derived runway data is not tied to the METAR observation time');

// Freshness contract: weather data must never be served as current from application/CDN cache.
check(wx.includes("cache:'no-store'"),'Primary weather request is not cache-bypassed');
check(extra.includes("cache:'no-store'"),'Weather context fallback request is not cache-bypassed');
check(api.includes("res.setHeader('Cache-Control','no-store, max-age=0')"),'Weather API still permits response caching');
check(!api.includes('stale-while-revalidate=300'),'Weather API still advertises stale-while-revalidate');
check(sw.includes("pathname.startsWith('/api/')"),'Service worker no longer keeps API requests network-only');
for(const asset of ['/assets/weather.css','/assets/weather-fixed.js','/assets/weather-extra.js','/assets/offline-weather.js'])
  check(sw.includes("'"+asset+"'"),'Weather asset is not network-first: '+asset);
check(offline.includes('does not reuse an older weather report as current'),'Offline mode does not explicitly reject stale-weather substitution');

// EFB visual language, not consumer-weather / generic SaaS.
check(css.includes('.wx-favorites')&&css.includes('.wx-brief-strip'),'Weather briefing hierarchy CSS missing');
check(css.includes('.wx-shell a,.wx-shell button{transform:none!important}'),'Decorative weather hover movement was not disabled');
check(!/radial-gradient|linear-gradient|backdrop-filter/i.test(css),'Weather layer contains decorative SaaS effects');
check(css.includes('.wx-shell .badge')&&css.includes('border-radius:0!important'),'Weather page still relies on pill treatment');

// Weather stays part of an active flight workflow, but does not masquerade as one of the six planning sub-app tabs.
check(journey.includes("const inSubapp=SUBAPP.some"),'Planning/weather chrome separation missing');
check(journey.includes("else if(hero)hero.insertAdjacentElement('afterend',wrap)"),'Weather workflow cannot render without the planning subnav');
check(journey.includes("document.addEventListener('pilotdesk:weatherloaded'"),'Weather no longer marks active-flight progress');

check(Number(sw.match(/CACHE='pilotdesk-v(\d+)'/)?.[1]||0)>=47,'Step 4 service-worker release version did not advance');

if(failures.length){
  console.error('Claude Step 4 weather smoke failed ('+failures.length+')');
  failures.forEach(x=>console.error(' - '+x));
  process.exit(1);
}
console.log('Claude Step 4 aviation-weather briefing smoke passed.');
