# PilotDesk Free Product Roadmap

PilotDesk is staying free-first while the product earns repeat use. This roadmap turns the existing account, Daily, training, Hangar, sharing, and PWA foundations into one coherent retention loop.

## Product rule

Before adding paid features, answer one question with usage data: **why does a pilot come back tomorrow?**

Do not remove useful free functionality to manufacture a future paywall.

## Foundation

- Keep one canonical PilotDesk visual system from `PILOTDESK-DESIGN.md`.
- Make the account page the signed-in dashboard instead of creating a duplicate dashboard route.
- Expand pilot-stage choices through CFII/MEI and use stage as a personalization hint.
- Keep Daily, Written Prep, profile and skill-gap progress account-synced.
- Keep aircraft/saved-flight planning data local until cross-device sync is deliberately migrated and tested.
- Keep the PWA installable and offline-safe for deterministic calculators.
- Treat approved FAA/aircraft sources as controlling; PilotDesk remains supplemental.

## Retention

### Daily Pilot Challenge
Already implemented. Continue rotating useful METAR, regulation, performance, IFR and scenario questions. Measure starts, completions, shares and returning streak users.

### Personalized account dashboard
Show the most useful next action:
1. Today's Daily status.
2. Continue Written Prep / oral prep.
3. Active aircraft.
4. Recent/pinned tools on this device.
5. Pilot-stage-specific training link.

### Pilot progression
Support Student, Private, Instrument, Commercial, CFI, CFII, MEI and ATP stages. Personalization must never hide the rest of PilotDesk.

### Saved aircraft and calculations
Aircraft profiles and saved calculations already have schema support. Prefer connecting existing storage to useful workflows over inventing duplicate stores. Cross-device migration must be opt-in and tested before changing local-only promises.

### Learn / oral prep
Build certificate/rating study hubs around FAA ACS and primary FAA references. Prioritize Private, Instrument, Commercial, CFI, CFII and multi-engine. Clearly distinguish source material, PilotDesk explanation and practice questions.

### Interactive simulations
Add simulations only where they improve understanding. Start with concepts that benefit from visualization: crosswind components, wind correction, density altitude/performance relationships, weight/CG movement and multi-engine concepts. Every simulation needs accessible numeric/text output and must not imply aircraft-specific approved performance unless it uses approved data.

## Growth

- Extend the existing native-share/copy-link system to useful calculators and results where sharing does not expose private user data.
- Keep Daily referral links and share cards.
- Build useful, human-first SEO pages around actual pilot tasks; no doorway pages or keyword spam.
- Strengthen internal links between calculators, guides, training and source pages.
- Keep install prompts restrained; never block the task a pilot came to complete.
- Measure returning users, Daily completion, training continuation, tool reuse, shares and account conversion before considering a paid tier.

## PWA / mobile

PilotDesk already has a web manifest and service worker. Treat the installed PWA as the mobile-product proving ground before native iOS work. Verify installability, standalone navigation, safe-area layout, offline calculator behavior, update flow and icons.

## Monetization gate

Do not build a paywall yet. Revisit Pro only after PilotDesk has enough repeat usage to identify which advanced conveniences users actually value. FAA reference access and safety-critical source information should not be artificially restricted.

## Release order

1. Foundation and QA.
2. Retention loop.
3. Growth/share/install polish.
4. Measure.
5. Consider Pro/native app from evidence, not guesses.
