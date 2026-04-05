create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade,
  rating_10 integer not null check (rating_10 >= 0 and rating_10 <= 10),
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_reviews_service on public.service_reviews(service_id);
create index if not exists idx_service_reviews_guest on public.service_reviews(guest_id);

alter table public.service_reviews enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_select_own'
  ) then
    create policy service_reviews_select_own
      on public.service_reviews
      for select
      using (guest_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_select_public'
  ) then
    create policy service_reviews_select_public
      on public.service_reviews
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_select_host_services'
  ) then
    create policy service_reviews_select_host_services
      on public.service_reviews
      for select
      using (
        exists (
          select 1
          from public.services s
          join public.hosts h on h.id = s.host_id
          where s.id = service_reviews.service_id
            and h.guest_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'service_reviews' and policyname = 'service_reviews_insert_from_own_booking'
  ) then
    create policy service_reviews_insert_from_own_booking
      on public.service_reviews
      for insert
      with check (
        guest_id = auth.uid()
        and exists (
          select 1
          from public.bookings b
          where b.id = booking_id
            and b.guest_id = auth.uid()
            and b.service_id = service_id
            and b.slot_start < now()
        )
      );
  end if;
end $$;
