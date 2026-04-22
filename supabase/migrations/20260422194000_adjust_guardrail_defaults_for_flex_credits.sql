-- Update operational guardrail defaults for Flex-credit era.
-- Applies only when keys are still on legacy defaults to avoid clobbering
-- environments that already tuned these values manually.

INSERT INTO public.app_config (key, value, description) VALUES
  ('budget_daily_usd_global', '60.0'::jsonb, 'Global AI spend cap per UTC day (sum of generation_attempts.estimated_cost_usd).'),
  ('budget_daily_usd_per_user', '2.5'::jsonb, 'Per-user AI spend cap per UTC day. Abuse backstop for runaway accounts.'),
  ('budget_monthly_usd_global', '1800.0'::jsonb, 'Global AI spend cap per UTC month.'),
  ('ai_cost_alert_daily_threshold_pct', '70'::jsonb, 'Trigger when yesterday''s global AI spend >= this %% of budget_daily_usd_global. 0-100.'),
  ('ai_cost_alert_wow_multiplier', '1.8'::jsonb, 'Trigger when yesterday''s spend >= this multiple of the prior 7-day average.')
ON CONFLICT (key) DO NOTHING;

UPDATE public.app_config
SET
  value = '60.0'::jsonb,
  description = 'Global AI spend cap per UTC day (sum of generation_attempts.estimated_cost_usd).'
WHERE key = 'budget_daily_usd_global'
  AND (value = '10'::jsonb OR value = '10.0'::jsonb);

UPDATE public.app_config
SET
  value = '2.5'::jsonb,
  description = 'Per-user AI spend cap per UTC day. Abuse backstop for runaway accounts.'
WHERE key = 'budget_daily_usd_per_user'
  AND (value = '1'::jsonb OR value = '1.0'::jsonb);

UPDATE public.app_config
SET
  value = '1800.0'::jsonb,
  description = 'Global AI spend cap per UTC month.'
WHERE key = 'budget_monthly_usd_global'
  AND (value = '300'::jsonb OR value = '300.0'::jsonb);

UPDATE public.app_config
SET
  value = '70'::jsonb,
  description = 'Trigger when yesterday''s global AI spend >= this %% of budget_daily_usd_global. 0-100.'
WHERE key = 'ai_cost_alert_daily_threshold_pct'
  AND (value = '80'::jsonb OR value = '80.0'::jsonb);

UPDATE public.app_config
SET
  value = '1.8'::jsonb,
  description = 'Trigger when yesterday''s spend >= this multiple of the prior 7-day average.'
WHERE key = 'ai_cost_alert_wow_multiplier'
  AND (value = '2'::jsonb OR value = '2.0'::jsonb);
