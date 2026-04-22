-- Pricing v1 packaging
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'pro_plus', 'lifetime'));

CREATE TABLE IF NOT EXISTS public.monthly_feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  month_start date NOT NULL,
  used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monthly_feature_usage_feature_check CHECK (feature IN ('premium_companion', 'wallpaper', 'reflection_insights')),
  CONSTRAINT monthly_feature_usage_used_nonnegative CHECK (used >= 0),
  CONSTRAINT monthly_feature_usage_unique UNIQUE (user_id, feature, month_start)
);

CREATE INDEX IF NOT EXISTS idx_monthly_feature_usage_user_month
  ON public.monthly_feature_usage(user_id, month_start);

ALTER TABLE public.monthly_feature_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monthly_feature_usage_owner_select ON public.monthly_feature_usage;
CREATE POLICY monthly_feature_usage_owner_select
  ON public.monthly_feature_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_monthly_feature_usage_touch_updated_at ON public.monthly_feature_usage;
CREATE TRIGGER trg_monthly_feature_usage_touch_updated_at
  BEFORE UPDATE ON public.monthly_feature_usage
  FOR EACH ROW EXECUTE FUNCTION public.app_config_touch_updated_at();

CREATE OR REPLACE FUNCTION public.consume_monthly_feature_quota(
  p_user_id uuid, p_feature text, p_limit integer, p_amount integer DEFAULT 1
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_month date := date_trunc('month', timezone('utc', now()))::date;
  v_limit integer := GREATEST(COALESCE(p_limit, 0), 0);
  v_amount integer := GREATEST(COALESCE(p_amount, 1), 1);
  v_used integer;
BEGIN
  IF v_limit <= 0 THEN
    RETURN jsonb_build_object('allowed', false, 'used', 0, 'remaining', 0, 'limit', v_limit);
  END IF;
  INSERT INTO public.monthly_feature_usage (user_id, feature, month_start, used)
  VALUES (p_user_id, p_feature, v_month, v_amount)
  ON CONFLICT (user_id, feature, month_start)
  DO UPDATE SET used = public.monthly_feature_usage.used + v_amount
  WHERE public.monthly_feature_usage.used + v_amount <= v_limit
  RETURNING used INTO v_used;
  IF v_used IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', true, 'used', v_used, 'remaining', GREATEST(v_limit - v_used, 0), 'limit', v_limit);
  END IF;
  SELECT used INTO v_used FROM public.monthly_feature_usage
  WHERE user_id = p_user_id AND feature = p_feature AND month_start = v_month;
  RETURN jsonb_build_object('allowed', false, 'used', COALESCE(v_used, 0), 'remaining', GREATEST(v_limit - COALESCE(v_used, 0), 0), 'limit', v_limit);
END; $$;

-- Flex credits wallet
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_wallets_balance_nonnegative CHECK (balance_credits >= 0)
);

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

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created_at ON public.credit_ledger(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_source_ref_unique ON public.credit_ledger(source, source_ref) WHERE source_ref IS NOT NULL;

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_wallets_owner_select ON public.credit_wallets;
CREATE POLICY credit_wallets_owner_select ON public.credit_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS credit_ledger_owner_select ON public.credit_ledger;
CREATE POLICY credit_ledger_owner_select ON public.credit_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_credit_wallets_touch_updated_at ON public.credit_wallets;
CREATE TRIGGER trg_credit_wallets_touch_updated_at BEFORE UPDATE ON public.credit_wallets FOR EACH ROW EXECUTE FUNCTION public.app_config_touch_updated_at();

CREATE OR REPLACE FUNCTION public.add_flex_credits(
  p_user_id uuid, p_credits integer, p_reason text, p_source text,
  p_source_ref text DEFAULT NULL, p_feature text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_credits integer := GREATEST(COALESCE(p_credits, 0), 0);
  v_balance integer := 0;
  v_existing integer := 0;
BEGIN
  IF v_credits <= 0 THEN
    SELECT COALESCE(balance_credits, 0) INTO v_balance FROM public.credit_wallets WHERE user_id = p_user_id;
    RETURN jsonb_build_object('applied', false, 'balance', COALESCE(v_balance, 0), 'added', 0);
  END IF;
  IF p_source_ref IS NOT NULL THEN
    SELECT COUNT(*) INTO v_existing FROM public.credit_ledger WHERE source = p_source AND source_ref = p_source_ref;
    IF v_existing > 0 THEN
      SELECT COALESCE(balance_credits, 0) INTO v_balance FROM public.credit_wallets WHERE user_id = p_user_id;
      RETURN jsonb_build_object('applied', false, 'balance', COALESCE(v_balance, 0), 'added', 0, 'duplicate', true);
    END IF;
  END IF;
  INSERT INTO public.credit_wallets (user_id, balance_credits) VALUES (p_user_id, v_credits)
  ON CONFLICT (user_id) DO UPDATE SET balance_credits = public.credit_wallets.balance_credits + v_credits
  RETURNING balance_credits INTO v_balance;
  INSERT INTO public.credit_ledger (user_id, delta_credits, reason, source, source_ref, feature, metadata)
  VALUES (p_user_id, v_credits, COALESCE(p_reason, 'credit_grant'), COALESCE(p_source, 'system'), p_source_ref, p_feature, COALESCE(p_metadata, '{}'::jsonb));
  RETURN jsonb_build_object('applied', true, 'balance', v_balance, 'added', v_credits);
END; $$;

CREATE OR REPLACE FUNCTION public.consume_feature_allowance_or_credits(
  p_user_id uuid, p_feature text, p_limit integer, p_amount integer DEFAULT 1, p_credit_cost integer DEFAULT 1,
  p_reason text DEFAULT 'feature_overage', p_source text DEFAULT 'edge_function',
  p_source_ref text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_month date := date_trunc('month', timezone('utc', now()))::date;
  v_limit integer := GREATEST(COALESCE(p_limit, 0), 0);
  v_amount integer := GREATEST(COALESCE(p_amount, 1), 1);
  v_credit_cost integer := GREATEST(COALESCE(p_credit_cost, 1), 1);
  v_used integer := 0; v_remaining_allowance integer := 0; v_use_allowance integer := 0;
  v_need_units integer := 0; v_need_credits integer := 0; v_balance integer := 0;
BEGIN
  INSERT INTO public.monthly_feature_usage (user_id, feature, month_start, used)
  VALUES (p_user_id, p_feature, v_month, 0) ON CONFLICT (user_id, feature, month_start) DO NOTHING;
  INSERT INTO public.credit_wallets (user_id, balance_credits) VALUES (p_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  SELECT used INTO v_used FROM public.monthly_feature_usage
  WHERE user_id = p_user_id AND feature = p_feature AND month_start = v_month FOR UPDATE;
  SELECT balance_credits INTO v_balance FROM public.credit_wallets WHERE user_id = p_user_id FOR UPDATE;
  v_used := COALESCE(v_used, 0); v_balance := COALESCE(v_balance, 0);
  v_remaining_allowance := GREATEST(v_limit - v_used, 0);
  v_use_allowance := LEAST(v_amount, v_remaining_allowance);
  v_need_units := GREATEST(v_amount - v_use_allowance, 0);
  v_need_credits := v_need_units * v_credit_cost;
  IF v_need_credits > v_balance THEN
    RETURN jsonb_build_object('allowed', false, 'feature', p_feature, 'limit', v_limit,
      'used', LEAST(v_used, v_limit), 'remaining_allowance', v_remaining_allowance,
      'requested_units', v_amount, 'needed_credits', v_need_credits,
      'credit_cost', v_credit_cost, 'credits_used', 0, 'credits_balance', v_balance);
  END IF;
  IF v_use_allowance > 0 THEN
    UPDATE public.monthly_feature_usage SET used = used + v_use_allowance
    WHERE user_id = p_user_id AND feature = p_feature AND month_start = v_month
    RETURNING used INTO v_used;
  END IF;
  IF v_need_credits > 0 THEN
    UPDATE public.credit_wallets SET balance_credits = balance_credits - v_need_credits
    WHERE user_id = p_user_id RETURNING balance_credits INTO v_balance;
    INSERT INTO public.credit_ledger (user_id, delta_credits, reason, source, source_ref, feature, metadata)
    VALUES (p_user_id, -v_need_credits, COALESCE(p_reason, 'feature_overage'),
      COALESCE(p_source, 'edge_function'), p_source_ref, p_feature, COALESCE(p_metadata, '{}'::jsonb));
  END IF;
  RETURN jsonb_build_object('allowed', true, 'feature', p_feature, 'limit', v_limit,
    'used', LEAST(COALESCE(v_used, 0), v_limit),
    'remaining_allowance', GREATEST(v_limit - COALESCE(v_used, 0), 0),
    'requested_units', v_amount, 'credit_cost', v_credit_cost,
    'credits_used', v_need_credits, 'credits_balance', COALESCE(v_balance, 0));
END; $$;

-- Notifications unified feed
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('badge', 'night_reflection', 'letter', 'insight', 'pause')),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_path text,
  action_state jsonb,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_source_unique UNIQUE (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_recent ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read_at) WHERE dismissed_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_owner_select ON public.notifications;
CREATE POLICY notifications_owner_select ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
CREATE POLICY notifications_owner_update ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notifications_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_notifications_touch_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_touch_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.notifications_touch_updated_at();

CREATE OR REPLACE FUNCTION public.notifications_upsert(
  p_user_id uuid, p_type text, p_source_table text, p_source_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb, p_action_path text DEFAULT NULL,
  p_action_state jsonb DEFAULT NULL, p_created_at timestamptz DEFAULT now()
) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF p_user_id IS NULL OR p_source_id IS NULL THEN RETURN; END IF;
  -- Skip orphaned rows whose user no longer exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
  VALUES (p_user_id, p_type, p_source_table, p_source_id, COALESCE(p_metadata, '{}'::jsonb), p_action_path, p_action_state, COALESCE(p_created_at, now()))
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    type = EXCLUDED.type, metadata = EXCLUDED.metadata,
    action_path = EXCLUDED.action_path, action_state = EXCLUDED.action_state, created_at = EXCLUDED.created_at;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_user_badges() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'badge', 'user_badges', NEW.id,
    jsonb_build_object('badge_id', NEW.badge_id), '/profile', jsonb_build_object('tab', 'badges'), NEW.earned_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_night_reflections() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'night_reflection', 'night_reflections', NEW.id,
    jsonb_build_object('message', NEW.message), NULL, NULL, NEW.created_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, '/profile', jsonb_build_object('tab', 'letters', 'letterId', NEW.id::text), NEW.delivered_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflection_insights() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'insight', 'reflection_insights', NEW.id,
    jsonb_build_object('reflection_count', NEW.reflection_count), '/profile', jsonb_build_object('tab', 'insights'), NEW.generated_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflections() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'reflections', NEW.id,
    jsonb_build_object('message', NEW.message, 'context', NEW.context), '/pause',
    jsonb_build_object('reflectionId', NEW.id::text), NEW.created_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_pause_notifications() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reflection_id IS NOT NULL THEN
    DELETE FROM public.notifications WHERE source_table = 'reflections' AND source_id = NEW.reflection_id;
  END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'pause', 'pause_notifications', NEW.id,
    jsonb_build_object('message', NEW.message, 'context', NEW.context, 'reflection_id', NEW.reflection_id),
    CASE WHEN NEW.reflection_id IS NOT NULL THEN '/pause' ELSE NULL END,
    CASE WHEN NEW.reflection_id IS NOT NULL THEN jsonb_build_object('reflectionId', NEW.reflection_id::text) ELSE NULL END,
    NEW.created_at);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notifications_user_badges ON public.user_badges;
CREATE TRIGGER trg_notifications_user_badges AFTER INSERT ON public.user_badges FOR EACH ROW EXECUTE FUNCTION public.notifications_from_user_badges();

DROP TRIGGER IF EXISTS trg_notifications_night_reflections ON public.night_reflections;
CREATE TRIGGER trg_notifications_night_reflections AFTER INSERT ON public.night_reflections FOR EACH ROW EXECUTE FUNCTION public.notifications_from_night_reflections();

DROP TRIGGER IF EXISTS trg_notifications_future_letters ON public.future_letters;
CREATE TRIGGER trg_notifications_future_letters AFTER INSERT OR UPDATE OF delivered, delivered_at ON public.future_letters FOR EACH ROW EXECUTE FUNCTION public.notifications_from_future_letters();

DROP TRIGGER IF EXISTS trg_notifications_reflection_insights ON public.reflection_insights;
CREATE TRIGGER trg_notifications_reflection_insights AFTER INSERT ON public.reflection_insights FOR EACH ROW EXECUTE FUNCTION public.notifications_from_reflection_insights();

DROP TRIGGER IF EXISTS trg_notifications_reflections ON public.reflections;
CREATE TRIGGER trg_notifications_reflections AFTER INSERT ON public.reflections FOR EACH ROW EXECUTE FUNCTION public.notifications_from_reflections();

DROP TRIGGER IF EXISTS trg_notifications_pause_notifications ON public.pause_notifications;
CREATE TRIGGER trg_notifications_pause_notifications AFTER INSERT ON public.pause_notifications FOR EACH ROW EXECUTE FUNCTION public.notifications_from_pause_notifications();

-- Backfill recent history (filtered: only users that still exist in auth.users)
INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT ub.user_id, 'badge', 'user_badges', ub.id, jsonb_build_object('badge_id', ub.badge_id),
  '/profile', jsonb_build_object('tab', 'badges'), ub.earned_at
FROM public.user_badges ub
WHERE ub.earned_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ub.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT nr.user_id, 'night_reflection', 'night_reflections', nr.id, jsonb_build_object('message', nr.message),
  NULL, NULL, nr.created_at
FROM public.night_reflections nr
WHERE nr.created_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = nr.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT fl.user_id, 'letter', 'future_letters', fl.id, '{}'::jsonb,
  '/profile', jsonb_build_object('tab', 'letters', 'letterId', fl.id::text), fl.delivered_at
FROM public.future_letters fl
WHERE fl.delivered IS TRUE AND fl.delivered_at IS NOT NULL
  AND fl.delivered_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = fl.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT ri.user_id, 'insight', 'reflection_insights', ri.id, jsonb_build_object('reflection_count', ri.reflection_count),
  '/profile', jsonb_build_object('tab', 'insights'), ri.generated_at
FROM public.reflection_insights ri
WHERE ri.generated_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ri.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT r.user_id, 'pause', 'reflections', r.id, jsonb_build_object('message', r.message, 'context', r.context),
  '/pause', jsonb_build_object('reflectionId', r.id::text), r.created_at
FROM public.reflections r
WHERE r.created_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id)
  AND NOT EXISTS (SELECT 1 FROM public.pause_notifications pn WHERE pn.reflection_id = r.id)
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
SELECT pn.user_id, 'pause', 'pause_notifications', pn.id,
  jsonb_build_object('message', pn.message, 'context', pn.context, 'reflection_id', pn.reflection_id),
  CASE WHEN pn.reflection_id IS NOT NULL THEN '/pause' ELSE NULL END,
  CASE WHEN pn.reflection_id IS NOT NULL THEN jsonb_build_object('reflectionId', pn.reflection_id::text) ELSE NULL END,
  pn.created_at
FROM public.pause_notifications pn
WHERE pn.created_at >= now() - interval '30 days'
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = pn.user_id)
ON CONFLICT (source_table, source_id) DO NOTHING;

