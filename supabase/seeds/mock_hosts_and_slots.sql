insert into public.hosts (display_name)
values
  ('Host Roma'),
  ('Host Milano'),
  ('Host Firenze');

with host_ids as (
  select id from public.hosts order by created_at asc limit 3
)
update public.services
set host_id = (select id from host_ids limit 1)
where host_id is null;

-- seed slots for each service (today, every 30 minutes from 09:00 to 18:00)
insert into public.service_slots (service_id, slot_start, slot_end)
select
  s.id,
  (date_trunc('day', now()) + make_interval(hours => h, mins => m)) as slot_start,
  (date_trunc('day', now()) + make_interval(hours => h, mins => m + 30)) as slot_end
from public.services s
cross join generate_series(9, 17, 1) as h
cross join (values (0), (30)) as mins(m);
