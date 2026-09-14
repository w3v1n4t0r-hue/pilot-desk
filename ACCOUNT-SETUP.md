# PilotDesk account setup

PilotDesk accounts use Supabase Auth + Postgres. The browser receives only the public Supabase URL and anon key. The service-role key stays server-side in Vercel Functions.

## 1. Database

Apply `supabase/migrations/001_pilotdesk_accounts.sql` to the production Supabase project. It creates:

- `profiles`
- `saved_airports`
- `aircraft_profiles`
- `saved_calculations`
- `daily_progress`
- new-user profile trigger
- row-level-security policies that scope data to `auth.uid()`

## 2. Authentication

Enable Email auth. PilotDesk uses passwordless magic links.

For Google sign-in, enable the Google provider in Supabase and configure its OAuth credentials.

Add these allowed redirect URLs:

- `https://www.pilot-desk.com/account.html`
- `https://pilot-desk.com/account.html`
- the relevant Vercel preview URL while testing

Set the Site URL to the canonical production origin.

## 3. Vercel environment variables

Set these only in project environment settings. Never commit them to GitHub.

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — public anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key
- `PILOTDESK_ADMIN_EMAIL` — email allowed to view the private account-growth panel

`PILOTDESK_ADMIN_EMAILS` may be used instead for a comma-separated list of owner/admin emails.

## 4. Owner metrics

When the configured admin signs in at `/account.html`, a private Account Growth panel appears with:

- total accounts
- accounts created today
- accounts created in the last 7 days
- accounts created in the last 30 days
- automatic next-account milestone progress

The service-role key is used only inside `/api/account-stats.js`; it is never sent to the browser.

## 5. Account deletion

Users can permanently delete their own PilotDesk account from `/account.html`. `/api/delete-account.js` verifies the user's access token before using the server-only service-role key to delete that exact auth user. Database rows cascade from `auth.users`.

## 6. Production checklist

Before merging to `main`:

1. Apply the migration.
2. Set environment variables.
3. Enable Email auth.
4. Configure Google OAuth or temporarily hide the Google button.
5. Verify magic-link redirect URLs.
6. Create a test account and confirm `profiles` gets a matching row.
7. Confirm one user cannot read or edit another user's rows.
8. Confirm the owner metrics panel is invisible to normal users.
9. Confirm account deletion removes the auth user and cascades profile data.
10. Update public privacy/terms copy before production if account sync is enabled.
