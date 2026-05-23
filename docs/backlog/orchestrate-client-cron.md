# Companion orchestration: client vs cron

> **Pause V2 supersession:** `check-volatility` **does not** POST `companion-orchestrate` on automatic pause claim. The overlap described below applied to the **pre–V2** cron dispatch; keep for log archaeology and any **non–check-volatility** server callers.

## Context

The manual pause path calls `companion-orchestrate` from the client (`use-companion-data`). **Historically,** `check-volatility` could POST the same function with service role + `userId` (fire-and-forget), so both could target the same `pauseInstanceId` around the same time → duplicate work and races. **Pause V2:** only the **client** path remains for pause claim → companions.

## Shipped (2026-04) — measure + skip-if-served

### Invoke logging

**Structured invoke log** on every `companion-orchestrate` entry (full + regenerate paths):

- Grep Edge logs for **`orchestrate_invoke`** or **`"holzen_event":"orchestrate_invoke"`**.
- Fields: **`invoke_source`** (caller-supplied **`holzenInvokeSource`**), **`auth_mode`**, **`pause_instance_prefix`**, **`regenerate_only`**.

| `holzenInvokeSource` | Set by |
|----------------------|--------|
| `browser_pause_intervention` | `use-companion-data` intervention-only once **`pauseInstanceId`** is set |
| `browser_lazy_fetch` | `use-companion-data` `fetchCompanion` (single slot on card tap) |
| `browser_regenerate` | `use-companion-data` `regenerateCompanion` |
| `cron_check_volatility` | Historical: `check-volatility` fetch body (**removed** Pause V2 automatic claim path) |

### Skip cached (dedup)

After **`selectIntervention`** and computing which generator slots would run, the orchestrator **loads `pause_ai_artifacts`** for the `pauseInstanceId`. If **every** required slot already has valid content (same shape as the client’s `fetchParsedPauseArtifactCache`), it returns **200** with JSON built from those rows, **`source: "cache"`**, and:

- **Does not** run **`generateQuestion`** or companion generators.
- **Does not** charge **rate limit** or **daily budget**.
- **Does not** insert **`intervention_selected`** again.

Grep: **`orchestrate_skip_cached`**.

**Historical (pre–V2):** if a cron worker finished orchestration before the user opened **`/pause`**, the client invoke could become a cheap cache read.

## Optional follow-up

- **Idempotency** tokens per pause + slot.
- **`automatic-pause-notification-timing.md`** if “pause ready” UX should wait on orchestration.

## Related code

- `supabase/functions/companion-orchestrate/index.ts`
- `features/pause/presentation/use-companion-data.ts`
- `supabase/functions/check-volatility/index.ts`
- `docs/reviews/phase-3-server-cron-triggers.md`
