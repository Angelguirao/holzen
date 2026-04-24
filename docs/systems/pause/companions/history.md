# History companion (end-to-end)

> **Pause V2 note:** this document predates the Pause V2 cutover and
> still describes the legacy `reflections` / `reflection_companions`
> model. The canonical runtime now lives on `pause_instances` + event
> tables + `pause_ai_artifacts`. See [`pause-system.md`](../../pause-system.md)
> for the current data flow; the per-companion pages below are retained
> for historical context until each is rewritten.
>


**History** (UI label: **Look Back**) is the pause **card** that surfaces a **historical insight**: a past event from Bitcoin or traditional finance that mirrors the current market situation, with a cross-asset analogy to provide perspective.

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.10** History reference table).

---

## 1. Where History sits in the pipeline

1. User completes reflection; when the user **taps the Look Back card**, **`use-companion-data`** invokes **`companion-orchestrate`** with `enableHistory: true` (lazy loading). If History data is already cached in `reflection_companions`, it is hydrated from DB without a network call.
2. **`companion-orchestrate`** runs **`generateHistory`** in `_shared/generators/history.ts` when **`enableHistory`** is true (or when the intervention **requires** it — pattern type), passing **context**, **session intent** (`preferredMood`), and **recency dedup** fields.
3. **`generateHistory`** returns structured History payload; the orchestrator **writes** **`reflection_companions`** (type `historical_insight`) and **`companion_serves`**.

History also serves as the **data source for pattern interventions**: when `selectIntervention` picks pattern, the orchestrator copies the history task result into `intervention.primary`.

---

## 2. Client → edge inputs

| Input | Source | Role |
|--------|--------|------|
| **`recentNudgeTopics`** | Recent history titles from `reflection_companions` + `localStorage` | Dedup: avoid repeating same historical eras/events. |
| **`context`** | BTC + Fear & Greed + on-chain line | Grounds the era selection in the current market move. |
| **`preferredMood`** | `determineSessionIntent()` → **`historyMood`** (`session-intent.ts`) | Selects recovery vs cautionary vs neutral historical eras. |
| **`mood`** | Current session mood | Maps to `historyMoodTag` for era filtering. |

---

## 3. Server pipeline (`history.ts`)

High-level order (source of truth: **`supabase/functions/_shared/generators/history.ts`**, **`PROMPT_VERSION`** v3):

**Phase 1: Library** — `searchLibrary` checks `content_library` (type `event`) for fresh historical events this user hasn't seen within `COMPANION_SERVE_FRESHNESS_DAYS` (30 days). Converts via `eventToHistory` with mood tag awareness. If found, returns immediately (`source: "library"`).

**Phase 2: Cache (strict + prompt-version pinned)** — `serveFromCache` with `strict: true` AND `promptVersion: "v3"` checks `companion_cache` for fresh, quality-≥-2 rows with per-user dedup, market direction awareness, and a `prompt_version = "v3"` filter (added migration `20260418180000_companion_cache_prompt_version.sql`). Pre-v3 rows written by earlier prompt revisions are invisible to reads, so they won't be served even after cache eviction of newer rows. If found, returns (`source: "cache"`). If the strict pool is empty it returns `null` and emits `cache_strict_miss` (Edge log) so the flow falls through to Phase 3 instead of recycling seen rows.

**Phase 3: Live generation** (if phases 1–2 miss):

1. **Mood mapping** — `anxious`/`fearful` → `recovery` tag; `excited`/`fomo`/`greedy` → `caution` tag; else `undefined`.
2. **Era selection** — `pickEra` in `_shared/history-util.ts` selects from **22 predefined historical eras**, each tagged with a mood (`recovery`, `caution`, `neutral`) and a list of distinctive `keywords`. Three-step fallback: (1) mood-matched AND not recently seen by keyword, (2) **any** era not recently seen (preference → fallback, not a hard filter), (3) full pool at random. Dedup is **keyword-anchored**: an era is "recently seen" only if one of its short keyword anchors (`"march 2020"`, `"ftx"`, `"mt. gox"`, etc.) appears as a substring of a recent card title. This replaces the earlier descriptor-text substring check which almost never fired.
3. **Perplexity (`sonar-pro`)** — Web search for specific historical events with dates, prices, and percentage moves. Prompt requires cross-asset analogies (gold, tech stocks, forex, etc.) and "what happened afterward" recovery context.
4. **Structuring (Lovable AI gateway)** — Turns search text + citations into one card: title, `btcInsight` (main body), analogy, assetClass, period, optional source and url. AI timeouts are **10 s** for `gemini-2.5-flash` then **8 s** for `gemini-2.5-flash-lite` (previously 8 s / 6 s).
5. **Specificity gate** — Quality gate requires dates (year/month/numeric) OR numbers ($/%).
6. **`qualityGate("historical_insight", …)`** — Length (80–800 chars), title word count **3–15**, banned terms, sentence diversity (`quality.ts`).
7. **On success (`source: "live"`)** — Inserts into `companion_cache` with `prompt_version: "v3"`; background URL validation.

**Phase 4: Curated** — if all above fail, static fallback pool from `companion_fallbacks` DB / `fallback-seed.json`.

