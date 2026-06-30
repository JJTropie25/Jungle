-- Remove the trigger that pre-creates guest reminder notifications on booking
-- insert. Those notifications appear in-app immediately (even for bookings hours
-- away) because the in-app feed shows all DB rows regardless of scheduled_for.
--
-- The correct mechanism is the queue_booking_reminders pg_cron job (scheduled
-- in 20260329090000_notifications.sql), which inserts notifications only when
-- the slot is actually ~10 minutes away, so they appear at the right moment.
DROP TRIGGER IF EXISTS bookings_schedule_reminders ON public.bookings;
