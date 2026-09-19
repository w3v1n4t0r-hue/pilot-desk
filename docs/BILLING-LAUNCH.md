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
