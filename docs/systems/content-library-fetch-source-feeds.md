# Content library ingestion — `fetch-source-feeds`

> **Ingest edge not deployed at pause-first launch (2026-05).** `fetch-source-feeds` lives under `supabase/functions/legacy/`. Shipped companions read **`companion_catalog`** (renamed from `content_library` in cutover) via the catalog phase — see [active-surface.md](../ops/active-surface.md).

This document describes the **Edge function** [`supabase/functions/fetch-source-feeds/index.ts`](../../supabase/functions/fetch-source-feeds/index.ts) and how it fills [`content_library`](../../supabase/migrations/20260321000003_content_library.sql) from admin-configured [`signal_sources`](../../src/screens/admin/components/SourceCatalogViewer.tsx).

## Role in the product

| Piece | Purpose |
|--------|---------|
| **`signal_sources`** | Admin catalog: name, `type`, `url`, category. **One row per publisher/feed/site**, not per article. |
| **`fetch-source-feeds`** | Cron- or invoke-driven worker: discovers article URLs, scrapes pages, structures JSON with Gemini, inserts rows into **`content_library`**. |
| **Companion Signal** | *Legacy:* generators read `content_library` first — see tag `full-ia-pre-strip` and [`_shared/legacy/content-library.ts`](../../supabase/functions/_shared/legacy/content-library.ts). |

## When it runs

- **Cron (typical)** — The repo documents a **pg_cron** job in [cron-setup.md](../ops/cron-setup.md): schedule **`0 6,18 * * *`** ( **06:00 and 18:00 UTC** daily, i.e. twice per day). Your **deployed** project may use a different expression or job name; confirm in the Supabase Dashboard (**Database → Cron Jobs**) or `SELECT * FROM cron.job`.
- **Manual** — Invoke the function anytime: Dashboard (Edge Functions → `fetch-source-feeds`), [Bruno `fetch-source-feeds`](../../bruno/service-cron/fetch-source-feeds.bru), or `curl` with `Authorization: Bearer` (`SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET`).

## Concurrency ("how many processes?")

- **One HTTP request = one invocation** — Each trigger runs a **single** Edge Function instance for that request. There is **no** parallel `Promise.all` over sources or articles: the code uses **sequential** `for` loops (sources one by one; within each source, article URLs one by one with a configurable pause between attempts — see `index.ts`).
- **Per invocation limits (defaults)** — Defaults: **5** sources, **2** inserts per source, **2000 ms** delay between article attempts. Override with Edge secrets (see below). Up to **100** URL attempts per source before giving up on that source's quota (pool order; dedup may skip many).
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
4. **URL normalization** — [`normalizeSourceUrl`](../../supabase/functions/_shared/feed-ingest.ts) fixes common paste errors: trailing `.` after `atom.xml`, and **missing `https://`** (e.g. `nakamotoinstitute.org/mempool/atom.xml` → `https://…`) so `fetch` does not throw `Invalid URL`.
5. **Discovery** (per source) — Depends on `signal_sources.type` and what the URL returns:

   | Mode | Behavior |
   |------|----------|
   | **`rss` / `feed`** | Fetch XML; **parse item/entry links** + optional per-item author (`dc:creator`, Atom `<author>`). Parses **RSS `<pubDate>`** and **Atom `<published>` / `<updated>`** into `publishedAt` (ISO). After batch URL dedup, pending refs are sorted **newest first** so small per-run insert limits favor fresh items. |
   | **`site_map` / `site`** | Firecrawl **Map** on the URL (up to **500** raw links per call); [`filterArticleLikeUrls`](../../supabase/functions/_shared/feed-ingest.ts) scores/filters paths and keeps up to **200** URLs for the pool (not “first rows on the HTML page” — order comes from Map/sitemap + score sort). Drops junk like `/tag/…`, boosts article-like segments. **Library sites:** paths ending in `copyright`, `table-of-contents`, or `toc` under `/library/…` are **excluded** (ancillary pages, not primary reading); `/library/<work-slug>/` is **boosted** so Map does not prefer TOC/copyright over the main work URL. |
   | **Default / `blog` / etc.** | If the URL returns RSS/Atom XML, treat as feed (**auto-detect**); else scrape **that single URL** as one article. |

