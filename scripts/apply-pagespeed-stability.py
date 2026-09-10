from pathlib import Path
p=Path('assets/site.js')
s=p.read_text()
old="function registerSW(){if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{})}"
new="function registerSW(){if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;let started=false,timer=null;const start=()=>{if(started)return;started=true;if(timer)clearTimeout(timer);navigator.serviceWorker.register('/sw.js').catch(()=>{})};['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,start,{once:true,passive:true}));const later=()=>{timer=setTimeout(start,12000)};if(document.readyState==='complete')later();else addEventListener('load',later,{once:true})}"
if old not in s: raise SystemExit('registerSW pattern not found')
p.write_text(s.replace(old,new,1))
q=Path('qa/google-audit.mjs')
t=q.read_text()
needle="if(!site.includes('No recent tools yet.'))fail('recent-tools stable empty state missing');\n"
insert=needle+"if(!site.includes('setTimeout(start,12000)'))fail('service worker should not take over the initial audit load');\n"
if needle not in t: raise SystemExit('qa insertion point not found')
q.write_text(t.replace(needle,insert,1))
print('PageSpeed stability patch applied')
