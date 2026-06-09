-- Stripe card fingerprints for one-trial-per-card enforcement (cross-email abuse).

CREATE TABLE IF NOT EXISTS public.trial_payment_method_fingerprints (
  payment_method_fingerprint text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trial_payment_method_fingerprints IS
  'Stripe payment_method.card.fingerprint values tied to a Holzen trial. Service writes only.';

CREATE INDEX IF NOT EXISTS idx_trial_payment_method_fingerprints_user_id
  ON public.trial_payment_method_fingerprints(user_id);

ALTER TABLE public.trial_payment_method_fingerprints ENABLE ROW LEVEL SECURITY;