6. **Scrape** — For **each** discovered article URL: Firecrawl **`/v2/scrape`** requests **`markdown`** and **`links`** in one call. **`onlyMainContent`:** `false` for **essays** (keeps article headers with "First published on …"); `true` for non-essay source types. Response **`metadata`** (canonical / Open Graph, etc. — see [Firecrawl scrape](https://docs.firecrawl.dev/features/scrape)). Perplexity fallback returns text only (no Firecrawl extras). The model does **not** ingest raw RSS `<content:encoded>` for structuring; it sees **the page** markdown.

7. **Structure** — Lovable gateway → **Gemini** (`google/gemini-2.5-flash-lite`) returns JSON: `title`, `author`, `summary`, `key_quote`, `url` (must match scraped page), optional `original_url` / `original_publication`. For essays, those fields are **inputs** to step 8; persistence order is **not** "model first" (see below).

8. **`original_url` resolution (essays)** — **Why this order:** phrase matching uses the **full** scrape (reliable for explicit bylines). Gemini only sees an **excerpt**, so it can confuse body citations with syndication attribution. Firecrawl **metadata** is cheap but often same-host canonical on republishers. If none match, `original_url` stays **null** — the article is treated as native content (no false positives from body citation links).

   **Precedence:** **(a)** Phrase inference on full markdown (Unicode normalization; **specific** syndication phrases beat generic for the footer match); **closest** external `https` after the matched phrase. **(b)** If no URL from phrases, Gemini's `original_url` (same-host rejected). **(c)** Firecrawl **metadata** (cross-site `canonical` / `ogUrl`). **(no further fallback)** — Firecrawl `links` was removed because grabbing the first external body link produced false positives for native articles with normal citations.

   Logs with path **`no_marker`** include **`noMarkerHint`** when nothing matched. Optional **`FETCH_FEEDS_LOG_ORIGINAL_INFER=false`** disables `fetch_feeds_original_infer` / `fetch_feeds_original_firecrawl` lines (default: log).

9. **Dedup** — Before scrape, **URL-only** check against `content_library` (same variants as [`urlDedupCandidates`](../../supabase/functions/_shared/content-dedup.ts)) so Firecrawl/Gemini are not called for known articles. The worker **batch-queries** all candidate URLs for the discovered pool first ([`filterArticleRefsNotInLibrary`](../../supabase/functions/_shared/content-dedup.ts)), drops refs that are already stored, then only walks the **pending** list — so skipped URLs do **not** consume the per-run attempt budget or repeat the same prefix on every cron. If batch queries fail, it falls back to per-URL pre-scrape checks. After structure, **URL + `title_norm`** checks remain as a safety net (e.g. model returns a different normalized URL string).

10. **Insert** — `content_library` row with tags derived from source category and name.

## Admin: what to add

- **One feed URL** (e.g. `https://nakamotoinstitute.org/mempool/atom.xml`) with type **`rss`** — **not** individual article URLs unless you intentionally want a single-page ingest.
- **Site discovery**: type **`site_map`** + site root URL (requires `FIRECRAWL_API_KEY`).
- **Manual `content_library` rows** — `/admin` → Library: **Add library item** inserts via the browser (RLS: admin). Paste URLs are normalized like feeds (`https://` default, etc.). Before insert, the UI checks **active** duplicates (`title_norm` or URL variants per [`urlDedupCandidates`](../../supabase/functions/_shared/content-dedup.ts)) and asks for confirmation if something matches.
- **Fill from URL** — same form: **`admin-library-preview`** edge function (JWT + `profiles.is_admin`): Firecrawl markdown scrape, then optional Gemini JSON fields via **`LOVABLE_API_KEY`** (same as fetch-source-feeds). Without Lovable key, the UI still gets a short markdown excerpt. Listed in [`supabase/config.toml`](../../supabase/config.toml) as `[functions.admin-library-preview]` with **`verify_jwt = true`**.
## Logs (grep Supabase Edge logs)

Each line is **JSON**: filter **`"fn":"fetch-source-feeds"`** and, if needed, **`fetch_feeds_cron`** inside **`extra.holzen_event`**. The **`msg`** field carries the stable token below. See [logging-strategy.md](../ops/logging-strategy.md).

| **msg** | When | Level |
|--------|------|--------|
| `fetch_feeds_batch` | After loading sources; `sourcesTotal`, `toProcess`, `maxArticlesPerSource`, `mode` | info |
| `fetch_feeds_discover` | After resolving URLs for one source; `discovery`, `poolSize`, **`poolPending`**, **`poolSkippedKnown`**, **`batchDedupOk`**, `feedAuthorsInPool` | info |
| `fetch_feeds_batch_dedup_failed` | Batch URL dedup query failed; falls back to per-URL pre-scrape checks | warn |
| `fetch_feeds_article` | Per article attempt: `outcome`, `reason` (e.g. `dedup_url_pre_scrape`, `dedup_url`, `dedup_title_norm`), `phase` on failure, `discovery`, `urlHost` | info |
| `fetch_feeds_complete` | Run finished; `fetched`, `sourcesTried`, `mode` | info |
| `fetch_feeds_source_error` | Uncaught error in one source loop | warn |
| `fetch_feeds_original_infer` | Per essay when inferring `original_url`: `path`, `phrase`, `candidateCount`, `candidatesPreview` (`host@distance`), `chosen`, `chosenDistanceAfterPhrase`; if `path` is `no_marker`, `noMarkerHint` (`hasPublished`, `hasFirst`, `headerScannedChars`) | info (omit when `FETCH_FEEDS_LOG_ORIGINAL_INFER=false`) |
| `fetch_feeds_original_firecrawl` | When `original_url` comes from Firecrawl **`metadata`** (`source`, `metadataKeysChecked`, `chosen`) | info (same gate) |
| `fetch_feeds_original_llm_rejected` | Model returned `original_url` on same host as article | info |

Stable grep tokens: **`fetch_feeds_batch`**, **`fetch_feeds_discover`**, **`fetch_feeds_article`**, **`fetch_feeds_complete`**, **`fetch_feeds_original_infer`**, **`fetch_feeds_original_firecrawl`**, **`fetch_feeds_original_llm_rejected`**.

## Related code

- **Shared helpers:** [`feed-ingest.ts`](../../supabase/functions/_shared/feed-ingest.ts) — RSS/Atom parsing, Map, URL normalization.
- **Dedup:** [`content-dedup.ts`](../../supabase/functions/_shared/content-dedup.ts).
- **Attribution in Signal UI:** [`essayToSignal`](../../supabase/functions/_shared/content-library.ts), [`SignalDisplay.tsx`](../../src/screens/pause/components/SignalDisplay.tsx).

## Related docs

- [logging-strategy.md](../ops/logging-strategy.md) — Edge JSON logging vs browser `holzen-console`.
- [AGENTS.md](../../AGENTS.md) — `supabase/functions/` and migrations.
