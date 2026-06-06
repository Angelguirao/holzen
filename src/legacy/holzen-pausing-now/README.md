# Live “pausing now” community stat (legacy)

Pause-first Home market footer shows **“% of users paused today”** only (`HomeMarketCommunityStats`).

This folder preserves the former **live in-ritual** aggregate (`users_pausing_now` / `percent_pausing_now`) and Figma **3.4.4.2** mid-pause copy (“% are pausing now, too”). Do **not** import from active `src/` (`check:active-surface`).

| Artifact | Role |
|----------|------|
| `has-pausing-now-stat.ts` | Visibility helper for live aggregate |
| `home-market-pausing-now-stats.tsx` | Stacked footer line(s) for pausing now |
| `HolzenNumber.tsx` | Legacy full-width / compact widget (now + today) |

Edge + cache unchanged: `holzen-number` / `get_holzen_number()` still returns both fields; active UI ignores `pausing_now`.
