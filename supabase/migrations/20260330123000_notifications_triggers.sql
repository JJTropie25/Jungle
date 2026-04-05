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
