# Rate and daily budget: fail-open observability

**Shipped (2026-04).** Fail-open branches in `ratelimit.ts` now emit **structured JSON** so operators can find “limits not enforced because the check failed” without guessing from generic warnings.

## Context

`checkRateLimit`, `checkDailyBudget`, and `checkCompanionRegenerateLimit` **allow** the request when their Supabase queries throw or return `error` (fail-open for uptime).

## What we did

**`logLimitCheckFailOpen`** in `supabase/functions/_shared/ratelimit.ts` writes one **`console.warn`** line per fail-open:

```json
{
  "holzen_event": "limit_check_fail_open",
  "scope": "rate_limit" | "daily_budget" | "companion_regenerate",
  "phase": "supabase_error" | "thrown",
  "detail": "<message, max 500 chars>",
  "ts": "<ISO8601>"
}
```

**How to verify:** Supabase → Edge Functions → Logs — search **`limit_check_fail_open`** or **`"holzen_event":"limit_check_fail_open"`**. Optionally alert when count &gt; N / window in your log drain.

**Policy:** Still **fail-open** for rate, budget, and regenerate checks (no behavior change to allow/deny). A future change could make budget **fail-closed** only — product/risk call; not implemented here.

## Related

- `docs/ops/logging-strategy.md` — Edge logging surfaces
- `supabase/functions/_shared/ratelimit.ts`