Phase toggles: `COMPANION_PHASE_LIBRARY`, `COMPANION_PHASE_CACHE`, `COMPANION_PHASE_LIVE` (all enabled by default; see `_shared/phase-config.ts`).

---

## 4. Historical eras

The generator maintains **22 predefined eras** in `_shared/history-util.ts` (`HISTORICAL_ERAS`). Each carries a `mood` tag, an `examples` descriptor passed to Perplexity, and a `keywords` array used for dedup against recent card titles.

**Recovery (10)** — crashes that ended; best for anxious / fearful users:

- COVID crash and recovery (March 2020)
- 2018-2019 bear market bottom
- Mt. Gox collapse and aftermath (2014-2015)
- FTX collapse and 2023 recovery
- Early Bitcoin volatility (2011-2013)
- May 2021 China mining ban
- Nasdaq dot-com recovery (2002-2007)
- S&P 500 post-2008 recovery
- Amazon's 95% crash and trillion-dollar rise
- Apple's 1997 near-bankruptcy and iPhone era

**Caution (7)** — euphoria before pain; best for excited / fomo / greedy users:

- 2017 Bitcoin mania and 2018 bear
- 2021 top and 2022 bear market
- Dot-com bubble (1999-2000)
- Black Monday (October 19, 1987)
- Japan asset price bubble (1989)
- Gold's 1980 peak and 20-year decline
- US housing bubble (2006-2008)

**Neutral (5)** — long-cycle context for calm / unknown mood:

- Bitcoin halving cycles
- 1970s oil price shocks
- Swiss franc unpegging (January 15, 2015)
- Asian financial crisis (1997)
- Emerging market FX crises

Era selection considers: (a) mood tag preference, (b) **keyword-anchored** recency dedup against recent card titles, (c) `preferredMood` from session intent. When the preferred pool is fully "seen by keyword", selection softens to **any** fresh era before ever forcing a repeat.

---

## 5. History and the pattern intervention

When `selectIntervention` picks **pattern** as the primary intervention:

1. The orchestrator **forces** the history generator to run, even if `enableHistory` is false.
2. The history result is copied into `intervention.primary = { type: "pattern", data }`.
3. `PatternFraming` + `HistoricalInsightDisplay` render the result in the intervention section.

**Duplicate avoidance:** `CompanionSection` **hides** the Look Back card when `intervention.primary.type === "pattern"` so the same history content is not shown twice (same pattern as Zoom Out secondary dedup and trap/grounding dedup).

---

## 6. Storage

| Target | What | Why |
|--------|------|-----|
| **`reflection_companions`** | Full JSON payload (title, btcInsight, analogy, assetClass, period, source, url) as type `historical_insight` | Canonical normalized store. |
| **`reflections.history_insight_data`** | *(deprecated — legacy column exists but is no longer populated by the orchestrator; `pause-cron-parity.ts` still reads it for recency hints)* | Legacy storage; new reads use `reflection_companions`. |
| **`companion_serves`** | Source, latency, fingerprint | Analytics and monitoring. |
| **`companion_cache`** | Cached payload with dedup fingerprint | Pool for future serves. |

---

## 7. Quality and diversity

| Layer | Role |
|--------|------|
| **Session intent** | `historyMood` (recovery/caution) aligns History with the session theme. |
| **Era pool** | 22 predefined eras with mood tags in `_shared/history-util.ts`; three-step preference-with-fallback selection. |
| **Recency dedup** | Keyword-anchored: each era declares distinctive substrings (`"covid"`, `"ftx"`, `"mt. gox"`, `"black monday"`, …) and is skipped if any recent card title contains one. |
| **Specificity gate** | Requires dates (year, month name, numeric date) OR dollar/percentage amounts. |
| **Cross-asset requirement** | Must draw analogy from another asset class (gold, tech stocks, etc.). |
| **Recovery context** | Prompt asks "what happened afterward" for grounding in outcomes. |
| **Quality gate** | Length (80–800 chars body), banned terms, sentence diversity. |
| **Fallbacks** | Library → cache → live → curated ensures something always ships. |

---

## 8. Key files

| Area | Path |
|------|------|
| Generator | `supabase/functions/_shared/generators/history.ts` |
| Era pool + `pickEra` helper | `supabase/functions/_shared/history-util.ts` (pure, unit-tested in `src/test/history-util.test.ts`) |
| Orchestrator | `supabase/functions/companion-orchestrate/index.ts` |
| Session intent | `supabase/functions/_shared/session-intent.ts` |
| Quality gate | `supabase/functions/_shared/quality.ts` |
| Phase config | `supabase/functions/_shared/phase-config.ts` |
| Content library | `supabase/functions/_shared/content-library.ts` |
| Client invoke | `src/hooks/use-companion-data.ts` |
| Full-screen view | `src/pages/CompanionHistoryPage.tsx` — route `/companion/history/:reflectionId` |
| UI | `src/components/CompanionSection.tsx` (Look Back card via `HistoricalInsightDisplay`) |

---

## 9. Related reading

- [AI-powered pause system](../ai-powered-pause-system.md) — full pause architecture (§7.10 History reference)
- [intervention.md](intervention.md) — Intervention types (pattern uses History)
- [signal.md](signal.md) — Signal companion (parallel companion card)
- [navigating-the-codebase.md](../../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map
