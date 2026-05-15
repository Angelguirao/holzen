# Observability Setup Bible

Click-paths and config for the Holzen observability stack. This is the setup source of truth; companion runbooks cover day-to-day operation.

- Incident flow: [incident-response.md](incident-response.md)
- PII review checklist: [pii-masking-review.md](pii-masking-review.md)
- Backup/restore drill: [backup-restore-drill.md](backup-restore-drill.md)
- Event taxonomy (PostHog): [event-taxonomy.md](event-taxonomy.md)
- Feature flags: [feature-flags.md](feature-flags.md)
- Edge logging conventions: [edge-logging-conventions.md](edge-logging-conventions.md)
- Broader logging strategy: [logging-strategy.md](logging-strategy.md)

## Stack at a glance

| Vendor | Use | Data |
|---|---|---|
| **Sentry** | Error tracking (frontend **and** edges), on-error Session Replay, release health, Web Vitals | Grouped errors with stack traces, tagged by `cid`, `release`, `source` |
| **PostHog** | Product analytics, funnels, retention, feature flags | Deliberate events only; autocapture and session recording disabled |
| **BetterStack (Logtail)** | Edge log aggregation, search, alerting | All structured JSON from `observe.ts` + cron heartbeats |
| **UptimeRobot** | Uptime monitoring | Frontend root URL + `/functions/v1/health` |
| **Slack** (`#holzen-alerts`) | Unified alert inbox | All vendor alerts + feedback forwarder summaries |
| **Backup email** (`alerts@...`) | Vendors without Slack integration | Anthropic budget, Supabase/Lovable limits |

**Division of labor**: Sentry owns error workflow (group, resolve, regress). BetterStack owns log search, rate-based alerting, heartbeats. PostHog owns product signals. Postgres owns audit/compliance.

## Inputs needed (gather before execution)

**Where each value lives is not interchangeable.** `VITE_*` variables are inlined into the browser bundle at build time by Vite — they are public by definition. Lovable's Secrets vault rightly refuses them (storing them there would be a category error: a "secret" that Vite would immediately publish to every user). Edge-function secrets are the opposite: they stay server-side and must never appear in the bundle.

### Frontend (committed to `src/config/public-env.ts` as hardcoded fallbacks — values are public)

| Variable | Value | Where obtained | Where set |
|---|---|---|---|
| `VITE_SENTRY_DSN` | Sentry DSN for frontend project — safe to commit; Sentry enforces allowed origins on the project side | Sentry → Settings → Projects → [project] → Client Keys (DSN) | `src/config/public-env.ts` → `FALLBACK_SENTRY_DSN` |
| `VITE_POSTHOG_KEY` | PostHog project API key — safe to commit; write-scoped, domain-throttled | PostHog → Project Settings → Project API Key | `src/config/public-env.ts` → `FALLBACK_POSTHOG_KEY` |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` (default) or EU equivalent | PostHog region setting | `src/config/public-env.ts` → `FALLBACK_POSTHOG_HOST` |
| `VITE_APP_VERSION` | Git SHA (7-char). Auto-`dev` when unset | Build env (CI) | `process.env.VITE_APP_VERSION` at build time; falls back to `dev` |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Build-time only, for `@sentry/vite-plugin` source-map upload | Sentry → Settings → Account → API → Auth Tokens (scope: `project:releases`) | CI build env or local-only; never committed |

**Why not Lovable Secrets for `VITE_*`?** They're inlined into the JS bundle. Lovable's UI blocks `VITE_*` secret names with the message *"VITE_ prefixed variables are build-time browser values and should be defined in .env files, not in secrets."* Because `.env` / `.env.*` are gitignored in this repo, the codebase convention is **hardcoded fallbacks in `src/config/public-env.ts`** (mirroring how `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` fallbacks live in `vite.config.ts`). To enable observability in the hosted build, edit `FALLBACK_SENTRY_DSN` / `FALLBACK_POSTHOG_KEY` in `src/config/public-env.ts` and push.

**Defense in depth (required):** Set allowed origins on the Sentry project and on the PostHog project so the embedded keys can only be used from your own domains. This is standard practice — vendors expect public-in-bundle keys and provide origin-restriction as the security layer.

### Edge functions (Lovable secrets UI)

| Variable | Value |
|---|---|
| `SENTRY_DSN_EDGES` | Sentry DSN for edges. Recommended: same project as frontend (unified quota + release health). Alternative: separate project if you anticipate muting edge noise during incidents. Tag segmentation via `source:edge` vs `source:frontend` handles the same-project case. |
| `SENTRY_RELEASE` | Git SHA of the deploy (same value as `VITE_APP_VERSION`). Enables cross-surface release correlation. |
| `SENTRY_ENVIRONMENT` | `production` or `preview` |
| `LOG_DRAIN_URL` | BetterStack log ingest endpoint (`https://in.logs.betterstack.com`) |
| `LOG_DRAIN_TOKEN` | BetterStack source token (not the API token) |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL for `#holzen-alerts` |
| `LOVABLE_API_KEY` | Already present; required for Lovable Email + AI gateway calls |

