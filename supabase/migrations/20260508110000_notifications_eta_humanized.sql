create or replace function public.notify_host_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  host_user uuid;
  eta_minutes int;
  eta_days int;
  eta_hours int;
  eta_mins int;
  eta_label text;
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

  eta_days := floor(eta_minutes / 1440.0);
  eta_hours := floor((eta_minutes % 1440) / 60.0);
  eta_mins := eta_minutes % 60;

  eta_label := '';
  if eta_days > 0 then
    eta_label := eta_days::text || ' day' || case when eta_days = 1 then '' else 's' end;
  end if;
  if eta_hours > 0 then
    eta_label := concat_ws(' ', eta_label, eta_hours::text || ' h');
  end if;
  if eta_mins > 0 or eta_label = '' then
    eta_label := concat_ws(' ', eta_label, eta_mins::text || ' min');
  end if;

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
    'New guest arrives in ' || eta_label,
    'host_new_booking',
    new.id,
    jsonb_build_object('eta_minutes', eta_minutes)
  );

  return new;
end;
$$;