DELETE FROM public.notifications n USING public.pause_notifications pn
WHERE n.source_table = 'reflections' AND pn.reflection_id IS NOT NULL AND n.source_id = pn.reflection_id;

-- Guardrail defaults
INSERT INTO public.app_config (key, value, description) VALUES
  ('budget_daily_usd_global', '60.0'::jsonb, 'Global AI spend cap per UTC day (sum of generation_attempts.estimated_cost_usd).'),
  ('budget_daily_usd_per_user', '2.5'::jsonb, 'Per-user AI spend cap per UTC day. Abuse backstop for runaway accounts.'),
  ('budget_monthly_usd_global', '1800.0'::jsonb, 'Global AI spend cap per UTC month.'),
  ('ai_cost_alert_daily_threshold_pct', '70'::jsonb, 'Trigger when yesterday''s global AI spend >= this %% of budget_daily_usd_global. 0-100.'),
  ('ai_cost_alert_wow_multiplier', '1.8'::jsonb, 'Trigger when yesterday''s spend >= this multiple of the prior 7-day average.')
ON CONFLICT (key) DO NOTHING;

UPDATE public.app_config SET value = '60.0'::jsonb
WHERE key = 'budget_daily_usd_global' AND (value = '10'::jsonb OR value = '10.0'::jsonb);
UPDATE public.app_config SET value = '2.5'::jsonb
WHERE key = 'budget_daily_usd_per_user' AND (value = '1'::jsonb OR value = '1.0'::jsonb);
UPDATE public.app_config SET value = '1800.0'::jsonb
WHERE key = 'budget_monthly_usd_global' AND (value = '300'::jsonb OR value = '300.0'::jsonb);
UPDATE public.app_config SET value = '70'::jsonb
WHERE key = 'ai_cost_alert_daily_threshold_pct' AND (value = '80'::jsonb OR value = '80.0'::jsonb);
UPDATE public.app_config SET value = '1.8'::jsonb
WHERE key = 'ai_cost_alert_wow_multiplier' AND (value = '2'::jsonb OR value = '2.0'::jsonb);