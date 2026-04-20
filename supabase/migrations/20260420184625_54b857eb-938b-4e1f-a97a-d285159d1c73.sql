
SELECT cron.schedule(
  'badge-notify', '30 */2 * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/badge-notify', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('badge_notify'); $$
);

SELECT cron.schedule(
  'check-followups-hourly', '15 * * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/check-followups', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{"time":"hourly"}'::jsonb); SELECT public.emit_heartbeat('check_followups'); $$
);

SELECT cron.schedule(
  'check-volatility', '*/15 * * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/check-volatility', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('check_volatility'); $$
);

SELECT cron.schedule(
  'daily-digest-10am', '0 10 * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/weekly-digest', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{"time":"scheduled"}'::jsonb); SELECT public.emit_heartbeat('daily_digest'); $$
);

SELECT cron.schedule(
  'deliver-letters-check', '*/30 * * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/deliver-letters', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('deliver_letters'); $$
);

SELECT cron.schedule(
  'fetch-source-feeds', '0 6,18 * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/fetch-source-feeds', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('fetch_source_feeds'); $$
);

SELECT cron.schedule(
  'ground-nudge', '0 */3 * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/ground-nudge', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('ground_nudge'); $$
);

SELECT cron.schedule(
  'monthly-report-1st', '0 10 1 * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/monthly-report', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{"time":"scheduled"}'::jsonb); SELECT public.emit_heartbeat('monthly_report'); $$
);

SELECT cron.schedule(
  'night-reflection', '0 * * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/night-reflection', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('night_reflection'); $$
);

SELECT cron.schedule(
  'personalized-nudge-12h', '0 */12 * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/personalized-nudge', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{"time":"scheduled"}'::jsonb); SELECT public.emit_heartbeat('personalized_nudge'); $$
);

SELECT cron.schedule(
  'pregenerate-companions', '0 */6 * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/pregenerate-companions', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('pregenerate_companions'); $$
);

SELECT cron.schedule(
  'refresh-btc-prices', '*/15 * * * *',
  $$ SELECT net.http_post(url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/refresh-btc-prices', headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')), body := '{}'::jsonb); SELECT public.emit_heartbeat('refresh_btc_prices'); $$
);
