# Signal companion (end-to-end)

> **Pause V2:** This doc reflects the current model. Companion payloads
> are stored in `pause_ai_artifacts` (one row per `pause_instance_id` + `kind`);
> legacy `reflection_companions` storage was removed in the V2 cutover.


**Signal** is the pause **card** that surfaces a short **cognitive reappraisal** snippet: title, body, and a real **citation URL**, grounded in Bitcoin-focused writing (not trading hype).

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.8** Signal reference table).

---

## 1. Where Signal sits in the pipeline

1. User completes reflection; when the user **taps the Signal card**, **`use-companion-data`** invokes **`companion-orchestrate`** with `enableSignal: true` (lazy loading). If Signal data is already cached in `pause_ai_artifacts`, it is hydrated from DB without a network call.
2. **`companion-orchestrate`** runs **`generateSignal`** in `_shared/generators/signal.ts` when **`enableSignal`** is true, passing **context**, **session intent** (`searchAngle`), **signal source catalog** hints, and **recency dedup** fields from the client.
3. **`generateSignal`** returns structured Signal payload; the orchestrator **writes** **`pause_ai_artifacts`** (canonical) and **`companion_serves`** for analytics.

Signal is **not** a primary **intervention** type (mirror / trap / pattern / question); it is always a **companion card** when the user enables it. See **§7.8** in the [system doc](../ai-powered-pause-system.md).

---

## 2. Client → edge inputs

| Input | Source | Role |
|--------|--------|------|
| **`signalSources`** | `signal_sources` + `user_signal_preferences` (`loadActiveOrchestrateSources('signal')` in `companion-orchestrate-sources.ts`) | Optional **catalog**: names + URLs → hostnames for Perplexity **allowlist** when URLs exist. |
| **`recentSignalTitles` / `recentSignalSources` / `recentSignalUrls`** | `localStorage` keys `holzen_recent_signal_*` (`getRecencyHints` in `companion-recency-hints.ts`) | Dedup: do not repeat same **titles**, **attribution strings**, or **citation URLs** across recent pauses on this browser. |
| **`context`** | BTC + Fear & Greed + on-chain line (same suffix as reflection) | Grounds the **search query** in the current move. |
| **`searchAngle`** | `determineSessionIntent()` → **`signalAngle`** (`session-intent.ts`) | Aligns Signal thematically with the rest of the pause session. |

If the catalog is **empty**, Perplexity runs **without** a domain allowlist (unrestricted web search, unless you add entries to **`SIGNAL_DOMAIN_DENYLIST`** in code). If the catalog has **URLs**, a **shuffled subset** of catalog hostnames is sent as **`search_domain_filter`** (allowlist).

---

## 3. Server pipeline (`signal.ts`)

High-level order (source of truth: **`supabase/functions/_shared/generators/signal.ts`**, **`PROMPT_VERSION`**):

**Phase 1: Library** — `searchLibrary` checks `content_library` for fresh essays this user hasn't seen within `COMPANION_SERVE_FRESHNESS_DAYS` (30 days). If found, returns immediately (`source: "library"`).

**Phase 2: Cache (strict)** — `serveFromCache` with `strict: true` checks `companion_cache` for fresh, quality-≥-2 rows with per-user dedup and market direction awareness. If found, returns (`source: "cache"`). If the strict pool is empty it returns `null` and emits `cache_strict_miss` (Edge log) so the flow falls through to Phase 3 instead of recycling seen rows.

**Phase 3: Live generation** (if phases 1–2 miss):

1. **Perplexity (`sonar-pro`)** — Web-grounded search: system + user **`searchQuery`** (context, angle, exclusions, optional source hints). API options include **`temperature`**, **`top_p`**, and **`web_search_options.search_context_size`** to reduce identical results. **`search_domain_filter`** is set only when the catalog yields hostnames; otherwise omitted.
2. **Citations** — Normalized from **`citations`**, **`search_results`**, and inline URLs (`perplexity-client.ts`); empty citation list can force fallback.
3. **Structuring (Lovable AI gateway)** — Second model (e.g. Gemini) turns search text + citation list into **one card** (title, body, source, url, optional quote) via tool/function JSON.
4. **`validateSource`** — Reconciles attribution with URL hostname rules (`source-validation.ts`).
5. **`qualityGate("signal", …)`** — Length, banned terms, Bitcoin-only constraints (`quality.ts`).
6. **On success (`source: "live"`)** — Inserts into **`companion_cache`** when not a duplicate title (pool for future fallback / other users).

**Phase 4: Curated** — if all above fail, static fallback pool from `companion_fallbacks` DB / `fallback-seed.json`.

Phase toggles: `COMPANION_PHASE_LIBRARY`, `COMPANION_PHASE_CACHE`, `COMPANION_PHASE_LIVE` (all enabled by default; see `_shared/phase-config.ts`).

