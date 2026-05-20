# Stats System

> **Not in shipped pause-first scope (2026-05).** Reference implementation: git tag `full-ia-pre-strip` or `src/legacy/full-shell/`. Shipped surface: [active-surface.md](../ops/active-surface.md).

> **Status:** the "Recommended target model (skills-first)" at the bottom of
> this doc is **shipped**. `Profile > Stats` renders
> [`StatsContentV2`](../../src/legacy/full-shell/src/components/stats/StatsContentV2.tsx) with all
> 13 deep-dive / Journey / Advanced cards, reading exclusively from
> `v_pause_full` + `pause_step_events` + `pause_companion_events`.
> **Holzen + skill values are computed client-side on read** — see **Pause V2 — data flow and where scores are computed** below. Pause lifecycle narrative: [`pause-system.md`](pause-system.md).
>
> The "Current App Order" section below is retained as historical context —
> it describes the legacy layout that ran on `reflections` and was removed
> in the Pause V2 cutover.

## Pause V2 — data flow and where scores are computed (authoritative)

### Source of truth (Postgres)

Pause lifecycle and ritual signals live in **`pause_instances`**, **`pause_step_events`**, **`pause_companion_events`**, and the read-model view **`v_pause_full`** (extended as migrations add columns). There is **no** trigger or materialized column that writes Holzen Score or per-skill numbers at `completed` time.

### Read path and client-side aggregation

- **Legacy full shell only:** [`usePauseStatsData`](../../src/legacy/full-shell/src/hooks/use-pause-stats-data.ts) loads one **TanStack Query** bundle per user: `v_pause_full` (bounded) + `pause_step_events` + `pause_companion_events` via [`fetchPauseStatsData`](../../src/legacy/full-shell/src/lib/pause-stats-data-query.ts). Journey → Stats and badges reused this cache in full IA — **not** pause-first Home/Journey overview.
- **Holzen Score and the five skill values** are computed **in the browser on read** by [`computePauseScore`](../../src/lib/stats/pause-score.ts) from that bundle (e.g. [`SkillOverviewCard`](../../src/legacy/full-shell/src/components/stats/SkillOverviewCard.tsx), [`HomeStatTiles`](../../src/legacy/full-shell/src/components/home/HomeStatTiles.tsx) in legacy).
- After a pause reaches **`completed`** (legacy paths), [`invalidatePauseStatsDataForUser`](../../src/lib/pause-stats-invalidate.ts) **invalidates** the pause-stats query key. Pause-first shipped UI uses qualitative [`ScoreImpact`](../../src/screens/pause/components/ScoreImpact.tsx) on Done — not Journey stat tiles.
- **Brief ritual done** (shipped [`PauseDone`](../../src/screens/pause/components/PauseDone.tsx) + [`ScoreImpact`](../../src/screens/pause/components/ScoreImpact.tsx); full-IA badge recap in legacy [`PauseDoneBriefJourneyRecap`](../../src/legacy/full-shell/src/components/pause/PauseDoneBriefJourneyRecap.tsx)): qualitative hints via `buildPauseScoreImpacts` — reasons only, no fake +N. Numeric roll-ups lived in Journey → Stats (not shipped).

### Why client-side today (and what “move to server” usually means)

- **Single formula in TypeScript** (`pause-score.ts`) stays aligned with the Stats UI without maintaining parallel SQL.
- The database stays **event-sourced**: it records what happened; derived metrics remain ephemeral until a second consumer needs them (e.g. public API, email digest, anti-tamper surfaces).
- A **Postgres trigger** that writes score columns would still duplicate formula ownership (SQL vs app) or call out to an edge — it does not remove the need for one canonical implementation.
- A practical server step, when needed, is usually an **RPC or Edge Function** that runs the **same** scoring logic (shared or ported module) for non-SPA consumers — not necessarily triggers.

## Current App Order (legacy, removed in Pause V2)

This document explains the metrics shown **before the Pause V2 cutover** in `Profile > Stats`, in the same order the UI rendered them.

## Legacy counting rules (pre-V2)

The legacy Stats panel mixed multiple counting bases in the `reflections` table:

1. **Generated pause**: any row in `reflections` (table removed in Pause V2).
2. **Completed pause**: `outcome` is set (used by most score/trend metrics).
3. **Full ritual pause**: breathing + mood + mood_after + outcome (used selectively).

Where possible, time bucketing uses `engaged_at` (via `pauseTimestamp`) so delayed engagement is placed in the day/week when the user actually acted.

---

