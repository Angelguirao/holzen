# Companion orchestration: client vs cron

## Context

The manual pause path calls `companion-orchestrate` from the client (`use-companion-data`). **`check-volatility`** also POSTs the same function with service role + `userId` (fire-and-forget). Both can target the same `reflectionId` around the same time → possible duplicate work and races.

## Shipped (2026-04) — measure

**Structured invoke log** on every `companion-orchestrate` entry (full + regenerate paths):

- Grep Edge logs for **`orchestrate_invoke`** or **`"holzen_event":"orchestrate_invoke"`**.
- Fields: **`invoke_source`** (caller-supplied), **`auth_mode`** (`user_jwt` | `service_role`), **`reflection_prefix`** (first 8 chars of `reflectionId`), **`regenerate_only`** (slot or `null`).

**Callers set** optional body field **`holzenInvokeSource`**:

| Value | Set by |
|--------|--------|
| `browser_pause` | `use-companion-data` full orchestrate |
| `browser_regenerate` | `use-companion-data` `regenerateCompanion` |
| `cron_check_volatility` | `check-volatility` fetch body |

Omit or unknown values log as **`invoke_source`:** **`unknown`**.

Use log drains to estimate **overlap** (same `reflection_prefix` + both `browser_*` and `cron_check_volatility` close in time).

## Still open

- **Dedup / skip-if-fresh** orchestration when cron already populated companions (see acceptance criteria in original ticket).
- **Idempotency** tokens per reflection + slot (optional).
- Ties to **`automatic-pause-notification-timing.md`** if “pause ready” UX changes.

## Related code

- `supabase/functions/companion-orchestrate/index.ts`
- `src/hooks/use-companion-data.ts`
- `supabase/functions/check-volatility/index.ts`
- `docs/reviews/phase-3-server-cron-triggers.md`
