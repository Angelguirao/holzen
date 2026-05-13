# Edge Logging Conventions

The contract for logging inside `supabase/functions/*`. Reads well alongside [logging-strategy.md](logging-strategy.md), which covers the browser + DB sides.

## The pipeline

```
Edge function
  │
  ├─ createLogger(fn, cid)                        (_shared/observe.ts)
  │     ├─ console.log / warn / error (JSON)     → Supabase Edge Logs
  │     └─ fire-and-forget POST                   → BetterStack (LOG_DRAIN_URL)
  │
  ├─ withRequestLogging(fn, handler)              (_shared/with-request-logging.ts)
  │     ├─ request.start / request.end            (all structured)
  │     └─ on throw → captureEdgeError            (_shared/sentry.ts) → Sentry
  │
  ├─ logDependencyCall(log, spec, fn)             (_shared/deps.ts)
  │     └─ dep.ok / dep.error                     (structured; no bodies)
  │
  ├─ EdgeError(code, message, opts)               (_shared/edge-error.ts)
  │     └─ toJSON() → standard envelope           → client
  │
  └─ logAudit(svcClient, entry)                   (_shared/audit.ts)
        └─ audit_log row                           → Postgres (admin-only RLS)
```

## Every new edge function MUST

1. **Export via `withRequestLogging('<fn-name>', async ({ req, log, cid }) => { ... })`.**
   - The handler receives a single `RequestLoggingContext` argument: `{ req, log, cid }`. Use `log` (not `console`) for all messages inside the handler.
   - Wrapper handles CORS preflight, logs `request` and `response`, sets `x-cid` on the response, captures edge errors, and returns a standard `EdgeError` envelope on failure.
2. **Throw `EdgeError` for user-actionable failures**, with one of the typed codes in `_shared/edge-error.ts`:
   - `auth_required` — missing/invalid Authorization header.
   - `forbidden` — authenticated but not allowed.
   - `bad_input` — validation failed.
   - `rate_limited` — global or per-user rate limit hit.
   - `not_found` — resource doesn't exist or user has no access.
   - `conflict` — state conflict (e.g. idempotency key reused with different body).
   - `dependency_unavailable` — a required 3rd-party call failed or timed out (Anthropic, Lovable Email, Stripe, Lovable AI gateway…).
   - `internal` — unknown/unexpected. Falls back from raw `Error`s.
   - The wrapper serializes via `edgeErrorToJson()` and attaches `x-cid`. The `code` reaches the client verbatim.
3. **Wrap external calls with `logDependencyCall(log, dependency, fn, options?)`.**
   - `dependency`: one of `anthropic`, `perplexity`, `lovable-email`, `stripe`, `supabase-db`, `lovable-ai-gateway`, `coingecko`, `crossref`, `firecrawl`, or a new well-known name.
   - `options.operation`: human-readable operation (`chat.completions`, `customers.list`, `emails.send`, `from.table.select`, …). Optional but useful for dashboards.
   - On success: `dependency_call` log with `status: "ok"` + `duration_ms`.
   - On error: `dependency_call` log at error level with `status: "error"`, `duration_ms`, and message. The error re-throws so the wrapper's catch can decide the `EdgeError` shape.
   - If an upstream HTTP status is an expected cleanup/no-op condition, pass `options.expectedStatusCodes` so the same `dependency_call` payload logs at warning level with `expected: true` instead of paging the `Errors` monitor (for example stale web-push endpoints `404`/`410`).
   - **Don't** pass full request/response bodies. `logDependencyCall` logs specs only by contract.
4. **Never `console.log` directly** from the handler or from new helpers. Always go through `log` from `ctx`. (Libraries under `_shared` can call `log.info/warn/error` from a passed-in logger.)
5. **Use `logAudit` for security-sensitive state changes** (see §Audit).

## PII rules (see [pii-masking-review.md](pii-masking-review.md) for the PR checklist)

- Never pass `prompt`, `reflection`, `content`, `message`, `body`, `input` as keys in `log()` extra.
- Pass IDs (`pause_instance_id`, `companion_id`) and stable codes.
- Don't log full emails; use `user_id`.
- Don't log full URLs with query strings that include identifying data. The BetterStack forwarder includes the path, not the full URL, for `request.start`.

