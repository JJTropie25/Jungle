create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
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

create table if not exists public.hosts (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references public.profiles(id) on delete set null,
  display_name text,
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
