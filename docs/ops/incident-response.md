# Incident Response — Slack-first Flow

Alerts land in **`#holzen-alerts`**. This runbook is the triage and resolution flow.

Companion docs: [observability-setup.md](observability-setup.md), [logging-strategy.md](logging-strategy.md), [edge-logging-conventions.md](edge-logging-conventions.md).

## Roles

Pre-PMF we're a team of one. "On-call" means: Slack unmuted during waking hours; mobile push on. For post-PMF, add a rotation here.

## Severities

| Severity | Example | Response target |
|---|---|---|
| **SEV-1 — user-facing outage** | `/health` down, Sentry first-seen edge with `@here`, UptimeRobot down on root URL, error rate > 5% | Acknowledge in Slack in ≤ 15 min. Mitigate in ≤ 1 hr. |
| **SEV-2 — feature broken** | Specific edge function error spike, cron heartbeat miss, Sentry first-seen frontend not affecting auth/paywall | Acknowledge ≤ 1 hr. Fix same day. |
| **SEV-3 — warning** | fail-open rate-limit, quality-gate rejects, low-volume first-seen | Next business day. |

## Triage flow

1. **Slack alert fires**. Read the message. Every alert includes source icon, severity tag, release, click-through link.
2. **Click through**.
   - Sentry link → issue page. Look at: title (code), first-seen, affected users, release, tags (`cid`, `source`, `fn`).
   - BetterStack link → filtered query. Look at: frequency, surrounding log lines for the same `cid`, dep.error context.
   - UptimeRobot link → monitor page. Confirms request status + recent downtime.
3. **Grab the `cid`** from the alert or linked issue. Paste into the other tool's search to get cross-surface context:
   - Sentry → BetterStack: filter `cid: <value>` in BetterStack to see the full structured log trail.
   - BetterStack → Sentry: search `cid: <value>` in Sentry issue search to find the grouped error.
4. **Check `/health`**: `curl https://<ref>.supabase.co/functions/v1/health`. Fields:
   - `status: "ok"` and `db_ping_ms < 200` → DB healthy.
   - `sentry_initialized: true` → edge Sentry wired (if `false`, `SENTRY_DSN_EDGES` is missing; no issues will be captured).
   - `log_drain_configured: true` → forwarder wired.
   - `503 degraded` → DB unreachable. Focus there first.
5. **Check last 3 deploys by release**. Sentry → Releases. A regression usually matches a deploy timestamp.
   - Frontend: Lovable shows the latest published build.
   - Edges: GitHub commit history; the last sync to Lovable is the latest deploy.
6. **Form a hypothesis**. One of:
   - **Deploy regression** — revert via Lovable (frontend) or create a fix commit for edges.
   - **Provider outage** — check Anthropic / Perplexity / Lovable / Stripe status pages. See `dep.error` in BetterStack for the service name. Mitigate: flip an app-config flag if available (e.g. `guardAiFeature` → disable); communicate if user-facing.
   - **DB issue** — RLS regression, unique-constraint violation, pg_cron silence. Query the DB directly; match `cid` against `analytics_events`, `generation_attempts`, `audit_log`.
   - **User-input class** — `auth_required`, `rate_limited`, `bad_input`, `not_found` should NOT create Sentry issues (skip-list in `scrubPiiEdge`). If they do, the skip-list regressed.
7. **Mitigate**. Quickest reversible action first.
8. **Verify**. Poll the same surface. Sentry issue stops seeing new events. BetterStack error query goes quiet. UptimeRobot turns green.
9. **Resolve in Sentry** with a comment linking the commit / root cause.

## Correlation anchors

| Tool | Pivot key | Example query |
|---|---|---|
| Sentry | `cid` tag | `cid:a1b2c3d4` in issue search |
| BetterStack | `cid` field | `cid: "a1b2c3d4"` |
| Postgres | `cid` column in `audit_log`, `analytics_events` (when set) | `SELECT * FROM audit_log WHERE cid = 'a1b2c3d4'` |
| PostHog | not directly by `cid`; use user id and time range | filter by `distinct_id` + `timestamp within` |

