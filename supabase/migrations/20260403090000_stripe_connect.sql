alter table public.hosts
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_onboarding_at timestamptz;

create unique index if not exists hosts_stripe_account_id_key
  on public.hosts (stripe_account_id)
  where stripe_account_id is not null;

alter table public.bookings
  add column if not exists payment_intent_id text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists amount_cents integer,
  add column if not exists platform_fee_cents integer,
  add column if not exists currency text default 'eur';
