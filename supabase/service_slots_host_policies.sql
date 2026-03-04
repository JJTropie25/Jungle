-- Host ownership policies for service_slots.
-- Run this in Supabase SQL editor (project DB) to allow hosts to edit slots
-- only for services they own.

alter table public.service_slots enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'service_slots'
      and policyname = 'service_slots_insert_host_own'
  ) then
    create policy service_slots_insert_host_own
      on public.service_slots
      for insert
      with check (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = service_slots.service_id
            and h.guest_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'service_slots'
      and policyname = 'service_slots_update_host_own'
  ) then
    create policy service_slots_update_host_own
      on public.service_slots
      for update
      using (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = service_slots.service_id
            and h.guest_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = service_slots.service_id
            and h.guest_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'service_slots'
      and policyname = 'service_slots_delete_host_own'
  ) then
    create policy service_slots_delete_host_own
      on public.service_slots
      for delete
      using (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = service_slots.service_id
            and h.guest_id = auth.uid()
        )
      );
  end if;
end $$;

