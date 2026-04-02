# Companion orchestration: client vs cron (Pending)

## Context (from Phase 2)

The manual pause path calls `companion-orchestrate` from the client (`use-companion-data`). Server-side jobs (e.g. automatic pause / volatility flows from Phase 3) can also trigger orchestration for the same or overlapping reflections.

## Current problem

Two independent drivers can invoke `companion-orchestrate` around similar timing:

- **User opens `/pause`** -> client orchestration for reflection `R`.
- **Cron / edge worker** may already be writing companion rows or invoking orchestration for `R`.

## Implications if we leave it as-is

- **Cost**: duplicate AI work if both paths run when one cached result would suffice.
- **Races**: last writer wins on companion rows; usually OK if idempotent, but worth validating.
- **Observability**: hard to tell "who paid for this generation" without logs/metrics.

## Proposed improvement (after Phase 3 review)

1. **Measure first**: confirm overlap frequency and cost (Phase 3 traces `check-volatility` and cron).
2. **Then** consider: stronger cache keys, "skip orchestrate if companion row fresh", or explicit idempotency tokens per reflection + slot.
3. Document the **intended** single owner when both could run (e.g. cron pre-warms, client only fills gaps).

## Related code pointers

- `src/hooks/use-companion-data.ts` - `companion-orchestrate` invoke
- `supabase/functions/companion-orchestrate/index.ts` - server behavior + cache
- Phase 3 review: `docs/reviews/phase-3-server-cron-triggers.md`

## Acceptance criteria / how to verify

1. For a reflection created by automatic trigger, opening `/pause` does not always trigger a full duplicate generation (or duplicate is detected and skipped cheaply).
2. Metrics or logs distinguish client-driven vs worker-driven orchestrate calls (optional but useful).
