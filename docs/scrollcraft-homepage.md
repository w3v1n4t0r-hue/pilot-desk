# PilotDesk homepage: Scrollcraft adaptation

## Grounding and design decisions
This branch uses nateherkai/scroll-craft (MIT) as a **scroll runtime**, not as a
lookalike marketing template. Upstream engine files and LICENSE are copied
unchanged to `assets/scrollcraft/`. The `pilotdesk-home.*` files contain
PilotDesk-specific composition and a route-scoped initializer.

- **Audience:** pilots planning a flight, students reviewing the math, and
  pilots preparing for written or oral exams.
- **Outcome:** visitors should find the next practical task quickly, see the
  reasoning behind the calculations, and find the right source to verify them.
- **Brand:** charcoal, graphite and silver. Square corners, instrument-style
  labels, no decorative purple gradients or fake dashboard numbers.
- **Structure:** live surface, not a filmic one-shot. The real route entry
  stays above the scroll narrative. A working crosswind slider follows it.
- **Sequence:** route entry → flight workflow (scroll) → crosswind math →
  calculators → route detail → weather → guides → Learn → Free/Pro → account
  and verification guidance.
- **Signature:** a small aircraft moves past ROUTE, NUMBERS and CONDITIONS
  markers as the visitor scrolls. The line is a *planning sequence*, explicitly
  not a map or route suggestion. All links are genuine PilotDesk destinations.
- **Feeling curve:** recognition (real form), comprehension (ordered sequence),
  control (slider), breadth (calculators), readiness (weather and FAA sources).
  The peak is the scroll-driven sequence backed immediately by useful tools.
- **Motion:** Scrollcraft mounts only on desktop when reduced-motion is not
  requested and data saving is off. Phones, print and reduced-motion have a
  fully readable static composition. No video, generated images or external
  fonts are required.

## Preservation
The revision keeps the route-planner GET form's `from` and `to` inputs,
saved-work desk, crosswind computation, local search, free/pro offers, account
state, safety notices and existing analytics attributes. PilotDesk remains a
supplement to an official briefing and approved aircraft performance data.

## Verification
- `node qa/scrollcraft-home-smoke.mjs` checks structure, internal links,
  syntax and accessibility fallbacks.
- `node qa/scrollcraft-home-browser.mjs` tests the real browser scroll
  progress, aircraft movement, 390px layout and reduced-motion behavior.
- The standard PilotDesk QA and desktop/mobile browser workflows remain
  release gates.
