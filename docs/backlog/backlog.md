# Backlog (Pending Improvements)

This folder collects items that we decided *not* to keep inside the phase review docs.

Rule of thumb used here:
- If something is fully addressed and stable, it gets removed from the audit trail doc (not duplicated in backlog).
- If something is still pending, it lives here (either in the category file and/or in this “everything” view).

## Categories

- `auth-referral` — pending auth + referral side-effect robustness items
  - See: `auth-referral.md`
- `route-gating` — auth/routing UX vs correctness tradeoffs
  - See: `route-gating.md`
- `pause-session-hydration` — pause entry contract robustness when navigation state is incomplete
  - See: `pause-session-hydration.md`
- `orchestrate-client-cron` — duplicate work / races between client and cron calling `companion-orchestrate`
  - See: `orchestrate-client-cron.md`
- `reflection-insert-partial-failure` — holzen-reflect succeeds but DB insert fails (manual path)
  - See: `reflection-insert-partial-failure.md`

## Pending items (everything)

- 1. Guaranteed referral delivery (within retry policy) (`auth-referral.md`)
- 2. UX clarity for strict route gating during auth loading (`route-gating.md`)
- 3. Reduce reliance on `location.state` for `/pause` restoration (`pause-session-hydration.md`)
- 4. Client vs cron `companion-orchestrate` overlap — measure, then dedup / cache policy (`orchestrate-client-cron.md`)
- 5. Partial failure: reflect OK, reflection insert fails — clearer error handling or server-side atomic path (`reflection-insert-partial-failure.md`)

