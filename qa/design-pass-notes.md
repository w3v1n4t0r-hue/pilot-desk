# Design, motion and content pass — September 24, 2026

## Scope and retained work

Started from production 3f72ecd (PR99). The prior content remediation and finishing fixes were already live. Retained the sourced examples, hydroplaning correction, local draft recovery, pins/recents and release fingerprinting.

Flagship review set: homepage, Tools, Route Planner, Weather, METAR Decoder, E6B, Weight & Balance, Crosswind, Density Altitude, Pressure Altitude, Fuel Required, Wind Triangle, Hydroplaning, Sources, About, the wind-triangle and METAR/TAF guides, and the Private, Instrument, Commercial, Multi-Engine, CFI and CFII learning paths. Existing substantive material was preserved; this pass does not represent a new expert review of every aviation statement or every question in the training bank.

## Changes

- Homepage: three direct starting actions, working wind-component example, compact tool list, explicit weather links, existing personal desk only when real local data exists. Search remains available beside the tool list.
- Shared layouts: 1260px application shell, 820px reading measure, smaller headings, narrower calculator resources column, natural input-first mobile stacking, fewer nested learning/article panels. Operational page class is emitted before first paint.
- Motion: central CSS for menu/search/panel states, validation and answer reveals. Crosswind rotates through the shortest angle. W&B points interpolate for 180ms only when the envelope and axes remain fixed. New/invalid data and scale changes render immediately. Reduced motion bypasses interpolation.
- Mobile map panels open at the viewport bottom with 44px close controls, keyboard focus entry/return and Escape dismissal. Existing desktop positioning remains.
- Empty weather favorites stay hidden until saved data exists. Sharing appears after the resource rather than before the inputs.
- Seven overlapping guides permanently redirect to sections of two stronger guides. Their source fallbacks are noindexed, removed from sitemap entries and discovery inventory, and internal links go to the destination sections.
- Wind triangle: corrected the drift-direction sentence, added true/magnetic conversion and a numeric time/fuel continuation. METAR/TAF: calm/gust clarification and a worked forecast timeline across midnight. FAA PHAK and AWC remain the controlling references; scenarios are explicitly illustrative.

## Verification

- Production build; all 68 workflow check scripts; JavaScript syntax checks.
- Added behavior regressions for shortest-angle rotation; normal/reduced CG motion; fixed versus changed axes; invalid graph inputs; seven redirect destinations and anchors; noindex and sitemap exclusions.
- Two visual review passes, including 375px/390px and desktop. Browser reduced-motion preference was active and computed transitions were effectively disabled.
- Browser: homepage slider and linked inputs; mobile navigation and Learn selection; mobile map layers and Escape; W&B worked example; guide/source typography and overflow. APIs are checked on production because the local static preview does not execute Vercel functions.

No AdSense review was requested. Approval cannot be inferred from these changes.
