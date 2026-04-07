# Content library ingestion — `fetch-source-feeds`

This document describes the **Edge function** [`supabase/functions/fetch-source-feeds/index.ts`](../../supabase/functions/fetch-source-feeds/index.ts) and how it fills [`content_library`](../../supabase/migrations/20260321000003_content_library.sql) from admin-configured [`signal_sources`](../../src/components/admin/SourceCatalogViewer.tsx).

## Role in the product

| Piece | Purpose |
|--------|---------|
| **`signal_sources`** | Admin catalog: name, `type`, `url`, category. **One row per publisher/feed/site**, not per article. |
| **`fetch-source-feeds`** | Cron- or invoke-driven worker: discovers article URLs, scrapes pages, structures JSON with Gemini, inserts rows into **`content_library`**. |
| **Companion Signal** | Generators read `content_library` essays first (see [`signal.md`](pause/companions/signal.md), [`content-library.ts`](../../supabase/functions/_shared/content-library.ts)). |

## When it runs

- **Cron (typical)** — The repo documents a **pg_cron** job in [cron-setup.md](../ops/cron-setup.md): schedule **`0 6,18 * * *`** ( **06:00 and 18:00 UTC** daily, i.e. twice per day). Your **deployed** project may use a different expression or job name; confirm in the Supabase Dashboard (**Database → Cron Jobs**) or `SELECT * FROM cron.job`.
- **Manual** — Invoke the function anytime: Dashboard (Edge Functions → `fetch-source-feeds`), [Bruno `fetch-source-feeds`](../../bruno/service-cron/fetch-source-feeds.bru), or `curl` with `Authorization: Bearer` (`SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET`).

## Concurrency (“how many processes?”)

- **One HTTP request = one invocation** — Each trigger runs a **single** Edge Function instance for that request. There is **no** parallel `Promise.all` over sources or articles: the code uses **sequential** `for` loops (sources one by one; within each source, article URLs one by one with a configurable pause between attempts — see `index.ts`).
- **Per invocation limits (defaults)** — Defaults: **5** sources, **2** inserts per source, **2000 ms** delay between article attempts. Override with Edge secrets (see below). Up to **30** URL attempts per source before giving up on that source’s quota.
- **Fair rotation** — Sources are ordered by **`last_fetch_feeds_at` ascending, nulls first** (migration `signal_sources.last_fetch_feeds_at`). After each source finishes successfully, that timestamp is updated so the next run prefers **other** stale sources. **Apply the migration** before relying on rotation.
- **Overlapping runs** — If cron fires again while a long manual invoke is still running, you could have **two concurrent invocations** (two separate Edge isolates). They do not coordinate; both read `signal_sources` and write `content_library` with dedup protecting duplicate rows.

## Bigger library / launch backfill

Steady-state cron is intentionally small (cost + Edge runtime). To **fill the library quickly** for launch:

1. **Add many RSS feeds** (`signal_sources` rows) — one feed URL per publisher, not per article.
2. **Raise Edge secrets temporarily** (then lower after backfill):
   - `FETCH_FEEDS_MAX_SOURCES` — default `5`, max `40` (how many distinct sources per invocation).
   - `FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE` — default `2`, max `25` (new inserts per source per run).
   - `FETCH_FEEDS_ARTICLE_DELAY_MS` — default `2000`; set `500` or `0` to speed up (be mindful of Firecrawl / Lovable rate limits).
3. **Invoke repeatedly** — Manual runs (Dashboard / Bruno) plus `last_fetch_feeds_at` rotation so **all** sources get turns across runs.
4. **Optional: seed SQL** — For a guaranteed baseline, insert curated rows directly into `content_library` via a migration or one-off SQL (bypasses API cost); keep quality_score + tags consistent with existing rows.

See [`.env.example`](../../.env.example) for commented examples.

## End-to-end flow

