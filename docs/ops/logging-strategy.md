# Logging strategy (by surface)

Holzen already uses **three complementary channels**. The strategy is to **keep using them consistently** and extend them as features grow—not to add a new stack early (e.g. full APM) unless pain justifies it.

## 1. Edge Functions (Deno) — **structured console + DB**

**Implementation:** [`supabase/functions/_shared/observe.ts`](../../supabase/functions/_shared/observe.ts) — **`createLogger`** emits **one JSON object per line** (`fn`, `cid`, `msg`, `level`, `extra`, …) to Supabase Edge stdout and (when configured) the BetterStack drain. **Edge and browser are different:** grep Edge by **`fn`** / **`msg`** / **`holzen_event`** in JSON; the SPA still uses bracket prefixes via [`holzen-console`](../../src/lib/holzen-console.ts) (see section 2).

**Prod vs “understand the flow” (same intent as [`holzen-console`](../../src/lib/holzen-console.ts)):**

| Surface | Quiet default (prod) | Verbose flow tracing |
|---------|----------------------|----------------------|
| **Browser** | Default prod build: no `[holzen:*]` | **`import.meta.env.DEV`**, **`VITE_HOLZEN_DEBUG=1`**, **`?holzenDebug=1`**, or **`localStorage holzen:debug=1`** |
| **Edge cron / workers** | JSON **`info`** lines still appear (stdout); tune noise via **log level / message keys** in code reviews, not a global env flag | Filter logs by **`fn`** (function name) or stable **`msg`** / **`holzen_event`** tokens |

**Staging / local:** `supabase functions serve` shows the same JSON **`console.log` / `warn` / `error`** lines as production; without **`LOG_DRAIN_URL`** the drain no-ops locally.

