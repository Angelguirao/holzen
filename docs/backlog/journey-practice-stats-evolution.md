# Journey practice stats — Home glimpse vs canonical overview

**Status:** Shipped (2026-06) — Postgres roll-ups + `get_practice_summary`; Journey shows Presence, completed, brief/deep mix. Home tiles link to `/journey`.

**Shipped today:** migration `20260601120000_pause_practice_xp_persistence.sql`, `get_practice_summary`, `usePracticeSummary`, Journey overview practice section.

**Formula (Presence):** [stats-system.md](../systems/stats-system.md) § Pause-first MVP — Postgres `get_practice_summary`.

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
6. **Postgres when it earns its keep** — see [§ When to add Postgres](#when-to-add-postgres) below (not “never DB”).

**Explicit non-goals:** Holzen Score ring, hold-goal alignment %, badge progress on Home — legacy [`stats-system.md`](../systems/stats-system.md) / `full-shell`.

---

## When to add Postgres

Deferring **derived** roll-ups in the SPA is a **cost / churn** choice, not a product rule. New Postgres is appropriate when at least one of these is true:

| Trigger | Why DB helps |
|---------|----------------|
| **Lifetime totals must be exact** | Client sum over “last 200 instances” is wrong for power users; counter or per-pause snapshot fixes it |
| **Second consumer** | Email digest, cron, admin, future API, Pro leaderboard — needs same numbers without shipping TS to the server |
| **Formula stabilizes** | XP weights stop changing every sprint — safe to persist or to backfill |
| **Performance** | Journey loads full event history on every tab open — aggregation in SQL/RPC is cheaper |
| **Gates or entitlements** | If Presence XP ever unlocks features, store authoritative totals (RLS + RPC), not client math |

**What should be Postgres (user-authored, not derived):**

| Data | Table | Notes |
|------|--------|--------|
| **Thesis / whys text** | `profiles.pause_thesis` (or JSON) | Same pattern as `mantra`, `motivations[]` |
| **Thesis snippets from pause** | `pause_thesis_snippets` or instance metadata | Optional; ritual → identity |

**Recommended shape for derived practice stats (when triggers fire):**

1. **`pause_instances.practice_xp_awarded`** — set when `state → completed` inside the same RPC path that completes the pause (one formula; port TS or compute in trusted RPC).
2. **`profiles.practice_presence_xp_total`** + **`profiles.completed_pause_count`** — denormalized counters updated in that transaction (or reconcile job).
3. **Optional RPC** `get_practice_summary(p_user_id)` — brief/deep counts and XP-by-signal for Journey without re-fetching all step events on the client.

**Anti-patterns:** duplicate XP math in SQL vs TS without shared tests; materialized views that lag until refresh; storing legacy Holzen Score on `profiles` for pause-first.

**Interim (now):** client projection is fine for MVP glimpse + Journey v1 while breakdown UX and XP weights still move ([stats-system.md](../systems/stats-system.md) § “Why client-side today”).

---

## Suggested build order

1. ~~Shared `PracticeStatsSummary` + `get_practice_summary`~~ **Done (2026-06).**
2. ~~Journey UI: variant split on overview~~ **Done**; ~~XP-by-signal section~~ **Done (2026-06)** — `JourneyPracticeXpBreakdown`.
3. ~~Home: tappable tiles → Journey~~ **Done.**
4. Optional: period comparison card (port patterns from legacy `PeriodComparisonCard` in `full-shell`, not the whole Stats stack).

---

## Related

- [screens/home.md](../screens/home.md) — `journey-pulse` section
- [stats-system.md](../systems/stats-system.md) — Pause-first Presence XP
- [active-surface.md](../ops/active-surface.md) — Journey overview shipped; `/journey/stats` dead