1. **Auth** — Service role or `CRON_SECRET` (same pattern as other cron workers; see [logging-strategy.md](../ops/logging-strategy.md)).
2. **Load sources** — `signal_sources` where `url` is set and `demoted_for_live = false`.
3. **Batch** — Up to **`FETCH_FEEDS_MAX_SOURCES`** (default **5**) sources per run; each source capped at **`FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE`** (default **2**) new inserts; **`FETCH_FEEDS_ARTICLE_DELAY_MS`** between article attempts (default **2000**). Stalest sources first via **`last_fetch_feeds_at`**.
4. **URL normalization** — [`normalizeSourceUrl`](../../supabase/functions/_shared/feed-ingest.ts) fixes common paste errors (e.g. trailing `.` after `atom.xml`).
5. **Discovery** (per source) — Depends on `signal_sources.type` and what the URL returns:

   | Mode | Behavior |
   |------|----------|
   | **`rss` / `feed`** | Fetch XML; **parse item/entry links** + optional per-item author (`dc:creator`, Atom `<author>`). |
   | **`site_map` / `site`** | Firecrawl **Map** on the URL; score/filter article-like paths. |
   | **Default / `blog` / etc.** | If the URL returns RSS/Atom XML, treat as feed (**auto-detect**); else scrape **that single URL** as one article. |

6. **Scrape** — For **each** discovered article URL: Firecrawl **scrape** → markdown (or Perplexity fallback if Firecrawl unavailable). The model does **not** ingest raw RSS `<content:encoded>` for structuring; it sees **the page** markdown (so “First published on …” lines and outbound links appear).

7. **Structure** — Lovable gateway → **Gemini** (`google/gemini-2.5-flash-lite`) returns JSON: `title`, `author`, `summary`, `key_quote`, `url` (must match scraped page), optional `original_url` / `original_publication` for **any** domain when the page indicates a prior publication.

8. **Fallbacks** — If the model omits `original_url`, a small regex may infer a known pattern (Substack, Medium, HackerNoon) from markdown.

9. **Dedup** — Before scrape, **URL-only** check against `content_library` (same variants as [`urlDedupCandidates`](../../supabase/functions/_shared/content-dedup.ts)) so Firecrawl/Gemini are not called for known articles. After structure, **URL + `title_norm`** checks remain as a safety net (e.g. model returns a different normalized URL string).

10. **Insert** — `content_library` row with tags derived from source category and name.

## Admin: what to add

- **One feed URL** (e.g. `https://nakamotoinstitute.org/mempool/atom.xml`) with type **`rss`** — **not** individual article URLs unless you intentionally want a single-page ingest.
- **Site discovery**: type **`site_map`** + site root URL (requires `FIRECRAWL_API_KEY`).

## Logs (grep Supabase Edge logs)

Filter with **`[holzen:fetch-feeds]`**. Verbose lines (`holzenEdgeLog` / `holzenEdgeWarn`) follow [logging-strategy.md](../ops/logging-strategy.md): **`HOLZEN_EDGE_LOG=0`** silences them in production; **`holzenEdgeRun`** always prints.

| Message | When | Always |
|--------|------|--------|
| `fetch_feeds_batch` | After loading sources; `sourcesTotal`, `toProcess`, `maxArticlesPerSource`, `mode` | Yes |
| `fetch_feeds_discover` | After resolving URLs for one source; `discovery`, `poolSize`, `feedAuthorsInPool` | If verbose |
| `fetch_feeds_article` | Per article attempt: `outcome`, `reason` (e.g. `dedup_url_pre_scrape`, `dedup_url`, `dedup_title_norm`), `phase` on failure, `discovery`, `urlHost` | If verbose |
| `fetch_feeds_complete` | Run finished; `fetched`, `sourcesTried`, `mode` | Yes |
| `fetch_feeds_source_error` | Uncaught error in one source loop | If verbose (warn) |

Stable grep tokens: **`fetch_feeds_batch`**, **`fetch_feeds_discover`**, **`fetch_feeds_article`**, **`fetch_feeds_complete`**.

## Related code

- **Shared helpers:** [`feed-ingest.ts`](../../supabase/functions/_shared/feed-ingest.ts) — RSS/Atom parsing, Map, URL normalization.
- **Dedup:** [`content-dedup.ts`](../../supabase/functions/_shared/content-dedup.ts).
- **Attribution in Signal UI:** [`essayToSignal`](../../supabase/functions/_shared/content-library.ts), [`SignalDisplay.tsx`](../../src/components/SignalDisplay.tsx).

## Related docs

- [logging-strategy.md](../ops/logging-strategy.md) — Edge vs browser logging; `HOLZEN_EDGE_LOG`.
- [AGENTS.md](../../AGENTS.md) — `supabase/functions/` and migrations.
