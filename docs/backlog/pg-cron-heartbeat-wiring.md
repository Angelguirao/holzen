# pg_cron heartbeat wiring (operational rollout)

**Status:** Open. Code-side plumbing shipped; manual BetterStack + SQL wiring pending.

The `emit_job_heartbeat` helper and `app_config` seed rows are already installed (migration [`20260420190000_cron_heartbeats_app_config.sql`](../../supabase/migrations/20260420190000_cron_heartbeats_app_config.sql)). Every cron job is currently running without heartbeats — if one silently stops (pg_cron worker dies, RLS / permission regression, `net.http_post` timeout, etc.) we only find out when a user reports a symptom.

This ticket captures the one-time operational wiring: create the heartbeats in BetterStack, drop the UUIDs into `app_config`, append `emit_job_heartbeat(...)` to each schedule body, attach the heartbeat Slack integration.

## Why this was redesigned

Original plan (migration `20260419180000_cron_heartbeats.sql` comments): use `ALTER DATABASE postgres SET app.heartbeat_<job> = '<uuid>'` and read back with `current_setting('app.heartbeat_<job>', true)`. That pattern requires superuser, which **Lovable-managed Supabase Cloud does not expose** — the SQL editor runs as `postgres` without the privilege and the statement fails with `permission denied for database`.

Storing UUIDs in `public.app_config` avoids the problem: the table is already admin-editable, already bypass-able by the service role, and already has an update timestamp + audit trail.

## What needs to happen

### Part A — BetterStack Heartbeats (≈ 8 min)

BetterStack → **Uptime** product (not Logs) → **Heartbeats** → **Create heartbeat** for each row below. Grace ≈ 2× cadence.

| Name | Period | Grace | `app_config` key |
|---|---|---|---|
| `holzen-cron-refresh-btc-prices` | 15 min | 5 min | `heartbeat.refresh_btc_prices` |
| `holzen-cron-fetch-source-feeds` | 12 hr | 30 min | `heartbeat.fetch_source_feeds` |
| `holzen-cron-pregenerate-companions` | 6 hr | 30 min | `heartbeat.pregenerate_companions` |
| `holzen-cron-check-volatility` | 15 min | 5 min | `heartbeat.check_volatility` |
| `holzen-cron-check-followups` | 6 hr | 30 min | `heartbeat.check_followups` |
| `holzen-cron-process-referral-pending` | 5 min | 2 min | `heartbeat.process_referral_pending` |
| `holzen-cron-night-reflection` | 1 hr | 10 min | `heartbeat.night_reflection` |
| `holzen-cron-process-email-queue` | 1 min | 5 min | `heartbeat.process_email_queue` |

Each heartbeat has a URL of the form `https://uptime.betterstack.com/api/v1/heartbeat/<uuid>`. Copy only the **last path segment** (the UUID) for use in Part B.

Then: BetterStack Uptime → **Integrations → Slack** → same `#holzen-alerts` workspace/channel as the error alerts. Enable both missed-heartbeat and recovery notifications.

### Part B — populate `app_config` (≈ 2 min)

Supabase dashboard → **SQL Editor** → new query → fill in the 8 UUIDs and run:

```sql
UPDATE public.app_config SET value = to_jsonb('<uuid-refresh-btc-prices>'::text)       WHERE key = 'heartbeat.refresh_btc_prices';
UPDATE public.app_config SET value = to_jsonb('<uuid-fetch-source-feeds>'::text)       WHERE key = 'heartbeat.fetch_source_feeds';
UPDATE public.app_config SET value = to_jsonb('<uuid-pregenerate-companions>'::text)   WHERE key = 'heartbeat.pregenerate_companions';
UPDATE public.app_config SET value = to_jsonb('<uuid-check-volatility>'::text)         WHERE key = 'heartbeat.check_volatility';
UPDATE public.app_config SET value = to_jsonb('<uuid-check-followups>'::text)          WHERE key = 'heartbeat.check_followups';
UPDATE public.app_config SET value = to_jsonb('<uuid-process-referral-pending>'::text) WHERE key = 'heartbeat.process_referral_pending';
UPDATE public.app_config SET value = to_jsonb('<uuid-night-reflection>'::text)         WHERE key = 'heartbeat.night_reflection';
UPDATE public.app_config SET value = to_jsonb('<uuid-process-email-queue>'::text)      WHERE key = 'heartbeat.process_email_queue';

-- Verify: 8 rows, UUID column non-empty.
SELECT key, value #>> '{}' AS uuid
FROM public.app_config
WHERE key LIKE 'heartbeat.%' AND key <> 'heartbeat._base_url'
ORDER BY key;
```

No `ALTER DATABASE` — no superuser needed. Rows are visible/editable in the `/admin` Tools tab once it's wired for `heartbeat.*` keys.

### Part C — append heartbeat calls to each cron job (≈ 2 min × 8 = 16 min)

For each existing cron job: fetch the current command, unschedule, re-schedule with a `PERFORM public.emit_job_heartbeat(...)` call **after** the real work (so a failure short-circuits before the heartbeat fires).

Template (repeat per job):

```sql
-- 1. Inspect the current command so you don't lose anything.
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'refresh-btc-prices';

-- 2. Unschedule.
SELECT cron.unschedule('refresh-btc-prices');

-- 3. Re-schedule with heartbeat appended. Paste the original command body verbatim
--    into the $$ ... $$ block before the PERFORM line.
SELECT cron.schedule(
  'refresh-btc-prices',
  '*/15 * * * *',
  $$
    -- <<< existing command body — usually a SELECT net.http_post(...) call >>>

    PERFORM public.emit_job_heartbeat('refresh_btc_prices');
  $$
);
```

Do this for all 8 jobs. `emit_job_heartbeat` is a safe no-op while `app_config.heartbeat.<job>` is still empty, so the order of Part B vs Part C does not matter.

Verify with:

```sql
SELECT jobname, schedule FROM cron.job ORDER BY jobname;
SELECT jobid, jobname, status, return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

Within one cadence cycle per job, the BetterStack heartbeat dashboard should flip to "up". Kill one cron temporarily (e.g. `ALTER DATABASE postgres SET` replaced with a deliberately failing query) to confirm the Slack alert fires inside the grace window, then restore.

## Related code

- `supabase/migrations/20260420190000_cron_heartbeats_app_config.sql` — seeds + `emit_job_heartbeat` wrapper.
- `supabase/migrations/20260419180000_cron_heartbeats.sql` — legacy `emit_heartbeat(text)` direct-UUID primitive, kept for ad-hoc use.
- `supabase/migrations/20260419120000_app_config.sql` — owner of the storage table.
- `docs/ops/observability-setup.md` §6 — runbook short version + reference table.

## Follow-up (optional)

- Surface `heartbeat.*` rows in `/admin` Tools tab alongside the existing cost / feature-flag rows so the UUIDs can be rotated without SQL.
- Add a small `/admin` indicator showing last-heartbeat-ok state per job (read from BetterStack API or last `cron.job_run_details`).
