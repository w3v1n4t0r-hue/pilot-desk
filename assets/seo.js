(()=>{
'use strict';
const SITE='https://www.pilot-desk.com';
function addMeta(key,content,property=false){if(!content||document.querySelector(`meta[${property?'property':'name'}="${key}"]`))return;const m=document.createElement('meta');m.setAttribute(property?'property':'name',key);m.content=content;document.head.appendChild(m)}
function pagePath(){return location.pathname==='/index.html'?'/':(location.pathname||'/')}
function pageUrl(){return SITE+pagePath()}
const canonical=document.querySelector('link[rel="canonical"]');
if(canonical)canonical.href=canonical.href.replace('https://pilot-desk.com',SITE);
else if(pagePath()!=='/history.html'){const l=document.createElement('link');l.rel='canonical';l.href=pageUrl();document.head.appendChild(l)}
const og=document.querySelector('meta[property="og:url"]');if(og)og.content=og.content.replace('https://pilot-desk.com',SITE);else addMeta('og:url',pageUrl(),true);
const description=document.querySelector('meta[name="description"]')?.content||'PilotDesk aviation calculators and pilot tools.';
addMeta('og:site_name','PilotDesk',true);addMeta('og:title',document.title,true);addMeta('og:description',description,true);addMeta('twitter:card','summary');addMeta('twitter:title',document.title);addMeta('twitter:description',description);
function ensureNav(){const n=document.querySelector('.topbar nav');if(n&&!n.querySelector('a[href="/guides.html"]')){const a=document.createElement('a');a.href='/guides.html';a.textContent='Guides';n.appendChild(a)}const f=document.querySelector('.footer-links');if(f&&!f.querySelector('a[href="/guides.html"]')){const a=document.createElement('a');a.href='/guides.html';a.textContent='Guides';f.insertBefore(a,f.firstChild)}}
function addJsonLd(data,attr){if(document.querySelector(`script[${attr}]`))return;const s=document.createElement('script');s.type='application/ld+json';s.setAttribute(attr,'1');s.textContent=JSON.stringify(data);document.head.appendChild(s)}
function schema(){const p=pagePath(),h=document.querySelector('h1')?.textContent?.trim(),url=SITE+p;let data=null;if(p==='/'){data={'@context':'https://schema.org','@type':'WebSite',name:'PilotDesk',url:SITE+'/',description,potentialAction:{'@type':'SearchAction',target:SITE+'/?q={search_term_string}','query-input':'required name=search_term_string'}}}else if(p.startsWith('/calculators/')&&h){data={'@context':'https://schema.org','@type':'WebApplication',name:h,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,url,description,publisher:{'@type':'Organization',name:'PilotDesk',url:SITE+'/'}}}else if(p.startsWith('/guides/')&&h){data={'@context':'https://schema.org','@type':'Article',headline:h,description,publisher:{'@type':'Organization',name:'PilotDesk',url:SITE+'/'},mainEntityOfPage:url}}if(data)addJsonLd(data,'data-pd-schema');if(p.startsWith('/calculators/')&&h)addJsonLd({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Calculators',item:SITE+'/'},{'@type':'ListItem',position:2,name:h,item:url}]},'data-pd-breadcrumbs')}
function run(){ensureNav();schema()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
