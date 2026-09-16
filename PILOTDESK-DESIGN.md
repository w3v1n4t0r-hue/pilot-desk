# PilotDesk Product & Design Direction

## Status

This document is the canonical visual, UX, interaction, and frontend design direction for PilotDesk.

Any engineer, coding agent, AI assistant, contributor, or future redesign effort working on PilotDesk must read this file before making user-facing changes.

This file exists so PilotDesk does not repeatedly drift between unrelated design directions.

The current repository is always the source of truth for actual implementation details.

If this document conflicts with the current code architecture:

1. preserve working functionality,
2. understand the current implementation,
3. migrate toward this design deliberately,
4. do not stack another override layer on top.

Do not rewrite working systems solely to satisfy visual preference.

The goal is controlled convergence toward one coherent product.

---

# 1. Product Vision

PilotDesk should feel like a premium aviation software product.

It should feel:

- modern
- precise
- minimal
- dark
- technical
- calm
- fast
- trustworthy
- expensive
- intentionally designed
- aviation-specific

PilotDesk should not feel like:

- a school project
- a generic SaaS dashboard
- an AI-generated website
- a template
- a gaming interface
- a neon cyberpunk dashboard
- a collection of unrelated HTML pages
- a giant grid of glowing cards
- a generic startup landing page

The visual quality bar should be comparable to premium modern software products.

A primary visual reference is the restraint, typography, spacing, interaction polish, and black-first aesthetic of Resend.

IMPORTANT:

Do not copy Resend's branding, layouts, illustrations, graphics, code, proprietary assets, or page composition.

Use it only as a quality and design-philosophy reference.

The target is:

**Resend-like restraint + professional aviation software.**

---

# 2. Core Design Philosophy

PilotDesk should communicate quality through:

- typography
- spacing
- alignment
- contrast
- hierarchy
- interaction
- motion
- precision

Do not rely on decoration to make the website interesting.

A screen should look good before illustrations, gradients, or effects are added.

The interface should feel engineered rather than decorated.

Use fewer visual elements, but make each one better.

Prefer:

- one good border
- one good surface
- one excellent heading
- one clear action

over:

- multiple gradients
- multiple shadows
- glowing cards
- decorative shapes
- visual clutter

---

# 3. Black-First Identity

PilotDesk is a black-first interface.

The desired direction is darker and more neutral than the older blue-heavy PilotDesk appearance.

Preferred visual family:

- true black
- near black
- charcoal
- graphite
- zinc
- steel gray
- silver
- off-white
- restrained aviation blue

Avoid making the entire interface blue.

Blue should represent:

- selection
- interaction
- live data
- focus
- meaningful status
- important aviation information

Blue should not be used merely because the product is aviation-related.

---

# 4. Canonical Color Direction

The existing design token architecture should be migrated toward a palette similar to:

```css
--bg: #050506;
--bg-secondary: #09090b;

--surface-1: #0c0c0e;
--surface-2: #111114;
--surface-3: #17171b;

--text: #f5f5f5;
--text-secondary: #a1a1aa;
--text-tertiary: #71717a;

--line: rgba(255,255,255,.08);
--line-strong: rgba(255,255,255,.14);

--silver: #d4d4d8;
--silver-bright: #f4f4f5;

--accent: #8ed8f8;
--accent-soft: rgba(142,216,248,.10);

--success: #5fd18b;
--warning: #e6bd62;
--danger: #e87c7c;
```

These values are directional, not permission to add another `:root`.

PilotDesk already has shared tokens.

Modify the canonical token source when migrating colors.

DO NOT create:

- `redesign.css`
- `new-theme.css`
- `final.css`
- `final-final.css`
- `modern.css`
- `polish.css`
- `overrides.css`

Never solve token problems by creating another global token namespace.

---

# 5. Surface Design

PilotDesk should use fewer obvious cards.

Not every section needs:

- rounded corners
- background fill
- border
- shadow

Use surfaces only when they communicate grouping or interaction.

Prefer separating content through:

