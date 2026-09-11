# PilotDesk Security Policy

PilotDesk is an aviation planning and training aid. Security or privacy issues that could expose user-entered data, alter calculations, change weather results, bypass safety messaging, or interfere with the application should be treated as sensitive.

## Reporting a vulnerability

Do **not** post passwords, access tokens, private personal information, exploit payloads, or step-by-step instructions for an actively exploitable vulnerability in a public GitHub issue.

If GitHub shows a **Report a vulnerability** option in the repository Security tab, use that private channel. If a private vulnerability-reporting option is not available, open a minimal public issue that says a security issue needs a private reporting channel, without including exploit details.

For ordinary bugs, incorrect aviation data, calculator problems, or non-sensitive safety concerns, use the PilotDesk feedback page or GitHub issues.

## Scope

Useful reports include problems involving:

- calculation integrity or result tampering
- weather/API result integrity or source confusion
- cross-site scripting or unsafe HTML injection
- exposure of locally stored aircraft, scenario, or calculation data
- authentication or deployment configuration if added in the future
- service-worker cache behavior that could serve unsafe or misleading stale data
- third-party script or advertising behavior that interferes with core PilotDesk functions

PilotDesk intentionally keeps core product behavior independent from advertising and minimizes analytics data. Please do not include real passenger information, credentials, or other sensitive aviation information in reports.
