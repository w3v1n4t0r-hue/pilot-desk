# PilotDesk authentication email templates

These templates are the repository source of truth for PilotDesk authentication email design and copy.

## Production magic-link email

- Template: `supabase/templates/magic-link.html`
- Subject: `Sign in to PilotDesk`
- Flow: `assets/account.js` uses `supabase.auth.signInWithOtp()` with `shouldCreateUser: true`.
- Supabase template: **Authentication → Emails → Magic Link**

Hosted Supabase projects do not automatically deploy this file from the repository. Apply the subject and HTML in the hosted project's Auth email-template settings, or update the hosted Auth configuration through the Supabase Management API.

The template intentionally uses `{{ .ConfirmationURL }}`, `{{ .Email }}` and `{{ .SiteURL }}` so the existing passwordless flow continues to work without application-side auth changes.

## Trust and deliverability requirements

Use a custom SMTP sender on the PilotDesk domain before treating the email experience as production-polished. A suitable sender identity is:

`PilotDesk <accounts@pilot-desk.com>`

Configure and verify SPF, DKIM and DMARC for the sending domain with the selected SMTP provider. Do not enable click/link tracking for authentication emails because rewritten links can interfere with one-time Supabase Auth links.

Keep the production Site URL canonical (`https://www.pilot-desk.com`) and retain the approved account redirect URLs documented in `ACCOUNT-SETUP.md`.

## Design rules

The email follows the repository's `AGENTS.md` design direction:

- dark charcoal / black / silver palette
- restrained technical presentation
- no bright gradients, neon, glassmorphism or generic SaaS decoration
- concise pilot-friendly copy
- no external fonts, JavaScript or tracking pixels
- no external logo dependency, so the brand still renders when images are blocked
- clear security explanation and no vague aviation-themed error/copy gimmicks

## Testing

Before production use, send test messages to at least Gmail, Outlook and Apple Mail / iCloud if available. Check desktop and mobile rendering, dark mode, the actual sign-in redirect, expired-link behavior, and that links have not been rewritten by the SMTP provider.