## 1) Hero card (top of Stats tab)

### 1.1 Holzen Score ring (`0-100`)

Computed from the last 30 completed pauses using 5 skill dimensions:

- **Emotional Regulation**: entry mood → after-mood improvement (after = latest `post_pause_emotion_logged` or `shift_emotion_logged`) + breathing bonus
- **Distress Tolerance**: outcome quality under volatility context
- **Decision Alignment**: alignment to hold-goal strategy (only when hold goal exists)
- **Cognitive Reappraisal**: use of perspective companions (zoom/history/signal/grounding)
- **Self-Awareness**: note depth, tags, favorite, full pause completion signals

If no hold goal exists, decision-alignment weight is redistributed across the other four dimensions.

### 1.2 Micro stat: `Pauses`

- **Value**: `engagedCount` = number of full ritual pauses (`breathing_completed && mood && mood_after && outcome`).
- **Context text**:
  - if generated > engaged: shows "`X generated`"
  - otherwise: shows elapsed time context since first pause (`d/w/mo`)

### 1.3 Micro stat: `Active`

- Distinct active days in the last 30 days from:
  - reflection days, plus
  - practice-entry days

### 1.4 Micro stat: `Practice`

- Distinct practice days during the current month.

### 1.5 Micro stat: `Trend`

- Trend arrow derived from Holzen Score trend:
  - `↑ improving`, `→ stable`, `↓ declining`
- Trend is based on recent vs older composure trajectory in `use-holzen-score`.

### 1.6 Skill bars (under score ring)

Order shown:

1. Regulation
2. Tolerance
3. Alignment (only if hold goal exists)
4. Reappraisal
5. Awareness

Each bar displays a `0-100` value from the score model above.

---

## 2) Section: Your Journey

## 2.1 Streak timeline widget

### 2.1.1 28-day heatmap statuses

Per day status priority:

- `outcome`: at least one completed pause
- `practice`: practice activity but no completed pause
- `freeze`: streak-freeze day
- `empty`: no activity
- `pre`: before signup

### 2.1.2 Current streak

Consecutive active days (completed pauses + practice + freeze days), counting from today/yesterday backwards.

### 2.1.3 Longest streak

Maximum historical consecutive-day streak from all active-day sources.

### 2.1.4 Milestone progress bar

Progress from current streak to next milestone in `[3, 7, 14, 30, 60, 100]`.

### 2.1.5 Expanded calendar metrics (when expanded)

Day detail shows:

- pause count
- letter count
- badge count
- practice count
- mood distribution for that day (for reflection items)

## 2.2 Milestone timeline

Chronological milestones (most recent first), including:

- first pause
- first calm exit (`mood_after` in calm/detached)
- first hold (`held` or `nothing`)
- highest reached pause-count milestone (`5/10/25/50/100/250/500`)
- longest streak milestone (>=3 days)
- first practice
- first letter written
- first letter delivered

---

## 3) Section: Progress (Pro)

## 3.1 Period Comparison card

Toggle: weekly or monthly.

Rows shown in this order:

1. **Pauses**: completed-pause count
2. **Hold rate**: `% held|nothing` among completed
3. **Calm exits**: `% with calm/detached mood_after` among completed with mood_after

Each row shows previous period, current period, and delta.

## 3.2 Weekly Trends card group

### 3.2.1 Score Over Time

- Weekly skill-weighted score (`0-100`) from completed pauses.
- Badge shows first-vs-last score delta.

### 3.2.2 Regulation Opportunity

- Stacked share of:
  - high-regulation-needed moments (reactive mood)
  - low-regulation-needed moments
- Also tracks `% navigated` when high-regulation moments occur.

### 3.2.3 Hold Rate

- Weekly hold-or-nothing percentage trend.

Unlock condition: at least 3 weekly buckets.

## 3.3 Practice Activity card

Shows:

- total practice sessions
- total practice minutes (if durations exist)
- last 8-week bar sparkline
- per-practice-type counts (`checkin`, `journal`, `bodyscan`, `replay`, etc.)

---

## 4) Section: Decision Making (Pro)

## 4.1 Decision Quality

Requires >=3 reflections with outcomes.

Metrics shown:

- with-pause hold rate (any companion engaged)
- without-pause hold rate (no companion engagement)
- delta insight text (if both cohorts have enough data)
- trend label (`improving/stable/declining`) from first-half vs second-half hold rate
- optional companion breakdown:
  - breathing, haiku, grounding, signal, zoom out, history
  - each with usage count and hold-rate vs baseline delta

