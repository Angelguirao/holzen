# Automatic pause: notification vs orchestrate ordering (Pending)

## Context (from Phase 3)

`check-volatility` persists the reflection, inserts `pause_notifications`, then dispatches `companion-orchestrate` with **fire-and-forget** (`fetch` without awaiting). Users can see "pause ready" and open `/pause` before every companion slot is written.

## Current problem

There is a **design choice**, not a single bug: when should the product tell the user the pause is "ready" relative to companion orchestration finishing?

- **Today**: notification appears after reflection + notification rows exist; orchestrate runs asynchronously.
- **Alternative A**: delay notification until orchestrate completes (or fails).
- **Alternative B**: keep current timing but **enrich** the notification (or client payload) so the first screen is usable without waiting for companion rows.

## Implications if we leave it as-is (fire-and-forget)

- **Time window**: featured fields on `reflections` (e.g. grounding) may still be null when the user lands on `/pause` from a notification.
- **Duplicate orchestrate**: client may invoke orchestrate while cron is still running — see `orchestrate-client-cron.md`.
- **Faster** user feedback at the cost of **eventual consistency** for full companion data.

## Proposed options (pick based on product priority)

1. **Keep fire-and-forget** (current): rely on client loading states, cache, rate limits; measure cost via `orchestrate-client-cron.md` follow-up.
2. **Await orchestrate before `pause_notifications`**: fewer races and less duplicate client work; **slower** notifications and higher tail latency if orchestrate is slow or overloaded.
3. **Enrich `pause_notifications` (or reflection row) before notify**: duplicate some copy into the notification payload so the bell or first paint has enough text without waiting for all companion tables; **more** fields to keep consistent.

## Related code pointers

- `supabase/functions/check-volatility/index.ts` — order of inserts and orchestrate dispatch
- `docs/reviews/phase-3-server-cron-triggers.md` — conclusions and tradeoffs

## Acceptance criteria / how to verify

1. The team documents the **chosen** policy (speed vs consistency vs payload duplication).
2. If policy changes, notification timing and user-visible loading states are tested for "open immediately after notification" flows.
