# 7-day cumulative volatility (legacy)

Pause-first active surface uses **24h directional thresholds only** for auto-pause, Home range copy, and settings.

This folder preserves the former **7-day cumulative** helpers and tests for reference or Tier B re-ship. Do **not** import from active `src/` (`check:active-surface`).

| Artifact | Role |
|----------|------|
| `volatility-thresholds-cumulative.ts` | Client mirror of edge legacy cumulative gating |
| `pause-context-cumulative.ts` | Optional 7d sentence appended to pause context |
| `market-volatility-range-status-cumulative.ts` | Home footer `cumulative` axis projection |
| `*.test.ts` | Archived unit tests |

Edge mirror: `supabase/functions/_shared/legacy/volatility-thresholds-cumulative-legacy.ts`.

DB column `profiles.cumulative_threshold` remains for data compatibility; active UI no longer reads or writes it.