| Mechanism | Purpose | When to use |
|-----------|---------|-------------|
| **`createLogger(prefix)`** | One JSON line per log (`fn`, `cid`, `elapsed_ms`, `level`, `msg`, optional `extra`) | Every new function: request lifecycle, branches, failures. Appears in **Supabase → Edge Functions → Logs**. |
| **`limit_check_fail_open`** ([`ratelimit.ts`](../../supabase/functions/_shared/ratelimit.ts)) | Rate / daily budget / regenerate check errored → request still **allowed** | Grep **`limit_check_fail_open`** or **`holzen_event":"limit_check_fail_open"`**; use **`scope`** (`rate_limit`, `daily_budget`, `companion_regenerate`) and **`phase`** (`supabase_error`, `thrown`) for dashboards/alerts. |
| **`quality_gate_reject`** ([`quality.ts`](../../supabase/functions/_shared/quality.ts)) | Companion **live** output failed `qualityGate` → fallback path | Grep **`quality_gate_reject`**; fields **`companion_type`**, **`reason`** (stable code, no body text). Pair with **`generation_attempts.status`** = **`quality_gate_failed`** and **`quality_gate_reason`**. |
| **`orchestrate_invoke`** ([`companion-orchestrate-logging.ts`](../../supabase/functions/_shared/companion-orchestrate-logging.ts)) | Every **`companion-orchestrate`** request after auth | Grep **`orchestrate_invoke`** / **`holzen_event":"orchestrate_invoke"`**; **`invoke_source`** from body **`holzenInvokeSource`** (`browser_pause_intervention`, `browser_lazy_fetch`, `browser_regenerate`, `cron_check_volatility`, …); **`auth_mode`**; **`pause_instance_prefix`** (8 chars, prefix of `pause_instance_id`). For client vs cron overlap metrics. |
| **`orchestrate_skip_cached`** ([`companion-orchestrate-skip-cached.ts`](../../supabase/functions/_shared/companion-orchestrate-skip-cached.ts)) | All requested slots already on **`pause_ai_artifacts`** — no AI, no rate/budget charge | Grep **`orchestrate_skip_cached`**; emitted via request **`log`** (**`need_*`** booleans show which slots were satisfied from cache). |
| **`fetch_feeds_*`** ([`fetch-source-feeds/index.ts`](../../supabase/functions/fetch-source-feeds/index.ts)) | Ingestion pipeline: **`fetch_feeds_batch`**, **`fetch_feeds_discover`**, **`fetch_feeds_article`**, **`fetch_feeds_complete`**, plus essay attribution helpers — all via request **`log`** / **`log.warn`** / **`log.error`** with **`extra.holzen_event":"fetch_feeds_cron"`** | Grep **`"fn":"fetch-source-feeds"`** and **`fetch_feeds_`** in **`msg`**. See [systems/content-library-fetch-source-feeds.md](../systems/content-library-fetch-source-feeds.md). |
| **`companion_slot_resolved`** ([`companion-orchestrate-slot-telemetry.ts`](../../supabase/functions/_shared/companion-orchestrate-slot-telemetry.ts)) | After each companion generator run inside **`companion-orchestrate`** (parallel tasks) or **`regenerate-only`** | Grep **`companion_slot_resolved`**; emitted via request **`log`**; **`orchestrator_slot`** (`signal`, `grounding`, …), **`companion_type`** (canonical DB type), **`source`** (`live` / `library` / `cache` / `curated` / `empty`), **`cache_relaxation`**, **`filled`**, **`pause_prefix`**. Pairs with client **`[holzen:companion]`** in **`use-companion-data`**. |
| **`library_search_rejected`** ([`content-library.ts`](../../supabase/functions/_shared/content-library.ts)) | `content_library` phase returned nothing and the generator fell through to `companion_cache` / curated | Grep **`library_search_rejected`**; **`reason`** (`db_error` / `empty` / `all_seen` / `threw`), **`type`** (`essay` / `paper` / `event`), **`companion_type`**, **`mood_tag`**, plus **`candidate_pool_size`** + **`recently_seen_size`** on `all_seen`. Aggregate by `reason` to spot RLS regressions, empty pools, freshness exhaustion, or unexpected throws. |
| **`library_recent_serves_error`** ([`content-library.ts`](../../supabase/functions/_shared/content-library.ts)) | Per-user freshness lookup on `user_companion_serves` errored — library phase falls **open** (ignores freshness for that call) rather than rejecting | Grep **`library_recent_serves_error`**; **`phase`** (`db_error` / `threw`), **`companion_type`**. If this fires together with unexpected repeat serves, that's why — library is intentionally permissive under lookup failure. |
| **`cache_serve`** ([`cache.ts`](../../supabase/functions/_shared/cache.ts)) | `serveFromCache` returned a row | Grep **`cache_serve`**; when generators pass **`structuredLog`** (orchestrate request **`log`**), lines use **`createLogger`** JSON (**`cid`**, **`fn`**, **`extra.holzen_event`**). **`companion_type`**, **`cache_relaxation`** (`none` / `market` / `repeat_or_lower_quality`). `repeat_or_lower_quality` should only appear from `serveFallback` (post-live) after the strict-mode Phase-2 change landed 2026-04-18 — if it appears on the main flow, the `strict: true` plumbing regressed. Callers may also pass **`promptVersion`** to filter to a specific generator revision (e.g. `zoom_out_deep_time` pins v4), so old rows with a mismatched or `NULL` `companion_cache.prompt_version` stop counting toward the pool — expect a burst of `cache_strict_miss` after a `PROMPT_VERSION` bump until new rows are written. |
| **`cache_strict_miss`** ([`cache.ts`](../../supabase/functions/_shared/cache.ts)) | Phase-2 `serveFromCache({ strict: true })` found no fresh+quality row and yielded to live | Grep **`cache_strict_miss`**; same **`structuredLog`** behaviour as **`cache_serve`**. **`companion_type`**. Expected whenever the user has seen the current cache pool within `COMPANION_SERVE_FRESHNESS_DAYS`. A healthy burst here means live is getting its shot; absence combined with many `cache_serve relaxation:"repeat_or_lower_quality"` means the strict plumbing is not being exercised. |
| **`grounding_enrich_hit`** ([`grounding-enrich/index.ts`](../../supabase/functions/grounding-enrich/index.ts)) | Citation enrichment served from `grounding_enrichment_cache` (no upstream calls) | Grep **`grounding_enrich_hit`**; emitted via request **`log`** (**`holzen_event`** in **`extra`**); **`citation_hash`**, **`has_doi`**, **`has_abstract`**, **`researcher_count`**. Healthy: this dominates after each paper's first view. If hit-rate is low, inspect `normalizeCitation` — a regression there silently shards the cache per user. |
| **`grounding_enrich_miss`** ([`grounding-enrich/index.ts`](../../supabase/functions/grounding-enrich/index.ts)) | Cache miss; at least one of Crossref / Semantic Scholar / Gemini returned data | Grep **`grounding_enrich_miss`**; request **`log`**; **`citation_hash`**, **`has_doi`**, **`has_abstract`**, **`researcher_count`**, **`citation_count`**. Expect one per novel citation; a burst on a single citation means the 60-day TTL didn't write (e.g. service-role key missing). |
| **`grounding_enrich_failed`** ([`grounding-enrich/index.ts`](../../supabase/functions/grounding-enrich/index.ts)) | Cache miss **and** all three upstreams returned nothing | Grep **`grounding_enrich_failed`**; request **`log.warn`**; **`citation_hash`**, **`has_doi`**. Cached with a 1-day TTL (not 60) so transient Crossref / Semantic Scholar outages self-heal. Persistent spikes → check Crossref status page and Lovable AI gateway quota. |
| **`reflection_insights_*`** ([`reflection-insights/index.ts`](../../supabase/functions/reflection-insights/index.ts)) | AI batch / single-user insights: upstream HTTP error, timeout → fallback model, rate limit, empty body, JSON parse failure | Grep **`reflection_insights_model_retry`**, **`reflection_insights_ai_upstream_error`**, **`reflection_insights_ai_timeout`**, **`reflection_insights_rate_limited`**, **`reflection_insights_ai_empty`**, **`reflection_insights_parse_failed`** — request **`log`** / **`log.warn`** / **`log.error`** (**`holzen_event`** in **`extra`**). Per-user lines include **`user_id`** where useful for triage. |
| **`companion_fullview_opened`** (analytics_events, [`use-fullview-telemetry.ts`](../../src/hooks/use-fullview-telemetry.ts)) | A Full View page (Signal / Grounding / History / ZoomOut) mounted | Query `analytics_events where event='companion_fullview_opened'`; **`metadata.companion`** (one of `signal` / `grounding` / `history` / `zoomOut`), **`metadata.pause_instance_id`**. One event per (user, pause, companion) — the hook guards against StrictMode double-fire. Used to measure Full View adoption independent of inline card impressions. |
| **`createAttemptLogger` → `generation_attempts`** | Model/API attempts, costs, quality gates | Companion and AI paths: success, error, timeout, `quality_gate_failed`. Enables **per-user / per-pause** cost and debugging. |
| **`createObsTracker` / `trackEvent` → `analytics_events`** | Product and pipeline events (counts, funnel steps) | User-scoped events (“pause_ai_call”, companion fallbacks, etc.); **not** a substitute for full request tracing. |

