# Featured intervention (quarantined product surface)

**Not shipped** in pause-first UI. The cognitive headline (`InterventionSection`, `MirrorDisplay`, trap/pattern/question block) was removed when Frame became a hub of companion deep-links (`PauseFrame.tsx`).

## What runs today

- **Client (shipped bundle)** — `PAUSE_FEATURED_INTERVENTION_ENABLED` is `false`; no mount-time `browser_pause_intervention` orchestrate call. Active companions use lazy slot fetch + regenerate only.
- **Edge** — `companion-orchestrate` still calls `selectIntervention` when `useIntervention: true` (automation/tests). Default request body sets `useIntervention: false`.

## Code map

| Layer | Location |
|-------|----------|
| Client (legacy) | `src/legacy/pause-featured-intervention/` (`public.ts` barrel) |
| Edge selector + generators | `supabase/functions/legacy/featured-intervention/` |
| Shared market helpers (active) | `supabase/functions/_shared/market-context.ts` (`parseDirection`, `bucketSeverity`) |
| Orchestrator hook | `supabase/functions/companion-orchestrate/index.ts` |
| Docs | `docs/systems/pause/companions/intervention.md` |

**Active `src/` must not import `@/legacy/**`** — only this folder and tests may reference it.

## Re-enable checklist

1. Set `PAUSE_FEATURED_INTERVENTION_ENABLED = true` in `domain/pause-featured-intervention.ts`.
2. Wire `useCompanionInterventionBootstrap` back into `useCompanionOrchestration` (or replace UI).
3. Restore headline UI (or new Reflect-integrated copy).
4. Update `docs/ops/active-surface.md` and `ai-powered-pause-system.md`.
5. Expect extra `companion-orchestrate` cost per pause — see `pause-session-cost-estimates.md`.
