# PilotDesk PR remediation review

Prepared October 12, 2026 (America/Chicago). Repository baseline: `209cea0d660580355f54b1130eafdbafdb9455e6`.

## Fixed

Two local review branches are prepared:

| Branch | Starting point | Purpose |
| --- | --- | --- |
| `fix/pr-readiness-20261013` | PR #150 head `d014ed7` (newer typography cleanup preserved) | Route-review integration, browser behavior, source-response validation and complete QA |
| `fix/account-readiness-20261013` | Current main `209cea0` | Recover useful #65/#46/#47 changes without replacing the current account page |

Route review now uses the canonical stylesheet, shared header/navigation, account affordance and bootstrap. Workspace styles stay inside the workspace. The sidebar, tabs, map, sample timeline and review strip remain. Saved-review controls remain available on phones; review copies are explicitly device-local and separate from saved flights/cloud backup.

Canvas sizing no longer participates in grid sizing and cannot push the workspace over the footer. Mobile layers initially stay closed with an accessible Layers button. Layer panels scroll when necessary; sample timeline labels and review chips fit.

The three route-review model/API/interaction suites now run in the main QA workflow. A separate browser workflow tests the built page at nine widths and verifies map pixels, footer placement, navigation, navlog, a deliberate provider outage, and route/UTC/TAS/fuel handoff.

Release fingerprinting now includes `.mjs` entry points and relative module imports. Malformed weather/NOTAM responses remain unavailable instead of becoming empty successful results. Impossible UTC calendar dates are rejected. Handoff imports also work when the hash changes on an already-open review page.

Account fixes add CFII/MEI profile options and a matching additive migration. Actual account handlers now suppress simultaneous email requests and apply a 60-second cooldown after successful sends; failed sends remain retryable. Confirmation creation and resend share a cooldown, as do forgot/change-password actions. Storage failure has an in-memory fallback. Password sign-in, billing and backup behavior are preserved.

Recovered magic-link template uses the existing Supabase variables and square geometry. SMTP documentation describes intended configuration rather than claiming the hosted configuration has been verified.

## Root Causes

- PR #150 did not follow the shared page shell contract and used broad CSS rules.
- Canvas intrinsic dimensions affected workspace layout; static checks alone did not catch the blank desktop rendering.
- The map-density regression test still called helpers removed during the shared briefing refactor. It now exercises the current helper and retains geometry/race/outage assertions.
- Integrity validation only recognized fingerprinted assets directly beneath `assets/`, excluding valid nested workspace assets.
- The release pipeline fingerprinted JS/CSS but omitted module workspaces and their relative imports.
- Older account PRs targeted obsolete markup/handlers. Applying their entire diffs would disturb current account functionality.

## Visual Improvements

One global PilotDesk header and logo, with a separate workspace toolbar. Existing workspace composition is retained. Styles no longer change global navigation or the footer.

## Mobile Improvements

Nine widths checked: 320, 360, 375, 390, 414, 430, 768, 1280 and 1920 pixels. Saved reviews remain accessible, map controls work, layers are scrollable, timeline labels fit, and no horizontal page overflow was observed.

## Calculators / Aviation Tools

Route handoff preserves supplied coordinates even when airport identifiers already exist in the sample map, along with UTC departure, TAS and fuel inputs. Imported airports do not inherit invented sample weather. Cruise/navlog and provider-error interactions pass. The native planner, weather, Learn, account, Pro, formula and performance regression checks pass in the combined checkout. Cold-offline density-altitude calculation also passes.

The route-review map/advisories remain explicitly synthetic; provider data is separate. This does not establish complete NOTAM coverage or constitute an official briefing. Route-review saves do not automatically sync with account backups.

## Validation

- Production builds passed for route, account and combined changes.
- Combined checkout: all 86 QA commands passed, including existing Learn/account/billing/route/calculator tests.
- Generated calculator/guide/sitemap verification passed after refreshing the planner modification date.
- JavaScript syntax: 252 files checked, zero failures.
- Built-page Chromium suite: all nine widths and actual hash handoff passed without page errors.
- Cold-offline E2E: a calculator not previously visited online loaded and calculated offline; shared navigation was exercised across core pages.
- Local Postgres migration: existing rows retained, CFII/MEI and null accepted, invalid stage rejected, repeat application safe.
- Production schema was inspected read-only and still excludes CFII/MEI; the migration was not applied.
- Provider-outage/browser tests use deliberate fixtures. They do not prove live FAA access, hosted SMTP delivery, or a completed paid checkout/webhook flow.

## Remaining Issues and PR Disposition

| PRs | Remaining decision |
| --- | --- |
| #150 | Publish the prepared fixes for GitHub CI/preview review after approval. It is not yet repaired remotely. |
| #65, #46, #47 | Prepared as a fresh account branch on main. Apply migration before publishing the CFII/MEI UI; separately verify/apply hosted SMTP and template configuration after approval. |
| #67 | Do not merge the obsolete fallback-price/automatic-enabling implementation. Preserve #148's explicit live billing safeguards. |
| #51 → #52 → #53 | Old redesign stack; #52/#53 target predecessor branches. Do not merge the stack into main wholesale. Compare residual improvements individually against today's shared shell and regression coverage. |
| #27, #44, #69 | Broad obsolete/conflicting content/navigation/design branches. Their conflicts and GitHub statuses are unchanged. No blanket merge is proposed. |
| #149 | CI-backed educational lab, but no validated CFD solve. Requires explicit educational-scope acceptance or actual CFD validation. |
| #54 | Remains draft: geometry/topology, physical frame/units, solver/mesh convergence and reviewed results are unresolved. |

No remote PR, branch, production configuration or data was modified, merged, closed or deployed during this remediation. Preparing narrow fixes does not make the old PR queue universally mergeable.

## Files Changed

Route: `route-review.html`, workspace styles/controller/briefing code, server adapter, release fingerprinting, QA checks and browser workflow.

Account: `account.html`, `assets/account.js`, request regression checks, timestamped profile migration and auth template/SMTP documentation.

## Deployment Risk

MEDIUM. The route workspace is additive, but its shared-shell, release-cache and API integration merit preview validation. Account frontend and database changes require correct release sequencing. Real FAA, email and billing configuration remain separate release gates.

## Deployment Recommendation

Ready to publish these fix branches for CI and preview review after approval; not an approval to merge or deploy production. The safest order is:

1. Publish/review the account branch and route-review fixes separately; require current GitHub checks and exact-commit previews.
2. Validate and approve the additive profile migration, then release the matching account UI. Approve hosted email configuration separately.
3. Release the corrected route-review workspace after desktop/mobile preview review, preserving current Pro boundaries and source labels.
4. Make a separate decision on educational #149. Keep #54 and the old broad branch stack out of these releases.

Pushing may trigger preview deployments. Main enables Git deployment, so merging can trigger production deployment. Both remain pending user approval.
