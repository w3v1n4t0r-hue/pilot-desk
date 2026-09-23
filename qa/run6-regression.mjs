import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(path,'utf8');
const head=html=>(html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)||[])[1]||'';
const count=(text,re)=>[...text.matchAll(re)].length;

for(const page of ['weather.html','route-planner.html','written-prep.html']){
 const html=read('dist/'+page),h=head(html);
 for(const name of ['og:title','og:description','og:type','og:url','og:site_name','twitter:card','twitter:title','twitter:description']){
  const re=new RegExp('<meta\\b[^>]*(?:name|property)=["\\x27]'+name+'["\\x27][^>]*>','gi');
  assert.equal(count(h,re),1,page+' must have one static '+name);
 }
}
for(const page of ['index.html','tools.html']){
 const h=head(read('dist/'+page));
 assert.match(h,/<meta name="twitter:card" content="summary"/,page+' Astro social metadata');
}
assert.match(read('dist/index.html'),/data-pd-account-link/,'Astro header account link must be present before JavaScript');
assert.match(read('assets/efb-layers.js'),/L\.marker\(ll,\{pane,icon,interactive:true,keyboard:false\}\)/,'background map markers must not fill tab order');
assert.match(read('assets/crosswind-mfd.js'),/if\(!s\)\{[^}]*data-xwind-head[^}]*data-xwind-cross/,'invalid crosswind values must clear live readouts');
assert.doesNotMatch(read('assets/styles-legacy.css'),/@view-transition\{navigation:auto\}/,'cross-document transitions should stay disabled');
const clients=['global-nav.js','account.js','billing.js','calculation-account.js','daily.js','written-prep.js'];
for(const file of clients)assert.match(read('assets/'+file),/supabase-client\.js/,'shared client required in '+file);
assert.equal(count(read('assets/supabase-client.js'),/createClient\(/g),1,'one Supabase client creation site');
console.log('Run 6 regression PASS: initial header, social metadata, map keyboard order, crosswind invalid state, navigation transitions, auth client.');