If any edge secret is absent, the corresponding forwarder silently no-ops. Never hard-fails user flows.

## 1. Slack channel + webhook

1. Slack → Create channel `#holzen-alerts`. Private is fine; add whoever needs the pages.
2. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App → From scratch** → name `Holzen Alerts`.
3. Enable **Incoming Webhooks** → **Add New Webhook to Workspace** → pick `#holzen-alerts`.
4. Copy the webhook URL (`https://hooks.slack.com/services/...`). Store as `SLACK_WEBHOOK_URL` in Lovable secrets.
5. Optional `alerts@<yourdomain>` for vendors without Slack integration (Anthropic budget emails, Lovable limit warnings).

Test once from any shell with network access:

```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"holzen-alerts smoke ping"}' "$SLACK_WEBHOOK_URL"
```

## 2. Sentry

### 2.1 Project

1. [sentry.io](https://sentry.io) → Create project → platform **Browser JavaScript / React**. Name: `holzen`.
2. Copy the DSN. Paste as `FALLBACK_SENTRY_DSN` in `src/config/public-env.ts` (frontend, committed) and — unless you want a dedicated edge project — also store as `SENTRY_DSN_EDGES` in the Lovable secrets UI (edges, server-side).
3. Settings → Projects → `holzen` → **Security & Privacy** → enable **Scrub IP addresses** and **Data scrubbing**. Defaults handle PAN/SSN-like patterns; our `beforeSend` on both surfaces adds Holzen-specific keys (`prompt|reflection|content|message|body|input`).
4. Settings → Projects → `holzen` → **Security & Privacy** → **Allowed Domains** → add your production + preview domains. The DSN is committed to the repo, so origin-restriction on the Sentry side is the security layer that prevents third parties from spamming your quota.
5. Settings → Projects → `holzen` → **Release Health** → enable.

### 2.2 Source maps (build-time)

1. Settings → Account → API → **Auth Tokens** → Create with scope `project:releases`. Store as `SENTRY_AUTH_TOKEN` in the CI build env (not Lovable runtime).
2. Vite build uploads source maps automatically when `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` are present (see `vite.config.ts`). Missing token = plugin is a no-op.

### 2.3 Slack integration

1. Sentry → Settings → Integrations → **Slack** → Authorize workspace.
2. Map project `holzen` → `#holzen-alerts`.

### 2.4 W3C Trace Context (browser → edge)

The SPA enables Sentry’s **`propagateTraceparent`** and **`tracePropagationTargets`** (Supabase project origin from `VITE_SUPABASE_URL`) so outgoing edge calls carry **`traceparent`**, **`sentry-trace`**, and **`baggage`** in addition to **`x-cid`**. See `src/lib/trace-propagation.ts`, `src/lib/sentry.ts`, and the patched `supabase.functions.invoke` in `src/integrations/supabase/client.ts`.

Edge CORS (`supabase/functions/_shared/cors.ts`) allow-lists those headers; `withRequestLogging` parses a valid version-`00` **`traceparent`** and adds **`trace_id`** / **`parent_span_id`** to the initial `request` log line for BetterStack joins alongside `cid`.

`createCidSupabaseClient(..., incomingRequest?)` forwards the same trace headers on service-role PostgREST/Auth HTTP calls when the optional **`Request`** is passed (see `_shared/forward-trace-headers.ts`); explicit `global.headers` from the caller still win.

This is **not** a full OpenTelemetry SDK in-app — it aligns the propagation **wire format** with OTel / W3C so downstream collectors or future OTLP export can reuse the same identifiers.

### 2.5 Alert rules (Sentry Alerts UI)

Create each as an **Issue Alert** (not Metric Alert) unless noted:

| Name | When | Filter | Action |
|---|---|---|---|
| First-seen (any source) | A new issue is created | `environment: production` | Slack `#holzen-alerts` |
| First-seen edge (paging) | A new issue is created | `environment: production` AND `source: edge` | Slack + `@here` (edges usually block core flows) |
| Regression | An issue changes state from resolved to unresolved | `environment: production` | Slack |
| Issue volume (warning) | Number of events in an issue > 10 in 1 hour | — | Slack |
| Issue volume edge (paging) | Number of events in an issue > 50 in 1 hour | `source: edge` | Slack |
| Release deployed | A release is created (info-level) | — | Slack |
| Error rate frontend (metric alert) | `event.type:error AND source:frontend` > 2% over 15 min | — | Slack + email |

Ensure **weekly summary** is on (Settings → Account → Notifications → Weekly Reports) → backup email.

**Quota hygiene note**: `beforeSend` in `supabase/functions/_shared/sentry.ts` drops expected `EdgeError` codes (`auth_required`, `rate_limited`, `bad_input`, `not_found`) so user-input errors never create issues. BetterStack still receives them for search.

## 3. PostHog

### 3.1 Project

1. [posthog.com](https://posthog.com) → Create project → platform **React**. Region: US or EU (match compliance needs; the region URL goes into `FALLBACK_POSTHOG_HOST` in `src/config/public-env.ts`).
2. Copy the project API key → paste as `FALLBACK_POSTHOG_KEY` in `src/config/public-env.ts` (committed; public by design — write-scoped and domain-throttled).
3. Project Settings → **Autocapture** → **Disabled**. Confirm; our `src/lib/posthog.ts` also sets `autocapture: false` but UI-level disable is belt-and-braces.
4. Project Settings → **Session Recording** → **Disabled**. Our init explicitly disables too; this closes any "enable globally" button.
5. Project Settings → **Data Management** → **Anonymize IPs** → enable.
6. Project Settings → **Authorized domains / URLs** → add your production + preview domains. Mirrors the Sentry allowed-domains step — since the key is in the bundle, origin-restriction on the PostHog side is the security layer.

### 3.2 Events and properties

Do **not** create events in the PostHog UI. Events are emitted from the app per [event-taxonomy.md](event-taxonomy.md). PostHog discovers them on first write. If an event shows up that isn't in the taxonomy, it's a bug — delete and add to taxonomy first.

### 3.3 First insights (optional; nice-to-have)

- Funnel: `auth.signed_up` → `pause.manual_completed` → `paywall.subscribed`
- Trend: `pause.manual_completed` count by day, breakdown by `had_bitcoin_context`
- Retention: `auth.signed_in` cohort weekly

## 4. BetterStack (Logtail)

### 4.1 Source

1. [betterstack.com/logs](https://betterstack.com/logs) → **Sources** → **Add source** → platform **HTTP** (or "Custom").
2. Name: `holzen-edges`. Copy the **HTTP endpoint URL** (`https://in.logs.betterstack.com`) → `LOG_DRAIN_URL`, and the **source token** → `LOG_DRAIN_TOKEN`. Store both in Lovable secrets.

### 4.2 Slack integration

1. Integrations → **Slack** → authorize → pick `#holzen-alerts`.

### 4.3 Alert rules (BetterStack → Alerts)

Each targets source `holzen-edges`:

| Name | Query | Severity |
|---|---|---|
| Edge error | `level = "error"` | Slack, paging |
| fail-open rate-limit | `msg contains "limit_check_fail_open"` | Slack, warning |
| Orchestrate invoke error | `msg contains "orchestrate_invoke_error"` | Slack, warning |
| Error spike | `level = "error"` count > 10 per 5 min | Slack, paging |
| Heartbeat miss: refresh-btc-prices | See §6 below | Slack, paging |
| Heartbeat miss: pregenerate-companions | See §6 | Slack, paging |
| Heartbeat miss: check-volatility | See §6 | Slack, paging |
| Heartbeat miss: night-reflection | See §6 | Slack, paging |
| Heartbeat miss: fetch-source-feeds | See §6 | Slack, paging |
| Heartbeat miss: process-referral-pending | See §6 | Slack, warning |

## 5. UptimeRobot

1. [uptimerobot.com](https://uptimerobot.com) → Add monitor.
2. Monitor 1: **HTTPS GET** `https://holzen.app/` (or your production frontend URL). 5-min interval. Keyword match: `<html`.
3. Monitor 2: **HTTPS GET** `https://<ref>.supabase.co/functions/v1/health`. 5-min interval. Keyword match: `"status":"ok"`.
4. Integrations → **Slack** → native integration → pick `#holzen-alerts`. Enable Down + Up notifications.

## 6. Cron heartbeats (BetterStack Heartbeats)

**Storage model.** Heartbeat UUIDs live in the existing `public.app_config` table (keys of the form `heartbeat.<job_name>`), seeded with empty strings by migration [`20260420190000_cron_heartbeats_app_config.sql`](../../supabase/migrations/20260420190000_cron_heartbeats_app_config.sql). The `ALTER DATABASE postgres SET app.heartbeat_*` pattern from the earlier migration requires superuser privileges that Lovable-managed Supabase does not expose — `app_config` is the workaround.

The helper `public.emit_job_heartbeat('<job_name>')` looks up the UUID and no-ops if it's still empty, so the migration can ship before UUIDs exist.

**Operational rollout (create heartbeats, populate UUIDs, wire cron jobs, attach Slack) is tracked as a single backlog ticket:** [pg-cron-heartbeat-wiring.md](../backlog/pg-cron-heartbeat-wiring.md).

Short version:

1. BetterStack → **Heartbeats** → create one per job using the **Period** + **Grace** in the table below — these are the canonical values, do not eyeball them. Tuning rationale lives in the backlog ticket.
2. In Supabase SQL editor:
   ```sql
   UPDATE public.app_config
      SET value = to_jsonb('<uuid-from-betterstack>'::text)
    WHERE key  = 'heartbeat.refresh_btc_prices';
   ```
3. In each cron schedule body, after the real work:
   ```sql
   PERFORM public.emit_job_heartbeat('refresh_btc_prices');
   ```

#### Heartbeat windows (canonical)

Mirror of the **Part A** table in [pg-cron-heartbeat-wiring.md](../backlog/pg-cron-heartbeat-wiring.md) (heartbeat periods + grace; row count shrank after Pause V2 removed `check-followups`). If you change a value, change it in **both** places in the same PR — the backlog ticket owns the *why* (per-job rationale + tuning rule), this runbook is the *what* (the values to type into BetterStack).

| Cron job | Schedule | Period | Grace | `app_config` key |
|---|---|---|---|---|
| `process-email-queue` | `*/1 * * * *` | 1 min | 5 min | `heartbeat.process_email_queue` |
| `process-referral-pending` | `*/5 * * * *` | 5 min | 2 min | `heartbeat.process_referral_pending` |
| `refresh-btc-prices` | `*/15 * * * *` | 15 min | 5 min | `heartbeat.refresh_btc_prices` |
| `check-volatility` | `*/15 * * * *` | 15 min | 5 min | `heartbeat.check_volatility` |
| `night-reflection` | `0 * * * *` | 1 hr | 10 min | `heartbeat.night_reflection` |
| `pregenerate-companions` | `0 */6 * * *` | 6 hr | 30 min | `heartbeat.pregenerate_companions` |
| `fetch-source-feeds` | `0 6,18 * * *` | 12 hr | 30 min | `heartbeat.fetch_source_feeds` |

**Pause V2:** `check-followups` / `heartbeat.check_followups` were removed with `follow_ups` — delete any stale BetterStack heartbeat and `app_config` row if they still exist.

**Tuning rule (one-liner):** sub-hourly → grace = period; hourly → grace = 10 min; multi-hour/daily → grace = 30 min absolute. Floor 2 min; never exceed 1× period for sub-hourly. Full rationale + per-job justification in the backlog ticket.

Override the base URL (e.g. to a non-BetterStack provider) via `heartbeat._base_url` in `app_config`.

## 7. Anthropic + Lovable limit alerts

- Anthropic Console → Billing → **Budget alerts** at 50 / 80 / 100% → email to `alerts@<yourdomain>`.
- Lovable dashboard → Billing / Limits → whatever hard caps Lovable exposes → email to `alerts@<yourdomain>`.

Neither vendor offers native Slack integration for billing. Route email → `alerts@...` → forward to Slack via your email client's rule or a Slack email address (`#holzen-alerts` → More → Open channel details → **Integrations → Send emails to this channel**).

## 8. Release tagging

`VITE_APP_VERSION` (frontend) and `SENTRY_RELEASE` (edges) must match for cross-surface correlation. A CI step sets both from the same Git SHA.

- Frontend build: Vite `define` injects `__APP_VERSION__`; `src/lib/sentry.ts` uses it as the Sentry `release`; PostHog registers it as super-property `$app_version`.
- Edge functions: `observe.ts` includes `release` in every forwarded log line; `supabase/functions/_shared/sentry.ts` uses `SENTRY_RELEASE` as Sentry `release`.

Release health UI (Sentry) shows the % of sessions free of crashes, grouped by release.

## 9. Verifying end-to-end correlation

After setup, a single test flow must hit every surface. See smoke test in [incident-response.md](incident-response.md) §Verify.

## 10. When to promote / reconsider

- **Dashboard access to Supabase** (claim via Lovable) → promote to **native log drain**; retire the in-function HTTP forwarder. `observability-setup.md` stays; BetterStack alert rules stay.
- **Edge log volume > 5M lines / month** → add batching in `observe.ts` forwarder (§backlog item in the plan).
- **Error volume > 5k / month (Sentry free tier)** → choose: upgrade Sentry plan, tighten `beforeSend` skip-list, or use Sentry sampling (`Sentry.init({ sampleRate: 0.5 })`).
- **EU users become primary cohort** → switch PostHog region to EU and revisit consent (see [pii-masking-review.md](pii-masking-review.md)).
