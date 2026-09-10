import fs from 'node:fs';

const index='index.html';
if(fs.existsSync(index)){
  let html=fs.readFileSync(index,'utf8');
  if(!html.includes('id="pdFavoritesStable"')){
    const marker='<section class="recent-section"><div class="category-head"><h2>Recently used</h2><span>Stored only on this device</span></div><div class="recent-row" id="recentTools"></div></section>';
    const extra=`${marker}<section class="recent-section"><div class="category-head"><h2>Favorites</h2><span>Stored only on this device</span></div><div class="recent-row pd-stable-home" id="pdFavoritesStable"></div></section><section class="recent-section"><div class="category-head"><h2>Calculation history</h2><span><a href="/history.html">View all</a></span></div><div class="recent-row pd-stable-home" id="pdHistoryStable"></div></section>`;
    html=html.replace(marker,extra);
  }
  if(!html.includes('data-pd-query-search')){
    html=html.replace('</body>','<script data-pd-query-search>addEventListener(\'DOMContentLoaded\',()=>{const q=new URLSearchParams(location.search).get(\'q\');const i=document.getElementById(\'toolSearch\');if(q&&i){i.value=q;i.dispatchEvent(new Event(\'input\',{bubbles:true}));i.focus()}});</script></body>');
  }
  fs.writeFileSync(index,html);
}

const notfound='404.html';
if(fs.existsSync(notfound)){
  let html=fs.readFileSync(notfound,'utf8');
  if(!html.includes('id="pd404Search"')){
    html=html.replace('<p>The link may be old or mistyped. These are the fastest ways back into PilotDesk.</p>','<p>The link may be old or mistyped. Search PilotDesk or use one of the quick links below.</p><form class="search" id="pd404Search" action="/" method="get"><label class="skip-link" for="pd404q">Search PilotDesk</label><input id="pd404q" name="q" placeholder="Search calculators and pilot tools" autocomplete="off"><button class="utility-btn" type="submit">Search</button></form>');
  }
  fs.writeFileSync(notfound,html);
}

const sitemap='sitemap.xml';
if(fs.existsSync(sitemap)){
  let xml=fs.readFileSync(sitemap,'utf8');
  if(!xml.includes('https://www.pilot-desk.com/changelog.html'))xml=xml.replace('</urlset>','  <url><loc>https://www.pilot-desk.com/changelog.html</loc></url>\n</urlset>');
  fs.writeFileSync(sitemap,xml);
}
console.log('Applied stable homepage, 404 search, and sitemap additions.');
