
-- Add missing columns to reflections
ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS grounding_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grounding_title text,
  ADD COLUMN IF NOT EXISTS grounding_body text;

-- Add missing column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS companion_grounding boolean NOT NULL DEFAULT true;

-- Create pause_notifications table
CREATE TABLE IF NOT EXISTS public.pause_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reflection_id uuid REFERENCES public.reflections(id) ON DELETE SET NULL,
  message text NOT NULL,
  context text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pause_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pause notifications"
  ON public.pause_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on pause_notifications"
  ON public.pause_notifications FOR ALL
  USING (auth.role() = 'service_role'::text);
