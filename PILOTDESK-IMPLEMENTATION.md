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
2. **NOT STARTED — Header and navigation**
3. **NOT STARTED — Homepage**
4. **NOT STARTED — Shared calculator experience**
5. **NOT STARTED — Weather**
6. **NOT STARTED — Flight planning**
7. **NOT STARTED — Weight & Balance**
8. **NOT STARTED — Learn**
9. **NOT STARTED — Written Prep**
10. **NOT STARTED — Daily**
11. **NOT STARTED — Account**
12. **NOT STARTED — Remaining pages**
13. **NOT STARTED — SEO**
14. **NOT STARTED — Accessibility**
15. **NOT STARTED — Performance**
16. **NOT STARTED — Legacy CSS cleanup**
