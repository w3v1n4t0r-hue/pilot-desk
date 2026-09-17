# PilotDesk redesign implementation

Canonical direction: `PILOTDESK-DESIGN.md`. Preserve working aviation logic, URLs, authentication, SEO, and offline behavior throughout the migration.

## Phase status

1. **COMPLETE — Design-system foundation**
   - Scope: canonical colors, type, spacing, radius, elevation, motion, focus, buttons, forms, panels, and status roles.
   - Architecture: `assets/design-tokens.css` is the final shared authority; legacy token names remain compatibility aliases while call sites migrate.
   - Files: `assets/design-tokens.css`, legacy shared CSS, navigation cascade bootstrap, focused QA, and a cache-version-only service-worker release bump.
   - Verification: production build; all local CI smoke, integrity, formula, SEO, offline, and performance checks; JavaScript syntax; desktop and 390px browser review with no console errors.
   - Result: one black-first semantic token authority, compatibility aliases, restrained shared controls/forms/panels, reduced-motion support, and a working closed/open mobile navigation state.
   - Follow-up: migrate page-specific token namespaces only when their owning feature phase is active.
2. **COMPLETE — Header and navigation**
   - Unified the desktop and mobile shell, restrained dropdowns, site search, account entry, current-section state, and accessible expanded/control relationships.
3. **COMPLETE — Homepage**
   - Rebuilt the first-run hierarchy around plan, calculate, learn, and fly; added restrained product proof, useful-number previews, task entry points, and clearer progression into PilotDesk.
4. **COMPLETE — Shared calculator experience**
   - Standardized calculator heroes, warnings, forms, inputs, actions, results, saved scenarios, supporting copy, loading/empty/error states, and responsive behavior without changing formulas.
5. **COMPLETE — Weather**
   - Consolidated the weather surface into the shared black-first system while preserving report retrieval, decoding, categories, and operational-source guidance.
6. **COMPLETE — Flight planning**
   - Unified route, airport, procedure, saved-flight, brief, aircraft, and navlog presentation while preserving planning logic and external aeronautical sources.
7. **COMPLETE — Weight & Balance**
   - Reworked builder, cabin, stations, envelope, totals, and result presentation without changing aircraft data or weight-and-balance calculations.
8. **COMPLETE — Learn**
   - Standardized rating paths, learning hubs, cards, navigation, lesson surfaces, and next-step hierarchy.
9. **COMPLETE — Written Prep**
   - Consolidated the prep owner stylesheet into semantic tokens and refined rating selection, question, answer, progress, explanation, and status surfaces.
10. **COMPLETE — Daily**
   - Refined the daily challenge, streak, question, answer, result, and completion states for a focused repeat-use flow.
11. **COMPLETE — Account**
   - Unified sign-in, account, profile, saved-progress, and authentication feedback surfaces without changing authentication behavior.
12. **COMPLETE — Remaining pages**
   - Applied the shared shell, content rhythm, panels, cards, lists, calls to action, footer, and responsive rules across remaining hubs, guides, references, and supporting pages.
13. **COMPLETE — SEO**
   - Preserved canonical URLs, metadata architecture, sitemap coverage, indexable supporting copy, and existing route compatibility; SEO QA passes for all 176 sitemap URLs.
14. **COMPLETE — Accessibility**
   - Added consistent focus visibility, 44px touch targets, semantic status states, reduced-motion behavior, navigation ARIA wiring, and mobile keyboard/screen-reader structure.
15. **COMPLETE — Performance**
   - Kept the system dependency-light, reduced redundant direct stylesheet loading, retained static output and offline support, and passed the repository performance budget.
16. **COMPLETE — Legacy CSS cleanup**
   - Removed redundant direct `hub.css` links from source pages, made `styles.css` the canonical shared entry, retired obsolete visual assets from service-worker release sets, and avoided adding another override layer.
