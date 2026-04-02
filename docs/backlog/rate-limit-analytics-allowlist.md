# Rate limit: analytics event allowlist parity (Pending)

## Context (from Phase 5)

`checkRateLimit` in `supabase/functions/_shared/ratelimit.ts` counts only **specific** `analytics_events.event` values. Paths that generate AI output but **do not** insert a matching event are **not** counted toward the sliding window.

## Current problem

Allowlist drift: generator refactors can stop emitting an event, or emit a **renamed** event — effective rate limit becomes **looser** than intended without a code change to `ratelimit.ts`.

## Implications if we leave it as-is

- Higher spend and abuse surface than product assumes from "30 per hour" style limits.
- Hard to debug: limits look correct in code but telemetry is incomplete.

## Proposed improvement

1. **Inventory** every generator path that should participate in rate limiting and assert it emits the expected event (tests or checklist).
2. **Document** the allowlist next to `checkRateLimit` or in Phase 5 review doc.
3. Optional: **unit test** that `ratelimit` allowlist matches the set of events emitted by `companion-orchestrate` (or document exceptions).

## Related code pointers

- `supabase/functions/_shared/ratelimit.ts`
- Companion generators and `companion-orchestrate` (Phase 2-4 review context)

## Acceptance criteria / how to verify

1. For each allowlisted event, at least one code path exists that inserts it on the corresponding generation.
2. Renaming or adding a generation path updates the allowlist or is explicitly excluded with rationale.
