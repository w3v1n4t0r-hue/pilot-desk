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

## Phase 18 — User-asset 3D / OpenFOAM foundation (in progress)

- Supersedes the earlier SVG trainer / qualitative particle implementation at the user's request. No decorative flow remains. The user-provided trainer now renders as a real 28,736-triangle WebGL mesh.
- The lab remains after the working calculator, collapsed by default. The large mesh and renderer load only when opened. Top/side/orbit views and keyboard rotation/zoom work. Rendering stops while closed, offscreen or backgrounded; geometry-only views render on demand.
- OpenFOAM exports can supply the actual solved surface, pressure in Pa and integrated velocity streamlines. Imported cases retain explicit fixed conditions, solver/version, dates, reviewer and content hashes. Calculator edits do not silently deform or relabel a solved case.
- Added asset ingestion without executing supplied HTML, topology audit, deterministic OpenCFD v2312 case preparation, a guarded local runner, review-gated PyVista export and a shared browser/export data contract under `scripts/openfoam/`.
- Inspected the linked Inductiva wind-tunnel project. Its road/floor placement, auto-scaling and remote job submission are not adopted unchanged for aircraft. No cloud account, API key, machine group or paid job has been created.
- Both supplied meshes fail topology screening. The trainer needs separate CFD-surface cleanup, physical-unit/orientation confirmation and aerodynamic review. WSL, Docker and OpenFOAM are not currently installed here.
- Production build, repository QA and all 47-calculator browser checks pass, including new lazy-load, import/rejection, keyboard, reset, stale-input, invalid-solution, reduced-motion, WebGL-unavailable, accessibility and 320–1920px layout checks. Test field fixtures are explicitly synthetic and excluded from publication.
- **Not yet verified:** real meshing, solver execution, convergence, boundary-layer quality, mesh/domain independence and the PyVista export against actual OpenFOAM output. No real CFD dataset is shipped. Keep PR #54 in draft until runtime and clean simulation geometry are available.
- Existing aviation formulas, authentication, SEO URLs and service-worker behavior remain unchanged. Full per-page simulations are future work after the solver path is validated. See `scripts/openfoam/README.md` for exact prerequisites and limitations.
- Visual review caught a mobile camera-toolbar stacking problem and a shared secondary-button hover contrast collision. The component now wraps camera controls compactly; the canonical primary-hover rule excludes secondary/quiet/destructive variants rather than adding a new override layer. Both have browser regression coverage.

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
