# PilotDesk account setup

PilotDesk accounts use Supabase Auth + Postgres. The browser uses the production project's public URL and publishable key directly; that key is intentionally browser-safe. Privileged account deletion runs in a Supabase Edge Function, where the service-role key remains server-side.

## Production project

The current production account backend is the PilotDesk Supabase project. The client configuration lives in `assets/account.js` and uses the project's public publishable key.

## Database

Apply the migrations in `supabase/migrations/` in order. They create:

- `profiles`
- `saved_airports`
- `aircraft_profiles`
- `saved_calculations`
- `daily_progress`
- new-user profile trigger
- row-level-security policies that scope user data to `auth.uid()`
- private owner account-growth metrics
- one-time owner access claiming

## Authentication

Email authentication is the default sign-in method. Configure the Supabase Auth URL settings so these production URLs are allowed:

- `https://www.pilot-desk.com/account.html`
- `https://pilot-desk.com/account.html`

Set the Site URL to the canonical production origin.

Google sign-in is optional. If Google is enabled in Supabase Auth and its OAuth credentials are configured, the Account page detects that provider and shows the Google button automatically.

## Owner metrics

The private owner dashboard is opened with:

`/account.html?owner=1`

The first owner signs in and uses the one-time owner key to claim owner access. After that, the database invalidates the one-time key and ties owner metrics to that authenticated account.

The dashboard shows:

- total accounts
- accounts created today
- accounts created in the last 7 days
- accounts created in the last 30 days
- automatic next-account milestone progress

## Account deletion

`supabase/functions/delete-account/index.ts` verifies the user's current access token before deleting that exact Auth user with the server-only service role. Related account rows cascade from `auth.users`.

## Production checklist

Before considering the account system fully launched:

1. Apply all migrations.
2. Deploy the `delete-account` Edge Function.
3. Configure Auth Site URL and redirect URLs.
4. Enable Email auth.
5. Optionally configure Google OAuth.
6. Create a test account and confirm `profiles` gets a matching row.
7. Confirm one user cannot read or edit another user's rows.
8. Claim owner access from `/account.html?owner=1` using the one-time owner key.
9. Confirm the owner metrics panel is unavailable to normal users.
10. Confirm account deletion removes the Auth user and cascades profile data.