## 4.2 Decision Accuracy (retired)

> **Pause V2 note:** the `follow_ups` table was dropped in the V2
> destructive cutover, so the legacy Decision Accuracy card no longer
> has a backing data source. It has been removed from the Profile UI.

## 4.3 Volatility Tolerance

Uses drop events parsed from reflection `context` (`down X%`).

Shows:

- overall volatility score ring (`0-100`)
- qualitative grade:
  - iron hands / steady / shaky / paper hands
- bucket rows:
  - mild dips (`0-3%`)
  - moderate drops (`3-6%`)
  - heavy drops (`6%+`)
- each bucket includes:
  - event count
  - composure label (reactive/mixed/composed)
  - hold rate within bucket when outcome exists

Unlock condition: at least 3 drop events.

---

## 5) Section: Deep Patterns (Pro)

## 5.1 Regulation Effect (Mood Shift Chart)

- Weekly `delta = avg(mood_after_score) - avg(mood_score)`
- Positive values indicate improved composure after pause.
- Shows average shift badge + session count.

Unlock condition: at least 2 weekly buckets with both mood checks.

## 5.2 Mood Trend

- Average mood score over time (`1..5`) with daily/weekly toggle.
- Trend state from first-vs-last average (`improving/stable/declining`).

Unlock condition: at least 3 data buckets.

## 5.3 Mood x Price Change

For each mood label:

- average BTC context change (`%`) when that mood was logged
- sample count per mood
- correlation summary `r` + weak/moderate/strong strength

Unlock condition: enough mood+context pairs to form at least 2 mood groups.

## 5.4 Mood x Price Scatter

- Each point = one reflection (`x = BTC % change`, `y = mood score 1..5`)
- Includes neutral reference lines (`x=0`, `y=3`)
- Optional auto insight comparing dominant mood in negative vs positive moves

Unlock condition: at least 8 points with both mood and context.

---

## Outcome scoring matrix

This is the canonical mapping from a completed pause's `outcome` (recorded by the Decide step — see [pause-system.md](pause-system.md) §6) to per-skill values in [src/lib/stats/pause-score.ts](../../src/lib/stats/pause-score.ts). The scoring model deliberately treats `bought` as **context-aware** so a dip-buy (during a `down` move) and a chase-buy (during an `up` move) do not look identical to the score.

`pctAbs` is the absolute 24h or 7d price change pulled from `pause_instances.context_snapshot` (see `parseVolatility`); `direction` is the sign of the same value (`up`, `down`, or `flat`). `tier` is a short scale based on `pctAbs`:

| `pctAbs` range | `tier` | Conceptual label |
| ---------- | ------ | ---------------- |
| `< 3%`     | 1.0    | mild             |
| `3% – 7%`  | 1.5    | moderate         |
| `>= 7%`    | 2.0    | severe           |

### Distress Tolerance — outcome × tier × direction

| `outcome`         | Formula                                  | mild (tier 1) | moderate (tier 1.5) | severe (tier 2) |
| ----------------- | ---------------------------------------- | ------------- | ------------------- | --------------- |
| `held`            | `min(100, 60 + tier * 20)`               | 80            | 90                  | 100             |
| `bought` + `down` | `min(100, 50 + tier * 10)` (dip-buy)     | 60            | 65                  | 70              |
| `bought` + `up`   | `max(0, 50 - tier * 10)` (chase-buy)     | 40            | 35                  | 30              |
| `bought` + `flat` | `45` (legacy fallback)                   | 45            | 45                  | 45              |
| `sold`            | `max(0, 40 - tier * 15)`                 | 25            | 17.5                | 10              |
| anything else (incl. legacy `nothing`) | `50` (catch-all)            | 50            | 50                  | 50              |

### Decision Alignment — outcome × hold-goal type

Only applied when the user has configured a hold goal. The values below are the per-row scores; the card averages across the recent completed window.

| `outcome`                              | Hold goal `forever` | Hold goal time / price |
| -------------------------------------- | ------------------- | ---------------------- |
| `held`                                 | 100                 | 100                    |
| `bought`                               | 60                  | 50                     |
| `sold`                                 | 15                  | 20                     |
| anything else (incl. legacy `nothing`) | 50 (catch-all)      | 50 (catch-all)         |

### Why `nothing` falls through to neutral

