# SlopMonster editorial review for PilotDesk

Reviewed: October 14, 2026. Source: `slopmonster-copy-audit` GitHub Actions artifact, plus the actual rendered HTML from the 196-page production build. This is an English writing-pattern review, **not** an AI-authorship test or a technical flight-safety review.

## Confirmed baseline

- 196 built HTML pages reviewed.
- 91 scored 5/5. 105 contained at least one regex pattern.
- 100 pages triggered the rule-of-three category. 87 triggered **only** this category.
- 15 pages triggered punctuation density. Three triggered vocabulary. Overlap means category counts cannot be summed to get flagged pages.
- Full-page pattern review showed that the three-item phrases overwhelmingly listed aviation quantities, weather groups, units, tools, official sources and actual feature inclusions. These are not automatically weak marketing copy.

## Genuine copy problems corrected on this branch

- `guides/metar-taf.html`: a constructed METAR was decoded using a run-on chain of semicolons; the observation and the TAF FM/TEMPO example now have readable, distinct statements.
- `guides/weight-balance-envelope.html`: seven errors were presented as semicolon-separated list items, making the checklist harder to scan. They now appear as consistent bullets. Fuel-burn/CG movement is stated directly.
- `guides/wind-triangle.html`: course, heading and track now each have their own definition; wind corrections and the navlog's winds-versus-METAR distinction are clearer.
- `guides/vx-vy-altitude.html`: removed the needless “Imagine plotting” introduction and clarified climb angle versus climb rate.
- `guides/ifr-alternate-requirements.html`: removed “; and” from the displayed regulatory conditions because the preceding text already requires both.
- `route-planner.html`: made NOTAM timing limitations, offline cache verification, POH interpolation, chart freshness and enroute wind assumptions easier to scan without changing behavior or safety limits.
- Earlier edits on this PR also simplified a METAR/dew-point explanation and overly formulaic multiengine study-guide contrasts.

## Findings that should **not** be rewritten merely to satisfy a score

- `pivotal altitude` and `pivotal maneuvers` are legitimate commercial-pilot training terms. So are `elevation` and the description of maintaining proficiency `in today's conditions`.
- Hyphenated aviation terms such as `accelerate-stop`, `accelerate-go`, `engine-out`, `dry-air`, `density-altitude` and `aircraft-specific` must not be replaced with vague synonyms. Several punctuation flags group **different sentences and headings** into the checker's 220-character window.
- Semicolons separating contrasting technical limits, the definition of Vx versus Vy, or unit conversions can be appropriate. The checker scores semicolon frequency across the page, not the readability or correctness of each sentence.
- Lists like `course, heading, and track`, `wind, time, and fuel`, and `METARs, TAFs, and SIGMETs` identify actual pilot tasks. Removing or reordering them only to change a pattern score would lose useful information.
- `written-prep.html` has two em dashes from nearby tab labels; these are UI state separators, not an AI-written prose sentence.

## How to validate

After an `npm run build`, the PilotDesk QA workflow runs:
1. `python3 qa/test_slopmonster_site_audit.py`
2. `python3 qa/slopmonster_site_audit.py --root dist --output slopmonster-report.json`
3. The existing calculator, aviation source, SEO, page-integrity, account, billing and route-planning QA suite.

The JSON audit now keeps the matched rule and its exact captured value, rather than only repeating “rule-of-three list.” This gives the next editor enough evidence to review a warning. A 5/5 score **does not** establish that copy is safe, clear, factual or human-authored. The checker stays advisory to protect legitimate aviation details from automatic rewrites.

**Scope limits:** SlopMonster does not test browser interactions, source data freshness, subscription entitlements, FAA compliance or live operational behavior. Those need the separately maintained QA and real-world verification. A second-model family editorial cleanse has not been run.


## Final triage contract (October 14, 2026)

Each page's JSON report separates **`categories` (unresolved style findings)** from
**`reviewed` (accepted literal aviation lists, technical compound words, or
separate UI counters)**. Accepted evidence retains the original rule, exact
matched excerpt, and a reason. This avoids pretending ordinary lists like
"Celsius, Fahrenheit, and Kelvin" or published "accelerate-stop" terminology
are AI-written filler. It does **not** edit or mask the original vendored
SlopMonster source.

The wrapper now flags rhetorical strings ("Faster, smarter, and better"),
three-action slogans ("Plan, calculate, and study"), stacked fabricated
compounds, unsupported social proof and semicolon-heavy individual
paragraphs. It explicitly tests each class as well as the separation of
independent Written Prep count badges. A third-party checker cannot prove
human authorship or aviation correctness.

CI uses `--strict` after this review, so any **unresolved** new writing
warning fails the site QA workflow. Accepted patterns remain in the full
uploaded JSON report for editorial scrutiny. The output also counts
`pages_with_reviewed_patterns` and `reviewed_patterns`; these numbers
must not be advertised as "newly written pages."

Additional live-source edits split dense METAR, IFR alternate, performance
formula and ceiling descriptions, simplified Vx/Vy wording, removed the
homepage three-action slogan and replaced a promotional writing-style
tricolon. All approved aircraft and legal-reference caveats are retained.