Admin **Monitor** shows **`live` / `library` / `cache` / `curated`** from **`companion_serves`**. `library` = a hit in the curated **`content_library`** table (Phase 1); `cache` = a hit in the runtime **`companion_cache`** pool (Phase 2). A **live** run can still create a **cache** row for the pool — that is expected.

---

## 4. Perplexity prompts (detail)

- **System message** — Frames cognitive reappraisal, Bitcoin-only constraints, themes (sound money, PoW, time preference, etc.). Session exclusions append when **`recentExclusion` / `topicExclusion`** apply.
- **User message (`searchQuery`)** — Built from **`searchAngle`** (if set), **`context`**, **`sourceHint`** (shuffled catalog names), author/title exclusions, and **recent citation URL** exclusions.

Exact strings change with **`PROMPT_VERSION`**; edit **`signal.ts`** rather than this doc when tuning copy.

---

## 5. Diversity and quality

**Pause quality is a primary product goal for Holzen** — the session should feel grounded, trustworthy, and emotionally proportionate. Signal is one companion card, but it sits next to **interventions**, **Grounding**, **History**, and **Zoom Out**; keeping Signal excellent (real citations, Bitcoin-appropriate framing, less repetition) supports the same standard as the rest of the pause flow.

Signal’s design problem splits into **(a)** “is this a good Bitcoin cognitive-reappraisal piece?” and **(b)** “does the user keep seeing the same article or domain?” Both matter for perceived quality. Holzen uses **layered controls** — not a single knob: prompts and retrieval settings, **dedup**, **gates**, **attribution**, and **fallbacks** all contribute.

### How we steer diversity and quality (overall)

| Layer | Role |
|--------|------|
| **Session intent** | **`searchAngle`** ties Signal to the rest of the pause so the card is not a generic essay request every time. |
| **Prompts** | System + user **`searchQuery`** encode Bitcoin-only framing, reappraisal intent, and (when present) exclusions for recent authors, topics, and URLs. **`PROMPT_VERSION`** in **`signal.ts`** marks material copy changes. |
| **Retrieval settings** | Perplexity **`temperature`**, **`top_p`**, and **`web_search_options.search_context_size`** widen or sharpen web results relative to defaults (cost vs variety tradeoff). |
| **Catalog / domains** | Optional user catalog → **shuffled** hostname allowlist for **`search_domain_filter`**; empty catalog → open web (unless **`SIGNAL_DOMAIN_DENYLIST`** is extended in code). Shuffling avoids always searching the same subset of hosts. |
| **Query variation** | Each live run appends a **random exploration facet** (short sub-theme) to the user message so similar market **context** does not always yield the same search. Facets live in **`SIGNAL_EXPLORATION_FACETS`** in **`signal.ts`** — expand there (and bump **`PROMPT_VERSION`**) to cover more angles without bloating this doc. |
| **Recency dedup** | **Device:** client **`recentSignalUrls`** / titles / sources (`localStorage`). **Account:** orchestrator merges those hints with recent Signal **`content.url`** values from **`pause_ai_artifacts`** for the same user (excluding the current pause when known). **Implementation note:** today this uses two DB round trips and a capped pause id list; a single RPC/join could reduce latency if needed. |
| **Citation handling** | When both YouTube and non-YouTube URLs appear in Perplexity output, **non-YouTube URLs are ordered first** before structuring so the model tends to pick a publisher page when one exists. |
| **Attribution** | **`validateSource`** reconciles stated source with URL hostname rules (best-effort; see limits below). |
| **Structural quality** | **`qualityGate("signal", …)`** enforces length, banned terms, and Bitcoin-only constraints before the card is served live. |
| **Fallbacks** | Generators try **library → cache → live → curated**. If live search/structure fails, the curated pool still ships *something* on-theme; those paths have their own diversity characteristics (e.g. smaller fixed sets). |
| **Operations** | **`companion_serves`**, **`generation_attempts`**, and cache fingerprints support monitoring and later **analytics-driven** tuning (see below). |

Together, these layers aim for **credible citations**, **thematic fit**, and **less repetition** — not a single lever. Improving “quality when pause” usually means moving **several** layers (and the other companion paths), not only adding facets — though a **richer facet list** is a cheap way to diversify retrieval.

### Inherent limits (not specific to one Holzen release)

- **Web search is not under our control** — Similar **context** strings still tend to produce similar ranked results; we can diversify *queries* and *exclusions*, not the entire index.
- **Allowlists concentrate** — A small catalog or many URLs on one host still biases retrieval toward those domains.
- **Third-party metadata** — Generic hosts (e.g. YouTube) make **attribution** noisy; **`validateSource`** cannot fully fix that.
- **Repetition as a product question** — “Good enough” diversity may still require **stricter product rules** (e.g. block or deprioritize certain hosts, per-user URL budgets, stronger library-first policies) beyond tuning prompts.

