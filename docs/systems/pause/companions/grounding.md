# Grounding companion (end-to-end)

**Grounding** (also called **Ground** in the UI) is the pause **card** that surfaces a short **behavioral finance nudge**: a research-grounded insight about a cognitive bias relevant to the current market situation, with an academic citation.

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.7** Grounding reference table).

---

## 1. Where Grounding sits in the pipeline

1. User completes reflection; when the user **taps the Ground card**, **`use-companion-data`** invokes **`companion-orchestrate`** with `enableGrounding: true` (lazy loading). If Grounding data is already cached in `reflection_companions`, it is hydrated from DB without a network call.
2. **`companion-orchestrate`** runs **`generateGrounding`** in `_shared/generators/grounding.ts` when **`enableGrounding`** is true (or when the intervention **requires** it — trap type), passing **context**, **session intent** (`preferredBias`), **grounding source catalog**, and **recency dedup** fields.
3. **`generateGrounding`** returns structured Grounding payload; the orchestrator **writes** **`reflection_companions`** (canonical), **`companion_serves`**, and **`reflections.grounding_*`** (denormalized for Home page display — Grounding is the **only** companion that still denormalizes to the base `reflections` table).

Grounding also serves as the **data source for trap interventions**: when `selectIntervention` picks trap, the orchestrator copies the grounding task result into `intervention.primary`.

---

## 2. Client → edge inputs

| Input | Source | Role |
|--------|--------|------|
| **`groundingSources`** | `grounding_sources` + user prefs (`loadActiveOrchestrateSources('grounding')` in `companion-orchestrate-sources.ts`) | Optional **catalog**: names + URLs → hostnames for Perplexity **domain filter**. |
| **`recentGroundingSources`** | `localStorage` keys + DB merge | Dedup: avoid repeating same sources across recent pauses. |
| **`recentNudgeTopics`** | Recent grounding titles from `reflection_companions` | Dedup: avoid repeating same bias topics. |
| **`context`** | BTC + Fear & Greed + on-chain line | Grounds the bias selection in the current market move. |
| **`preferredBias`** | `determineSessionIntent()` → **`groundingBias`** (`session-intent.ts`) | Aligns Grounding thematically with the rest of the pause session. |

---

## 3. Server pipeline (`grounding.ts`)

High-level order (source of truth: **`supabase/functions/_shared/generators/grounding.ts`**, **`PROMPT_VERSION`** v3):

**Phase 1: Library — disabled for grounding.** Gated by the module-level constant `GROUNDING_LIBRARY_ENABLED = false` in `grounding.ts` (in addition to the global `COMPANION_PHASE_LIBRARY` env toggle). We short-circuit the phase entirely because `content_library` currently has no rows of `type: "paper"` and paper ingestion is parked; calling `searchLibrary` would only emit `library_search_rejected reason:"empty"` and add an unnecessary DB round-trip per grounding request. When ingestion resumes, flip the flag (or swap it for a `COMPANION_PHASE_LIBRARY_GROUNDING` env var) and the existing `searchLibrary` / `paperToGrounding` / `recordLibraryServe` path is ready to use.

**Phase 2: Cache (strict)** — `serveFromCache` with `strict: true` checks `companion_cache` for fresh, quality-≥-2 rows with per-user dedup and market direction awareness. If found, returns (`source: "cache"`). If the strict pool is empty it returns `null` and emits `cache_strict_miss` (Edge log) so the flow falls through to Phase 3 instead of recycling seen rows.

**Phase 3: Live generation** (if phases 1–2 miss):

1. **Bias topic selection** — Selects from 10 predefined behavioral finance topics, each tagged with market direction (`up`, `down`, `both`):
   - Loss aversion, FOMO/herd behavior, disposition effect, anchoring bias, emotional regulation, endowment effect, recency bias, overconfidence, regret aversion, social proof
2. **Direction-aware filtering** — Filters topics by current market direction; avoids recently shown topics.
3. **`preferredBias` matching** — If session intent provides a bias hint, substring-matches against available topics.
4. **Perplexity (`sonar-pro`, academic mode)** — Web-grounded search with `search_mode: "academic"` and optional domain filtering from catalog.
5. **Retry** — If citations are empty with domain filter, retries without filter.
6. **Structuring (Lovable AI gateway)** — Second model turns search text + citations into one card (title, body, citation in "Author(s) (Year), Title" format, url).
7. **Specificity gate** — Quality gate requires researcher names OR years OR "et al." OR DOI references.
8. **`qualityGate("ground_nudge", …)`** — Length, banned terms, Bitcoin-only constraints (`quality.ts`).
9. **On success (`source: "live"`)** — Inserts into `companion_cache`; background URL validation.

