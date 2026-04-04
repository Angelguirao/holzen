# Logging strategy (by surface)

Holzen already uses **three complementary channels**. The strategy is to **keep using them consistently** and extend them as features grow—not to add a new stack early (e.g. full APM) unless pain justifies it.

## 1. Edge Functions (Deno) — **structured console + DB**

**Implementation:** [`supabase/functions/_shared/observe.ts`](../../supabase/functions/_shared/observe.ts) for structured JSON + DB; **[`holzen-edge-log.ts`](../../supabase/functions/_shared/holzen-edge-log.ts)** for cron/worker lines grep-able as **`[holzen:<tag>]`** in Supabase Edge logs (`holzenEdgeRun` always; `holzenEdgeLog` / `Warn` gated by `HOLZEN_EDGE_LOG`; `holzenEdgeError` always).

**Prod vs “understand the flow” (same intent as [`holzen-console`](../../src/lib/holzen-console.ts)):**

| Surface | Quiet default (prod) | Verbose flow tracing |
|---------|----------------------|----------------------|
| **Browser** | Default prod build: no `[holzen:*]` | **`import.meta.env.DEV`**, **`VITE_HOLZEN_DEBUG=1`**, **`?holzenDebug=1`**, or **`localStorage holzen:debug=1`** |
| **Edge cron / workers** | Set secret **`HOLZEN_EDGE_LOG=0`** (still get **`holzenEdgeRun`** + errors) | Leave secret **unset** or **`1`** on staging / while debugging |

So: **production hosted** → `HOLZEN_EDGE_LOG=0` matches “no strategic spam in prod.” **Staging or local serve** → omit it to see **`holzenEdgeLog`** milestones (eligible counts, run complete, rate limits, etc.) the same way you rely on **`holzen:debug`** or dev mode in the app.

| Mechanism | Purpose | When to use |
|-----------|---------|-------------|
| **`createLogger(prefix)`** | One JSON line per log (`fn`, `cid`, `elapsed_ms`, `level`, `msg`, optional `extra`) | Every new function: request lifecycle, branches, failures. Appears in **Supabase → Edge Functions → Logs**. |
| **`limit_check_fail_open`** ([`ratelimit.ts`](../../supabase/functions/_shared/ratelimit.ts)) | Rate / daily budget / regenerate check errored → request still **allowed** | Grep **`limit_check_fail_open`** or **`holzen_event":"limit_check_fail_open"`**; use **`scope`** (`rate_limit`, `daily_budget`, `companion_regenerate`) and **`phase`** (`supabase_error`, `thrown`) for dashboards/alerts. |
| **`quality_gate_reject`** ([`quality.ts`](../../supabase/functions/_shared/quality.ts)) | Companion **live** output failed `qualityGate` → fallback path | Grep **`quality_gate_reject`**; fields **`companion_type`**, **`reason`** (stable code, no body text). Pair with **`generation_attempts.status`** = **`quality_gate_failed`** and **`quality_gate_reason`**. |
| **`orchestrate_invoke`** ([`companion-orchestrate/index.ts`](../../supabase/functions/companion-orchestrate/index.ts)) | Every **`companion-orchestrate`** request after auth | Grep **`orchestrate_invoke`**; **`invoke_source`** from body **`holzenInvokeSource`** (`browser_pause`, `browser_regenerate`, `cron_check_volatility`, …); **`auth_mode`**; **`reflection_prefix`** (8 chars). For client vs cron overlap metrics. |
| **`createAttemptLogger` → `generation_attempts`** | Model/API attempts, costs, quality gates | Companion and AI paths: success, error, timeout, `quality_gate_failed`. Enables **per-user / per-reflection** cost and debugging. |
| **`createObsTracker` / `trackEvent` → `analytics_events`** | Product and pipeline events (counts, funnel steps) | User-scoped events (“pause_ai_call”, companion fallbacks, etc.); **not** a substitute for full request tracing. |

**Along the way**

- Prefer **`createLogger`** over ad-hoc `console.log` in new or touched functions so logs are grep-friendly and share a **correlation id** (`cid`) per request.
- When you add a **new critical path**, wire **attempt logging** if it calls external models or billable APIs.
- **Never log:** service role keys, full JWTs, raw Stripe payloads with secrets, or full user journal text in `extra`—use ids (`user_id`, `reflection_id`) and short hashes if needed.

## 2. Browser (React) — **prefixed console + user-visible errors**

**Holzen flow tracing:** [`src/lib/holzen-console.ts`](../../src/lib/holzen-console.ts) — **`[holzen:boot]`**, **`holzen:profile`**, query cache, etc. **Turn everything on** (non-DEV builds too) using any of:

1. **`VITE_HOLZEN_DEBUG=1`** in `.env.hosted.local` / `.env` (e.g. with **`npm run dev:hosted`**).
2. Open the app with **`?holzenDebug=1`** once — enables **session** debug for that tab and removes the query param.
3. **`localStorage.setItem('holzen:debug','1')`** + reload — persistent.

**Dev server** (`import.meta.env.DEV`): always verbose. **Default prod build:** off unless one of the above (pairs with Edge: leave **`HOLZEN_EDGE_LOG`** unset for full **`holzenEdgeLog`** traces, or **`=0`** for quiet prod).

**Current pattern:** `console.error` / `console.warn` with a **stable prefix** (e.g. `[useCompanionData]`, `[boot-crash-promise]`), plus `ErrorBoundary` and `main.tsx` handlers for boot failures.

**Along the way**

- Keep **prefixes** so support and devtools searches are easy.
- **Production:** avoid logging PII; treat the console as **user-visible** in devtools.
- If you later add **Sentry / LogRocket / etc.**, centralize in one wrapper (e.g. `reportError(error, context)`) instead of scattering new SDK calls.

**Analytics:** `analytics_events` from the client (e.g. feedback, admin toggles) are **product events**, not technical logs—keep them intentional and privacy-aligned with your privacy copy.

## 3. Postgres / cron — **jobs as logs**

- **pg_cron** and HTTP callouts: success/failure often shows in **Supabase logs** and the **edge function** invoked by the job. Document “what to check” in [cron-setup.md](cron-setup.md) and the [observability checklist](observability-and-failures.md).
- For **data issues**, prefer **queries** (e.g. `generation_attempts` by `reflection_id`) over raw log scrolling when possible.

## Correlation: how to debug a single “pause session”

1. **Time range** in Edge logs.
2. **`cid`** from `createLogger` JSON lines for that request.
3. **`reflection_id` / `user_id`** in `generation_attempts` and `analytics_events` when those columns are populated.

If a path does not yet attach `reflection_id` to attempts, improve that when you touch the function.

## What not to do (until you need it)

- **Don’t** log every successful DB row in hot paths (noise + cost).
- **Don’t** duplicate the same event in three places without reason—pick **one** primary (e.g. attempt for AI, analytics for product).
- **Don’t** commit a second “logging framework” on the client without a concrete incident that `console` + future error reporting could not answer.

## Related

- [observability-and-failures.md](observability-and-failures.md) — per-pipeline checklist.
- [http-review-playbooks.md](../fundamentals/http-review-playbooks.md) — pairing HTTP steps with Edge logs.
