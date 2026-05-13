# Edge Functions

Deno HTTP handlers deployed to Supabase. Shared helpers live in [`_shared/`](./_shared/);
the canonical contract is [`docs/ops/edge-logging-conventions.md`](../../docs/ops/edge-logging-conventions.md).
This README is the one-screen orientation: read it before adding a new function.

## Anatomy of a function

```ts
// supabase/functions/my-function/index.ts
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";

Deno.serve(
  withRequestLogging("my-function", async ({ req, log, cid }) => {
    if (req.method !== "POST") {
      throw new EdgeError("bad_input", "POST required", { status: 405 });
    }

    const body = await req.json();
    log("input_received", { keys: Object.keys(body) });

    // ...do work...

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      // CORS headers are added automatically by the wrapper.
    });
  }),
);
```

Three things to internalize:

1. **`withRequestLogging` is mandatory.** A pre-push CI check
   (`scripts/check-edge-logging.mjs`) fails the build if any `index.ts` calls
   `Deno.serve(...)` or `serve(...)` without wrapping the handler.
2. **Use `log`, not `console`.** The bound logger forwards each line to
   BetterStack with `cid`, `fn`, `release`, and `frontend_release` attached.
   Bare `console.log` only reaches Supabase Edge Logs and is invisible to
   alerting.
3. **Throw `EdgeError` for user-actionable failures**, anything else for bugs.
   The wrapper translates `EdgeError` into a typed JSON envelope and skips
   Sentry for expected codes (`auth_required`, `bad_input`, `rate_limited`,
   `not_found`); unexpected throws become 500 + Sentry capture.

The handler context is `{ req, log, cid, frontendRelease }`. `cid` is the
per-tab correlation ID propagated from the browser via the `x-cid` header —
do not regenerate it inside the handler.

## What `withRequestLogging` does for you

| Concern | Handled where | You do |
|---|---|---|
| CORS preflight (`OPTIONS`) | `_shared/cors.ts` → `handleCors(req)` called inside the wrapper before your handler runs. Returns `200` with the full allow-headers list. | **Nothing.** Do not add a `if (req.method === "OPTIONS")` branch — it's dead code and trips code review. |
| CORS headers on responses | `decorateResponse` in the wrapper merges `corsHeaders` into every `Response` (including `EdgeError` and 500 envelopes). | Return a bare `new Response(...)`; CORS is appended. |
| Correlation ID | `readCid` reads `x-cid` (or generates a UUID), bound to the logger, attached as the `x-cid` response header. | Read it from context if you need to pass it to a downstream call. |
| Sentry init + capture | `initSentryEdges()` runs once per cold start; the wrapper's `catch` invokes `captureEdgeError`. | Don't init Sentry per-function; don't `try/catch` just to re-throw. |
| Structured request/response logs | The wrapper logs `request` (method + path) and `response` (status). | Don't duplicate these from inside the handler. |

## Event-name naming conventions

The first argument to `log(...)` is the **event name**. Names are filtered on
in BetterStack and Sentry breadcrumbs, so consistency matters more than
prose.

Rules:

- **`snake_case`, lowercase, no spaces.** `cache_hit`, not `Cache Hit` or
  `cacheHit`.
- **Verb-first or noun-first, but pick one per family.** Within a function,
  prefer noun-first phases (`input_received`, `quota_checked`,
  `model_invoked`, `cache_written`, `response_built`) so logs sort
  chronologically when grouped by `cid`.
- **Reserved prefixes** — do not reuse for unrelated events:
  - `request` / `response` — emitted by the wrapper itself.
  - `dep.ok` / `dep.error` — emitted by `logDependencyCall` for outbound
    HTTP calls (use it instead of hand-rolled fetch logging).
  - `edge_error` / `unhandled_exception` — emitted by the wrapper's catch.
  - `audit.*` — emitted by `logAudit` for security-sensitive writes.
- **Errors carry an `error` payload, not a separate event.** Prefer
  `log.warn("quota_exceeded", { used, limit })` over a generic `"error"`
  event — the level + name pair is what alerts pivot on.
- **Don't put values in the name.** `log("user_resolved", { user_id })`,
  not `log(\`user_resolved:\${userId}\`)`. The latter explodes cardinality
  in BetterStack.

