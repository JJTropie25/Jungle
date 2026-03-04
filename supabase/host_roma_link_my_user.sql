-- Link current app user to Host Roma without creating extra auth accounts.
-- User id taken from app logs:
-- 71445069-7f60-41cd-af90-410da42f9ebd

begin;

-- 0) Ensure auth user exists and profile row exists (hosts.guest_id -> profiles.id FK).
do $$
declare
  _uid uuid := '71445069-7f60-41cd-af90-410da42f9ebd';
begin
  if not exists (select 1 from auth.users where id = _uid) then
    raise exception 'User % not found in auth.users', _uid;
  end if;

  insert into public.profiles (id)
  values (_uid)
  on conflict (id) do nothing;
end $$;

-- 1) Ensure no other host is linked to this user.
update public.hosts
set guest_id = null
where guest_id = '71445069-7f60-41cd-af90-410da42f9ebd'
  and display_name <> 'Host Roma';

-- 2) Ensure Host Roma exists.
insert into public.hosts (display_name, guest_id)
select 'Host Roma', null
where not exists (
  select 1
  from public.hosts
  where display_name = 'Host Roma'
);

-- 3) Link Host Roma to this user and normalize name.
with target as (
  select id
  from public.hosts
  where display_name = 'Host Roma'
  order by created_at asc
  limit 1
)
update public.hosts h
set guest_id = '71445069-7f60-41cd-af90-410da42f9ebd',
    display_name = 'Host Roma'
from target t
where h.id = t.id;

-- 4) If Host Roma has no listings, assign a starter set of services.
with host_row as (
  select id
  from public.hosts
  where display_name = 'Host Roma'
    and guest_id = '71445069-7f60-41cd-af90-410da42f9ebd'
  order by created_at asc
  limit 1
),
has_listings as (
  select exists(
    select 1
    from public.services s
    join host_row h on h.id = s.host_id
  ) as ok
),
picked as (
  select s.id
  from public.services s
  where s.host_id is null
  order by s.created_at asc
  limit 20
)
update public.services s
set host_id = (select id from host_row)
where s.id in (select id from picked)
  and (select ok from has_listings) = false;

commit;
