# Migrate remaining edge functions to `withRequestLogging`

**Status:** Completed (2026-04). 39 of 39 functions wrapped.

## Why

[`supabase/functions/_shared/with-request-logging.ts`](../../supabase/functions/_shared/with-request-logging.ts) is the standard request wrapper installed as part of the observability pragmatic stack. It guarantees every edge invocation emits:

- A structured start log with method + path + correlation id (`x-cid`).
- A structured end log with status + duration.
- A Sentry `captureEdgeError` call on uncaught throw (via `supabase/functions/_shared/sentry.ts`).
- A standardized error envelope (`EdgeError`) in the response so the frontend can surface friendly messages without parsing raw stack traces.

Functions that skip the wrapper don't get any of this. Logs show only what the hand-written handler chose to emit, Sentry sees nothing unless the author remembered to plumb it, and the response shape for errors is inconsistent across endpoints.

## Current state

Wrapped:

- `supabase/functions/journal-prompt/index.ts`
- `supabase/functions/send-feedback/index.ts`
- `supabase/functions/health/index.ts`
- `supabase/functions/delete-account/index.ts`
- `supabase/functions/companion-orchestrate/index.ts`
- `supabase/functions/refresh-btc-prices/index.ts`
- `supabase/functions/fetch-source-feeds/index.ts`
- `supabase/functions/pregenerate-companions/index.ts`
- `supabase/functions/check-volatility/index.ts`
- `supabase/functions/night-reflection/index.ts`
- `supabase/functions/process-referral-pending/index.ts`
- `supabase/functions/suggest-ritual/index.ts`
- `supabase/functions/suggest-grounding/index.ts`
- `supabase/functions/reflection-insights/index.ts`
- `supabase/functions/weekly-digest/index.ts`
- `supabase/functions/monthly-report/index.ts`
- `supabase/functions/holzen-reflect/index.ts`
- `supabase/functions/personalized-nudge/index.ts`
- `supabase/functions/grounding-enrich/index.ts`
- `supabase/functions/generate-wallpaper/index.ts`
- `supabase/functions/ai-cost-alert/index.ts`
- `supabase/functions/admin-library-preview/index.ts`
- `supabase/functions/seed-btc-history/index.ts`
- `supabase/functions/backfill-btc-prices/index.ts`
- `supabase/functions/process-email-queue/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/register-push/index.ts`
- `supabase/functions/record-referral/index.ts`
- `supabase/functions/holzen-number/index.ts`
- `supabase/functions/badge-notify/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `supabase/functions/deliver-letters/index.ts`
- `supabase/functions/preview-transactional-email/index.ts`
- `supabase/functions/send-transactional-email/index.ts`
- `supabase/functions/auth-email-hook/index.ts`
- `supabase/functions/handle-email-unsubscribe/index.ts`
- `supabase/functions/handle-email-suppression/index.ts`

Unwrapped: none.

List is deliberately open-ended here rather than enumerated — run `ls supabase/functions | rg -v ^_` to generate the current set at migration time; the count will change as new functions land.

## What to do (per function)

1. Read the current handler.
2. Move business logic into a `handle(req, ctx)` function that returns a `Response` or throws `EdgeError`.
3. Replace the top-level `Deno.serve(...)` (or equivalent) with `Deno.serve(withRequestLogging('<function-name>', handle))`.
4. Replace ad-hoc `console.log` / `console.error` with `ctx.logger` (passed by the wrapper) so the log drain gets structured rows with `cid` / `release` / `env` tags.
5. Replace hand-rolled error responses with `throw new EdgeError(code, message, { status, expected })` and let the wrapper format the response.
6. Update `supabase/config.toml` if the function has specific flags — `verify_jwt`, cors, etc. — that the wrapper doesn't already handle.
7. Smoke-test the function (Bruno / `curl`) and confirm a JSON log line appears in BetterStack with the expected `cid`.

## Order suggestion (highest value first)

1. **Companion-serving functions** — `companion-orchestrate`, `generate-reflection`, generators under `_shared/generators/` — highest invocation volume, highest cost, already log some state but inconsistently.
2. **Cron-driven functions** — anything invoked from `pg_cron` (refresh-btc-prices, fetch-source-feeds, pregenerate-companions, check-volatility, night-reflection, process-referral-pending, process-email-queue). These pair with [pg-cron-heartbeat-wiring.md](pg-cron-heartbeat-wiring.md); together they close the reliability loop. (`check-followups` was removed in Pause V2.)
3. **Admin / one-off** — admin-library-preview, monthly-report, weekly-digest, generate-wallpaper, etc. Lower volume but still benefit from a unified error envelope.
4. **Billing / auth** — Stripe webhooks, subscription checks. Lower noise, but Sentry coverage matters for money flows.

## Gotchas

- **Stripe webhook endpoints** must preserve the raw request body for signature verification. `withRequestLogging` passes the `Request` through unchanged, but if the handler currently buffers the body before verification, confirm the order is preserved after refactor.
- **Streaming responses** (if any) need the wrapper to flush the end log at stream close, not at handler return. Check `with-request-logging.ts` supports this before wrapping a streaming function.
- **`verify_jwt = false`** functions (health, public endpoints) still benefit from the wrapper — it does not add auth.

## Acceptance

- 100% of `supabase/functions/*` (excluding `_shared`) use `withRequestLogging` or have a documented exemption in the function's header comment.
- BetterStack source shows `function` + `status` + `cid` fields for every invocation after one day of traffic.
- Sentry shows `source:edge` issues on the next intentional failure in any wrapped function.

## Related code

- `supabase/functions/_shared/with-request-logging.ts`
- `supabase/functions/_shared/edge-error.ts`
- `supabase/functions/_shared/sentry.ts`
- `supabase/functions/_shared/observe.ts`
- `docs/ops/edge-logging-conventions.md`
- `docs/ops/observability-setup.md`