**Phase 4: Curated** — if all above fail, static fallback pool from `companion_fallbacks` DB / `fallback-seed.json`.

Phase toggles: `COMPANION_PHASE_LIBRARY`, `COMPANION_PHASE_CACHE`, `COMPANION_PHASE_LIVE` (all enabled by default; see `_shared/phase-config.ts`). Note: grounding also has a module-local override (`GROUNDING_LIBRARY_ENABLED`) that forces Phase 1 off regardless of the global `COMPANION_PHASE_LIBRARY` setting — see Phase 1 above.

---

## 4. Bias topics (detail)

The generator maintains 10 predefined behavioral finance topics. Each has a `key`, `label`, `description`, `searchTerms`, and a `direction` tag:

| Topic | Direction | When shown |
|-------|-----------|------------|
| Loss aversion | `down` | Market drops — fear of losses |
| FOMO / herd behavior | `up` | Market rises — fear of missing out |
| Disposition effect | `both` | Any — selling winners early, holding losers |
| Anchoring bias | `both` | Any — fixating on specific price points |
| Emotional regulation | `both` | Any — managing emotions in decisions |
| Endowment effect | `both` | Any — overvaluing what you own |
| Recency bias | `both` | Any — overweighting recent events |
| Overconfidence | `up` | Market rises — believing you can time it |
| Regret aversion | `both` | Any — avoiding decisions to avoid regret |
| Social proof | `both` | Any — following the crowd |

Topic selection considers: (a) market direction filter, (b) recency dedup (skip recently shown), (c) `preferredBias` from session intent.

---

## 5. Grounding and the trap intervention

When `selectIntervention` picks **trap** as the primary intervention:

1. The orchestrator **forces** the grounding generator to run, even if `enableGrounding` is false.
2. If the client didn't send `groundingSources`, the orchestrator loads the catalog server-side via `fetchGroundingSourcesForOrchestrate`.
3. The grounding result is copied into `intervention.primary = { type: "trap", data }`.
4. `TrapFraming` in the UI uses `primary.data.title` as the bias label.

**Duplicate avoidance:** `CompanionSection` **hides** the Ground card when `intervention.primary.type === "trap"` so the same grounding content is not shown twice (same pattern as Zoom Out secondary dedup).

---

## 6. Storage

| Target | What | Why |
|--------|------|-----|
| **`reflection_companions`** | Full JSON payload (title, body, citation, url) | Canonical normalized store; used by lazy hydration on card tap. |
| **`reflections.grounding_*`** | Denormalized title, body, citation, url columns | **Home page** reads grounding from the base table for performance. Grounding is the **only** companion that still denormalizes. |
| **`companion_serves`** | Source (`live`/`cache`/`curated`), latency, fingerprint | Analytics and monitoring. |
| **`companion_cache`** | Cached payload with dedup fingerprint | Pool for future serves to same or other users. |

---

## 7. Quality and diversity

| Layer | Role |
|--------|------|
| **Session intent** | `preferredBias` ties Grounding to the rest of the pause. |
| **Bias topics** | 10 predefined topics with direction tags; random selection within filtered pool. |
| **Recency dedup** | Recent topics and sources excluded from selection and search. |
| **Academic mode** | Perplexity `search_mode: "academic"` for research-quality results. |
| **Specificity gate** | Requires researcher names, years, "et al.", or DOI. |
| **Citation format** | Required: "Author(s) (Year), Paper Title" — validated during structuring. |
| **Quality gate** | Length (80–400 chars body), banned terms, Bitcoin-only, sentence diversity. |
| **Fallbacks** | Library → cache → live → curated ensures something always ships. |

---

## 8. Key files

| Area | Path |
|------|------|
| Generator | `supabase/functions/_shared/generators/grounding.ts` |
| Orchestrator | `supabase/functions/companion-orchestrate/index.ts` |
| Session intent | `supabase/functions/_shared/session-intent.ts` |
| Quality gate | `supabase/functions/_shared/quality.ts` |
| Phase config | `supabase/functions/_shared/phase-config.ts` |
| Content library | `supabase/functions/_shared/content-library.ts` |
| Client invoke | `src/hooks/use-companion-data.ts` |
| UI | `src/components/CompanionSection.tsx` (Ground card via `LearningInput`) |

---

## 9. Related reading

- [AI-powered pause system](../ai-powered-pause-system.md) — full pause architecture (§7.7 Grounding reference)
- [intervention.md](intervention.md) — Intervention types (trap uses Grounding)
- [signal.md](signal.md) — Signal companion (parallel companion card)
- [navigating-the-codebase.md](../../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map
