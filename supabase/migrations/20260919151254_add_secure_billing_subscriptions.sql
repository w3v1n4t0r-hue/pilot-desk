create table public.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'free' check (plan in ('free','pro','school')),
  status text not null default 'inactive' check (status in ('inactive','trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.billing_subscriptions enable row level security;
create policy billing_subscriptions_select_own on public.billing_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.billing_subscriptions from anon;
revoke all on public.billing_subscriptions from authenticated;
grant select on public.billing_subscriptions to authenticated;
create index billing_subscriptions_customer_idx on public.billing_subscriptions(stripe_customer_id) where stripe_customer_id is not null;
create index billing_subscriptions_subscription_idx on public.billing_subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;
