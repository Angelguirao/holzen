
ALTER TABLE public.profiles ADD COLUMN threshold_down numeric NOT NULL DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN streak_freeze_dates text[] NOT NULL DEFAULT '{}';
-- Copy existing threshold value into threshold_down for existing users
UPDATE public.profiles SET threshold_down = threshold;
