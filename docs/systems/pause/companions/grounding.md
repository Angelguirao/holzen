# Grounding companion (end-to-end)

> **Pause V2:** This doc reflects the current model. Companion payloads
> are stored in `pause_ai_artifacts` (one row per `pause_instance_id` + `kind`);
> the legacy `reflection_companions` / `reflections.grounding_*` storage paths
> were removed in the V2 cutover.


**Grounding** (also called **Ground** in the UI) is the pause **card** that surfaces a short **behavioral finance nudge**: a research-grounded insight about a cognitive bias relevant to the current market situation, with an academic citation.

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.7** Grounding reference table).

---

## 1. Where Grounding sits in the pipeline

1. User completes a pause; when the user **taps the Ground card**, **`use-companion-data`** invokes **`companion-orchestrate`** with `enableGrounding: true` (lazy loading). If Grounding data is already cached in `pause_ai_artifacts`, it is hydrated from DB without a network call.
2. **`companion-orchestrate`** runs **`generateGrounding`** in `_shared/generators/grounding.ts` when **`enableGrounding`** is true (or when the intervention **requires** it — trap type), passing **context**, **session intent** (`preferredBias`), **grounding source catalog**, and **recency dedup** fields.
3. **`generateGrounding`** returns structured Grounding payload; the orchestrator **writes** **`pause_ai_artifacts`** (canonical) and **`companion_serves`** for analytics.

Grounding also serves as the **data source for trap interventions**: when `selectIntervention` picks trap, the orchestrator copies the grounding task result into `intervention.primary`.

---

## 2. Client → edge inputs

| Input | Source | Role |
|--------|--------|------|
| **`groundingSources`** | `grounding_sources` + user prefs (`loadActiveOrchestrateSources('grounding')` in `companion-orchestrate-sources.ts`) | Optional **catalog**: names + URLs → hostnames for Perplexity **domain filter**. |
| **`recentGroundingSources`** | `localStorage` keys + DB merge | Dedup: avoid repeating same sources across recent pauses. |
| **`recentNudgeTopics`** | Recent grounding titles from `pause_ai_artifacts` | Dedup: avoid repeating same bias topics. |
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
| **`pause_ai_artifacts`** | Full JSON payload (title, body, citation, url) | Canonical normalized store; used by lazy hydration on card tap. |
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
| **Quality gate** | Length (80–500 chars body; structuring prompt targets ≤480 to leave headroom), banned terms, Bitcoin-only, sentence diversity. |
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
| Full View page | `src/pages/CompanionGroundingPage.tsx` (route `/companion/grounding/:pauseInstanceId`) |
| Full View presentation | `src/components/companion/GroundingFullView.tsx` |
| Enrichment edge fn | `supabase/functions/grounding-enrich/index.ts` |
| Enrichment helpers | `supabase/functions/_shared/grounding-enrichment-util.ts` |
| Enrichment client hook | `src/hooks/use-grounding-enrichment.ts` |
| Enrichment presentation | `src/components/companion/GroundingEnrichment.tsx` |
| Enrichment cache table | `grounding_enrichment_cache` (migration `20260418140000_grounding_enrichment_cache.sql`) |
| Related biases rail | `src/components/companion/RelatedBiasesThisMonth.tsx` (+ `related-biases-util.ts`) |
| Full View telemetry hook | `src/hooks/use-fullview-telemetry.ts` (event `companion_fullview_opened`) |

---

## 9. Full View (reflect-step deep read)

The inline Ground card in `CompanionSection` has an **"Open full view"** button that routes to **`/companion/grounding/:pauseInstanceId`** (lazy-loaded in `src/App.tsx`). The Full View keeps the generated body verbatim and surrounds it with affordances that don't fit in the inline card:

- **Promoted citation CTA** — the tiny `ExternalLink` footnote in `LearningInput` becomes a proper **"Read the paper →"** link sitting directly under the citation text.
- **Enrichment slot** — the `GroundingFullView` accepts an `enrichmentSlot` ReactNode where `CompanionGroundingPage` renders abstract preview + 1–2 sentence researcher bios + Semantic Scholar citation count from the `grounding-enrich` edge function (see §10). Missing fields hide silently — we never show a "couldn't enrich" banner.
- **Read-time indicator** + **"Why this card now?"** disclosure with mood / market direction / session-intent transparency (explains why *this* bias was picked today).
- **Cross-reference badge** — when the session's primary intervention was a `trap` that used this same Ground payload, a subtle **"This was also today's headline"** badge sits above the card so the repetition is acknowledged rather than confusing.
- **Breathing-room pacing** (8 s) before feedback + save CTAs fade in.
- **Per-user history thread** — the last 5 Ground cards for this user from `pause_ai_artifacts`, deep-linked to their own Full Views so the Full View doubles as a small personal archive of biases surfaced.
- **Related biases this month** — a distinct-by-normalized-title chip rail drawn from the last 30 days of the user's Ground cards. Complements the chronological history thread by showing *breadth* of biases surfaced rather than raw recency. Dedupe is title-based (titles are short bias labels per the structuring prompt), cap 8 chips.
- **Pro-gated "Save this moment"** — captures the user's own note triggered by the card as a `library_items` row (`source_type: companion_moment`). Free users get a locked state with an upgrade toast.

