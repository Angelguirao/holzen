# Companion orchestration: client vs cron

## Context

The manual pause path calls `companion-orchestrate` from the client (`use-companion-data`). **`check-volatility`** also POSTs the same function with service role + `userId` (fire-and-forget). Both can target the same `pauseInstanceId` around the same time → possible duplicate work and races.

## Shipped (2026-04) — measure + skip-if-served

### Invoke logging

**Structured invoke log** on every `companion-orchestrate` entry (full + regenerate paths):

- Grep Edge logs for **`orchestrate_invoke`** or **`"holzen_event":"orchestrate_invoke"`**.
- Fields: **`invoke_source`** (caller-supplied **`holzenInvokeSource`**), **`auth_mode`**, **`pause_instance_prefix`**, **`regenerate_only`**.

| `holzenInvokeSource` | Set by |
|----------------------|--------|
| `browser_pause_intervention` | `use-companion-data` intervention-only on mount |
| `browser_lazy_fetch` | `use-companion-data` `fetchCompanion` (single slot on card tap) |
| `browser_regenerate` | `use-companion-data` `regenerateCompanion` |
| `cron_check_volatility` | `check-volatility` fetch body |

### Skip cached (dedup)

After **`selectIntervention`** and computing which generator slots would run, the orchestrator **loads `pause_ai_artifacts`** for the `pauseInstanceId`. If **every** required slot already has valid content (same shape as the client’s `fetchParsedPauseArtifactCache`), it returns **200** with JSON built from those rows, **`source: "cache"`**, and:

- **Does not** run **`generateQuestion`** or companion generators.
- **Does not** charge **rate limit** or **daily budget**.
- **Does not** insert **`intervention_selected`** again.

Grep: **`orchestrate_skip_cached`**.

Typical win: cron finishes orchestration before the user opens `/pause` — the client’s invoke becomes a cheap DB read.

## Optional follow-up

- **Idempotency** tokens per pause + slot.
- **`automatic-pause-notification-timing.md`** if “pause ready” UX should wait on orchestration.

## Related code

- `supabase/functions/companion-orchestrate/index.ts`
- `src/hooks/use-companion-data.ts`
- `supabase/functions/check-volatility/index.ts`
- `docs/reviews/phase-3-server-cron-triggers.md`
