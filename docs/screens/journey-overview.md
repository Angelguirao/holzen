# Journey overview (`/journey`)

**Route:** `/journey` — single overview screen ([`JourneyOverview.tsx`](../../src/pages/journey/JourneyOverview.tsx)). No stats/badges/activity tabs in the shipped shell.

## Data sources

| UI | Source |
| --- | --- |
| Streak card | [`JourneyStreakCard`](../../src/screens/journey/components/JourneyStreakCard.tsx) + [`fetchPauseInstancesForJourney`](../../src/features/pause/public-queries.ts) (journey query) |
| Completed count | Same query — `state === 'completed'` rows |
| Archive CTA | Link to `/archive` — **no Pro gate** (universal browse) |

## Analytics

- `journey.overview_viewed` — `streak_days`, `completed_pause_count` (see [event-taxonomy.md](../ops/event-taxonomy.md))

## Non-goals (shipped)

- Journey tabs (`/journey/stats`, badges, activity) — **404**; see pre-strip tag `full-ia-pre-strip`
- Stats skills, badges panel, profile gamification

**Manifest:** [active-surface.md](../ops/active-surface.md)