The "Open full view" navigation is free; only the **Save this moment** action is gated.

---

## 10. Citation enrichment (`grounding-enrich` edge function)

The Full View's enrichment block is served by a dedicated edge function, `grounding-enrich` (JWT verified, authenticated users only). It exists for three reasons:

1. **Cross-user cache.** Every user who sees the same citation shares the same enriched row — keyed by `sha256(normalizeCitation(citation))` — so we pay each upstream API once per paper, not once per user. TTL: **60 days** on the happy path, **1 day** when all three providers failed (so outages self-heal).
2. **Graceful fan-out.** The function calls Crossref, Semantic Scholar, and Gemini **in parallel**. Each helper returns `null` on failure so one bad provider can't tank the whole response. The final payload fields are *all nullable*; the UI renders only what arrived.
3. **Provenance trail.** Every cached row stores `source_provenance` (`abstract_source`, `bio_source`, `citation_count_source`) so we can audit where any surfaced claim came from during follow-ups.

### Flow

```
citation + url (+ optional DOI)
          │
          ├─ SHA-256 hash of normalized citation
          │
          ▼
┌─ cache read (grounding_enrichment_cache, expires_at > now) ─┐
│  hit  →  holzen_event=grounding_enrich_hit  → return row    │
│  miss →  ┌─ Crossref (abstract, authors[], DOI)             │
│           ├─ Semantic Scholar (citation count) [only if DOI]│
│           └─ Gemini (1-bio-per-author)  [only if authors]   │
│           ↓                                                 │
│  upsert row (60d TTL on success, 1d on total failure)       │
│  → holzen_event=grounding_enrich_miss (or _failed)          │
└─────────────────────────────────────────────────────────────┘
```

### Upstreams

| Provider | What it contributes | Auth | Timeout |
| --- | --- | --- | --- |
| **Crossref** `/works` or `/works?query.bibliographic=…` | Canonical DOI + URL, abstract (when publisher provided one), author names | None (User-Agent with contact email) | 8s |
| **Semantic Scholar** `/graph/v1/paper/DOI:…` | `citationCount` integer | None (free tier) | 8s |
| **Gemini via Lovable AI gateway** | 1–2 sentence researcher bios, bounded to ≤160 chars each | `LOVABLE_API_KEY` | 10s |

### Client wiring

`useGroundingEnrichment({ citation, url })` is a TanStack Query hook that memoizes the edge-function call per `(citation, doi, url)` tuple. Result is passed to `<GroundingEnrichment data loading error />` which renders nothing until data arrives and nothing at all if every field is null/empty (i.e. the page looks exactly like pre-enrichment, only richer when the data exists).

### Storage

Table `grounding_enrichment_cache` (migration `20260418140000_grounding_enrichment_cache.sql`):
- PK: `id`; unique key for upsert: `citation_hash`.
- Columns: `doi`, `url`, `abstract`, `researchers jsonb` (`[{name, bio}]`), `citation_count`, `source_provenance jsonb`, `last_validated_at`, `expires_at`.
- RLS: `authenticated` role can `SELECT` (content is public metadata); writes are service-role only via the edge function.

### Telemetry

All events carry the same stable tag structure as the rest of the companion stack — see [logging-strategy.md](../../../ops/logging-strategy.md).

| Event | When |
| --- | --- |
| `grounding_enrich_hit` | Cache row found and not expired |
| `grounding_enrich_miss` | Cache miss; at least one upstream returned something |
| `grounding_enrich_failed` | Cache miss *and* all three upstreams failed (row cached with 1d TTL) |

---

## 11. Related reading

- [AI-powered pause system](../ai-powered-pause-system.md) — full pause architecture (§7.7 Grounding reference)
- [intervention.md](intervention.md) — Intervention types (trap uses Grounding)
- [signal.md](signal.md) — Signal companion (parallel companion card)
- [navigating-the-codebase.md](../../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map
