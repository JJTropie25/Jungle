-- Fix schedule_booking_reminders: only schedule if the slot is actually
-- in the future (> 10 min away). Booking test slots that are already past
-- or imminent would otherwise fire notifications immediately.
create or replace function public.schedule_booking_reminders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is null or new.status in ('confirmed', 'reserved') then

    -- "starts soon" reminder — only if slot is > 10 min away
    if new.slot_start > now() + interval '10 minutes' then
      insert into public.notifications (
        user_id, title, body, type, booking_id, scheduled_for
      ) values (
        new.guest_id,
        'Booking starts soon',
        'Your booking starts in 10 min',
        'guest_start_soon',
        new.id,
        new.slot_start - interval '10 minutes'
      )
      on conflict do nothing;
    end if;

    -- "ends soon" reminder — only if slot end is > 10 min away
    if new.slot_end > now() + interval '10 minutes' then
      insert into public.notifications (
        user_id, title, body, type, booking_id, scheduled_for
      ) values (
        new.guest_id,
        'Booking ending soon',
        'Your booking ends in 10 min',
        'guest_end_soon',
        new.id,
        new.slot_end - interval '10 minutes'
      )
      on conflict do nothing;
    end if;

  end if;

  return new;
end;
$$;
