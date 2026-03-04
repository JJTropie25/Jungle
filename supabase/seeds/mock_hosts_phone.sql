-- Populate fake phone numbers for mock hosts (except Host Roma).
-- Also distribute services across hosts so bookings can target different hosts.

update public.hosts
set phone_country_code = '+39',
    phone_number = case
      when display_name = 'Host Milano' then '3470000002'
      when display_name = 'Host Firenze' then '3470000003'
      else phone_number
    end
where display_name in ('Host Milano', 'Host Firenze');

with ordered_hosts as (
  select id, row_number() over (order by created_at asc, id asc) as rn
  from public.hosts
),
ordered_services as (
  select id, row_number() over (order by created_at asc, id asc) as rn
  from public.services
)
update public.services s
set host_id = h.id
from ordered_services os
join ordered_hosts h on ((os.rn - 1) % 3) + 1 = h.rn
where s.id = os.id
  and s.city is not null;
