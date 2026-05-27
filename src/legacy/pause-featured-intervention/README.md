# Featured intervention (quarantined product surface)

**Not shipped** in pause-first UI. The cognitive headline (`InterventionSection`, `MirrorDisplay`, trap/pattern/question block) was removed when Frame became a hub of companion deep-links (`PauseFrame.tsx`).

## What still runs today (when `PAUSE_FEATURED_INTERVENTION_ENABLED` is false)

- **Nothing on the client** — no `browser_pause_intervention` orchestrate call on pause mount.
- **Edge** — `companion-orchestrate` keeps `selectIntervention` for `useIntervention: true` callers (automation/tests); default body flag is `false`.

## Code map (active `src/`, not moved yet)

| Layer | Location |
|-------|----------|
| Client fetch | `src/features/pause/presentation/companion/use-companion-intervention-*.ts` |
| Use cases | `src/features/pause/application/use-cases/ritual/frame/*intervention*` |
| Edge selector | `supabase/functions/_shared/intervention-selector.ts` |
| Orchestrator | `supabase/functions/companion-orchestrate/index.ts` (when `useIntervention`) |
| Docs | `docs/systems/pause/companions/intervention.md` |

## Re-enable checklist

1. Set `PAUSE_FEATURED_INTERVENTION_ENABLED = true` in `pause-featured-intervention.ts`.
2. Restore headline UI (or replace with new Reflect-integrated copy).
3. Update `docs/ops/active-surface.md` and `ai-powered-pause-system.md`.
4. Expect extra `companion-orchestrate` cost per pause — see `pause-session-cost-estimates.md`.
