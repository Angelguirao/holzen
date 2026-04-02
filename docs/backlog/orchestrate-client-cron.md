# Companion orchestration: client vs cron (Pending)

## Context (from Phase 2 and Phase 3)

The manual pause path calls `companion-orchestrate` from the client (`use-companion-data`). Server-side jobs — **`check-volatility`** automatic pause (Phase 3) and related workers — also invoke orchestration for the same `reflectionId` around similar time.

Phase 3 review **confirms** the race: `pause_notifications` can exist and the user can open `/pause` while cron’s fire-and-forget orchestrate is still in flight, so the client may issue a **second** `companion-orchestrate` for overlapping work.

## Current problem

Two independent drivers can invoke `companion-orchestrate` around similar timing:

- **User opens `/pause`** -> client orchestration for reflection `R`.
- **Cron / edge worker** may already be writing companion rows or invoking orchestration for `R`.

## Implications if we leave it as-is

- **Cost**: duplicate AI work if both paths run when one cached result would suffice.
- **Races**: last writer wins on companion rows; usually OK if idempotent, but worth validating.
- **Observability**: hard to tell "who paid for this generation" without logs/metrics.

## Proposed improvement

1. **Measure**: overlap frequency and extra cost (logs/metrics: client vs worker-driven orchestrate for the same `reflectionId`).
2. **Then** consider: stronger cache keys, "skip orchestrate if companion row fresh", or explicit idempotency tokens per reflection + slot.
3. Document the **intended** single owner when both could run (e.g. cron pre-warms, client only fills gaps).
4. **Related**: notification timing vs orchestrate completion — `automatic-pause-notification-timing.md` if we change when "pause ready" appears.

## Related code pointers

- `src/hooks/use-companion-data.ts` - `companion-orchestrate` invoke
- `supabase/functions/companion-orchestrate/index.ts` - server behavior + cache
- Phase 3 review: `docs/reviews/phase-3-server-cron-triggers.md`

## Acceptance criteria / how to verify

1. For a reflection created by automatic trigger, opening `/pause` does not always trigger a full duplicate generation (or duplicate is detected and skipped cheaply).
2. Metrics or logs distinguish client-driven vs worker-driven orchestrate calls (optional but useful).