## Error flow and Sentry capture

**Where Sentry captures**:

1. `withRequestLogging` catch block — primary path, covers every wrapped function automatically. Passes `EdgeError.code` to `captureEdgeError`.
2. `observe.ts` `createLogger`'s `.error()` method — secondary path, covers fire-and-forget code that doesn't flow through the wrapper (scheduled tasks, post-response background work).

**Quota hygiene**: `scrubPiiEdge`'s `beforeSend` skips expected `EdgeError` codes (`auth_required`, `rate_limited`, `bad_input`, `not_found`). These NEVER create Sentry issues. BetterStack still receives the log line for search and rate alerting.

**No double capture**: The wrapper catches before `logger.error` fires the `dep.error` path, so the same underlying error flows to Sentry once. Sentry's own de-dup handles any residual overlap.

**No-op without DSN**: If `SENTRY_DSN_EDGES` is unset, `captureEdgeError` returns immediately. Safe for local dev and preview.

## Release + environment

Every forwarded log line carries:

- `release` — value of `SENTRY_RELEASE` (git SHA)
- `env` — value of `SENTRY_ENVIRONMENT` (`production` | `preview`)
- `service: 'holzen-edges'`

Sentry events are tagged the same way. Cross-surface correlation uses `cid` as the pivot key.

## Audit log

`logAudit(svcClient, { actor_id, action, target_type, target_id, before, after, cid })` — fire-and-forget insert into `audit_log`.

**When to call**:

- Account deletion (`delete-account`).
- Admin overrides (admin-only UI actions that modify another user's data).
- Subscription state transitions driven by the Stripe webhook.
- Role/permission changes (if added later).
- Any action a regulator or on-call reviewer would want a record of.

**What to include** in `before`/`after`:

- Non-PII operational state. E.g., `{ plan: 'free' }` → `{ plan: 'monthly' }`, `{ is_admin: false }` → `{ is_admin: true }`.
- Never reflection content, prompt text, or full PII blobs.

`audit_log` RLS is admins-only for SELECT. Service role inserts.

## Migration path for legacy functions

The first three functions wrapped as reference implementations: **`health`** (new, trivial), **`journal-prompt`** (AI + dependency calls + rate-limit guard), **`send-feedback`** (user-auth + DB write + email forward + Slack forward).

For the remaining ~35 functions, adopt one per PR using this recipe:

```ts
// Before
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    // ...handler...
  } catch (e) {
    console.error('fn-name error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

// After
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { withRequestLogging } from '../_shared/with-request-logging.ts';
import { EdgeError } from '../_shared/edge-error.ts';
import { logDependencyCall } from '../_shared/deps.ts';

serve(
  withRequestLogging('fn-name', async ({ req, log, cid }) => {
    const body = await req.json().catch(() => ({}));
    if (!body.foo) throw new EdgeError('bad_input', 'foo is required');

    const result = await logDependencyCall(log, 'anthropic', () =>
      fetch('https://api.anthropic.com/v1/messages', { /* ... */ })
    );

    log('success', { id: result.id });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  })
);
```

Wrapper outputs:

- `request` on entry (method, path, cid).
- `response` on success (status).
- `edge_error` on `EdgeError` throw (code, status, message).
- `unhandled_exception` on other throws (message, stack) → Sentry via `captureEdgeError` (with `forceSend: true`).
- CORS + `x-cid` on every outgoing response.

**Prioritization**: tackle user-facing functions (`companion-orchestrate`, `generate-wallpaper`, `record-referral`, `create-checkout`, `delete-account`) first; cron/background functions (`process-email-queue`, `monthly-report`, `weekly-digest`) second. Share helpers and the pattern will converge across the tree.

## Local dev

- Without `LOG_DRAIN_URL` / `SENTRY_DSN_EDGES`, the forwarder + Sentry both no-op. You still get JSON log lines in `supabase functions serve` stdout.
- Edge handlers use the bound **`log`** from **`withRequestLogging`** only — no separate “quiet mode” env for stdout; adjust verbosity in code (fewer hot-path **`log`** calls) or filter in the log UI.