The full list of reserved/standard events lives in
[`docs/ops/edge-logging-conventions.md`](../../docs/ops/edge-logging-conventions.md#event-names).

## CORS preflight, in one paragraph

The wrapper checks `req.method === "OPTIONS"` first. If true, it returns
`new Response(null, { headers: corsHeaders })` — `200`, empty body, the
canonical allow-list (`authorization, x-client-info, apikey, content-type,
x-cid, x-app-version, x-supabase-client-platform[, ...]`). Your handler is
never invoked for preflight. For non-OPTIONS requests, every `Response` you
return — including ones you didn't construct (e.g. the `EdgeError`
envelope) — has `Access-Control-Allow-Origin: *` and the allow-headers
appended by `decorateResponse`. **Never write a manual `OPTIONS` branch or
attach `corsHeaders` yourself**; the regression mode is a function that
strips its CORS by replacing the wrapper output, which the CI check above
also catches.

## Adding a new function — checklist

1. Create `supabase/functions/<name>/index.ts` using the template above.
2. Add a `[functions.<name>]` block to `supabase/config.toml`. Without it,
   `supabase.functions.invoke()` may 401 in production. Most Lovable
   functions keep the default `verify_jwt = false` and validate the JWT in
   code; only override when the function pattern requires it.
3. Run `npm run check:edge` (Deno typecheck, no-op if Deno isn't
   installed) and `npm run check:edge-logging` (the wrapper guardrail).
4. If the function needs a secret, add it via the secrets tool — never via
   `VITE_*` or committed `.env` files.
5. To verify the wrapper is wired up end-to-end against the deployed
   project, run `npm run smoke:edge-logging` (optionally pass function
   names: `npm run smoke:edge-logging -- health notify-checkout-confirmation`).
   It pings each HTTP-serving function with a unique `x-cid` and asserts the
   response carries the same `x-cid` back — proving `withRequestLogging`
   ran. Set `LOG_DRAIN_QUERY_URL` + `LOG_DRAIN_QUERY_TOKEN` to also
   confirm BetterStack received the `event:"request"` line for that cid.

## Don't

- ❌ `import { serve } from "..."; serve(handler)` without
  `withRequestLogging` — CI fails.
- ❌ `if (req.method === "OPTIONS") return new Response(...)` — the
  wrapper already did this.
- ❌ `console.log("step 1")` inside the handler — invisible to
  BetterStack; use `log("step_1", { ... })`.
- ❌ Initializing Sentry, attaching `cid` to logs, or merging
  `corsHeaders` into responses by hand — the wrapper owns all three.
- ❌ Importing from `src/integrations/supabase/*` — that's frontend code;
  build a Supabase client from `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  (or `SUPABASE_ANON_KEY` when you want to forward the user's JWT) inside
  the function.

## Reference

- [`_shared/with-request-logging.ts`](./_shared/with-request-logging.ts) — wrapper source.
- [`_shared/cors.ts`](./_shared/cors.ts) — preflight + allow-list.
- [`_shared/edge-error.ts`](./_shared/edge-error.ts) — typed error envelope.
- [`_shared/observe.ts`](./_shared/observe.ts) — `createLogger` + BetterStack forwarder.
- [`_shared/deps.ts`](./_shared/deps.ts) — `logDependencyCall` for outbound HTTP; use `expectedStatusCodes` for caller-handled outcomes that should stay warning-level.
- [`_shared/cid-clients.ts`](./_shared/cid-clients.ts) — `createCidSupabaseClient` + `sendWebPushWithCid`: drop-in helpers that propagate the request `cid` to Supabase REST/Auth (via the `x-cid` header — reaches `audit_log.cid`) and to web-push deliveries (logged as `dependency_call dep=webpush` with cid + endpoint host). **Use these instead of bare `createClient(...)` and `webpush.sendNotification(...)`** so cross-surface joins don't break at the function boundary. For web-push stale-subscription cleanup, pass `expectedStatusCodes: [404, 410]`.
- [`_shared/audit.ts`](./_shared/audit.ts) — `logAudit` for security writes.
- [`docs/ops/edge-logging-conventions.md`](../../docs/ops/edge-logging-conventions.md) — full contract.
- [`docs/ops/observability-setup.md`](../../docs/ops/observability-setup.md) — DSNs, alerts, dashboards.
