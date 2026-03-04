-- Add phone fields to hosts table (used for host contact fallback in mock mode).

alter table public.hosts
  add column if not exists phone_country_code text;

alter table public.hosts
  add column if not exists phone_number text;

