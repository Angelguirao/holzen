# Journey practice stats — Home glimpse vs canonical overview

**Status:** Backlog (2026-06).  
**Shipped today:** Home `journey-pulse` row ([`HomePracticeStatTiles`](../../src/screens/home/components/HomePracticeStatTiles.tsx)) shows **Presence** (sum XP) + **Pauses** (completed count). Journey [`JourneyOverviewScreen`](../../src/screens/journey/JourneyOverviewScreen.tsx) shows **streak** + **completed count** + Archive CTA — overlapping but not yet the drill-down.

**Formula (Presence):** [home-practice-presence-xp.md](../systems/home-practice-presence-xp.md) — client projection from `pause_instances` + `pause_step_events` + companion completes.

---

## Product intent (long term)

| Surface | Role | Density |
|---------|------|---------|
| **Home** (`journey-pulse`) | **Glimpse** — two numbers that reward return visits; tap → Journey | Low (2 tiles max) |
| **Journey** (`/journey`) | **Practice overview** — how you pause over time | High (breakdowns, trends, streak) |
| **Archive** | **Corpus** — individual pauses and echoes | Row-level history |
| **Pause Done** | **Moment** — qualitative impacts for *this* ritual | One pause only |

Home must **not** grow into a second Stats tab. Anything that needs explanation (brief vs deep, XP by signal, weekly rhythm) belongs on **Journey**, with Home linking there.

---

## Presence (XP) — evolution

**Today:** one lifetime total (sum over completed pauses, capped fetch window for XP sum).

**Journey candidates** (same underlying events, richer projection):

| Slice | Source | UX sketch |
|-------|--------|-----------|
| **By ritual depth** | `resolveHomePracticeRitualVariant` / step events | Brief vs deep totals + % of practice |
| **By signal** | Same weights as Done / Presence | Breath, mood shift, tools, reflection, brief decision — bar or list “where your XP came from” |
| **By period** | `engaged_at` / completed timestamps | This week vs last week (reuse streak calendar patterns) |
| **Lifetime** | Same as Home | Hero number on Journey; Home shows abbreviated |

**Architecture:** one **domain projector** in `features/pause/` (or `features/journey/` if Journey owns all practice read models) e.g. `buildPracticePresenceSummary(userId)` returning `{ lifetimeXp, byVariant, bySignal, … }`. Home and Journey both **select** from it; Home passes `pickHomeGlimpse(summary)`.

---

## Pauses (count) — evolution

**Today:** exact `state = completed` count (Home + Journey duplicate display).

**Journey candidates:**

| Slice | Source | UX sketch |
|-------|--------|-----------|
| **By variant** | brief vs deep classification on instances | “12 deep · 8 brief” |
| **By source** | `pause_instances.source` | Manual vs auto-check (if user-facing) |
| **By outcome** | `outcome_logged` / Decide | Held / bought / sold / waited — **descriptive**, not scored as “good trader” |
| **Streak / calendar** | Already on `JourneyStreakCard` | Keep as primary rhythm metaphor |

Home keeps **one** number (total completed). Journey shows **composition** + streak.

---

## Engineering best practices (Holzen)

1. **Truth stays event-sourced** — Postgres records instances + step events; derived metrics remain projections ([client-server-architecture.md](../fundamentals/client-server-architecture-holzen.md)).
2. **One formula module** — extend `compute-pause-practice-xp.ts` / siblings; do not fork Home-only math.
3. **TanStack Query** — single query key family e.g. `practiceStats(userId)` consumed by `useHomePracticeStats` and `useJourneyPracticeOverview`; Home uses `select` for glimpse fields.
4. **Rename when ready** — Customize id `journey-pulse` is historical; optional rename to `practice-glimpse` in a migration PR with storage key note.
5. **Deep links** — Home tiles should navigate to `/journey` (hash or section ref when Journey sections exist); footnote copy: “See breakdown in Journey”.
6. **Server later** — RPC only when a **second consumer** needs the same roll-up (email, leaderboard, anti-tamper); until then client aggregation from bounded instance fetch is acceptable (document cap like Presence doc §200).

**Explicit non-goals:** Holzen Score ring, hold-goal alignment %, badge progress on Home — legacy [`stats-system.md`](../systems/stats-system.md) / `full-shell`.

---

## Suggested build order

1. Shared `PracticeStatsSummary` type + query in `features/pause/` (refactor `fetchHomePracticeStats` upward).
2. Journey UI: variant split + XP-by-signal section (read-only).
3. Home: tappable tiles → Journey; align copy (“completed pauses” not investment “held”).
4. Optional: period comparison card (port patterns from legacy `PeriodComparisonCard` in `full-shell`, not the whole Stats stack).

---

## Related

- [screens/home.md](../screens/home.md) — `journey-pulse` section
- [home-practice-presence-xp.md](../systems/home-practice-presence-xp.md)
- [active-surface.md](../ops/active-surface.md) — Journey overview shipped; `/journey/stats` dead
