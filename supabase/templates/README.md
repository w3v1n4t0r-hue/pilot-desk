# PilotDesk authentication email templates

These templates are the repository source of truth for PilotDesk authentication email design and copy.

## Production magic-link email

- Template: `supabase/templates/magic-link.html`
- Subject: `Sign in to PilotDesk`
- Flow: `assets/account.js` uses `supabase.auth.signInWithOtp()` with `shouldCreateUser: true`.
- Supabase template: **Authentication → Emails → Magic Link**

Hosted Supabase projects do not automatically deploy this file from the repository. Apply the subject and HTML in the hosted project's Auth email-template settings, or update the hosted Auth configuration through the Supabase Management API.

The template intentionally uses `{{ .ConfirmationURL }}`, `{{ .Email }}` and `{{ .SiteURL }}` so the existing passwordless flow continues to work without application-side auth changes.

## Production SMTP: Resend

PilotDesk uses Resend as the production SMTP provider for authentication email.

In Resend, verify a sending domain for PilotDesk before production sending. Prefer a dedicated authentication subdomain when practical, for example `auth.pilot-desk.com`, so transactional authentication reputation remains separate from future marketing email.

In **Supabase → Authentication → Emails → SMTP Settings**, enable custom SMTP and use:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: a Resend API key with permission to send mail
- Sender name: `PilotDesk`
- Sender email: a verified address on the PilotDesk Resend domain, preferably `accounts@pilot-desk.com` or an equivalent address on the verified auth subdomain

Do not commit the Resend API key to this repository. Keep it only in the hosted Supabase SMTP configuration or another approved secret store.

After custom SMTP is enabled, review **Supabase → Authentication → Rate Limits** and set the email sending limit to an appropriate production value. Supabase applies a conservative initial limit to custom SMTP; raise it deliberately based on expected PilotDesk account traffic and Resend account limits.

Disable Resend click tracking for authentication mail so one-time Supabase sign-in links are not rewritten. Verify SPF and DKIM in Resend and publish a sensible DMARC policy for the sending domain.

## Duplicate-send protection

`assets/account-email-guard.js` prevents repeated form submissions from burning email quota when a user double-clicks or repeatedly taps the magic-link button. It enforces a 60-second client-side cooldown matching the normal Supabase magic-link resend window. This is abuse/UX protection only; production capacity still depends on Resend SMTP and Supabase Auth rate-limit configuration.

## Trust and deliverability requirements

Use a custom SMTP sender on the PilotDesk domain before treating the email experience as production-polished. A suitable sender identity is:

`PilotDesk <accounts@pilot-desk.com>`

Configure and verify SPF, DKIM and DMARC for the sending domain with Resend. Do not enable click/link tracking for authentication emails because rewritten links can interfere with one-time Supabase Auth links.

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
