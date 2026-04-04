# Rate limit: analytics event allowlist parity

**Shipped (2026-04).** Sliding-window rate limiting now aligns with real companion AI work: generators and question mode emit allowlisted rows; the allowlist is a single exported constant with an inline inventory.

## What was wrong

`checkRateLimit` counted only specific `analytics_events.event` values, but **`signal_companion_ai_call`**, **`zoom_out_ai_call`**, and **`historical_insight_ai_call`** had **no insert paths** after the in-process generator refactor — companion orchestration could run many live generations without incrementing the sliding window.

Grounding (**`ground_nudge`**) live generations were also uncounted. Question-mode AI (**`generateQuestion`**) had no matching event.

## What we did

1. **`CHECK_RATE_LIMIT_ANALYTICS_EVENTS`** in `supabase/functions/_shared/ratelimit.ts` — single source of truth; `checkRateLimit` uses `[...CHECK_RATE_LIMIT_ANALYTICS_EVENTS]`.
2. **Table comment** in that file: each event → where it is inserted.
3. **`trackEvent`** on the **live** path only (when `userId` is present):
   - `generators/signal.ts` → `signal_companion_ai_call`
   - `generators/history.ts` → `historical_insight_ai_call`
   - `generators/grounding.ts` → `ground_nudge_ai_call` (**new** allowlist member)
   - `generators/zoom-out.ts` → `zoom_out_ai_call` when deep-time source is `live`
   - `companion-orchestrate` → `intervention_question_ai_call` (**new**) when `generateQuestion` returns a non-empty string

Still **not** counted (by design): `intervention_selected`, `reflection_generated`, fallbacks, feedback, etc.

## Follow-up (optional)

- **Unit test** (Deno) that imports `CHECK_RATE_LIMIT_ANALYTICS_EVENTS` and fails if a generator references a string not in the list — not added yet (no Deno in CI path here).

## Related code

- `supabase/functions/_shared/ratelimit.ts`
- `supabase/functions/_shared/observe.ts` (`trackEvent`)
- `supabase/functions/_shared/generators/{signal,history,grounding,zoom-out}.ts`
- `supabase/functions/companion-orchestrate/index.ts`
