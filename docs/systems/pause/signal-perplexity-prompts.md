# Signal companion: Perplexity and structuring prompts

This doc summarizes what the **Signal** pipeline sends to **Perplexity (`sonar-pro`)** and then to the **Lovable AI gateway** (structuring). Source of truth is `supabase/functions/_shared/generators/signal.ts` (`PROMPT_VERSION`).

## 1. Perplexity — system message (fixed)

The system role frames **Signal** as **cognitive reappraisal** during a pause: find substantive Bitcoin writing that helps reframe emotional reactions to price moves. It lists themes (sound money, proof-of-work, time preference, etc.) and **Bitcoin-only** constraints. Session-specific exclusions (`recentExclusion` / `topicExclusion` / recent citation URLs) apply when provided.

When the user has not set pause **signal sources**, `search_domain_filter` is **omitted** (unrestricted web search). Optional denylist entries can be added in code via `SIGNAL_DOMAIN_DENYLIST` if needed. When the user **does** provide source URLs, a **shuffled** subset of catalog hosts is used as an **allowlist** (cannot combine allowlist and denylist in one request). Citation URLs are merged from multiple response fields in `perplexity-client.ts`, then deduped server-side before structuring.

## 2. Perplexity — user message (`searchQuery`) — varies each run

Built from:

| Input | Effect |
|--------|--------|
| **`searchAngle`** (from `determineSessionIntent().signalAngle`) | If set, used as the main query string — emotional/theme steering for the whole pause. |
| **`context`** (e.g. “BTC is down 5%…”) | Adds market-aware phrasing and optional **direction hints** (patience on drops, humility on rallies). |
| **Neither** | Default: broad request for a profound essay/insight with **diverse author and site**. |
| **`sourceHint`** | If the user has pause **signal sources**, appends “Look for insights from sources like: …”. |
| **`search_domain_filter`** | If pause sources have URLs: **allowlist** (shuffled subset of catalog hosts). Otherwise: omitted unless `SIGNAL_DOMAIN_DENYLIST` is non-empty. |

So the prompt is **not** “random Bitcoin trivia”; it is a **short search query** plus a **long system brief**. Richness depends on: Perplexity retrieval, whether domain filter is on, and whether citations are returned (we merge `citations`, `search_results[].url`, and inline URLs — see `perplexity-client.ts`).

## 3. Structuring — second model (Gemini via Lovable gateway)

After Perplexity returns **search text + citation URLs**, a separate call extracts **one** card: title, body, source, url, optional quote — framed for **reappraisal** (reframe reaction to the move), strict rules to match **search results** and **citation list**, Bitcoin-only wording, no invented URLs.

## Why quality can feel uneven (not “Bitcoin has no literature”)

- **Two-step compression**: Web search → one paragraph + one title; a lot of nuance is dropped by design.
- **Constraints**: Quality gate (length, no slop terms, no generic “crypto”, banned meme strings, etc.) rejects many generations.
- **API behavior**: Historically, empty `citations` was often a **response-shape** issue; we now normalize URLs from multiple fields.
- **Intent**: Session themes sometimes bias the **angle** of the search query; that is intentional for coherence with other companions.

To change behavior, edit **`signal.ts`** (and optionally **`session-intent.ts`** for `signalAngle` strings), not only Perplexity account settings.
