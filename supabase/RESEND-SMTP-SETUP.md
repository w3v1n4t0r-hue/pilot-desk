# PilotDesk Resend SMTP setup

PilotDesk authentication email must use custom SMTP in production. Supabase's built-in sender is intended only for testing and is limited to 2 Auth emails per hour for the whole project.

## Resend

Verify a PilotDesk sending domain in Resend first. Prefer a dedicated auth subdomain such as `auth.pilot-desk.com` when practical.

Then configure **Supabase → Authentication → Emails → SMTP Settings**:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Resend API key with send permission
- Sender name: `PilotDesk`
- Sender email: a verified PilotDesk address, e.g. `accounts@pilot-desk.com`

Never commit the Resend API key to GitHub.

After saving SMTP, open **Supabase → Authentication → Rate Limits** and set the email send limit to an appropriate production value. Custom SMTP starts with a conservative Supabase limit, which can be adjusted.

Disable click tracking for auth mail. Verify SPF and DKIM in Resend and publish a sensible DMARC policy for the sending domain.

## Application protection

`assets/account-email-guard.js` applies a 60-second client-side cooldown to the three PilotDesk actions that can trigger email:

- one-time magic link
- new-account confirmation
- password reset

This prevents repeated clicks from wasting email quota. It does not replace custom SMTP.
