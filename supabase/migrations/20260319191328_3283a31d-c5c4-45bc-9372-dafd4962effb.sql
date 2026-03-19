
-- Create a table for multiple quiet hour windows per user
CREATE TABLE public.quiet_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiet_windows ENABLE ROW LEVEL SECURITY;

-- Users manage their own quiet windows
CREATE POLICY "Users manage own quiet windows"
  ON public.quiet_windows
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_quiet_windows_user ON public.quiet_windows(user_id);