17. **COMPLETE — Interaction and accessibility safety net**
   - Added production-browser coverage for all 47 calculator interfaces, shared keyboard flows, URL state, resets, responsive fit, first-action visibility, and representative WCAG A/AA checks.
   - Added a focused pull-request workflow so interaction regressions fail before merge.
   - Fixed issues exposed by the new suite in optional Crosswind gust handling, Written Prep first-screen hierarchy, search semantics, inline-link affordance, Route Planner attribution, and canonical tertiary-text contrast.
   - Preserved calculator formulas, authentication behavior, SEO URLs, and service-worker behavior.

## Phase 18 — Flight Lab foundation

- Added an original SVG 172-class high-wing trainer in top and side views, with component-owned styles that consume the canonical tokens. Only Crosswind, Wind Triangle, and Density Altitude load this optional feature.
- Crosswind illustrates ground-referenced steady wind across the runway; Wind Triangle rotates the trainer using the calculator's displayed wind-correction angle; Density Altitude varies qualitative particle spacing using the displayed density-altitude result.
- The calculator remains above the teaching panel. Existing formula/validation code owns every result; the model waits for a completed calculation and suppresses stale or invalid states.
- Pause/play works with the keyboard. Reduced motion gives a static illustration; offscreen and background-tab animation pauses. Text communicates the result without relying on motion or color.
- This is an educational schematic, not a manufacturer-accurate 3D model, CFD simulation, control-technique demonstration, or aircraft-performance model. New Flight Lab assets use existing runtime caching when visited; they are not added to the service-worker precache.
- Production build, the existing 47-calculator interaction/accessibility suite, dedicated Flight Lab checks, and repository QA pass. Responsive checks cover 320–1920px; localized numeric output is covered with a German browser locale.
- Screenshot-based Product Design review covers the trainer, wind correction, and mobile crosswind. The review removed a misleading density reference legend and clarified zero-crab-angle wording.
- Formula code, authentication, SEO URLs, service-worker behavior, and dependencies are unchanged. This branch is stacked on `qa/tool-interaction-safety-net` (PR #53).

## Phase 2–16 verification

- Production build and Astro passthrough verification pass.
- All 32 repository QA workflows pass, including formula regression, 568-page integrity, authentication/RLS, trust and safety, performance, SEO, and offline-cache coverage.
- JavaScript syntax verification passes for 148 files.
- Browser review passes on desktop and a phone viewport for homepage, density altitude, weather, route planning, Weight & Balance, Written Prep, Daily, account, and flight training; no horizontal overflow or application errors were found. Existing duplicate Supabase-client warnings remain outside the visual scope.
- Density-altitude interaction was exercised end to end. Aviation formulas, auth flows, SEO URLs, and service-worker algorithms were not changed.

### Follow-up interaction pass

- Verified dark, light, and night-red display themes; global search; desktop dropdowns; and every nested mobile navigation section against the production build.
- Corrected a legacy cascade collision that forced desktop dropdown titles and descriptions into cramped rows.
- Corrected a legacy small-screen selector that hid E6B and Weight & Balance from the mobile Tools menu.
- Added a focused UI regression assertion for the canonical dropdown-item layout.

### Tool-first viewport pass

- Tightened calculator and tool-page introductions so the working inputs and primary action appear in the first screen on desktop and mobile.
- Moved long-form supporting and search content below each working tool instead of placing it between the page title and the interface.
- Removed the redundant generated calculator introduction while preserving page-specific safety guidance, metadata, canonical URLs, formulas, and offline behavior.
- Added regression coverage that keeps generated supporting guidance after the tool surface and prevents the generic introduction from returning.

### Interaction and accessibility regression pass

- All 47 standard calculators calculate from their defaults, reject missing required values with actionable feedback, recalculate from the keyboard, reset safely, expose visible labels and numeric mobile keyboards, and fit a 390×844 viewport without horizontal overflow.
- Crosswind query-string prefills, URL updates, reload persistence, optional gust input, and reset behavior are covered end to end.
- Homepage search, mobile navigation, and the first useful action on major product surfaces are covered in a production browser.
- Automated Axe checks cover representative homepage, calculator, planning, Weight & Balance, Written Prep, Daily, account, and learning surfaces, failing on serious or critical WCAG A/AA violations.
- Production build, repository smoke/integrity/formula/SEO/offline/performance/copy checks, and changed-JavaScript syntax checks pass alongside the new browser suite.
