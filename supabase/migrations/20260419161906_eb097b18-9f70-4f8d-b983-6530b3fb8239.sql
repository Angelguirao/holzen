INSERT INTO public.app_config (key, value, description) VALUES
  ('ai_cost_alert_enabled', 'true'::jsonb, 'Master switch for the daily AI cost alert email. When false, ai-cost-alert no-ops.'),
  ('ai_cost_alert_recipients', '[]'::jsonb, 'JSON array of email addresses that receive the daily AI cost alert. Empty = no alerts sent.'),
  ('ai_cost_alert_daily_threshold_pct', '80'::jsonb, 'Trigger when yesterday''s global AI spend >= this %% of budget_daily_usd_global. 0-100.'),
  ('ai_cost_alert_wow_multiplier', '2.0'::jsonb, 'Trigger when yesterday''s spend >= this multiple of the prior 7-day average. Default 2.0x.')
ON CONFLICT (key) DO NOTHING;