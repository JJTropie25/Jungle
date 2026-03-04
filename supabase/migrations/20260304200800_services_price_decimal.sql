-- Allow decimal service prices (e.g. 7.50 EUR).

alter table public.services
  alter column price_eur type numeric(10,2) using price_eur::numeric;