- whitespace
- typography
- alignment
- subtle dividers
- background changes

When cards are appropriate:

- use restrained radius
- use subtle border
- use little or no shadow
- use slightly brighter background than the page
- use hover feedback only when interactive

Avoid excessive "floating card" design.

---

# 6. Borders

Borders should be subtle and precise.

Default:

```css
1px solid rgba(255,255,255,.08)
```

Stronger interactive or selected states may use approximately:

```css
rgba(255,255,255,.14)
```

Avoid bright outlines around every element.

Borders should usually be noticed subconsciously.

---

# 7. Border Radius

PilotDesk should not become excessively rounded.

Recommended hierarchy:

```text
Small control:        6–8px
Button/input:         8–10px
Standard panel:       10–12px
Large modal/panel:    12–16px
```

Avoid 20–30px radii on ordinary cards.

Avoid pill shapes unless:

- status chips
- filters
- compact segmented controls
- very small metadata

---

# 8. Shadows

Shadows must be extremely restrained.

Most panels should not require a visible shadow.

Use shadows primarily for:

- dropdowns
- menus
- modals
- elevated overlays
- temporarily floating UI

Preferred shadow character:

- broad
- dark
- soft
- low opacity

Never make every card appear to float.

---

# 9. Gradients

Gradients should be rare.

Allowed:

- nearly invisible surface depth
- subtle metallic highlight
- extremely restrained hero background
- data visualization

Avoid:

- purple gradients
- giant blue gradients
- glowing radial blobs
- gradients behind every card
- gradients used as decoration without purpose

If a gradient becomes the first thing someone notices, it is probably too strong.

---

# 10. Typography

Typography should carry much of the visual identity.

PilotDesk should have clear hierarchy for:

- page title
- section title
- card title
- numeric value
- body copy
- form label
- metadata
- units
- aviation data
- status text

Large headings should be clean and confident.

Avoid oversized startup-style hero text taking half the viewport.

PilotDesk is a tool first.

Use tighter tracking for large headings.

Use comfortable spacing for body text.

Use tabular numerals where appropriate.

Examples:

- altitude
- heading
- wind
- fuel
- time
- distance
- weight
- balance
- METAR data
- calculator output
- coordinates

Technical values should visually separate:

VALUE
UNIT
LABEL

---

# 11. Content Width

Do not stretch content across very large monitors.

Use sensible maximum widths.

Suggested ranges:

```text
General application shell: 1180–1320px
Reading content:           700–850px
Forms/tools:               width appropriate to task
```

Center content intentionally.

Large monitors should feel spacious, not empty.

---

# 12. Spacing System

Use a consistent spacing scale.

Preferred conceptual scale:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
80px
96px
```

Do not use random values such as:

```text
17px
27px
43px
59px
```

unless required by a specific layout.

Sections should have significantly more breathing room than individual controls.

---

# 13. Buttons

Create one canonical button system.

Required variants:

- primary
- secondary
- quiet
- destructive
- icon button

Buttons should have:

- consistent height
- consistent radius
- consistent typography
- visible hover
- visible focus
- visible pressed state
- disabled state
- loading state when appropriate

Primary buttons should be used sparingly.

A screen with six "primary" buttons has no primary action.

Preferred button height:

```text
40–46px desktop
44px minimum touch target mobile
```

Avoid huge CTA buttons.

---

# 14. Button Motion

Buttons should feel responsive.

Hover:

```text
100–180ms
```

Press:

- very slight scale or translation
- no cartoon bounce

Example:

```css
transform: translateY(1px);
```

or:

```css
transform: scale(.985);
```

Never make buttons wobble, bounce, or glow continuously.

---

# 15. Forms

Forms must feel extremely polished.

Every input should have:

- visible label
- units when applicable
- clear focus state
- validation
- readable errors
- appropriate mobile keyboard
- consistent spacing
- disabled state
- optional helper text where useful

Never rely solely on placeholder text as a label.

Aviation units must never be ambiguous.

Examples:

```text
Altitude
5,500 ft

