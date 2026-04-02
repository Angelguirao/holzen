# Signal companion (end-to-end)

**Signal** is the pause **card** that surfaces a short **cognitive reappraisal** snippet: title, body, and a real **citation URL**, grounded in Bitcoin-focused writing (not trading hype).

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.8** Signal reference table).

---

## 1. Where Signal sits in the pipeline

1. User completes reflection; **`use-companion-data`** invokes **`companion-orchestrate`** when the Signal slot is needed (not fully cached on the reflection row).
2. **`companion-orchestrate`** runs **`generateSignal`** in `_shared/generators/signal.ts` when **`enableSignal`** is true, passing **context**, **session intent** (`searchAngle`), **signal source catalog** hints, and **recency dedup** fields from the client.
3. **`generateSignal`** returns structured Signal payload; the orchestrator **writes** **`reflection_companions`** (canonical) and **`companion_serves`** — not duplicate Signal columns on **`reflections`** (those were removed; only **Grounding** still denormalizes to **`reflections.grounding_*`** for Home). The compatibility view **`v_reflection_with_companions`** can still expose `signal_url` as a computed alias for reads.

Signal is **not** a primary **intervention** type (mirror / trap / pattern / question); it is always a **companion card** when the user enables it. See **§7.8** in the [system doc](../ai-powered-pause-system.md).

---

## 2. Client → edge inputs

| Input | Source | Role |
|--------|--------|------|
| **`signalSources`** | `signal_sources` + `user_signal_preferences` (`getSignalSources()` in `use-companion-data.ts`) | Optional **catalog**: names + URLs → hostnames for Perplexity **allowlist** when URLs exist. |
| **`recentSignalTitles` / `recentSignalSources` / `recentSignalUrls`** | `localStorage` keys `holzen_recent_signal_*` | Dedup: do not repeat same **titles**, **attribution strings**, or **citation URLs** across recent pauses on this browser. |
| **`context`** | BTC + Fear & Greed + on-chain line (same suffix as reflection) | Grounds the **search query** in the current move. |
| **`searchAngle`** | `determineSessionIntent()` → **`signalAngle`** (`session-intent.ts`) | Aligns Signal thematically with the rest of the pause session. |

If the catalog is **empty**, Perplexity runs **without** a domain allowlist (unrestricted web search, unless you add entries to **`SIGNAL_DOMAIN_DENYLIST`** in code). If the catalog has **URLs**, a **shuffled subset** of catalog hostnames is sent as **`search_domain_filter`** (allowlist).

---

## 3. Server pipeline (`signal.ts`)

High-level order (source of truth: **`supabase/functions/_shared/generators/signal.ts`**, **`PROMPT_VERSION`**):

1. **Perplexity (`sonar-pro`)** — Web-grounded search: system + user **`searchQuery`** (context, angle, exclusions, optional source hints). API options include **`temperature`**, **`top_p`**, and **`web_search_options.search_context_size`** to reduce identical results. **`search_domain_filter`** is set only when the catalog yields hostnames; otherwise omitted.
2. **Citations** — Normalized from **`citations`**, **`search_results`**, and inline URLs (`perplexity-client.ts`); empty citation list can force fallback.
3. **Structuring (Lovable AI gateway)** — Second model (e.g. Gemini) turns search text + citation list into **one card** (title, body, source, url, optional quote) via tool/function JSON.
4. **`validateSource`** — Reconciles attribution with URL hostname rules (`source-validation.ts`).
5. **`qualityGate("signal", …)`** — Length, banned terms, Bitcoin-only constraints (`quality.ts`).
6. **On success (`source: "live"`)** — Inserts into **`companion_cache`** when not a duplicate title (pool for future fallback / other users).
7. **Fallback chain** if live path fails — **Library** essays → **`serveFromCache`** → **curated** DB pool (`fallbacks.ts`).

Admin **Monitor** shows **`live` vs `cache` vs `curated`** from **`companion_serves`**; a **live** run can still create a **cache** row for the pool — that is expected.

---

## 4. Perplexity prompts (detail)

- **System message** — Frames cognitive reappraisal, Bitcoin-only constraints, themes (sound money, PoW, time preference, etc.). Session exclusions append when **`recentExclusion` / `topicExclusion`** apply.
- **User message (`searchQuery`)** — Built from **`searchAngle`** (if set), **`context`**, **`sourceHint`** (shuffled catalog names), author/title exclusions, and **recent citation URL** exclusions.

