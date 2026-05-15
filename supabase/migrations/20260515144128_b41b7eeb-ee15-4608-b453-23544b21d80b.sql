
-- Lock down user_badges.badge_id to a known allowlist to prevent
-- client-side self-awarding of arbitrary badges.
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  badge_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS badge_definitions_read ON public.badge_definitions;
CREATE POLICY badge_definitions_read
  ON public.badge_definitions
  FOR SELECT
  TO authenticated, anon
  USING (true);

INSERT INTO public.badge_definitions (badge_id) VALUES
  ('first-pause'),
  ('first-week'),
  ('first-ritual'),
  ('iron-hands'),
  ('thirty-strong'),
  ('full-ritual-100'),
  ('btc-genesis'),
  ('btc-pizza'),
  ('btc-halving')
ON CONFLICT (badge_id) DO NOTHING;

-- Remove any orphaned user_badges rows whose badge_id is not in the allowlist
-- (otherwise the FK below will fail).
DELETE FROM public.user_badges
WHERE badge_id NOT IN (SELECT badge_id FROM public.badge_definitions);

ALTER TABLE public.user_badges
  DROP CONSTRAINT IF EXISTS user_badges_badge_id_fkey;

ALTER TABLE public.user_badges
  ADD CONSTRAINT user_badges_badge_id_fkey
  FOREIGN KEY (badge_id)
  REFERENCES public.badge_definitions (badge_id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
