# History companion (end-to-end)

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

High-level order (source of truth: **`supabase/functions/_shared/generators/history.ts`**, **`PROMPT_VERSION`** v2):

**Phase 1: Library** — `searchLibrary` checks `content_library` (type `event`) for fresh historical events this user hasn't seen in 7 days. Converts via `eventToHistory` with mood tag awareness. If found, returns immediately (`source: "cache"`).

**Phase 2: Cache** — `serveFromCache` checks `companion_cache` with per-user dedup and market direction awareness. If found, returns (`source: "cache"`).

**Phase 3: Live generation** (if phases 1–2 miss):

1. **Mood mapping** — `anxious`/`fearful` → `recovery` tag; `excited`/`fomo`/`greedy` → `caution` tag; else `undefined`.
2. **Era selection** — Selects from 9 predefined historical eras, each tagged with mood (`recovery`, `caution`, `neutral`). Filters by mood tag and avoids recently shown eras (substring match on recent titles).
3. **Perplexity (`sonar-pro`)** — Web search for specific historical events with dates, prices, and percentage moves. Prompt requires cross-asset analogies (gold, tech stocks, forex, etc.) and "what happened afterward" recovery context.
4. **Structuring (Lovable AI gateway)** — Turns search text + citations into one card: title, `btcInsight` (main body), analogy, assetClass, period, optional source and url.
5. **Specificity gate** — Quality gate requires dates (year/month/numeric) OR numbers ($/%).
6. **`qualityGate("historical_insight", …)`** — Length (80–800 chars), banned terms, sentence diversity (`quality.ts`).
7. **On success (`source: "live"`)** — Inserts into `companion_cache`; background URL validation.

**Phase 4: Curated** — if all above fail, static fallback pool from `companion_fallbacks` DB / `fallback-seed.json`.

Phase toggles: `COMPANION_PHASE_LIBRARY`, `COMPANION_PHASE_CACHE`, `COMPANION_PHASE_LIVE` (all enabled by default; see `_shared/phase-config.ts`).

---

## 4. Historical eras

The generator maintains 9 predefined eras. Each has a key, label, example events, and a mood tag:

| Era | Mood tag | Focus |
|-----|----------|-------|
| COVID recovery (2020) | `recovery` | V-shaped recovery after March crash |
| Tech parallels | `caution` | Dot-com bubble lessons |
| Early Bitcoin | `neutral` | Pre-2013 price discovery |
| 2017 mania | `caution` | Bull run + crash cycle |
| TradFi bubbles | `caution` | Historical financial manias |
| Mt. Gox era | `recovery` | Exchange failure + recovery |
| Bear market | `recovery` | Extended downturns + eventual recovery |
| Commodity history | `neutral` | Gold, oil, long-term cycles |
| Bitcoin halving cycles | `neutral` | Supply schedule + price patterns |

Era selection considers: (a) mood tag filter, (b) recency dedup (skip recently shown eras by substring match on titles), (c) `preferredMood` from session intent.

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
| **Era pool** | 9 predefined eras with mood tags; random selection within filtered pool. |
| **Recency dedup** | Recent titles excluded from era selection by substring match. |
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