Historical `pause_step_events` rows may still carry `outcome = "nothing"` from a prior product iteration where a fourth "abstain" choice existed in the UI. The live `PauseDecide` flow no longer emits that value, and migration [supabase/migrations/20260519120000_pause_log_step_main_outcome_validation.sql](../../supabase/migrations/20260519120000_pause_log_step_main_outcome_validation.sql) now rejects it server-side. To avoid retroactively reclassifying historical rows, scoring treats `nothing` as the catch-all neutral 50 (it does **not** count toward tolerance or alignment ladders, and the `held` and `bought`/`sold` numbers above stay clean). Badges follow the same rule via `HOLD_OUTCOMES = new Set(['held'])` in [src/lib/badges/compute.ts](../../src/lib/badges/compute.ts).

---

## Notes for maintainers (Pause V2)

- Stats tab layout (legacy): [`StatsContentV2`](../../src/legacy/full-shell/src/components/stats/StatsContentV2.tsx) and `src/legacy/full-shell/src/components/stats/`.
- Holzen + five skills: [`src/lib/stats/pause-score.ts`](../../src/lib/stats/pause-score.ts) (`computePauseScore`).
- Data loader + cache keys (legacy): [`src/legacy/full-shell/src/hooks/use-pause-stats-data.ts`](../../src/legacy/full-shell/src/hooks/use-pause-stats-data.ts), [`src/legacy/full-shell/src/lib/pause-stats-data-query.ts`](../../src/legacy/full-shell/src/lib/pause-stats-data-query.ts).
- Shared pause-count / “engaged” semantics where still used: [`src/lib/engaged-pause.ts`](../../src/lib/engaged-pause.ts).
- Legacy `use-holzen-score` / `reflections` paths were removed at the Pause V2 cutover.

---

## Recommended target model (skills-first)

Yes: target organization should revolve around the five core skills as much as possible.

## A) Target information architecture

Keep Stats in this order:

1. **Skill Overview** (single glance)
2. **Skill Deep Dives** (one card per skill)
3. **Journey & Consistency** (supporting context)
4. **Advanced patterns** (optional, collapsed by default)

This makes the skills the primary lens, and everything else secondary context.

## B) Skill Overview (top card)

One unified card with:

- overall Holzen Score
- 5 skill bars in fixed order:
  1. Regulation
  2. Tolerance
  3. Alignment
  4. Reappraisal
  5. Awareness
- trend chip per skill (up/stable/down vs prior window)
- confidence chip per skill (high/medium/low sample reliability)

## C) Skill Deep Dives (recommended cards)

Map each current metric family into one skill owner:

### C.1 Regulation

- Keep: Mood Shift chart, Mood Trend
- Add: "Reactive -> Composed conversion rate"
- Remove from default view: duplicate mood scatter (move to Advanced)

### C.2 Tolerance

- Keep: Volatility Tolerance card
- Keep: hold/nothing during drops by bucket
- Add: "High-volatility hold rate" as headline metric

### C.3 Alignment

- Keep: hold-goal alignment logic when hold goal exists
- Fallback when no hold goal: show "Not configured" state, not a synthetic score bar
- Add CTA: configure hold goal from card

### C.4 Reappraisal

- Keep: companion-engagement effect from Decision Quality
- Change: show as one normalized "Perspective tools impact" metric
- Add: per-tool marginal lift only if sample threshold is met

### C.5 Awareness

- Keep: notes/tags/favorites + completion signals
- Add: "reflection depth score" breakdown (notes, tags, revisit behavior)

## D) Journey & Consistency (supporting section)

Keep, but explicitly mark as supporting:

- streak timeline
- milestones
- practice activity
- period comparison

These should not compete visually with skill cards.

## E) Metrics to de-emphasize or relocate

- Move Mood x Price Scatter to Advanced by default.
- Keep Mood x Price Change in Advanced unless user has enough data confidence.
- Keep Decision Accuracy, but frame as "Outcome stability" under Tolerance/Alignment context.

## F) Common rules for all skill cards

- Show formula summary in plain language.
- Show denominator and sample size.
- Show last-updated window (for example last 30 completed pauses).
- Hide or gray cards below minimum reliability threshold.

## G) Suggested phased rollout

### Phase 1 (quick wins)

- Re-label sections to skills-first wording.
- Keep existing computations, just remap UI grouping to skill ownership.
- Add confidence/sample chips.

### Phase 2 (model cleanup)

- Centralize volatility parsing and trend logic.
- Ensure all time-bucketing uses `pauseTimestamp`.
- Normalize denominators across cards.

### Phase 3 (advanced)

- Add per-skill confidence scoring and variance-aware trend detection.
- Add adaptive recommendations ("best next action to improve weakest skill").