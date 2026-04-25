# pg_cron heartbeat wiring (operational rollout)

**Status:** Open. Code-side plumbing shipped; manual BetterStack + SQL wiring pending.

The `emit_job_heartbeat` helper and `app_config` seed rows are already installed (migration [`20260420190000_cron_heartbeats_app_config.sql`](../../supabase/migrations/20260420190000_cron_heartbeats_app_config.sql)). Every cron job is currently running without heartbeats — if one silently stops (pg_cron worker dies, RLS / permission regression, `net.http_post` timeout, etc.) we only find out when a user reports a symptom.

This ticket captures the one-time operational wiring: create the heartbeats in BetterStack, drop the UUIDs into `app_config`, append `emit_job_heartbeat(...)` to each schedule body, attach the heartbeat Slack integration.

## Why this was redesigned

Original plan (migration `20260419180000_cron_heartbeats.sql` comments): use `ALTER DATABASE postgres SET app.heartbeat_<job> = '<uuid>'` and read back with `current_setting('app.heartbeat_<job>', true)`. That pattern requires superuser, which **Lovable-managed Supabase Cloud does not expose** — the SQL editor runs as `postgres` without the privilege and the statement fails with `permission denied for database`.

Storing UUIDs in `public.app_config` avoids the problem: the table is already admin-editable, already bypass-able by the service role, and already has an update timestamp + audit trail.

## What needs to happen

### Part A — BetterStack Heartbeats (≈ 7 min)

BetterStack → **Uptime** product (not Logs) → **Heartbeats** → **Create heartbeat** for each row below. Use **exactly** the period and grace shown — these are the contract that downstream alerting is tuned against.

#### Tuning rule (canonical)

- **Period** = the cron `schedule` interval, expressed as the *upper bound* of expected gap between successful runs (not "average").
- **Grace** = `max( 2 × p95 runtime of the job , 1 × period , floor(2 min) )`. In practice this lands at:
  - **Sub-hourly jobs (≤15 min):** grace = period (covers exactly one missed slot — alert on the *second* miss, not flaky single misses caused by Supabase Cloud restarts, pg_cron worker hiccups, or `net.http_post` timeouts).
  - **Hourly jobs:** grace = 10 min (~17% of period — long enough to absorb a delayed run, short enough that a true outage pages within the next slot).
  - **Multi-hour jobs (≥6 hr):** grace = 30 min (absolute, not proportional — a 6 hr job that's 30 min late is operationally indistinguishable from on-time; >30 min late means the worker is actually stuck).
  - **Daily/12 hr jobs:** grace = 30 min for the same reason.
- **Never** set grace < 2 min: BetterStack heartbeat ingestion + `net.http_get` round-trip variance alone can eat ~30 s, and pg_cron schedules are not millisecond-accurate.
- **Never** set grace > 1× period for sub-hourly jobs: defeats the purpose — a job that's silently dead for two full cycles is a real outage we want to know about.

| Name | Period | Grace | Rationale | `app_config` key |
|---|---|---|---|---|
| `holzen-cron-process-email-queue` | 1 min | 5 min | Smallest cadence; allow up to 5 missed slots before paging — single-slot misses are noise from pgmq lock contention. | `heartbeat.process_email_queue` |
| `holzen-cron-process-referral-pending` | 5 min | 2 min | Floor grace; job is idempotent + retries internally, so one missed run is tolerable, two is not. | `heartbeat.process_referral_pending` |
| `holzen-cron-refresh-btc-prices` | 15 min | 5 min | CoinGecko 429s + retry add up to ~3 min; 5 min absorbs that without false-positive while still catching a fully dead worker on the next slot. | `heartbeat.refresh_btc_prices` |
| `holzen-cron-check-volatility` | 15 min | 5 min | Same cadence as price refresh; grace matches so they alert in lockstep when pg_cron itself is down. | `heartbeat.check_volatility` |
| `holzen-cron-night-reflection` | 1 hr | 10 min | Fans out per-user AI generation; p95 runtime ~3-5 min, grace covers slow batches without paging. | `heartbeat.night_reflection` |
| `holzen-cron-pregenerate-companions` | 6 hr | 30 min | Long-running batch (Lovable AI); 30 min absolute grace, not proportional — anything later is a real stall. | `heartbeat.pregenerate_companions` |
| `holzen-cron-fetch-source-feeds` | 12 hr | 30 min | External RSS/Firecrawl fetches with internal per-source throttling; runtime variance is bounded, so absolute grace is appropriate. | `heartbeat.fetch_source_feeds` |

**Pause V2:** the `holzen-cron-check-followups` row was removed — the `follow_ups` table and `check-followups` function were dropped in `20260423202000_pause_v2_destructive_cutover.sql`. Remove any existing BetterStack heartbeat + `app_config` `heartbeat.check_followups` entry + pg_cron schedule if still present.

If you add a new cron job, **pick its row from the tuning rule above** before creating the BetterStack heartbeat — don't eyeball it. If a job ends up paging for transient reasons (single-slot miss, expected upstream slowness), revisit the rule rather than silently bumping grace in the BetterStack UI; update the table here in the same PR so future-you knows why.

Each heartbeat has a URL of the form `https://uptime.betterstack.com/api/v1/heartbeat/<uuid>`. Copy only the **last path segment** (the UUID) for use in Part B.

Then: BetterStack Uptime → **Integrations → Slack** → same `#holzen-alerts` workspace/channel as the error alerts. Enable both missed-heartbeat and recovery notifications.

### Part B — populate `app_config` (≈ 2 min)

Supabase dashboard → **SQL Editor** → new query → fill in the 7 UUIDs and run:

```sql
UPDATE public.app_config SET value = to_jsonb('<uuid-refresh-btc-prices>'::text)       WHERE key = 'heartbeat.refresh_btc_prices';
UPDATE public.app_config SET value = to_jsonb('<uuid-fetch-source-feeds>'::text)       WHERE key = 'heartbeat.fetch_source_feeds';
UPDATE public.app_config SET value = to_jsonb('<uuid-pregenerate-companions>'::text)   WHERE key = 'heartbeat.pregenerate_companions';
UPDATE public.app_config SET value = to_jsonb('<uuid-check-volatility>'::text)         WHERE key = 'heartbeat.check_volatility';
UPDATE public.app_config SET value = to_jsonb('<uuid-process-referral-pending>'::text) WHERE key = 'heartbeat.process_referral_pending';
UPDATE public.app_config SET value = to_jsonb('<uuid-night-reflection>'::text)         WHERE key = 'heartbeat.night_reflection';
UPDATE public.app_config SET value = to_jsonb('<uuid-process-email-queue>'::text)      WHERE key = 'heartbeat.process_email_queue';

-- Optional: remove stale Pause V1 key if migrations left it behind.
-- DELETE FROM public.app_config WHERE key = 'heartbeat.check_followups';

-- Verify: one row per active job above; UUID column non-empty.
SELECT key, value #>> '{}' AS uuid
FROM public.app_config
WHERE key LIKE 'heartbeat.%' AND key <> 'heartbeat._base_url'
ORDER BY key;
```

No `ALTER DATABASE` — no superuser needed. Rows are visible/editable in the `/admin` Tools tab once it's wired for `heartbeat.*` keys.

### Part C — append heartbeat calls to each cron job (≈ 2 min × N jobs)

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
