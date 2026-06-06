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

**Schema (Jun 2026):** `profiles.cumulative_threshold` dropped in migration `20260608120000_drop_profiles_cumulative_threshold.sql`. Historical `pause_instances.context_snapshot.change_7d_pct` may still exist on old rows.

**Fingerprints:** `computeContextFingerprint` no longer includes a cumulative bucket (`cb` removed); daily-only regime keys only.
