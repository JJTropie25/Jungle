create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  phone_country_code text,
  phone_number text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select'
  ) then
    create policy profiles_select
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_upsert'
  ) then
    create policy profiles_upsert
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text,
  booking_id uuid references public.bookings(id) on delete set null,
  data jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz default now()
);

create unique index if not exists notifications_unique_scheduled
  on public.notifications(user_id, type, booking_id, scheduled_for);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_select_own'
  ) then
    create policy notifications_select_own
      on public.notifications
      for select
      using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_update_own'
  ) then
    create policy notifications_update_own
      on public.notifications
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_insert_service_role'
  ) then
    create policy notifications_insert_service_role
      on public.notifications
      for insert
      with check (auth.role() = 'service_role');
  end if;
end $$;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

alter table public.push_tokens enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_select_own'
  ) then
    create policy push_tokens_select_own
      on public.push_tokens
      for select
      using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_insert_own'
  ) then
    create policy push_tokens_insert_own
      on public.push_tokens
      for insert
      with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'push_tokens' and policyname = 'push_tokens_update_own'
  ) then
    create policy push_tokens_update_own
      on public.push_tokens
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.notify_host_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  host_user uuid;
  eta_minutes int;
begin
  select h.guest_id
    into host_user
  from public.services s
  join public.hosts h on h.id = s.host_id
  where s.id = new.service_id;

  if host_user is null then
    return new;
  end if;

  eta_minutes :=
    greatest(0, floor(extract(epoch from (new.slot_start - now())) / 60));

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    booking_id,
    data
  )
  values (
    host_user,
    'New booking',
    'New guest arrives in ' || eta_minutes || ' min',
    'host_new_booking',
    new.id,
    jsonb_build_object('eta_minutes', eta_minutes)
  );

  return new;
end;
$$;

drop trigger if exists bookings_notify_host on public.bookings;
create trigger bookings_notify_host
  after insert on public.bookings
  for each row execute function public.notify_host_on_booking();

create or replace function public.queue_booking_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    booking_id,
    scheduled_for
  )
  select
    b.guest_id,
    'Booking starts soon',
    'Your booking starts in 10 min',
    'guest_start_soon',
    b.id,
    b.slot_start - interval '10 minutes'
  from public.bookings b
  where b.status = 'confirmed'
    and b.slot_start >= now() + interval '10 minutes'
    and b.slot_start < now() + interval '11 minutes'
  on conflict do nothing;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    booking_id,
    scheduled_for
  )
  select
    b.guest_id,
    'Booking ending soon',
    'Your booking ends in 10 min',
    'guest_end_soon',
    b.id,
    b.slot_end - interval '10 minutes'
  from public.bookings b
  where b.status = 'confirmed'
    and b.slot_end >= now() + interval '10 minutes'
    and b.slot_end < now() + interval '11 minutes'
  on conflict do nothing;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'queue_booking_reminders') then
      perform cron.schedule(
        'queue_booking_reminders',
        '* * * * *',
        'select public.queue_booking_reminders();'
      );
    end if;
  end if;
end $$;

create extension if not exists pg_net;

create or replace function public.schedule_booking_reminders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is null or new.status in ('confirmed', 'reserved') then
    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      booking_id,
      scheduled_for
    )
    values (
      new.guest_id,
      'Booking starts soon',
      'Your booking starts in 10 min',
      'guest_start_soon',
      new.id,
      new.slot_start - interval '10 minutes'
    )
    on conflict do nothing;

    insert into public.notifications (
      user_id,
      title,
      body,
      type,
      booking_id,
      scheduled_for
    )
    values (
      new.guest_id,
      'Booking ending soon',
      'Your booking ends in 10 min',
      'guest_end_soon',
      new.id,
      new.slot_end - interval '10 minutes'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_schedule_reminders on public.bookings;
create trigger bookings_schedule_reminders
  after insert on public.bookings
  for each row execute function public.schedule_booking_reminders();

create or replace function public.queue_booking_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    booking_id,
    scheduled_for
  )
  select
    b.guest_id,
    'Booking starts soon',
    'Your booking starts in 10 min',
    'guest_start_soon',
    b.id,
    b.slot_start - interval '10 minutes'
  from public.bookings b
  where (b.status is null or b.status in ('confirmed', 'reserved'))
    and b.slot_start >= now()
    and b.slot_start < now() + interval '15 minutes'
  on conflict do nothing;

  insert into public.notifications (
    user_id,
    title,
    body,
    type,
    booking_id,
    scheduled_for
  )
  select
    b.guest_id,
    'Booking ending soon',
    'Your booking ends in 10 min',
    'guest_end_soon',
    b.id,
    b.slot_end - interval '10 minutes'
  from public.bookings b
  where (b.status is null or b.status in ('confirmed', 'reserved'))
    and b.slot_end >= now()
    and b.slot_end < now() + interval '15 minutes'
  on conflict do nothing;
end;
$$;

insert into public.notifications (
  user_id,
  title,
  body,
  type,
  booking_id,
  scheduled_for
)
select
  b.guest_id,
  'Booking starts soon',
  'Your booking starts in 10 min',
  'guest_start_soon',
  b.id,
  b.slot_start - interval '10 minutes'
from public.bookings b
where (b.status is null or b.status in ('confirmed', 'reserved'))
  and b.slot_start >= now()
  and b.slot_start <= now() + interval '24 hours'
on conflict do nothing;

insert into public.notifications (
  user_id,
  title,
  body,
  type,
  booking_id,
  scheduled_for
)
select
  b.guest_id,
  'Booking ending soon',
  'Your booking ends in 10 min',
  'guest_end_soon',
  b.id,
  b.slot_end - interval '10 minutes'
