# Signal companion (end-to-end)

**Signal** is the pause **card** that surfaces a short **cognitive reappraisal** snippet: title, body, and a real **citation URL**, grounded in Bitcoin-focused writing (not trading hype).

This page is the **companion-level** view. For **manual vs automatic pause**, **interventions**, **cost limits**, and the full **orchestrator** contract, see the system doc: **[AI-powered pause system](../ai-powered-pause-system.md)** (especially **§5** `companion-orchestrate`, **§6** generators, **§7.8** Signal reference table).

---

## 1. Where Signal sits in the pipeline

1. User completes reflection; **`use-companion-data`** invokes **`companion-orchestrate`** when the Signal slot is needed (not fully cached on the reflection row).
2. **`companion-orchestrate`** runs **`generateSignal`** in `_shared/generators/signal.ts` when **`enableSignal`** is true, passing **context**, **session intent** (`searchAngle`), **signal source catalog** hints, and **recency dedup** fields from the client.
3. **`generateSignal`** returns structured **`signal_*`** payload; the orchestrator **dual-writes** to **`reflections`** / **`reflection_companions`** and records **`companion_serves`** (including **`serve_source`**: live / cache / curated).

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

## 5. Diversity and quality — what we improved vs what remains

**Implemented (recent iterations):**

- **Catalog allowlist** — Domains are **shuffled** per request (not always the same first five hosts in fixed order).
- **Perplexity** — **`temperature`**, **`top_p`**, **`search_context_size: high`** for broader retrieval (higher API cost than default).
- **Dedup** — **`recentSignalUrls`** so the same citation URL is discouraged across sessions on the same device.
- **Domain policy** — **`SIGNAL_DOMAIN_DENYLIST`** is **empty by default**; optional `-domain` entries in code if you need a denylist later.

**Still inherent (not “bugs” in Holzen alone):**

- **Similar pause context** (e.g. “BTC down ~3%, extreme fear”) produces **similar search queries** → web ranking surfaces the **same canonical essays** and domains.
- **Small catalog** or many URLs on the **same hostname** still concentrates results.
- **Attribution** for generic hosts (e.g. YouTube) can vary run-to-run; **`validateSource`** is best-effort.

Treating repetition as a **product** problem may mean stricter rules (e.g. prefer non-YouTube citations, server-side **URL** dedup from **`reflection_companions`** for the user), beyond prompt tweaks.

---

## 6. Key files

| Area | Path |
|------|------|
| Generator | `supabase/functions/_shared/generators/signal.ts` |
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

The legacy filename **`signal-perplexity-prompts.md`** redirects here; use **this** file for Signal going forward.
