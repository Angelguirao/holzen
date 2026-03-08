ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS motivations text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mantra text DEFAULT NULL;