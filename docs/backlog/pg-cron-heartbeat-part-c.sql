-- Part C — re-schedule each pg_cron job so its body calls
-- public.emit_job_heartbeat('<job>') (reads app_config.heartbeat.<job>)
-- INSTEAD of the legacy public.emit_heartbeat('<job>') (reads heartbeat_<job>).
--
-- Run in the Supabase SQL editor as the postgres role.
-- Bodies below are reproduced verbatim from `SELECT command FROM cron.job`
-- on 2026-04-22 — re-check before running if it has been a while.
--
-- Order of unschedule + schedule does not matter across jobs;
-- emit_job_heartbeat is a no-op until app_config.heartbeat.<job> is populated (Part B).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. badge-notify   (every 2h at :30)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('badge-notify');
SELECT cron.schedule(
  'badge-notify',
  '30 */2 * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/badge-notify',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('badge_notify');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. check-followups-hourly — OBSOLETE (Pause V2)
--     Dropped with `follow_ups` + `check-followups` in
--     20260423202000_pause_v2_destructive_cutover.sql. Do not re-schedule.
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT cron.unschedule('check-followups-hourly');
-- SELECT cron.schedule(
--   'check-followups-hourly',
--   '15 * * * *',
--   $$ ... $$
-- );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. check-volatility   (every 15 min)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('check-volatility');
SELECT cron.schedule(
  'check-volatility',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/check-volatility',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('check_volatility');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. daily-digest-10am   (10:00 daily)   [not in original Part C table — keep heartbeat anyway]
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('daily-digest-10am');
SELECT cron.schedule(
  'daily-digest-10am',
  '0 10 * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/weekly-digest',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{"time":"scheduled"}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('daily_digest');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. deliver-letters-check   (every 30 min)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('deliver-letters-check');
SELECT cron.schedule(
  'deliver-letters-check',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/deliver-letters',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('deliver_letters');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. fetch-source-feeds   (06:00 + 18:00)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('fetch-source-feeds');
SELECT cron.schedule(
  'fetch-source-feeds',
  '0 6,18 * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/fetch-source-feeds',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('fetch_source_feeds');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. monthly-report-1st   (10:00 on the 1st)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('monthly-report-1st');
SELECT cron.schedule(
  'monthly-report-1st',
  '0 10 1 * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/monthly-report',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{"time":"scheduled"}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('monthly_report');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. night-reflection   (top of every hour)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('night-reflection');
SELECT cron.schedule(
  'night-reflection',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/night-reflection',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('night_reflection');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. personalized-nudge-12h   (every 12h)   [not in original Part C table]
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('personalized-nudge-12h');
SELECT cron.schedule(
  'personalized-nudge-12h',
  '0 */12 * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/personalized-nudge',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{"time":"scheduled"}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('personalized_nudge');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. pregenerate-companions   (every 6h)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('pregenerate-companions');
SELECT cron.schedule(
  'pregenerate-companions',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/pregenerate-companions',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('pregenerate_companions');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. process-email-queue   (every 5 seconds; conditional)
--     Heartbeat fires unconditionally each tick — that's intentional:
--     the cron worker itself is what we're monitoring, not the email throughput.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('process-email-queue');
SELECT cron.schedule(
  'process-email-queue',
  '5 seconds',
  $$
    SELECT CASE
      WHEN (SELECT retry_after_until FROM public.email_send_state WHERE id = 1) > now()
        THEN NULL
      WHEN EXISTS (SELECT 1 FROM pgmq.q_auth_emails LIMIT 1)
        OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails LIMIT 1)
        THEN net.http_post(
          url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/process-email-queue',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
              SELECT decrypted_secret FROM vault.decrypted_secrets
              WHERE name = 'email_queue_service_role_key'
            )
          ),
          body := '{}'::jsonb
        )
      ELSE NULL
    END;
    PERFORM public.emit_job_heartbeat('process_email_queue');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. refresh-btc-prices   (every 15 min)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.unschedule('refresh-btc-prices');
SELECT cron.schedule(
  'refresh-btc-prices',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/refresh-btc-prices',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')),
      body := '{}'::jsonb
    );
    PERFORM public.emit_job_heartbeat('refresh_btc_prices');
  $$
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: process-referral-pending is listed in the Part A heartbeat table but
-- has NO matching row in cron.job as of 2026-04-22. If/when it is scheduled,
-- append:
--     PERFORM public.emit_job_heartbeat('process_referral_pending');
-- inside its body.
-- ─────────────────────────────────────────────────────────────────────────────

-- Verify
SELECT jobname, schedule FROM cron.job ORDER BY jobname;
