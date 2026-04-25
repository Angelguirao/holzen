# Automatic pause: notification vs orchestrate ordering (Done — 2026-04)

## Chosen policy

**Keep fire-and-forget** (`check-volatility` creates the pause instance + `pause_ai_artifacts` and relies on the `notifications` trigger, then dispatches `companion-orchestrate` without awaiting). Rationale:

- Faster “pause ready” in the bell; users are not blocked on orchestrate tail latency or overload.
- **Duplicate / overlapping orchestrate** when the client opens `/pause` immediately is acceptable when mitigated by cache + skip-if-served (`orchestrate_skip_cached` — see `orchestrate-client-cron.md`).
- Alternatives (await orchestrate before notify, or duplicate copy into the notification payload) remain documented below if product priorities change.

## Implications (accepted)

- Featured artifacts may still be filling when the user lands on `/pause`; the client must show **loading** for intervention and companion cards until data exists (see `cron-pause-featured-parity.md`).

## Historical options (not selected)

1. **Await orchestrate before notifications**: fewer races; slower notifications and higher tail latency.
2. **Enrich the notification payload (or pause artifacts) before notify**: faster first paint without DB reads; more fields to keep consistent.

## Related code pointers

- `supabase/functions/check-volatility/index.ts` — order of inserts and orchestrate dispatch
- `docs/reviews/phase-3-server-cron-triggers.md` — mental model and tradeoffs

## How to verify

1. After a volatility trigger, open the pause notification **immediately**: reflection text + ritual should load; featured/companion areas show skeletons or content, not a silent empty state (`use-companion-data` loader priming + existing `InterventionSection` / `LearningInput` skeletons).
