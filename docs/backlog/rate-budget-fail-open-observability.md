# Rate and daily budget: fail-open observability (Pending)

## Context (from Phase 5)

`checkRateLimit` and `checkDailyBudget` in `supabase/functions/_shared/ratelimit.ts` return **allow** when their underlying Supabase queries **fail** (fail-open). That favors **uptime** but can **silently weaken** cost controls during DB outages or transient errors.

## Current problem

There is no mandatory **signal** that "limits were not enforced because the check failed" — operators may not notice elevated spend until much later.

## Implications if we leave it as-is

- Budget and rate limits are **best-effort** under infrastructure stress exactly when you might want **stricter** caps.
- Debugging "why did spend spike?" is harder without correlated logs/metrics.

## Proposed improvement

Pick one or combine:

1. **Structured log + metric** when fail-open triggers (count by reason: rate check error vs budget query error).
2. **Alerting threshold**: e.g. if fail-open count > N in 5 minutes, page or Slack.
3. **Policy split** (larger change): keep fail-open for **rate limit** but **fail-closed** for **daily budget** only — product/risk tradeoff.

## Related code pointers

- `supabase/functions/_shared/ratelimit.ts`

## Acceptance criteria / how to verify

1. Fail-open paths are **visible** in dashboards or logs with enough context to correlate with spend.
2. Team agrees whether fail-closed is ever desired for budget vs rate.
