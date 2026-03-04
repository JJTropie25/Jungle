create extension if not exists "pgcrypto";

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('rest', 'shower', 'storage')),
  price_eur integer not null,
  location text not null,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  rating numeric(2,1),
  distance_meters integer,
  section text,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'services'
      and policyname = 'services_select'
  ) then
    create policy services_select
      on public.services
      for select
      using (true);
  end if;
end $$;
