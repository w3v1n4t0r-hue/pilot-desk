# PilotDesk Launch Checklist

Status updated: September 9, 2026

## Local production readiness — COMPLETE
- [x] Normalize sitemap URLs to one configurable final-domain placeholder (fixed an accidental mixed-domain entry).
- [x] Add a launch configurator (`configure-launch.py`) that safely writes the final HTTPS domain, contact email, canonical URLs, Open Graph URLs, and optional AdSense IDs.
- [x] Keep analytics disabled at launch until a privacy/consent decision is made; privacy policy now states this explicitly.
- [x] Validate `vercel.json` parses and includes CSP, HSTS, nosniff, Referrer-Policy, and Permissions-Policy headers.
- [x] Verify all sitemap URLs serve successfully from a local HTTP server: 55/55 returned HTTP 200.
- [x] Verify internal links/assets structurally: 0 broken internal links found.
- [x] Verify page metadata and safety language across the site.
- [x] Verify ad placements remain visually separate from calculator controls/results in the page structure.
- [x] Re-test all standard formula pages after `assets/site.js` changes: 47/47 calculator pages pass with finite default outputs.
- [x] Run known-value regression checks for crosswind, pressure altitude, pivotal altitude, hydroplaning, load factor, accelerated stall, 3-degree descent, and cloud-base estimate.
- [x] Keep approximation labels/method notes visible on applicable calculators.
- [x] Keep Weight & Balance free of generic operational “safe/unsafe” approval claims; exact aircraft limits remain the pilot/operator’s approved-source responsibility.
- [x] Keep aircraft-specific performance calculators out unless approved source data and correct interpolation logic are supplied.
- [x] Add repeatable QA tools: `qa/run-regression.js` and `qa/audit-site.py`.

## Required external launch actions — BLOCKED UNTIL ACCOUNT/IDENTITY INPUTS EXIST
These cannot be truthfully completed inside the site files alone.

- [x] Buy the final domain: `pilot-desk.com`.
  - Domain purchased; DNS/hosting connection still needs to be completed during deployment.
- [~] Configure final domain + real support/contact method.
  - Final domain is configured as `https://pilot-desk.com`.
  - A real support/contact email is still required before public launch.
- [ ] Deploy over HTTPS and confirm Vercel security headers are active on the live response.
  - Needs: hosting/Vercel authorization.
- [ ] Test desktop and phone layouts on the live domain in a real browser.
  - Must be repeated after the production deployment because CDN/security/ad behavior can differ from local files.
- [ ] Submit `sitemap.xml` to Google Search Console.
  - Needs: live-domain ownership verification and Google account authorization.

## AdSense — READY, BUT ACCOUNT-BOUND STEPS REMAIN
- [x] Ad slots are implemented for top, content, sidebar, and footer placements without being styled as calculator buttons/results.
- [x] AdSense remains disabled until legitimate publisher and slot IDs are supplied.
- [x] `ads.txt` remains a non-functional placeholder until Google provides the exact publisher record.
- [x] CSP already anticipates core Google ad/consent domains, but must be re-tested after real ads are enabled.
- [ ] Get the public site established with useful content and traffic history.
- [ ] Apply/verify the domain in AdSense.
- [ ] Enter the real `ca-pub-...` publisher ID and four responsive slot IDs.
  - `configure-launch.py` can write these safely once provided.
- [ ] Replace `ads.txt` with Google’s exact publisher line.
  - The configurator can generate the standard Google line from the legitimate publisher ID; compare it with the value shown in AdSense before launch.
- [ ] Configure Google Privacy & Messaging / an appropriate certified CMP where required.
- [ ] Re-test the live CSP, consent flow, and ads after AdSense is enabled.

## Regression commands
Run these after any calculator/site change:

```bash
node qa/run-regression.js
python3 qa/audit-site.py
```

Current result: **PASS — 47 standard formula pages, 48 total calculator pages, 55 sitemap URLs, 0 audit failures.**


## AdSense verification
- AdSense publisher ID: ca-pub-2325772529624834
- AdSense ownership script is installed in every HTML page head.
- ads.txt is populated for this publisher.
- Ad unit slot IDs remain blank until Google approves the site / ad units are created.
