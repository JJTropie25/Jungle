-- Add phone fields to personal profile data.

alter table public.profiles
  add column if not exists phone_country_code text;

alter table public.profiles
  add column if not exists phone_number text;