Wind Speed
18 kt

Fuel Burn
9.6 gal/hr
```

---

# 16. Inputs

Inputs should use:

- dark neutral background
- subtle border
- strong text contrast
- restrained focus ring

Focus should use the accent color.

Do not create giant glowing input states.

---

# 17. Navigation

Navigation is one of the most important parts of PilotDesk.

Canonical primary taxonomy should remain coherent around:

- Tools
- Plan
- Weather
- Learn

Account and search should remain easy to access.

Navigation should feel:

- immediate
- smooth
- predictable
- keyboard-friendly
- touch-friendly

Dropdowns should animate.

Recommended:

```text
opacity
translateY
scale approximately .98 → 1
```

Duration:

```text
160–220ms
```

Do not create slow menus.

---

# 18. Mobile Navigation

Mobile navigation must feel intentionally designed.

It should not look like desktop navigation stacked vertically.

Use:

- clear grouping
- large touch targets
- excellent spacing
- smooth opening
- strong hierarchy

The menu should:

- close with Escape
- close after navigation
- close on appropriate outside interaction
- expose current section
- preserve accessibility

---

# 19. Motion Philosophy

PilotDesk should have noticeably more animation than the old website.

However:

**motion must communicate quality, not activity.**

Motion should make PilotDesk feel alive.

Motion should never make PilotDesk feel busy.

---

# 20. Motion Timing

Recommended timing system:

```text
Immediate feedback:     90–140ms
Hover transition:       140–180ms
Control transition:     160–220ms
Dropdown/menu:          180–240ms
Panel transition:       220–320ms
Section reveal:         300–450ms
Celebration:            400–700ms maximum
```

Most UI animation should remain below 400ms.

---

# 21. Motion Easing

Prefer smooth modern easing.

Examples:

```css
cubic-bezier(.2,.8,.2,1)
cubic-bezier(.16,1,.3,1)
```

Avoid:

```text
bounce
elastic
cartoon spring behavior
```

unless a very specific interaction warrants it.

---

# 22. Animation Performance

Prefer animating:

- opacity
- transform

Avoid repeatedly animating:

- width
- height
- top
- left
- expensive filters
- large box shadows

Do not introduce heavy animation libraries unless absolutely necessary.

CSS should handle most motion.

---

# 23. Reduced Motion

Every animation system must respect:

```css
@media (prefers-reduced-motion: reduce)
```

The application must remain fully usable with animation disabled.

Motion is enhancement.

Never functionality.

---

# 24. Scroll Animation

Subtle entrance animation is acceptable.

Example:

```text
opacity 0 → 1
translateY 8–16px → 0
```

Do not:

- animate every paragraph
- repeatedly animate content on every scroll
- use huge parallax
- hijack scrolling
- delay content visibility

Content must remain available immediately.

---

# 25. Page Transitions

Lightweight page transitions are encouraged if safe.

Potential pattern:

```text
old content:
opacity 1 → .85

new content:
opacity 0 → 1
translateY 5px → 0
```

Do not convert the entire application into a SPA just for transitions.

Preserve:

- deep links
- browser history
- back button
- SEO
- service worker
- calculator URLs
- progressive enhancement

---

# 26. Hover States

Interactive elements should usually respond to hover.

Possible feedback:

- border becomes slightly brighter
- surface becomes slightly lighter
- icon shifts 1–2px
- card translates 1–2px
- text contrast increases

Keep movement subtle.

No dramatic floating.

---

# 27. Homepage

The homepage should feel like the PilotDesk command center.

It should immediately answer:

**What can I do here?**

Primary actions:

- Plan
- Calculate
- Weather
- Study
- Daily

Utility should appear before marketing.

Do not begin with excessive copy explaining what PilotDesk is.

Show the product.

---

# 28. Homepage Narrative

The homepage should tell a product story.

Suggested flow:

```text
Primary task launcher

↓
Most useful / popular tools

↓
Flight planning

↓
Weather

↓
Calculators

↓
Learning / Written Prep

↓
Daily challenge

