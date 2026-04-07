import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createAttemptLogger } from "../_shared/observe.ts";
import { canonicalContentUrl, normalizeTitleKey, urlDedupCandidates } from "../_shared/content-dedup.ts";
import { callPerplexityChat, type PerplexityUsage } from "../_shared/perplexity-client.ts";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun, holzenEdgeWarn } from "../_shared/holzen-edge-log.ts";
import {
  fetchFeedXmlIfApplicable,
  type FeedArticleRef,
  firecrawlMapArticleUrls,
  isExplicitFeedSourceType,
  isExplicitSiteMapSourceType,
  normalizeSourceUrl,
  parseArticleRefsFromFeedXml,
} from "../_shared/feed-ingest.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Active Source Feeds — fetches latest content from signal_sources URLs.
 *
 * Uses Firecrawl to scrape source URLs into clean text, then Gemini to
 * structure the content into content_library entries.
 *
 * Falls back to Perplexity search if Firecrawl is not configured.
 *
 * Scheduled via cron (twice daily).
 *
 * Ingest modes (per `signal_sources.type` + URL):
 * - Default / blog / etc.: scrape the single `url` (article or page).
 * - `rss` or `feed`: treat `url` as RSS/Atom — extract item links, scrape up to N articles.
 * - `site_map` or `site`: Firecrawl Map on `url`, then scrape up to N discovered article URLs.
 * Auto-detect: if the URL returns RSS/Atom XML, it is parsed as a feed even when type is `blog`.
 *
 * Human doc + log grep tokens: docs/systems/content-library-fetch-source-feeds.md
 *
 * Env (optional, for launch backfills — see docs):
 * - FETCH_FEEDS_MAX_SOURCES (default 5, max 40)
 * - FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE (default 2, max 25)
 * - FETCH_FEEDS_ARTICLE_DELAY_MS (default 2000, max 60000; 0 = no pause)
 */

function parseEnvInt(name: string, defaultVal: number, min: number, max: number): number {
  const raw = Deno.env.get(name);
  if (raw === undefined || raw === "") return defaultVal;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return defaultVal;
  return Math.min(max, Math.max(min, n));
}

// ── Firecrawl scraper ──

