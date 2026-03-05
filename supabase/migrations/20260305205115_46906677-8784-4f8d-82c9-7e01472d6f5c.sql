-- Add email notification preference to profiles
ALTER TABLE public.profiles ADD COLUMN email_notifications boolean NOT NULL DEFAULT true;