### What else could be done (examples)

Engineering and product options to revisit when repetition or quality still feels wrong:

- **Stricter URL policy** — Harder rules on YouTube or other hosts; per-host frequency caps in prompts or post-filtering.
- **Phase tuning** — Adjust `COMPANION_PHASE_*` env vars to disable live generation for some deployments, or disable library/cache to force fresh AI content.
- **Analytics-driven tuning** — Use **`companion_serves`** / fingerprints to spot dominant domains or titles and feed that into exclusions or catalog suggestions.
- **User-visible controls** — Narrower “only these sources” vs “surprise me” modes change the diversity–predictability tradeoff by design.
- **Faster dedup path** — One Postgres RPC or a single query with a join (instead of two round trips) for recent Signal URLs; watch **`.in(pause_instance_id, …)`** size if the pause window grows very large.

Exact behavior in code changes with **`PROMPT_VERSION`** and the files in **§6**; treat this section as **design intent**, not a changelog.

### Related backlog (quality and pause)

| Topic | Backlog / doc |
|--------|----------------|
| Grounding: Home vs pause data surfaces | [writeCompanionData-grounding-consistency.md](../../../backlog/writeCompanionData-grounding-consistency.md) |
| Quality gate false positives / i18n | [quality-gates-false-positives.md](../../../backlog/quality-gates-false-positives.md) |
| Cache / library near-duplicate dedup | [cache-dedup-near-duplicates.md](../../../backlog/cache-dedup-near-duplicates.md) |
| Full backlog index | [backlog.md](../../../backlog/backlog.md) |

### Companion reading & sharing (backlog)

| Topic | Ticket |
|--------|--------|
| Text-to-speech (Pro): `SpeechSynthesis` → ElevenLabs if insufficient | [companion-tts-pro.md](../../../backlog/companion-tts-pro.md) |
| Share as image (Pro): `html-to-image` + design pass | [companion-share-as-image-pro.md](../../../backlog/companion-share-as-image-pro.md) |
| High-contrast reading mode (theme token swap) | [companion-high-contrast-reading-mode.md](../../../backlog/companion-high-contrast-reading-mode.md) |
| Print-friendly CSS | [companion-print-friendly-css.md](../../../backlog/companion-print-friendly-css.md) |

---

## 6. Key files

| Area | Path |
|------|------|
| Generator | `supabase/functions/_shared/generators/signal.ts` |
| Recent URL merge (DB + client) | `supabase/functions/_shared/recent-signal-urls.ts` |
| Perplexity client | `supabase/functions/_shared/perplexity-client.ts` |
| Session angles | `supabase/functions/_shared/session-intent.ts` |
| Orchestrator | `supabase/functions/companion-orchestrate/index.ts` |
| Client invoke + recency | `src/hooks/use-companion-data.ts` |
| Attribution | `supabase/functions/_shared/source-validation.ts` |
| Quality gate | `supabase/functions/_shared/quality.ts` |
| Full View page | `src/pages/CompanionSignalPage.tsx` (route `/companion/signal/:pauseInstanceId`) |
| Full View presentation | `src/components/companion/SignalFullView.tsx` |

---

## 7. Full View (reflect-step deep read)

The inline card in `CompanionSection` has an **"Open full view"** button that routes to **`/companion/signal/:pauseInstanceId`** (lazy-loaded in `src/App.tsx`). The Full View renders the same Signal payload with extra reading affordances that don't fit in the inline card:

- **Favicon + publisher host** above the source link — the source reads as credibility, not as a footnote.
- **Trusted-source badge** — only shown when the signal URL's host matches a row in `signal_sources`. Falls back silently when there is no match (no negative "untrusted" state).
- **Read-time indicator** + **"Why this card now?"** collapsible disclosure (mood / market direction / session bias transparency).
- **Breathing-room pacing** (8 s) before feedback and save CTAs fade in, so the screen doesn't demand input before the user has read.
- **Per-user history thread** — the last 5 Signal cards for this user from `pause_ai_artifacts`, deep-linked to their own Full Views.
- **Pro-gated "Save this moment"** — writes a `library_items` row of `type: note`, `source_type: companion_moment`, capturing the user's own thinking about the card (not the card itself, which is already autosaved as a bookmark).

The free "Open full view" button is visible to all users; gating only applies to the **Save this moment** action.

---

## 8. Related reading

- [AI-powered pause system](../ai-powered-pause-system.md) — full pause architecture  
- [navigating-the-codebase.md](../../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map  
- [docs/README.md](../../README.md) — docs index  
- [backlog.md](../../../backlog/backlog.md) — pending improvements; companion-quality items linked from **§5** (“Related backlog”)  
