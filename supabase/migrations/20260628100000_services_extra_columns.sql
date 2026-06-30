-- Add image_url, amenities, cancellation_minutes to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS amenities JSONB,
  ADD COLUMN IF NOT EXISTS cancellation_minutes INTEGER DEFAULT 60;

-- Add host_reply and author_name to service_reviews
ALTER TABLE public.service_reviews
  ADD COLUMN IF NOT EXISTS host_reply TEXT,
  ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Allow NULL booking_id and guest_id so seed/mock reviews can be inserted
-- without requiring a real booking or auth user
ALTER TABLE public.service_reviews
  ALTER COLUMN booking_id DROP NOT NULL,
  ALTER COLUMN guest_id   DROP NOT NULL;
