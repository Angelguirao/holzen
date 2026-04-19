CREATE TABLE IF NOT EXISTS public.app_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_config IS
  'Runtime config for AI cost ceilings, feature flags, signup gate. Admin-editable via /admin Tools tab.';

CREATE OR REPLACE FUNCTION public.app_config_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_config_touch_updated_at ON public.app_config;
CREATE TRIGGER trg_app_config_touch_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.app_config_touch_updated_at();

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_config_admin_select ON public.app_config;
CREATE POLICY app_config_admin_select ON public.app_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS app_config_admin_write ON public.app_config;
CREATE POLICY app_config_admin_write ON public.app_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

INSERT INTO public.app_config (key, value, description) VALUES
  ('signups_enabled', 'true'::jsonb, 'Master on/off for new account signups. Flip to false for emergencies.'),
  ('signups_max_per_day', 'null'::jsonb, 'Max profiles created per UTC day. null = unlimited. Throttle during viral spikes.'),
  ('budget_daily_usd_global', '10.0'::jsonb, 'Global AI spend cap per UTC day (sum of generation_attempts.estimated_cost_usd).'),
  ('budget_daily_usd_per_user', '1.0'::jsonb, 'Per-user AI spend cap per UTC day. Abuse backstop; typical users never approach this.'),
  ('budget_monthly_usd_global', '300.0'::jsonb, 'Global AI spend cap per UTC month. Reports alert if projected overrun.'),
  ('panic_mode', 'false'::jsonb, 'When true, companion AI is bypassed for cache/library/fallback. Reflection still runs.'),
  ('feature_flags',
    jsonb_build_object(
      'wallpaper', true, 'letters', true, 'nudges', true, 'digest', true, 'reports', true,
      'night_reflection', true, 'reflection_insights', true, 'suggest_ritual', true,
      'suggest_grounding', true, 'journal_prompt', true, 'pregenerate', true,
      'fetch_source_feeds', true, 'grounding_enrich', true, 'admin_library_preview', true
    ),
    'Per-feature on/off switches. Panic mode overrides companion flags regardless of these.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_signup_gate()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled      boolean;
  v_max_per_day  int;
  v_today_count  int;
  v_max_raw      jsonb;
BEGIN
  SELECT (value #>> '{}')::boolean INTO v_enabled
  FROM app_config WHERE key = 'signups_enabled';
  v_enabled := COALESCE(v_enabled, true);

  SELECT value INTO v_max_raw
  FROM app_config WHERE key = 'signups_max_per_day';
  IF v_max_raw IS NULL OR v_max_raw = 'null'::jsonb THEN
    v_max_per_day := NULL;
  ELSE
    v_max_per_day := (v_max_raw #>> '{}')::int;
  END IF;

  SELECT count(*)::int INTO v_today_count
  FROM profiles
  WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  RETURN jsonb_build_object(
    'enabled',      v_enabled,
    'max_per_day',  v_max_per_day,
    'today_count',  v_today_count,
    'allow',        CASE
                      WHEN NOT v_enabled THEN false
                      WHEN v_max_per_day IS NULL THEN true
                      WHEN v_today_count >= v_max_per_day THEN false
                      ELSE true
                    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_signup_gate() TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_ai_spend_today_global AS
SELECT COALESCE(SUM(estimated_cost_usd), 0)::numeric(12,6) AS total_usd
FROM public.generation_attempts
WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
  AND estimated_cost_usd IS NOT NULL;

CREATE OR REPLACE VIEW public.v_ai_spend_today_per_user AS
SELECT
  user_id,
  COALESCE(SUM(estimated_cost_usd), 0)::numeric(12,6) AS total_usd
FROM public.generation_attempts
WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
  AND estimated_cost_usd IS NOT NULL
  AND user_id IS NOT NULL
GROUP BY user_id;

CREATE OR REPLACE VIEW public.v_ai_spend_month_global AS
SELECT COALESCE(SUM(estimated_cost_usd), 0)::numeric(12,6) AS total_usd
FROM public.generation_attempts
WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'UTC')
  AND estimated_cost_usd IS NOT NULL;

GRANT SELECT ON public.v_ai_spend_today_global TO authenticated;
GRANT SELECT ON public.v_ai_spend_today_per_user TO authenticated;
GRANT SELECT ON public.v_ai_spend_month_global TO authenticated;