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
