import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(cond,msg)=>{if(!cond)throw new Error(msg)};

const pricing=read('pricing.html');
const account=read('account.html');
const accountJs=read('assets/account.js');
const billing=read('assets/billing.js');
const ads=read('assets/ads.js');
const checkout=read('supabase/functions/billing-checkout/index.ts');
const portal=read('supabase/functions/billing-portal/index.ts');
const webhook=read('supabase/functions/stripe-webhook/index.ts');
const migration=read('supabase/migrations/20260919151254_add_secure_billing_subscriptions.sql');

must(pricing.includes('data-pd-checkout-plan="pro"'),'Pro checkout CTA is missing');
must(pricing.includes('pdPricingBillingStatus'),'Pricing billing status is missing');
must(account.includes('pdAccountBilling'),'Account billing panel is missing');
must(account.includes('PRO · CLOUD BACKUP BETA'),'Cloud backup is not labeled as Pro');
must(accountJs.includes('paidAccess()'),'Account paid-access gate is missing');
must(accountJs.includes("PilotDeskBilling.checkout('pro')"),'Account upgrade action is missing');
must(billing.includes("from('billing_subscriptions')"),'Client is not reading server subscription state');
must(!billing.includes(".from('billing_subscriptions').update("),'Client must not update subscription authority');
must(ads.includes("dataset.pdAdFree==='1'"),'Ad-free entitlement hook is missing');

must(migration.includes('enable row level security'),'Billing RLS is missing');
must(migration.includes('grant select on public.billing_subscriptions to authenticated'),'Billing client should be read-only');
must(!migration.includes('grant insert')&&!migration.includes('grant update'),'Billing table must not grant client writes');

must(checkout.includes('PILOTDESK_BILLING_ENABLED'),'Checkout launch switch is missing');
must(checkout.includes('STRIPE_SECRET_KEY')&&checkout.includes('STRIPE_PRO_PRICE_ID'),'Checkout Stripe configuration is incomplete');
must(checkout.includes('/auth/v1/user'),'Checkout does not authenticate the PilotDesk session');
must(portal.includes('/billing_portal/sessions'),'Customer portal endpoint is missing');
must(portal.includes('/auth/v1/user'),'Billing portal does not authenticate the PilotDesk session');
must(webhook.includes('Stripe-Signature'),'Webhook signature check is missing');
must(webhook.includes('customer.subscription.updated')&&webhook.includes('customer.subscription.deleted'),'Subscription lifecycle events are incomplete');
must(webhook.includes('billing_subscriptions'),'Webhook does not sync subscription authority');

console.log('Billing readiness checks passed: RLS authority, launch switch, checkout, portal, lifecycle sync, Pro gates, and ad-free entitlement wiring are present.');