Exact strings change with **`PROMPT_VERSION`**; edit **`signal.ts`** rather than this doc when tuning copy.

---

## 5. Diversity and quality

Signal’s quality problem splits into **(a)** “is this a good Bitcoin cognitive-reappraisal piece?” and **(b)** “does the user keep seeing the same article or domain?” Holzen addresses both through **layered controls** — prompts and retrieval knobs are not the whole story; **dedup**, **gates**, and **fallbacks** matter too.

### How we steer diversity and quality (overall)

| Layer | Role |
|--------|------|
| **Session intent** | **`searchAngle`** ties Signal to the rest of the pause so the card is not a generic essay request every time. |
| **Prompts** | System + user **`searchQuery`** encode Bitcoin-only framing, reappraisal intent, and (when present) exclusions for recent authors, topics, and URLs. **`PROMPT_VERSION`** in **`signal.ts`** marks material copy changes. |
| **Retrieval settings** | Perplexity **`temperature`**, **`top_p`**, and **`web_search_options.search_context_size`** widen or sharpen web results relative to defaults (cost vs variety tradeoff). |
| **Catalog / domains** | Optional user catalog → **shuffled** hostname allowlist for **`search_domain_filter`**; empty catalog → open web (unless **`SIGNAL_DOMAIN_DENYLIST`** is extended in code). Shuffling avoids always searching the same subset of hosts. |
| **Query variation** | A rotating **exploration facet** (sub-theme) in the user message reduces identical queries when market **context** text is similar across sessions. |
| **Recency dedup** | **Device:** client **`recentSignalUrls`** / titles / sources (`localStorage`). **Account:** orchestrator merges those hints with recent Signal **`content.url`** values from **`reflection_companions`** for the same user (excluding the current reflection when known), so “don’t repeat this URL” applies across browsers once data exists server-side. |
| **Citation handling** | When both YouTube and non-YouTube URLs appear in Perplexity output, **non-YouTube URLs are ordered first** before structuring so the model tends to pick a publisher page when one exists. |
| **Attribution** | **`validateSource`** reconciles stated source with URL hostname rules (best-effort; see limits below). |
| **Structural quality** | **`qualityGate("signal", …)`** enforces length, banned terms, and Bitcoin-only constraints before the card is served live. |
| **Fallbacks** | If live search/structure fails, **library essays → cache → curated pool** still ship *something* on-theme; those paths have their own diversity characteristics (e.g. smaller fixed sets). |

Together, these layers aim for **credible citations**, **thematic fit**, and **less repetition** — not a single lever.

### Inherent limits (not specific to one Holzen release)

- **Web search is not under our control** — Similar **context** strings still tend to produce similar ranked results; we can diversify *queries* and *exclusions*, not the entire index.
- **Allowlists concentrate** — A small catalog or many URLs on one host still biases retrieval toward those domains.
- **Third-party metadata** — Generic hosts (e.g. YouTube) make **attribution** noisy; **`validateSource`** cannot fully fix that.
- **Repetition as a product question** — “Good enough” diversity may still require **stricter product rules** (e.g. block or deprioritize certain hosts, per-user URL budgets, stronger library-first policies) beyond tuning prompts.

### What else could be done (examples)

Engineering and product options to revisit when repetition or quality still feels wrong:

- **Stricter URL policy** — Harder rules on YouTube or other hosts; per-host frequency caps in prompts or post-filtering.
- **Library-first or hybrid** — Prefer **`content_library`** or cache for some sessions to guarantee curated variety.
- **Analytics-driven tuning** — Use **`companion_serves`** / fingerprints to spot dominant domains or titles and feed that into exclusions or catalog suggestions.
- **User-visible controls** — Narrower “only these sources” vs “surprise me” modes change the diversity–predictability tradeoff by design.

Exact behavior in code changes with **`PROMPT_VERSION`** and the files in **§6**; treat this section as **design intent**, not a changelog.

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

---

## 7. Related reading

- [AI-powered pause system](../ai-powered-pause-system.md) — full pause architecture  
- [navigating-the-codebase.md](../../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map  
- [docs/README.md](../../README.md) — docs index  
