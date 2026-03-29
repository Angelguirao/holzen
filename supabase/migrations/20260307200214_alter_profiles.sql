ALTER TABLE public.profiles 
ADD COLUMN reflection_style text NOT NULL DEFAULT 'standard',
ADD COLUMN quiet_hours_start integer DEFAULT null,
ADD COLUMN quiet_hours_end integer DEFAULT null;