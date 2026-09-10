from pathlib import Path

# Homepage trust cues + flight-training discovery
p=Path('index.html')
s=p.read_text()
old='<div class="trust-row"><div class="trust-card"><b>48 calculators</b>Common pilot math.</div><div class="trust-card"><b>No account</b>Open a tool and use it.</div><div class="trust-card"><b>Methods shown</b>See the formula and assumptions.</div></div>'
new='<div class="trust-row"><div class="trust-card"><b>HTTPS connection</b>Encrypted between your browser and PilotDesk.</div><div class="trust-card"><b>No account</b>Saved tools and planning data stay in this browser.</div><div class="trust-card"><b>Methods shown</b>See the formula and assumptions.</div></div>'
if old not in s: raise SystemExit('homepage trust row pattern not found')
s=s.replace(old,new,1)
old_card='<a class="tool-card" href="/guides/weight-and-balance.html"><b>Weight &amp; Balance</b><p>Weight, arm, moment and CG in plain English.</p></a></div><p style="margin-top:14px"><a class="recent-chip" href="/guides.html">See all PilotDesk guides →</a></p></section>'
new_card='<a class="tool-card" href="/guides/weight-and-balance.html"><b>Weight &amp; Balance</b><p>Weight, arm, moment and CG in plain English.</p></a><a class="tool-card" href="/flight-training.html"><b>Flight Training</b><p>A quick page of PilotDesk tools for students, instructors, and clubs.</p></a></div><p style="margin-top:14px"><a class="recent-chip" href="/guides.html">See all PilotDesk guides →</a></p></section>'
if old_card not in s: raise SystemExit('homepage guide card pattern not found')
p.write_text(s.replace(old_card,new_card,1))

# Sitemap
p=Path('sitemap.xml')
s=p.read_text()
needle='<url><loc>https://www.pilot-desk.com/about.html</loc></url>\n'
entry='<url><loc>https://www.pilot-desk.com/flight-training.html</loc></url>\n'
if entry not in s:
    if needle not in s: raise SystemExit('sitemap insertion point not found')
    s=s.replace(needle,needle+entry,1)
p.write_text(s)

# Existing QoL QA gets growth checks without another workflow step.
p=Path('qa/qol-smoke.mjs')
s=p.read_text()
needle="for(const p of ['assets/runtime-qol.js','assets/calculator-ux.js','assets/theme.js','assets/seo.js','assets/offline-weather.js','sw.js','vercel.json','api/weather.js'])ok(fs.existsSync(p),`Missing ${p}`);\n"
insert=needle+"for(const p of ['flight-training.html','index.html','sitemap.xml'])ok(fs.existsSync(p),`Missing ${p}`);\n"
if "flight-training.html','index.html','sitemap.xml" not in s:
    if needle not in s: raise SystemExit('QoL file check insertion point not found')
    s=s.replace(needle,insert,1)
needle2="const ux=read('assets/calculator-ux.js');for(const s of ['Copy result','Copy link','Reset','Print','Report result','history.replaceState','localStorage'])ok(ux.includes(s),`Calculator UX missing ${s}`);\n"
insert2=needle2+"const home=read('index.html'),training=read('flight-training.html'),sitemap=read('sitemap.xml');ok(home.includes('HTTPS connection'),'Homepage HTTPS trust cue missing');ok(home.includes('/flight-training.html'),'Homepage flight-training link missing');ok(training.includes('For instructors and clubs'),'Flight-training instructor section missing');ok(training.includes('/checklist-trainer.html'),'Flight-training checklist link missing');ok(sitemap.includes('/flight-training.html'),'Flight-training page missing from sitemap');\n"
if "Homepage HTTPS trust cue missing" not in s:
    if needle2 not in s: raise SystemExit('QoL content insertion point not found')
    s=s.replace(needle2,insert2,1)
p.write_text(s)
print('Organic growth patch applied')
