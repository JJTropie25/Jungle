-- Widen rating column to NUMERIC(3,1) to allow the value 10.0
-- (NUMERIC(2,1) caps at 9.9, which overflows when AVG rating_10 = 10).
ALTER TABLE public.services ALTER COLUMN rating TYPE NUMERIC(3,1);
