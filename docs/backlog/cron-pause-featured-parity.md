# Cron pause: featured fields vs manual path on first paint (Done — 2026-04)

## Context

Automatic pauses from `check-volatility` create `pause_instances` on claim **without** pre-filling companion **`pause_ai_artifacts`**; expanded content arrives from **`companion-orchestrate`** once **`PauseSession`** runs (intervention-only orchestrate once **`pauseInstanceId`** is bound, slots on tap). Manual pauses may arrive with more merged `location.state` from the browser.

## What we shipped

**Client loader priming** in `use-companion-data`: a `useLayoutEffect` keyed on `pauseInstanceId` sets `interventionLoading` and per-pref companion loaders (`signal`, `grounding` / nudge, `history`, `zoomOut`) to **true** before the browser paints when a pause is active. That removes the first-frame gap where hooks initialized `loading` to `false`, so `InterventionSection` and `CompanionSection` did not render skeletons and grounding could look **silently empty** on notification opens.

Existing UI already had skeletons for intervention (`InterventionSection`) and grounding (`LearningInput` when `nudgeLoading`); this change ensures those paths are active on the first painted frame for cron-driven opens.

## Related code pointers

- `src/screens/pause/hooks/use-companion-data.ts` — `useLayoutEffect` loader priming when `pauseInstanceId` is set
- `src/screens/pause/components/CompanionSection.tsx` — intervention + companion cards
- `src/screens/pause/components/LearningInput.tsx` — grounding skeleton while nudge loads
- `supabase/functions/check-volatility/index.ts` — pause instance + profile/notification writes on claim (**V2:** no orchestrate dispatch)
- `docs/reviews/phase-3-server-cron-triggers.md`

## Acceptance (met)

1. Opening `/pause` from a notification right after an automatic pause does not show a **silent** empty featured or grounding area without a loading affordance (skeletons / pulse on cards).
2. After orchestration completes, content **converges** with the manual path for the same prefs (same orchestrate + `pause_ai_artifacts` sources).