**Along the way**

- Prefer **`createLogger`** over ad-hoc `console.log` in new or touched functions so logs are grep-friendly and share a **correlation id** (`cid`) per request.
- When you add a **new critical path**, wire **attempt logging** if it calls external models or billable APIs.
- **Never log:** service role keys, full JWTs, raw Stripe payloads with secrets, full email addresses, or full user journal text in `extra`—use ids (`user_id`, `pause_instance_id`), **`recipient_host`** / **`redactEmailForLog`** from [`email-log-helpers.ts`](../../supabase/functions/_shared/email-log-helpers.ts) on transactional email paths, and short hashes if needed.

## 2. Browser (React) — **prefixed console + user-visible errors**

**Holzen flow tracing:** [`src/lib/holzen-console.ts`](../../src/lib/holzen-console.ts) — **`[holzen:boot]`**, **`holzen:profile`**, **`[holzen:companion]`** (pause session lazy fetch / regenerate / intervention orchestrate), query cache, etc. **Turn everything on** (non-DEV builds too) using any of:

1. **`VITE_HOLZEN_DEBUG=1`** in `.env.hosted.local` / `.env` (e.g. with **`npm run dev:hosted`**).
2. Open the app with **`?holzenDebug=1`** once — enables **session** debug for that tab and removes the query param.
3. **`localStorage.setItem('holzen:debug','1')`** + reload — persistent.

**Dev server** (`import.meta.env.DEV`): always verbose. **Default prod build:** off unless one of the above. Edge log volume is controlled in code (which branches call **`log`** / **`log.warn`** / **`log.error`**) — it does not use the same env toggles as the browser **`holzen-console`** path.

**Current pattern:** `console.error` / `console.warn` with a **stable prefix** (e.g. `[useCompanionData]`, `[boot-crash-promise]`), plus `ErrorBoundary` and `main.tsx` handlers for boot failures.

**Along the way**

- Keep **prefixes** so support and devtools searches are easy.
- **Production:** avoid logging PII; treat the console as **user-visible** in devtools.
- If you later add **Sentry / LogRocket / etc.**, centralize in one wrapper (e.g. `reportError(error, context)`) instead of scattering new SDK calls.

**Analytics:** `analytics_events` from the client (e.g. feedback, admin toggles) are **product events**, not technical logs—keep them intentional and privacy-aligned with your privacy copy.

## 3. Postgres / cron — **jobs as logs**

- **pg_cron** and HTTP callouts: success/failure often shows in **Supabase logs** and the **edge function** invoked by the job. Document “what to check” in [cron-setup.md](cron-setup.md) and the [observability checklist](observability-and-failures.md).
- For **data issues**, prefer **queries** (e.g. `generation_attempts` by `pause_instance_id`) over raw log scrolling when possible.

## Correlation: how to debug a single “pause session”

1. **Time range** in Edge logs.
2. **`cid`** from `createLogger` JSON lines for that request.
3. **`pause_instance_id` / `user_id`** in `generation_attempts` and `analytics_events` when those columns are populated.

If a path does not yet attach `pause_instance_id` to attempts, improve that when you touch the function.

## What not to do (until you need it)

- **Don’t** log every successful DB row in hot paths (noise + cost).
- **Don’t** duplicate the same event in three places without reason—pick **one** primary (e.g. attempt for AI, analytics for product).
- **Don’t** commit a second “logging framework” on the client without a concrete incident that `console` + future error reporting could not answer.

## Related

- [observability-and-failures.md](observability-and-failures.md) — per-pipeline checklist.
- [pause-signal-companion-logging-e2e.md](pause-signal-companion-logging-e2e.md) — strategic checklist: pause → open Signal → grep client + Edge.
- [http-review-playbooks.md](../fundamentals/http-review-playbooks.md) — pairing HTTP steps with Edge logs.