from public.bookings b
where (b.status is null or b.status in ('confirmed', 'reserved'))
  and b.slot_end >= now()
  and b.slot_end <= now() + interval '24 hours'
on conflict do nothing;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net') then
    if not exists (select 1 from cron.job where jobname = 'send_push_notifications') then
      perform cron.schedule(
        'send_push_notifications',
        '* * * * *',
        $cron$select net.http_post(
          url := 'https://vphdaahrnszfuoswbpwj.supabase.co/functions/v1/send-push',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := '{}'::jsonb
        );$cron$
      );
    end if;
  end if;
end $$;

create table if not exists public.hosts (
    id uuid primary key default gen_random_uuid(),
    guest_id uuid references public.profiles(id) on delete set null,
    display_name text,
    phone_country_code text,
    phone_number text,
    stripe_account_id text,
    stripe_onboarding_complete boolean not null default false,
    stripe_charges_enabled boolean not null default false,
    stripe_payouts_enabled boolean not null default false,
    stripe_details_submitted boolean not null default false,
    stripe_onboarding_at timestamptz,
    created_at timestamptz default now()
  );

alter table public.hosts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hosts' and policyname = 'hosts_select'
  ) then
    create policy hosts_select
      on public.hosts
      for select
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hosts' and policyname = 'hosts_insert_own'
  ) then
    create policy hosts_insert_own
      on public.hosts
      for insert
      with check (guest_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hosts' and policyname = 'hosts_update_own'
  ) then
    create policy hosts_update_own
      on public.hosts
      for update
      using (guest_id = auth.uid())
      with check (guest_id = auth.uid());
  end if;
end $$;

alter table public.services
  add column if not exists host_id uuid references public.hosts(id);

alter table public.services
  add column if not exists description text;

alter table public.services
  alter column price_eur type numeric(10,2) using price_eur::numeric;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'services' and policyname = 'services_insert_host_own'
  ) then
    create policy services_insert_host_own
      on public.services
      for insert
      with check (
        exists (
          select 1
          from public.hosts h
          where h.id = host_id and h.guest_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'services' and policyname = 'services_update_host_own'
  ) then
    create policy services_update_host_own
      on public.services
      for update
      using (
        exists (
          select 1
          from public.hosts h
          where h.id = host_id and h.guest_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.hosts h
          where h.id = host_id and h.guest_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'services' and policyname = 'services_delete_host_own'
  ) then
    create policy services_delete_host_own
      on public.services
      for delete
      using (
        exists (
          select 1
          from public.hosts h
          where h.id = host_id and h.guest_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists public.service_slots (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  slot_start timestamptz not null,
  slot_end timestamptz not null
);

alter table public.service_slots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_slots' and policyname = 'service_slots_select'
  ) then
    create policy service_slots_select
      on public.service_slots
      for select
      using (true);
  end if;
end $$;

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    guest_id uuid not null references auth.users(id) on delete cascade,
    service_id uuid not null references public.services(id) on delete cascade,
    slot_start timestamptz not null,
    slot_end timestamptz not null,
    people_count integer not null default 1,
    qr_token text unique,
    status text not null default 'confirmed',
    checked_in_at timestamptz,
    payment_intent_id text,
    payment_status text not null default 'pending',
    amount_cents integer,
    platform_fee_cents integer,
    currency text default 'eur',
    created_at timestamptz default now()
  );

alter table public.bookings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_select_own'
  ) then
    create policy bookings_select_own
      on public.bookings
      for select
      using (auth.uid() = guest_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_select_host_services'
  ) then
    create policy bookings_select_host_services
      on public.bookings
      for select
      using (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = bookings.service_id
            and h.guest_id = auth.uid()
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_insert_own'
  ) then
    create policy bookings_insert_own
      on public.bookings
      for insert
      with check (auth.uid() = guest_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bookings' and policyname = 'bookings_delete_own'
  ) then
    create policy bookings_delete_own
      on public.bookings
      for delete
      using (auth.uid() = guest_id);
  end if;
end $$;

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz default now(),
  unique (guest_id, service_id)
);

alter table public.favorites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_select_own'
  ) then
    create policy favorites_select_own
      on public.favorites
      for select
      using (auth.uid() = guest_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_insert_own'
  ) then
    create policy favorites_insert_own
      on public.favorites
      for insert
      with check (auth.uid() = guest_id);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'favorites' and policyname = 'favorites_delete_own'
  ) then
    create policy favorites_delete_own
      on public.favorites
      for delete
      using (auth.uid() = guest_id);
  end if;
end $$;

create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  rating_10 integer not null check (rating_10 >= 0 and rating_10 <= 10),
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_reviews_service on public.service_reviews(service_id);
create index if not exists idx_service_reviews_guest on public.service_reviews(guest_id);

alter table public.service_reviews enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_select_own'
  ) then
    create policy service_reviews_select_own
      on public.service_reviews
      for select
      using (guest_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_select_public'
  ) then
    create policy service_reviews_select_public
      on public.service_reviews
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_select_host_services'
  ) then
    create policy service_reviews_select_host_services
      on public.service_reviews
      for select
      using (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = service_reviews.service_id
            and h.guest_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_insert_from_own_booking'
  ) then
    create policy service_reviews_insert_from_own_booking
      on public.service_reviews
      for insert
      with check (
        guest_id = auth.uid()
        and exists (
          select 1
          from public.bookings b
          where b.id = booking_id
            and b.guest_id = auth.uid()
            and b.service_id = service_id
            and b.slot_start < now()
        )
      );
  end if;
end $$;
