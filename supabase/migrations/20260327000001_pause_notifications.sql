-- pause_notifications: stores in-app records of volatility push notifications
-- so the bell icon can surface them even for users who miss the device push.
CREATE TABLE public.pause_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_id uuid REFERENCES public.reflections(id) ON DELETE SET NULL,
  message text NOT NULL,
  context text,
  severity text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pause_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pause notifications"
  ON public.pause_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-expire old notifications after 7 days to keep the table lean
CREATE INDEX idx_pause_notifications_user_recent
  ON public.pause_notifications (user_id, created_at DESC);