↓
Account / save progress

↓
Trust / sources / safety
```

Not every section needs to appear.

The important principle is intentional progression.

---

# 29. Homepage Visual Demonstrations

Use product-specific visual demonstrations rather than generic decoration.

Possible examples:

- animated wind vector
- METAR decoding preview
- route line between airports
- changing calculator output
- CG position moving inside an envelope
- Daily question preview
- written-test progress
- flight-plan summary
- runway/wind visualization

These should demonstrate what PilotDesk does.

Do not add decorative aircraft purely to fill space.

---

# 30. Cards

Tool cards should become cleaner.

Card anatomy:

```text
icon
title
short description
optional status/value
```

Avoid unnecessary:

- arrows
- badges
- glow
- decorative pseudo-elements
- huge descriptions

If every card has six visual elements, simplify it.

---

# 31. Calculator Experience

Calculators are core PilotDesk functionality.

Do not change formulas merely for redesign.

Calculator layout should feel like a professional instrument.

Preferred structure:

```text
Title

Short explanation

Input group

Primary action

Results

Interpretation / explanation

Source / formula

Related tools
```

Input and output regions should be visually distinct.

---

# 32. Calculator Results

Results should be one of the strongest visual moments.

Use:

- large numeric value
- clear unit
- concise label
- restrained reveal animation
- optional interpretation

Do not make all three result values equally dominant.

Primary result should visually lead.

---

# 33. Calculator Result Animation

When calculating:

- update smoothly
- allow subtle result reveal
- optionally animate number changes
- briefly strengthen border or contrast

Do not:

- flash
- pulse repeatedly
- spin
- create confetti

---

# 34. Aviation Safety

Visual simplification must never remove useful aviation information.

Preserve:

- units
- assumptions
- warnings
- source information
- data age
- limitations

A beautiful aviation tool that hides important limitations is worse than an ugly one.

---

# 35. Weather

Weather should feel like an aviation data product.

Prioritize:

- airport
- observation time
- report age
- flight category
- wind
- visibility
- clouds
- temperature/dewpoint
- altimeter
- raw report
- TAF

Use excellent typography.

Raw reports should remain easy to copy/read.

---

# 36. Weather Freshness

Clearly communicate:

- LIVE
- RECENT
- STALE
- CACHED
- OFFLINE
- UNAVAILABLE

Never imply cached weather is current.

Do not hide report timestamps for visual simplicity.

---

# 37. Weather Animation

Good animation:

- skeleton loading
- smooth report reveal
- refresh icon movement during request
- category change
- subtle updated-state confirmation

Bad animation:

- animated weather background
- fake moving clouds
- constant radar-like effects
- blinking data

---

# 38. Flight Planning

Planning should feel like a workspace.

Improve hierarchy between:

- aircraft
- route
- airport
- weather
- loading
- fuel
- procedures
- review

Preserve continuity between steps.

Avoid requiring users to repeatedly rediscover where they are.

---

# 39. Weight & Balance

Weight & Balance should feel especially premium.

Emphasize:

- aircraft
- stations
- weights
- arms
- moments
- total weight
- CG
- envelope
- status

Visualization should be clean and technically accurate.

Do not add decorative graphs that reduce clarity.

---

# 40. Written Prep

Written Prep should feel like a dedicated study application.

Question UI should emphasize:

- question
- answer choices
- progress
- selected state
- correct state
- incorrect state
- explanation
- source
- next action

Avoid clutter around the actual question.

---

# 41. Daily Challenge

Daily should be enjoyable and polished.

Possible motion:

- question transition
- progress movement
- answer feedback
- XP reveal
- streak update
- tasteful completion state

Avoid childish game design.

No casino-like rewards.

No excessive confetti.

---

# 42. Learn

All learning areas should feel like one system.

Private
Instrument
Commercial
Multi
CFI

should share:

- layout
- navigation
- typography
- cards
- progress treatment
- source presentation

---

# 43. Account

Account pages should feel as polished as the public site.

Avoid making authentication look like a separate product.

Improve:

- sign-in
- registration
- OAuth
- password reset
- profile
- saved progress
- loading
- errors

Never compromise Supabase security for UI simplicity.

---

# 44. Loading States

Avoid blank screens.

Use:

- skeletons
- subtle spinners
- inline progress
- placeholder blocks

Loading indicators should match expected layout to reduce layout shift.

---

# 45. Empty States

Empty states should tell users what to do.

Bad:

```text
No data.
```

Better:

```text
No saved flights yet.
Create a route to save your first flight.
```

Keep the copy concise.

---

# 46. Error States

Errors should explain:

- what failed
- whether data is preserved
- what the user can do

Avoid cute aviation language replacing useful information.

Bad:

```text
That request flew past us.
```

Better:

```text
Weather data could not be retrieved.
Check the airport identifier and try again.
```

---

# 47. Icon System

PilotDesk should eventually use one coherent icon language.

Icons should feel:

- precise
- thin
- geometric
- technical
- modern

Use consistent:

- stroke width
- corner behavior
- viewBox
- optical weight
- sizing

---

# 48. Aviation Icons

Specialized aviation icons may be custom SVGs.

Examples:

- aircraft
- airport
- runway
- wind
- crosswind
- altitude
- fuel
- W&B
- CG
- heading
- route
- VOR
- RNAV
- weather
- checklist

Aircraft geometry should be plausible.

Runways should look like runways.

Aviation meaning matters.

---

# 49. Avoid AI-Looking Design

Actively reject:

- arbitrary glowing icons
- fake airplane geometry
- random gradients
- unnecessary wings
- stars attached to aviation icons
- generic hero illustrations
- decorative HUD circles
- futuristic cockpit graphics unrelated to function

If something looks impressive but has no purpose, remove it.

---

# 50. Copywriting

PilotDesk copy should be concise and technical without sounding robotic.

Prefer:

```text
Calculate density altitude
```

over:

```text
Unlock accurate density altitude insights
```

Avoid:

- unlock
- elevate
- seamless
- revolutionary
- powerful solution
- cutting-edge
- game-changing
- optimize your journey

Write like a competent pilot or aviation engineer.

---

# 51. Mobile First-Class Support

Every meaningful change must be reviewed at:

```text
320px
360px
375px
390px
414px
430px
tablet
desktop
wide desktop
```

Do not accept horizontal scrolling unless intrinsic to something such as a large data table.

---

# 52. Mobile Typography

Do not simply scale desktop typography down proportionally.

Mobile should use intentionally selected sizes.

Avoid:

- 50px headings on narrow screens
- tiny metadata
- giant hero sections

The user should see useful content quickly.

---

# 53. Touch Targets

Interactive targets should generally meet:

```text
44px minimum
```

Especially:

- navigation
- buttons
- answer choices
- account controls
- calculator actions
- menus

---

# 54. Accessibility

Accessibility is part of the design system.

Every redesign must preserve or improve:

- semantic HTML
- focus order
- keyboard navigation
- focus visibility
- labels
- screen reader context
- color contrast
- reduced motion
- button/link semantics

Do not use ARIA when native HTML already solves the problem.

---

# 55. SEO

Visual redesign must never destroy SEO.

Preserve/improve:

- page title
- description
- canonical
- robots
- sitemap
- headings
- internal links
- structured data
- OpenGraph metadata
- crawlable content

Do not hide important page content behind client-side rendering unnecessarily.

---

# 56. Performance

Visual quality must not come at the cost of speed.

Avoid:

- massive animation libraries
- unnecessary React-like hydration
- huge icon libraries
- excessive JavaScript
- repeated DOM work
- expensive blur filters everywhere
- oversized imagery

Prefer:

- HTML
- CSS
- SVG
- route-scoped JavaScript

---

# 57. CSS Architecture

PilotDesk already has historical CSS layering.

The long-term goal is consolidation.

Before adding CSS:

1. search for existing selector
2. determine current cascade
3. identify canonical shared rule
4. modify the canonical rule where possible
5. remove obsolete duplication only when safe

Never fix one page by blindly appending another global override.

---

# 58. Design Tokens

The canonical token source should eventually own:

- colors
- spacing
- radius
- shadows
- typography
- motion durations
- easing
- status colors

Avoid hardcoding repeated values throughout pages.

---

# 59. Legacy CSS

Legacy CSS must be removed gradually.

Do not delete old rules because they look unused.

Check:

- static pages
- build transformation
- injected classes
- runtime JavaScript
- mobile states
- account
- calculators
- training
- service-worker offline pages

Remove only after confirming references.

---

# 60. Astro Migration

Continue migration gradually.

Prefer migrating:

- shared layout
- shared shell
- repeated page structures
- shared navigation
- cards
- tool directories
- content templates

Do not rewrite proven calculator logic purely for architectural purity.

---

# 61. JavaScript

Client JavaScript should progressively enhance the page.

Static content should remain usable if optional enhancement fails.

Avoid:

- duplicate listeners
- global script execution on irrelevant routes
- unnecessary DOM rebuilding
- large client bundles

---

# 62. Animation Architecture

Avoid one-off inline animation styles scattered everywhere.

Define shared motion concepts.

Suggested semantic classes/tokens:

```text
motion-fast
motion-standard
motion-reveal
motion-panel
motion-hover
```

or equivalent variables.

Maintain consistency.

---

# 63. Microinteractions

PilotDesk should feel responsive to actions.

Add polished microinteractions for:

- save
- copy
- calculate
- refresh
- select
- login
- complete
- mark
- filter
- open/close
- search

Feedback should usually occur within 100–200ms.

---

# 64. Status Communication

Status should never depend only on color.

Use combinations of:

- icon
- text
- color
- shape

Especially for:

- warnings
- errors
- weather categories
- correct/incorrect answers
- loading states
- saved state

---

# 65. Offline

PilotDesk has offline capability.

Do not casually break:

- service-worker registration
- calculator precaching
- offline calculator operation
- cache migration
- update logic

Never treat live aviation weather as safely authoritative offline data.

---

# 66. Aviation Trust

Every feature should ask:

"Would a pilot trust this?"

Trust comes from:

- accurate terminology
- clear sources
- visible units
- transparent limitations
- predictable UI
- data freshness
- restrained visual design

Avoid fake precision.

---

# 67. Responsive Tables

Large tables should:

- scroll inside their own container
- preserve headers where useful
- maintain readable spacing

Do not allow entire pages to overflow horizontally.

---

# 68. Search

Site search should feel immediate.

Improve:

- focus
- keyboard selection
- result hierarchy
- empty state
- mobile presentation

Avoid a giant search modal unless justified.

---

# 69. Footer

Footer should remain restrained.

Include useful links without turning it into another sitemap.

Visual priority should remain low.

---

# 70. Marketing vs Application UI

PilotDesk includes both product-discovery pages and actual application tools.

They should share:

- color
- typography
- controls
- icon language
- motion
- spacing

But they do not need identical layouts.

Marketing pages can breathe more.

Operational tools should prioritize density and efficiency.

---

# 71. Visual Density

Different tasks require different density.

Homepage:

medium/low density.

Calculator:

medium density.

Weather:

medium/high density.

Written Prep:

focused medium density.

Planning:

high density but structured.

Do not force every page into the same grid.

---

# 72. Definition of "Modern"

Modern does NOT mean:

- bigger radius
- brighter gradient
- more glass
- more animation

Modern means:

- excellent hierarchy
- intentional spacing
- fast interaction
- restrained surfaces
- consistent controls
- strong typography
- thoughtful motion

---

# 73. Definition of "Minimal"

Minimal does NOT mean removing useful information.

Minimal means removing unnecessary visual noise.

Keep aviation information.

Remove decorative clutter.

---

# 74. Before Editing Any Page

Before making substantial UI changes:

1. inspect current HTML/Astro
2. inspect relevant CSS
3. inspect relevant JS hooks
4. inspect shared components
5. inspect responsive rules
6. understand what the page does
7. identify the primary user action
8. preserve functional selectors/hooks

Do not redesign from screenshots alone.

---

# 75. When Improving a Page

Use this sequence:

### Step 1 — Function

Make sure the page works.

### Step 2 — Hierarchy

Determine what is most important.

### Step 3 — Structure

Improve layout.

### Step 4 — Typography

Improve readability.

### Step 5 — Surfaces

Simplify cards/panels.

### Step 6 — Controls

Standardize buttons/forms.

### Step 7 — Motion

Add meaningful animation.

### Step 8 — Mobile

Verify responsive behavior.

### Step 9 — Accessibility

Verify focus/keyboard/semantics.

### Step 10 — Cleanup

Remove obsolete styles only after validation.

---

# 76. Do Not Redesign Blindly

Never replace a shared component without checking:

- selectors
- JS hooks
- data attributes
- tests
- legacy pages
- mobile usage

Prefer controlled migration.

---

# 77. Quality Review

Before completing a visual task, ask:

Does this feel intentional?

Does this feel expensive?

Does this feel like aviation software?

Is anything visually unnecessary?

Is anything too bright?

Is anything moving without reason?

Can the hierarchy be understood in two seconds?

Does mobile feel designed rather than compressed?

Does the site still work without animation?

---

# 78. Anti-Patterns

Reject changes that introduce:

- giant gradients
- neon glow everywhere
- floating particles
- decorative radar screens
- blue borders on every card
- oversized round cards
- random blur
- endless pulse animation
- excessive parallax
- excessive glass
- cartoon icons
- AI-looking artwork
- duplicate nav systems
- duplicate token systems
- duplicate CSS layers
- generic startup copy

---

# 79. AI / Coding Agent Instructions

If you are an AI coding agent working on PilotDesk:

DO NOT immediately produce a redesign.

First inspect the relevant repository files.

Do not invent:

- file paths
- components
- APIs
- classes
- IDs
- data attributes

Do not remove functionality because it complicates visual redesign.

Do not introduce a new framework simply for visual polish.

Do not install dependencies unless necessary.

Do not modify calculator formulas without verification.

Do not weaken authentication.

Do not expose secrets.

Do not break SEO.

Do not break offline functionality.

Do not create another global CSS override file.

---

# 80. Agent Response Expectations

When completing substantial UI work, report:

- problem identified
- design rationale
- files changed
- functionality preserved
- animations introduced
- mobile behavior
- accessibility impact
- tests performed
- remaining technical debt

Do not simply say:

"Improved styling."

Explain what actually changed.

---

# 81. Pull Request Philosophy

Prefer focused coherent PRs.

Examples:

```text
Redesign global header and navigation
Modernize homepage
Standardize calculator shell
Improve Weather interface
Modernize Written Prep
Consolidate form controls
Consolidate design tokens
```

Avoid one PR changing every page on the website unless absolutely necessary.

---

# 82. Design Migration Order

Recommended order:

1. canonical tokens
2. typography
3. spacing
4. buttons
5. inputs
6. shared panels
7. navigation/header
8. homepage
9. calculator layout
10. weather
11. planning
12. learning
13. Daily
14. Written Prep
15. account
16. remaining legacy pages
17. remove obsolete CSS

---

# 83. Final Visual Goal

A new user opening PilotDesk should think:

"This is real software."

Then:

"This looks extremely polished."

Then:

"This was clearly designed for pilots."

The interface should not call attention to the design system itself.

The design should make the product feel obvious.

---

# 84. Final Rule

When choosing between:

MORE

and

BETTER,

choose BETTER.

When choosing between:

DECORATION

and

CLARITY,

choose CLARITY.

When choosing between:

ANIMATION

and

MEANINGFUL MOTION,

choose MEANINGFUL MOTION.

When choosing between:

A NEW CSS LAYER

and

FIXING THE SYSTEM,

fix the system.

PilotDesk should become simpler internally while becoming more polished externally.