## Common scenarios

### Scenario: `companion-orchestrate` error spike (BetterStack alert)

1. Open BetterStack link → last 15 min of `fn: "orchestrate"` level:"error".
2. Grab a `cid` → search in Sentry. If not captured, it's a user-input error (`auth_required`, `bad_input`) — no issue created by design.
3. Look at `dep.error` lines for the same `cid` → which upstream failed.
4. If upstream = Anthropic/Perplexity: check status. If sustained, flip `guardAiFeature` disable for the affected feature.
5. If upstream = none and code = `quality_gate_failed`: expected during prompt drift — review recent generator changes.

### Scenario: UptimeRobot `/health` 503

1. Open `/health` response. If `status: degraded, error: db_unreachable`, DB is the issue.
2. Check Supabase (via Lovable if dashboard access absent) for ongoing incident.
3. If DB is fine but `/health` still 503, check edge function logs for boot failures (import errors, missing env).

### Scenario: Cron heartbeat miss

1. BetterStack Heartbeat alert → job name is in the alert title (e.g. `refresh-btc-prices`).
2. Check the cron's recent runs: `SELECT * FROM cron.job_run_details WHERE jobname = 'refresh-btc-prices' ORDER BY start_time DESC LIMIT 10;`.
3. Inspect the latest function log in BetterStack for `fn: "refresh-btc-prices"` and its `request.error` line.
4. If `pg_cron` itself died (unlikely on Supabase), reschedule via SQL. See [cron-setup.md](cron-setup.md).

### Scenario: Sentry first-seen frontend

1. Open issue. Read stack trace (source maps uploaded during build = readable line numbers).
2. Check release — did the issue first-seen within ~minutes of a deploy?
3. If user-reported via feedback widget, the feedback row has `sentry_event_id` linking directly to the Sentry event.
4. Reproduce locally if possible. Fix. Release. Sentry auto-resolves when no new events appear post-release.

### Scenario: Feedback arrives in Slack

1. Alert is PII-safe summary only (category, page, cid, release).
2. Read full context in DB: `SELECT * FROM feedback WHERE cid = '<cid>' ORDER BY created_at DESC LIMIT 1;`. Only SELECT via admin RLS.
3. If `category = 'bug'`, cross-reference `sentry_event_id` with the Sentry issue.

## Post-incident (SEV-1 only)

Write a short postmortem in `docs/postmortems/YYYY-MM-DD-short-slug.md`:

```markdown
## What happened
...
## User impact
...
## Timeline (UTC)
- 12:04 — alert fired
- 12:18 — acknowledged
- ...
## Root cause
...
## Resolution
...
## What we'll change
- [ ] Specific action with owner
```

Keep it short; the point is the actions list, not narrative.

## Verify smoke (post-setup, monthly)

Run through once after observability goes live, and monthly thereafter:

1. In the browser, throw an error (`throw new Error("smoke")` in devtools). Expect Sentry issue tagged `source:frontend`, with Replay.
2. Reject a promise unhandled. Expect Sentry capture + crash screen.
3. Submit feedback via the floating widget. Expect DB row with context + Slack PII-safe summary.
4. `curl .../functions/v1/health` → `status: ok`, `sentry_initialized: true`, `log_drain_configured: true`.
5. From any wrapped edge function, throw an `EdgeError('upstream_error', ...)`. Expect Sentry issue `source:edge` + BetterStack log line.
6. From any wrapped edge, throw an `EdgeError('bad_input', ...)`. Expect BetterStack log line but **no** Sentry issue.
7. Emit a PostHog event from devtools (`posthog.capture('test.smoke')`). Expect it in PostHog → Live Events.
8. Toggle `ui.home_v2` for your distinct_id to `true`. Confirm UI variant changes (manual hook test).
9. Heartbeat: wait for the next cron cycle; confirm BetterStack heartbeat turns green on success.

Document anomalies in the PR, not inline in this runbook.
