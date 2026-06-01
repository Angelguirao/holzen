# Hold goal / commitment (quarantined)

**Hold goal** UI (“set your commitment”, target months, price bands) was removed from the pause-first **Home** and **Settings → You** surfaces (2026-06).

It encodes **investment-strategy / hold-duration** semantics that are out of scope for pause-first Holzen ([active-surface.md](../../docs/ops/active-surface.md): celebrate completed pauses, not portfolio targets).

**Active Home anchor card (Wireframes 546:8945):** personal **mantra** + **motivations** (“whys”) only — see `HomeGoalWhyCard`.

**Recovery:** `HoldGoalWidget.tsx` in this folder; wire from `@/legacy/hold-goal/public` only in legacy/full-shell or explicit re-ship PRs (active `src/` must not import `@/legacy/**` per `check:active-surface`).

**Data:** `profiles.hold_goal_*` columns remain for existing users; no active client writes required for MVP.
