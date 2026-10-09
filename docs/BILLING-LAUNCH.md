# PilotDesk Billing Launch

PilotDesk billing is implemented but intentionally fail-closed until Stripe is connected and the explicit launch switch is enabled.

## Required Supabase Edge Function secrets

Set these in the PilotDesk Supabase project Edge Function secrets:

- `STRIPE_SECRET_KEY` — Stripe secret key for the environment being tested.
- `STRIPE_PRO_PRICE_ID` — recurring monthly price for PilotDesk Pro ($5/month target).
- `STRIPE_SCHOOL_PRICE_ID` — recurring monthly price for Flight School ($29/month target), if school checkout is enabled.
- `STRIPE_WEBHOOK_SECRET` — signing secret from the Stripe webhook endpoint.
- `PILOTDESK_SITE_URL` — optional; defaults to `https://www.pilot-desk.com`.
- `PILOTDESK_BILLING_ENABLED` — must equal `true` before checkout is offered.

Keep `PILOTDESK_BILLING_ENABLED` unset or false during setup and test-mode verification.

## Current live Stripe setup (October 2026)

- Live Stripe account: **Pilot-Desk** (not Pilot-Desk sandbox).
- Live Pro product has a verified recurring **$5 USD/month** price.
- Set `STRIPE_PRO_PRICE_ID=price_1UOlFP0t3Muvn8bKKGHb2CtZ` in Supabase Edge Function secrets.
- Live Stripe webhook is registered at the endpoint below and has four subscription/checkout events enabled.
- Live Stripe customer portal is configured for invoice history, payment-method updates, and cancellation at period end.
- **Secrets must be entered in Supabase project Edge Function secrets by an authorized project operator**: the available Supabase integration does not expose a secret-management operation.
- Retrieve the live webhook's **signing secret** securely from Stripe; do not paste it in GitHub, client-side code, chat, or logs. If no longer visible, rotate the webhook secret in Stripe.
- Use a live-mode Stripe secret or restricted key with the necessary Stripe API scopes. Never reuse the sandbox key.
- **Keep `PILOTDESK_BILLING_ENABLED=false` until a real checkout and webhook-based entitlement test passes**. The deployed checkout function now requires a live key, this exact live Pro price, a webhook-signing-secret-shaped value, and explicit opt-in; these checks do not prove the secret matches until an event is actually delivered.
- The webhook must process signed events successfully before launching, and `billing_subscriptions` must reflect active Pro status on the purchased account.

## Stripe webhook

Endpoint:

`https://hqqgcfiaxcrzyuhtkzqg.supabase.co/functions/v1/stripe-webhook`

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The endpoint verifies Stripe signatures before changing subscription state.

## Launch verification

1. Keep billing disabled.
2. Add Stripe test-mode secret, product price IDs, and webhook signing secret.
3. Configure Stripe Customer Portal for subscription cancellation, payment-method updates, and invoice access.
4. Temporarily enable billing in test mode.
5. Create a fresh PilotDesk account and purchase Pro with a Stripe test card.
6. Confirm the account page changes from Free to Pro after the webhook arrives.
7. Confirm cloud backup/restore is available and the ad-free flag is applied.
8. Open Manage billing, update/cancel the test subscription, and confirm PilotDesk reflects the new Stripe state.
9. Confirm canceled-at-period-end access remains active until the period ends.
10. Run GitHub PilotDesk QA and confirm the billing readiness check passes.
11. Replace test-mode Stripe values with live-mode values, recreate the live webhook and portal configuration, repeat a low-risk live verification, and only then leave `PILOTDESK_BILLING_ENABLED=true`.

The browser never writes paid entitlement state. Stripe lifecycle events update `public.billing_subscriptions` through the verified webhook, and signed-in clients may only read their own row.
