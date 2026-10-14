# PilotDesk homepage: product-first Scrollcraft

## Why the first version changed
The first Scrollcraft pass resembled a generic SaaS page. Its three numbered
feature panels and airplane traveling down a straight line drew more attention
to the animation than to PilotDesk. The page repeated the same planning/weather
claims across several sections, and the crosswind introduction said the same
thing twice.

## Research and copy
PilotDesk Copywriter's audience research identifies tedious navlog setup,
disconnected weather and aircraft calculations, and difficulty explaining oral
exam answers as repeat problems. The inventory confirms the live free E6B,
calculators, route planner, aviation-weather tools and checkride study, with
$5/month Pro for deeper features. The competitor blueprint prioritizes immediate
utility and actual product proof rather than large feature inventories.

## Result
- The working route-entry form still appears first.
- The scroll stage displays the repository's existing sectional chart overview
  (`assets/chart-overviews/sectional.webp`) inside a PilotDesk-styled route
  planning window. It is honestly marked a **static chart image, not for
  navigation**. There are no fabricated routes, current conditions, FAA
  approvals, or map data.
- Scrollcraft moves the chart image slightly on desktop. No pretend aircraft
  or animated route line. Upstream engine and MIT license stay unchanged.
- Primary actions lead into the real route planner, weather reports, and
  source documentation. The home route-form inputs stay functional.
- The crosswind slider demonstrates actual arithmetic immediately after the
  chart, followed by the calculators, pilot guides and oral study.
- Two repetitive route/weather marketing sections were removed. The pricing,
  account and official-source limitations remain visible.
- Phones and reduced-motion environments show the same content without a
  prolonged sticky-scroll sequence. No new images, font downloads or videos.

## Visual intent
Square black and graphite controls, silver highlights, tightly set headings and
a substantial real aviation chart. This is a live-surface composition, not a
film reel or fake software screenshot.

## Release checks
`qa/scrollcraft-home-smoke.mjs` checks the source, genuine chart asset and
feature integration. `qa/scrollcraft-home-browser.mjs` checks that the image
actually loads, scroll progress shifts the chart, and phone/reduced-motion
visitors can read the page without a pinned stage. Both run with existing QA
and desktop/mobile browser checks.
