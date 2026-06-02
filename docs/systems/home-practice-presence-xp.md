# Home Presence XP (practice stats)

> **Canonical formula** for Presence XP. **Authority:** Postgres (`pause_compute_practice_xp_awarded`, `pause_finalize_practice_xp`). **Client parity reference:** `compute-pause-practice-xp.ts` (Vitest) — must stay aligned when weights change.

**Screen:** [screens/home.md](../screens/home.md) · **Home glimpse:** `HomePracticeStatTiles` · **Journey drill-down:** `/journey` · **Read API:** `get_practice_summary` RPC

---

## Storage (Postgres)

| Column / object | Role |
|-----------------|------|
| `pause_instances.practice_xp_awarded` | XP for that completed pause (recomputed idempotently) |
| `profiles.practice_presence_xp_total` | Lifetime sum |
| `profiles.completed_pause_count` | Completed instance count |
| `get_practice_summary(user_id)` | Home + Journey read model (+ brief/deep split) |

**When XP is written:** After each `pause_step_events` / qualifying `pause_companion_events` insert, `pause_evaluate_transitions` runs, then `pause_finalize_practice_xp` if the instance is `completed` (includes post-`outcome_logged` `post_pause_emotion_logged`).

Migration: `20260601120000_pause_practice_xp_persistence.sql`.

---

## Per completed pause (formula)

| Component | Value |
|-----------|--------|
| **Base** | **5** XP |
| **Bonus** | Ritual-depth signals (same weights as Done / `sumPauseScoreImpactPoints`) |

| Signal | Bonus |
|--------|-------|
| Breathing completed | +4 |
| Mood shifted toward composure (when no breathing bonus) | +5 |
| Perspective tools used | +2 per tool, max +6 |
| Reflection note or tags | +3 |
| Brief ritual: decision recorded | +2 |
| Brief ritual: entry mood named (when no regulation bonus yet) | +2 |

Typical range: **5–18+** XP per pause.

---

## Client

- **Query:** `PRACTICE_SUMMARY_QUERY_KEY` → `get_practice_summary` (includes `xp_by_signal`).
- **Home:** `useHomePracticeStats` selects `presenceXp` + `completedPauseCount` (ignores breakdown).
- **Journey:** `usePracticeSummary` + `JourneyPracticeXpBreakdown` — Presence, completed, brief/deep, XP-by-signal bars.
- **Invalidate:** `invalidatePauseStatsDataForUser` after pause completes.

**`xp_by_signal` keys:** `base`, `breath`, `mood_regulation`, `tools`, `reflection`, `brief_decision`, `brief_entry_mood` — aggregated in SQL (`20260602120000_practice_summary_xp_by_signal.sql`).

---

## Related

- [journey-practice-stats-evolution.md](../backlog/journey-practice-stats-evolution.md) — future XP-by-signal UI on Journey
- [stats-system.md](stats-system.md) — legacy Holzen Score (not pause-first)
