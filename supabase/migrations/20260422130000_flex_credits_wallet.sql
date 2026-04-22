-- Flex credit wallet + ledger for cross-feature AI top-ups.
-- Keeps existing monthly feature quotas and adds a universal overage balance.

CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_wallets_balance_nonnegative CHECK (balance_credits >= 0)
);

COMMENT ON TABLE public.credit_wallets IS
'Per-user flex credit wallet for premium AI overage.';

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta_credits integer NOT NULL,
  reason text NOT NULL,
  source text NOT NULL,
  source_ref text NULL,
  feature text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.credit_ledger IS
'Append-only credit ledger. Positive deltas are grants, negative deltas are consumption.';

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created_at
  ON public.credit_ledger(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_source_ref_unique
  ON public.credit_ledger(source, source_ref)
  WHERE source_ref IS NOT NULL;

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_wallets_owner_select ON public.credit_wallets;
CREATE POLICY credit_wallets_owner_select
  ON public.credit_wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS credit_ledger_owner_select ON public.credit_ledger;
CREATE POLICY credit_ledger_owner_select
  ON public.credit_ledger
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_credit_wallets_touch_updated_at ON public.credit_wallets;
CREATE TRIGGER trg_credit_wallets_touch_updated_at
  BEFORE UPDATE ON public.credit_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.app_config_touch_updated_at();

CREATE OR REPLACE FUNCTION public.add_flex_credits(
  p_user_id uuid,
  p_credits integer,
  p_reason text,
  p_source text,
  p_source_ref text DEFAULT NULL,
  p_feature text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_credits integer := GREATEST(COALESCE(p_credits, 0), 0);
  v_balance integer := 0;
  v_existing integer := 0;
BEGIN
  IF v_credits <= 0 THEN
    SELECT COALESCE(balance_credits, 0) INTO v_balance
    FROM public.credit_wallets
    WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'applied', false,
      'balance', COALESCE(v_balance, 0),
      'added', 0
    );
  END IF;

  IF p_source_ref IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing
    FROM public.credit_ledger
    WHERE source = p_source
      AND source_ref = p_source_ref;
    IF v_existing > 0 THEN
      SELECT COALESCE(balance_credits, 0) INTO v_balance
      FROM public.credit_wallets
      WHERE user_id = p_user_id;
      RETURN jsonb_build_object(
        'applied', false,
        'balance', COALESCE(v_balance, 0),
        'added', 0,
        'duplicate', true
      );
    END IF;
  END IF;

  INSERT INTO public.credit_wallets (user_id, balance_credits)
  VALUES (p_user_id, v_credits)
  ON CONFLICT (user_id)
  DO UPDATE SET balance_credits = public.credit_wallets.balance_credits + v_credits
  RETURNING balance_credits INTO v_balance;

  INSERT INTO public.credit_ledger (
    user_id, delta_credits, reason, source, source_ref, feature, metadata
  )
  VALUES (
    p_user_id,
    v_credits,
    COALESCE(p_reason, 'credit_grant'),
    COALESCE(p_source, 'system'),
    p_source_ref,
    p_feature,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'applied', true,
    'balance', v_balance,
    'added', v_credits
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_feature_allowance_or_credits(
  p_user_id uuid,
  p_feature text,
  p_limit integer,
  p_amount integer DEFAULT 1,
  p_credit_cost integer DEFAULT 1,
  p_reason text DEFAULT 'feature_overage',
  p_source text DEFAULT 'edge_function',
  p_source_ref text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_month date := date_trunc('month', timezone('utc', now()))::date;
  v_limit integer := GREATEST(COALESCE(p_limit, 0), 0);
  v_amount integer := GREATEST(COALESCE(p_amount, 1), 1);
  v_credit_cost integer := GREATEST(COALESCE(p_credit_cost, 1), 1);
  v_used integer := 0;
  v_remaining_allowance integer := 0;
  v_use_allowance integer := 0;
  v_need_units integer := 0;
  v_need_credits integer := 0;
  v_balance integer := 0;
BEGIN
  INSERT INTO public.monthly_feature_usage (user_id, feature, month_start, used)
  VALUES (p_user_id, p_feature, v_month, 0)
  ON CONFLICT (user_id, feature, month_start) DO NOTHING;

  INSERT INTO public.credit_wallets (user_id, balance_credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT used INTO v_used
  FROM public.monthly_feature_usage
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND month_start = v_month
  FOR UPDATE;

  SELECT balance_credits INTO v_balance
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_used := COALESCE(v_used, 0);
  v_balance := COALESCE(v_balance, 0);
  v_remaining_allowance := GREATEST(v_limit - v_used, 0);
  v_use_allowance := LEAST(v_amount, v_remaining_allowance);
  v_need_units := GREATEST(v_amount - v_use_allowance, 0);
  v_need_credits := v_need_units * v_credit_cost;

  IF v_need_credits > v_balance THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'feature', p_feature,
      'limit', v_limit,
      'used', LEAST(v_used, v_limit),
      'remaining_allowance', v_remaining_allowance,
      'requested_units', v_amount,
      'needed_credits', v_need_credits,
      'credit_cost', v_credit_cost,
      'credits_used', 0,
      'credits_balance', v_balance
    );
  END IF;

  IF v_use_allowance > 0 THEN
    UPDATE public.monthly_feature_usage
    SET used = used + v_use_allowance
    WHERE user_id = p_user_id
      AND feature = p_feature
      AND month_start = v_month
    RETURNING used INTO v_used;
  END IF;

  IF v_need_credits > 0 THEN
    UPDATE public.credit_wallets
    SET balance_credits = balance_credits - v_need_credits
    WHERE user_id = p_user_id
    RETURNING balance_credits INTO v_balance;

    INSERT INTO public.credit_ledger (
      user_id, delta_credits, reason, source, source_ref, feature, metadata
    )
    VALUES (
      p_user_id,
      -v_need_credits,
      COALESCE(p_reason, 'feature_overage'),
      COALESCE(p_source, 'edge_function'),
      p_source_ref,
      p_feature,
      COALESCE(p_metadata, '{}'::jsonb)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'feature', p_feature,
    'limit', v_limit,
    'used', LEAST(COALESCE(v_used, 0), v_limit),
    'remaining_allowance', GREATEST(v_limit - COALESCE(v_used, 0), 0),
    'requested_units', v_amount,
    'credit_cost', v_credit_cost,
    'credits_used', v_need_credits,
    'credits_balance', COALESCE(v_balance, 0)
  );
END;
$$;