async function scrapeWithFirecrawl(url: string, apiKey: string, log: (msg: string) => void): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true, // Skip navs, footers, sidebars
        timeout: 15000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      log(`Firecrawl error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    if (!data.success || !data.data?.markdown) {
      log(`Firecrawl returned no content for ${url}`);
      return null;
    }

    // Full markdown for attribution parsing + structure excerpt (head/tail) below.
    // Do **not** truncate here — a 4k cap dropped SNI's "First published on …" header on long pages
    // and made `inferOriginalUrlFromAttributionFooter` miss Substack links while picking body URLs.
    const markdown = String(data.data.markdown);
    const maxChars = 200_000;
    return markdown.length > maxChars ? markdown.slice(0, maxChars) : markdown;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      log(`Firecrawl timeout for ${url}`);
    } else {
      log(`Firecrawl error: ${e}`);
    }
    return null;
  }
}

// ── Perplexity search fallback ──

async function searchWithPerplexity(
  sourceName: string,
  sourceUrl: string,
  category: string,
  apiKey: string,
  log: (msg: string) => void,
): Promise<{ content: string; citations: string[]; usage?: PerplexityUsage; searchMs: number } | null> {
  const t0 = Date.now();
  try {
    const searchPrompt = category === "signal"
      ? `Find the most profound or recent philosophical essay or insight from ${sourceName}. Look at ${sourceUrl}. Return ONE specific essay with its title, main argument in 2-3 sentences, and a memorable quote if available.`
      : `Find a specific research paper or finding from ${sourceName} about behavioral finance, investor psychology, or decision-making. Return ONE specific finding with the researcher name, year, and key result.`;

    let hostname = "";
    try { hostname = new URL(sourceUrl).hostname.replace(/^www\./, ""); } catch { /* ignore */ }

    const result = await callPerplexityChat(
      {
        model: "sonar",
        messages: [
          { role: "system", content: `You find specific content from ${sourceName}. Be precise — return the actual title, author, and key ideas.` },
          { role: "user", content: searchPrompt },
        ],
        ...(hostname ? { search_domain_filter: [hostname] } : {}),
      },
      apiKey,
      log,
      15_000,
    );
    return {
      content: result.content,
      citations: result.citations,
      usage: result.usage,
      searchMs: Date.now() - t0,
    };
  } catch (e) {
    log(`Perplexity error: ${e}`);
    return null;
  }
}

type SourceRow = { id: string; name: string; type: string; url: string; category: string };

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  const hzLog = (msg: string) => holzenEdgeLog("fetch-feeds", msg, { ms: Date.now() - t0 });

  try {
    holzenEdgeRun("fetch-feeds", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("fetch-feeds", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    holzenEdgeRun("fetch-feeds", "auth ok");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey, { auth: { persistSession: false } });
    const logAttempt = createAttemptLogger(supabase);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      holzenEdgeError("fetch-feeds", "Missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!FIRECRAWL_API_KEY && !PERPLEXITY_API_KEY) {
      holzenEdgeError("fetch-feeds", "Need FIRECRAWL_API_KEY or PERPLEXITY_API_KEY");
      return new Response(JSON.stringify({ error: "Need either FIRECRAWL_API_KEY or PERPLEXITY_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const scrapeMode = FIRECRAWL_API_KEY ? "firecrawl" : "perplexity";
    const maxSources = parseEnvInt("FETCH_FEEDS_MAX_SOURCES", 5, 1, 40);
    const maxArticlesPerSource = parseEnvInt("FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE", 2, 1, 25);
    const articleDelayMs = parseEnvInt("FETCH_FEEDS_ARTICLE_DELAY_MS", 2000, 0, 60_000);
    hzLog(`scrape mode: ${scrapeMode}; limits: sources=${maxSources} articles/source=${maxArticlesPerSource} delayMs=${articleDelayMs}`);

    // Active sources: stalest first so all rows rotate across cron runs (requires last_fetch_feeds_at migration).
    const { data: sources } = await supabase
      .from("signal_sources")
      .select("id, name, type, url, category")
      .not("url", "is", null)
      .eq("demoted_for_live", false)
      .order("last_fetch_feeds_at", { ascending: true, nullsFirst: true });

    if (!sources || sources.length === 0) {
      holzenEdgeRun("fetch-feeds", "fetch_feeds_batch", { sourcesTotal: 0, toProcess: 0, mode: scrapeMode });
      hzLog("no sources with URLs");
      return new Response(JSON.stringify({ fetched: 0, mode: scrapeMode }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: string[] = [];
    let fetched = 0;

    /** Strip trailing punctuation often glued to URLs in markdown/HTML. */
    function stripUrlTrailingJunk(u: string): string {
      return u.replace(/[.,;:!?)>\]]+$/g, "");
    }

    /** Last start index of `phrase` in `lower`, or -1. */
    function lastIndexOfPhrase(lower: string, phrase: string): number {
      let lastIdx = -1;
      let searchFrom = 0;
      while (true) {
        const i = lower.indexOf(phrase, searchFrom);
        if (i === -1) break;
        lastIdx = i;
        searchFrom = i + 1;
      }
      return lastIdx;
    }

    /** Hosts that appear in legal/semantic boilerplate — never use as canonical original_url. */
    const ORIGINAL_URL_SKIP_HOSTS = new Set([
      "creativecommons.org",
      "www.w3.org",
      "validator.w3.org",
    ]);

    /**
     * Citations in body often link here; not a reliable “original publication” for syndicated mempool
     * pieces (false positives like unrelated Ethereum articles).
     */
    const ORIGINAL_URL_DEPRIORITIZE_HOSTS = new Set(["hackernoon.com"]);

    /** Prefer Substack/Medium/personal domains over generic tech blogs when multiple URLs appear. */
    function scoreOriginalUrlHost(hostname: string): number {
      const h = hostname.replace(/^www\./, "").toLowerCase();
      if (ORIGINAL_URL_DEPRIORITIZE_HOSTS.has(h)) return 5;
      if (h.endsWith("substack.com")) return 100;
      if (h === "medium.com" || h.endsWith(".medium.com")) return 85;
      if (h.endsWith("wordpress.com")) return 75;
      return 40;
    }

    /**
     * Best external https URL in `window` (not the syndicated page host), by score then document order.
     */
    function bestExternalCanonicalUrl(window: string, syndHost: string): string | null {
      const urlRe = /https?:\/\/[^\s\)\]<>"]+/gi;
      type Cand = { url: string; score: number; pos: number };
      const cands: Cand[] = [];
      let m: RegExpExecArray | null;
      while ((m = urlRe.exec(window)) !== null) {
        const u = stripUrlTrailingJunk(m[0]);
        try {
          const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
          if (h === syndHost) continue;
          if (ORIGINAL_URL_SKIP_HOSTS.has(h)) continue;
          if (ORIGINAL_URL_DEPRIORITIZE_HOSTS.has(h)) continue;
          cands.push({ url: u, score: scoreOriginalUrlHost(h), pos: m.index });
        } catch {
          continue;
        }
      }
      if (cands.length === 0) return null;
      cands.sort((a, b) => (b.score - a.score) || (a.pos - b.pos));
      return cands[0].url;
    }

    /** Match bylines like “First published on …” before loose “first published” in blockquotes. */
    const ATTRIBUTION_MARKERS_SPECIFIC = [
      "first published on",
      "originally published on",
      "originally published at",
      "reprinted from",
    ] as const;

    const ATTRIBUTION_MARKERS_GENERIC = ["first published", "originally published"] as const;

    /** Leftmost of `markers` in lower[0..rangeEnd), or -1. */
    function firstIndexOfAnyMarker(lower: string, markers: readonly string[], rangeEnd: number): number {
      const slice = lower.slice(0, rangeEnd);
      let best = -1;
      for (const phrase of markers) {
        const idx = slice.indexOf(phrase);
        if (idx !== -1 && (best === -1 || idx < best)) best = idx;
      }
      return best;
    }

    /** Rightmost occurrence among `markers` in full `lower`. */
    function lastIndexOfAnyMarker(lower: string, markers: readonly string[]): number {
      let best = -1;
      for (const phrase of markers) {
        const idx = lastIndexOfPhrase(lower, phrase);
        if (idx > best) best = idx;
      }
      return best;
    }

    function tryInferAtPhraseStart(markdown: string, syndHost: string, phraseStartIdx: number): string | null {
      const narrow = markdown.slice(phraseStartIdx, phraseStartIdx + 1200);
      const fromNarrow = bestExternalCanonicalUrl(narrow, syndHost);
      if (fromNarrow) return fromNarrow;
      const wide = markdown.slice(phraseStartIdx, phraseStartIdx + 4500);
      return bestExternalCanonicalUrl(wide, syndHost);
    }

    /**
     * Infer canonical `original_url` from syndication **attribution** lines only (never arbitrary body links).
     *
     * SNI (Next.js) puts "First published on …" in the **article header** (often a Substack URL). We
     * **prefer the first** attribution phrase in the opening of the page so we do not pick a later
     * phrase + wrong URL (e.g. an inline citation to hackernoon.com). If that fails, we fall back to
     * the **last** phrase in the full text (footer-style originals).
     *
     * Requires **untruncated** scrape text — truncating to a few KB previously dropped the header line.
     */
    function inferOriginalUrlFromAttributionFooter(markdown: string, syndicatedArticleUrl: string): string | null {
      let syndHost: string;
      try {
        syndHost = new URL(syndicatedArticleUrl).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return null;
      }
      const lower = markdown.toLowerCase();
      const headerCap = Math.min(lower.length, 16_000);
      // Prefer “first published on …” over bare “first published” (quotes can contain the latter first).
      let headerIdx = firstIndexOfAnyMarker(lower, ATTRIBUTION_MARKERS_SPECIFIC, headerCap);
      if (headerIdx === -1) {
        headerIdx = firstIndexOfAnyMarker(lower, ATTRIBUTION_MARKERS_GENERIC, headerCap);
      }
      if (headerIdx !== -1) {
        const fromHeader = tryInferAtPhraseStart(markdown, syndHost, headerIdx);
        if (fromHeader) return fromHeader;
      }
      let footerIdx = lastIndexOfAnyMarker(lower, ATTRIBUTION_MARKERS_SPECIFIC);
      if (footerIdx === -1) footerIdx = lastIndexOfAnyMarker(lower, ATTRIBUTION_MARKERS_GENERIC);
      if (footerIdx === -1) return null;
      return tryInferAtPhraseStart(markdown, syndHost, footerIdx);
    }

    /** `original_url` must point off-site; same hostname as the syndicated page is never a valid “original.” */
    function sanitizeCrossSiteOriginalUrl(candidate: string | null, syndicatedArticleUrl: string): string | null {
      if (!candidate) return null;
      try {
        const ah = new URL(syndicatedArticleUrl).hostname.replace(/^www\./, "").toLowerCase();
        const oh = new URL(candidate).hostname.replace(/^www\./, "").toLowerCase();
        if (oh === ah) return null;
      } catch {
        return null;
      }
      return candidate;
    }

    function isDeprioritizedOriginalHost(hostname: string): boolean {
      return ORIGINAL_URL_DEPRIORITIZE_HOSTS.has(hostname.replace(/^www\./, "").toLowerCase());
    }

    function safeUrlHost(u: string): string {
      try {
        return new URL(u).hostname.replace(/^www\./, "");
      } catch {
        return "?";
      }
    }

    type FeedDiscovery =
      | "rss_feed"
      | "rss_feed_empty"
      | "site_map"
      | "site_map_fallback_single"
      | "single_page";

    async function resolveArticleRefs(
      source: SourceRow,
    ): Promise<{ refs: FeedArticleRef[]; discovery: FeedDiscovery }> {
      if (!source.url) return { refs: [], discovery: "single_page" };

      if (isExplicitSiteMapSourceType(source.type)) {
        if (!FIRECRAWL_API_KEY) {
          hzLog(`${source.name}: site_map requires FIRECRAWL_API_KEY`);
          return { refs: [{ url: source.url, feedAuthor: null }], discovery: "site_map_fallback_single" };
        }
        const mapped = await firecrawlMapArticleUrls(source.url, FIRECRAWL_API_KEY, hzLog);
        if (mapped.length > 0) {
          hzLog(`map: ${mapped.length} candidate URLs for ${source.name}`);
          return { refs: mapped.map((url) => ({ url, feedAuthor: null })), discovery: "site_map" };
        }
        hzLog(`map: empty, falling back to single URL for ${source.name}`);
        return { refs: [{ url: source.url, feedAuthor: null }], discovery: "site_map_fallback_single" };
      }

      const feedXml = await fetchFeedXmlIfApplicable(source.url, hzLog);
      if (feedXml) {
        const refs = parseArticleRefsFromFeedXml(feedXml, source.url);
        if (refs.length > 0) {
          hzLog(`rss/atom: ${refs.length} item links for ${source.name}`);
          return { refs, discovery: "rss_feed" };
        }
        if (isExplicitFeedSourceType(source.type)) {
          hzLog(`${source.name}: explicit rss/feed type but no links parsed`);
          return { refs: [], discovery: "rss_feed_empty" };
        }
      } else if (isExplicitFeedSourceType(source.type)) {
        hzLog(`${source.name}: url is not RSS/Atom XML`);
        return { refs: [], discovery: "rss_feed_empty" };
      }

      return { refs: [{ url: source.url, feedAuthor: null }], discovery: "single_page" };
    }

    async function ingestArticle(
      source: SourceRow,
      articleRef: FeedArticleRef,
      discovery: FeedDiscovery,
    ): Promise<"inserted" | "skipped" | "failed"> {
      const articleUrl = articleRef.url;
      const contentType = source.category === "signal" ? "essay" : "paper";

      const preUrlCandidates = urlDedupCandidates(articleUrl);
      if (preUrlCandidates.length > 0) {
        const { data: existingPre } = await supabase
          .from("content_library")
          .select("id")
          .eq("type", contentType)
          .eq("active", true)
          .in("url", preUrlCandidates)
          .limit(1);
        if (existingPre && existingPre.length > 0) {
          results.push(`${source.name}: URL already in library (skipped before scrape)`);
          holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
            ms: Date.now() - t0,
            outcome: "skipped",
            reason: "dedup_url_pre_scrape",
            source: source.name,
            discovery,
            urlHost: safeUrlHost(articleUrl),
          });
          return "skipped";
        }
      }

      let scrapedContent: string | null = null;
      let citations: string[] = [];

      if (scrapeMode === "firecrawl") {
        scrapedContent = await scrapeWithFirecrawl(articleUrl, FIRECRAWL_API_KEY!, hzLog);
        if (scrapedContent) citations = [articleUrl];
      }

      if (!scrapedContent && PERPLEXITY_API_KEY) {
        const searchResult = await searchWithPerplexity(source.name, articleUrl, source.category, PERPLEXITY_API_KEY, hzLog);
        if (searchResult) {
          scrapedContent = searchResult.content;
          citations = searchResult.citations;
          if (searchResult.usage) {
            logAttempt({
              companion_type: "source_feed",
              provider: "perplexity",
              model: "sonar",
              status: "success",
              latency_ms: searchResult.searchMs,
              input_tokens: searchResult.usage.prompt_tokens,
              output_tokens: searchResult.usage.completion_tokens,
              api_requests: 1,
            });
          }
        }
      }

      if (!scrapedContent) {
        results.push(`${source.name} (${articleUrl.slice(0, 48)}…): no content`);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
          ms: Date.now() - t0,
          outcome: "failed",
          phase: "scrape",
          source: source.name,
          discovery,
          urlHost: safeUrlHost(articleUrl),
        });
        return "failed";
      }

      const feedAuthor = articleRef.feedAuthor;
      const authorHint = feedAuthor
        ? `The syndicating feed lists the writer as "${feedAuthor}" — use that as "author" unless the page text clearly names someone else as the author.`
        : "";

      const structurePrompt = contentType === "essay"
        ? `Extract the ONE most compelling essay or insight from this page (published on ${source.name}). ${authorHint}
Return JSON with:
- title (string)
- author (string): the **human writer/byline**, not the website or institute name unless they are literally the author.
- summary (2-3 sentences)
- key_quote (optional string): a real quote from the text only — do NOT fabricate.
- url (string): MUST be exactly this page URL: ${citations[0] || articleUrl}
- original_url (optional string): if the article says it was "first published" elsewhere, or a link points to the primary source, set that full https URL (any domain — e.g. dergigi.com, HackerNoon, Substack, Medium). Must differ from the page URL when this is a republish/syndication. Check the **byline/header** and the **end** of the content for "First published on …" lines. Otherwise omit.
- original_publication (optional string): human name of that outlet (e.g. "dergigi.com", "HackerNoon") if clear from the text; otherwise omit.`
        : `Extract ONE specific research finding from this content. Return JSON with: title, author, summary (2-3 sentences), citation (Author (Year), Title format), finding (key result in plain language), url (use: ${citations[0] || articleUrl}).`;

      const structureT0 = Date.now();
      const structureExcerpt = contentType === "essay" && scrapedContent.length > 8000
        ? `${scrapedContent.slice(0, 4500)}\n\n[...middle omitted...]\n\n${scrapedContent.slice(-4000)}`
        : scrapedContent.slice(0, 6000);

      const structureRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: structurePrompt },
            { role: "user", content: `Source: ${source.name}\nURL: ${articleUrl}\n\nContent:\n${structureExcerpt}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!structureRes.ok) {
        results.push(`${source.name}: structure error ${structureRes.status}`);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
          ms: Date.now() - t0,
          outcome: "failed",
          phase: "structure",
          source: source.name,
          discovery,
          status: structureRes.status,
          urlHost: safeUrlHost(articleUrl),
        });
        return "failed";
      }

      const structureData = await structureRes.json();
      const structUsage = structureData.usage;
      logAttempt({
        companion_type: "source_feed",
        provider: "lovable",
        model: "google/gemini-2.5-flash-lite",
        status: "success",
        latency_ms: Date.now() - structureT0,
        input_tokens: structUsage?.prompt_tokens,
        output_tokens: structUsage?.completion_tokens,
      });
      const raw = structureData.choices?.[0]?.message?.content;
      if (!raw) {
        results.push(`${source.name}: empty structure`);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
          ms: Date.now() - t0,
          outcome: "failed",
          phase: "structure_empty",
          source: source.name,
          discovery,
          urlHost: safeUrlHost(articleUrl),
        });
        return "failed";
      }

      let entry: Record<string, unknown>;
      try {
        entry = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        results.push(`${source.name}: JSON parse error`);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
          ms: Date.now() - t0,
          outcome: "failed",
          phase: "json_parse",
          source: source.name,
          discovery,
          urlHost: safeUrlHost(articleUrl),
        });
        return "failed";
      }
      if (typeof entry.title !== "string" || typeof entry.summary !== "string") {
        results.push(`${source.name}: invalid structure`);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
          ms: Date.now() - t0,
          outcome: "failed",
          phase: "invalid_fields",
          source: source.name,
          discovery,
          urlHost: safeUrlHost(articleUrl),
        });
        return "failed";
      }

      const resolvedUrl = String(entry.url || citations[0] || articleUrl || "");
      const urlCandidates = urlDedupCandidates(resolvedUrl);
      if (urlCandidates.length > 0) {
        const { data: byUrl } = await supabase
          .from("content_library")
          .select("id")
          .eq("type", contentType)
          .eq("active", true)
          .in("url", urlCandidates)
          .limit(1);
        if (byUrl && byUrl.length > 0) {
          results.push(`${source.name}: URL already in content_library`);
          holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
            ms: Date.now() - t0,
            outcome: "skipped",
            reason: "dedup_url",
            source: source.name,
            discovery,
            title: String(entry.title).slice(0, 80),
            urlHost: safeUrlHost(articleUrl),
          });
          return "skipped";
        }
      }

      const titleNorm = normalizeTitleKey(entry.title);
      const { data: byNorm } = await supabase
        .from("content_library")
        .select("id")
        .eq("type", contentType)
        .eq("active", true)
        .eq("title_norm", titleNorm)
        .limit(1);
      if (byNorm && byNorm.length > 0) {
        results.push(`${source.name}: same normalized title already in content_library`);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
          ms: Date.now() - t0,
          outcome: "skipped",
          reason: "dedup_title_norm",
          source: source.name,
          discovery,
          title: String(entry.title).slice(0, 80),
          urlHost: safeUrlHost(articleUrl),
        });
        return "skipped";
      }

      const storedUrl = canonicalContentUrl(resolvedUrl) ?? (resolvedUrl.trim() || null);

      let originalUrl: string | null = typeof entry.original_url === "string" ? entry.original_url.trim() : null;
      let originalPublication: string | null =
        typeof entry.original_publication === "string" ? entry.original_publication.trim() : null;
      if (contentType === "essay") {
        if (originalUrl) {
          originalUrl = sanitizeCrossSiteOriginalUrl(originalUrl, articleUrl);
        }
        if (originalUrl) {
          try {
            if (isDeprioritizedOriginalHost(new URL(originalUrl).hostname)) originalUrl = null;
          } catch {
            originalUrl = null;
          }
        }
        if (!originalUrl) originalPublication = null;
        if (!originalUrl) {
          const fromFooter = inferOriginalUrlFromAttributionFooter(scrapedContent, articleUrl);
          if (fromFooter) originalUrl = fromFooter;
        }
        if (originalUrl) {
          originalUrl = canonicalContentUrl(originalUrl) ?? originalUrl;
        }
        if (originalUrl && !originalPublication) {
          try {
            originalPublication = new URL(originalUrl).hostname.replace(/^www\./, "");
          } catch {
            /* keep null */
          }
        }
      }

      const insertData: Record<string, unknown> = {
        type: contentType,
        title: entry.title,
        author: (typeof entry.author === "string" ? entry.author : null) || feedAuthor || source.name,
        summary: entry.summary,
        url: storedUrl,
        tags: [source.category, source.name.toLowerCase().replace(/\s+/g, "-")],
        companion_types: [source.category === "signal" ? "signal" : "ground_nudge"],
        language: "en",
        quality_score: 2,
      };

      if (contentType === "essay") {
        insertData.key_quote = typeof entry.key_quote === "string" ? entry.key_quote : null;
        if (originalUrl) insertData.original_url = originalUrl;
        if (originalPublication) insertData.original_publication = originalPublication;
      } else {
        insertData.citation = typeof entry.citation === "string" ? entry.citation : null;
        insertData.finding = typeof entry.finding === "string" ? entry.finding : null;
      }

      await supabase.from("content_library").insert(insertData);
      results.push(`${source.name}: added "${entry.title}" (via ${scrapeMode})`);
      fetched++;
      holzenEdgeLog("fetch-feeds", "fetch_feeds_article", {
        ms: Date.now() - t0,
        outcome: "inserted",
        source: source.name,
        discovery,
        title: String(entry.title).slice(0, 80),
        urlHost: safeUrlHost(articleUrl),
        feedAuthorHint: Boolean(feedAuthor),
        originalUrlStored: Boolean(originalUrl),
        originalPublicationStored: Boolean(originalPublication),
        scrapeMode,
      });
      return "inserted";
    }

    const toProcess = sources.slice(0, maxSources) as SourceRow[];
    holzenEdgeRun("fetch-feeds", "fetch_feeds_batch", {
      sourcesTotal: sources.length,
      toProcess: toProcess.length,
      maxArticlesPerSource,
      articleDelayMs,
      mode: scrapeMode,
    });

    for (const source of toProcess) {
      try {
        if (!source.url) continue;
        const sourceNorm: SourceRow = { ...source, url: normalizeSourceUrl(source.url) };
        if (sourceNorm.url !== source.url) {
          hzLog(`normalized URL (trim/trailing-dot fix): ${source.url} → ${sourceNorm.url}`);
        }
        hzLog(`processing: ${source.name} (${sourceNorm.url})`);

        const { refs: articlePool, discovery } = await resolveArticleRefs(sourceNorm);
        holzenEdgeLog("fetch-feeds", "fetch_feeds_discover", {
          ms: Date.now() - t0,
          source: sourceNorm.name,
          sourceType: sourceNorm.type,
          discovery,
          poolSize: articlePool.length,
          feedAuthorsInPool: articlePool.filter((r) => r.feedAuthor).length,
        });

        const maxAttempts = Math.min(articlePool.length, 30);
        let insertedForSource = 0;

        for (let i = 0; i < maxAttempts && insertedForSource < maxArticlesPerSource; i++) {
          const articleRef = articlePool[i]!;
          const outcome = await ingestArticle(sourceNorm, articleRef, discovery);
          if (outcome === "inserted") insertedForSource++;
          if (
            articleDelayMs > 0 && i + 1 < maxAttempts && insertedForSource < maxArticlesPerSource
          ) {
            await new Promise((r) => setTimeout(r, articleDelayMs));
          }
        }

        await supabase
          .from("signal_sources")
          .update({ last_fetch_feeds_at: new Date().toISOString() })
          .eq("id", sourceNorm.id);
      } catch (e) {
        results.push(`${source.name}: ${e}`);
        holzenEdgeWarn("fetch-feeds", "fetch_feeds_source_error", { source: source.name, err: String(e) });
      }
    }

    holzenEdgeRun("fetch-feeds", "fetch_feeds_complete", {
      ms: Date.now() - t0,
      fetched,
      sourcesTried: toProcess.length,
      mode: scrapeMode,
      resultsLines: results.length,
    });
    return new Response(JSON.stringify({ fetched, mode: scrapeMode, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    holzenEdgeError("fetch-feeds", "uncaught error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
