import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createAttemptLogger } from "../_shared/observe.ts";
import {
  canonicalContentUrl,
  filterArticleRefsNotInLibrary,
  normalizeTitleKey,
  urlDedupCandidates,
} from "../_shared/content-dedup.ts";
import { callPerplexityChat, type PerplexityUsage } from "../_shared/perplexity-client.ts";
import { unknownErrorForLog } from "../_shared/log-unknown-error.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";
import {
  fetchFeedXmlIfApplicable,
  type FeedArticleRef,
  firecrawlMapArticleUrls,
  isExplicitFeedSourceType,
  isExplicitSiteMapSourceType,
  normalizeSourceUrl,
  parseArticleRefsFromFeedXml,
  sortFeedArticleRefsByPublishedAtDesc,
} from "../_shared/feed-ingest.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Active Source Feeds — fetches latest content from signal_sources URLs.
 *
 * Uses Firecrawl `/v2/scrape` (markdown + links + page metadata), then Gemini to
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

/** One v2/scrape response: markdown for Gemini + structured fields for original_url fallbacks. */
type FirecrawlScrapeResult = {
  markdown: string;
  metadata: Record<string, unknown> | null;
  /** Normalized https URLs from the `links` format (see Firecrawl docs). */
  links: string[];
};

function normalizeFirecrawlScrapeLinks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") out.push(item);
    else if (item && typeof item === "object" && "url" in item && typeof (item as { url: string }).url === "string") {
      out.push((item as { url: string }).url);
    }
  }
  return out;
}

async function scrapeWithFirecrawl(
  url: string,
  apiKey: string,
  log: (msg: string) => void,
  opts?: { onlyMainContent?: boolean },
  incoming?: Request,
): Promise<FirecrawlScrapeResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(
      "https://api.firecrawl.dev/v2/scrape",
      fetchInitWithIncomingTrace(incoming, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown", "links"],
          onlyMainContent: opts?.onlyMainContent ?? true,
          timeout: 15000,
        }),
        signal: controller.signal,
      }),
    );
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      log(`Firecrawl error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as {
      success?: boolean;
      data?: { markdown?: string; links?: unknown; metadata?: Record<string, unknown> };
    };
    if (!data.success || !data.data?.markdown) {
      log(`Firecrawl returned no content for ${url}`);
      return null;
    }

    // Full markdown for attribution parsing + structure excerpt (head/tail) below.
    // Do **not** truncate here — a 4k cap dropped SNI's "First published on …" header on long pages
    // and made `inferOriginalUrlFromAttributionFooter` miss Substack links while picking body URLs.
    const markdown = String(data.data.markdown);
    const maxChars = 200_000;
    const md = markdown.length > maxChars ? markdown.slice(0, maxChars) : markdown;
    const meta = data.data.metadata && typeof data.data.metadata === "object" ? data.data.metadata : null;
    const links = normalizeFirecrawlScrapeLinks(data.data.links);
    return { markdown: md, metadata: meta, links };
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

serve(
  withRequestLogging("fetch-source-feeds", async ({ req, log }) => {
  const t0 = Date.now();
  const hzLog = (msg: string) =>
    log("fetch_feeds_progress", {
      holzen_event: "fetch_feeds_cron",
      phase: "progress",
      message: msg,
      ms: Date.now() - t0,
    });

  try {
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      log.warn("fetch_feeds_phase", {
        holzen_event: "fetch_feeds_cron",
        phase: "service_auth_rejected",
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    log("fetch_feeds_phase", {
      holzen_event: "fetch_feeds_cron",
      phase: "service_auth_ok",
    });

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey, { auth: { persistSession: false } });
    const logAttempt = createAttemptLogger(supabase);

    // Feature flag + global budget guard. On block, return a no-op so the
    // cron keeps advancing through its schedule without error.
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const feedsGuard = await guardAiFeature(supabase, "fetch_source_feeds", {
      providers: ["lovable"],
    });
    if (!feedsGuard.allowed) {
      hzLog(`fetch-feeds skipped: ${feedsGuard.reason}`);
      return new Response(
        JSON.stringify({ skipped: true, reason: feedsGuard.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      log.error("fetch_feeds_config", {
        holzen_event: "fetch_feeds_cron",
        phase: "missing_lovable_api_key",
      });
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!FIRECRAWL_API_KEY && !PERPLEXITY_API_KEY) {
      log.error("fetch_feeds_config", {
        holzen_event: "fetch_feeds_cron",
        phase: "missing_scrape_keys",
      });
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
      log("fetch_feeds_batch", {
        holzen_event: "fetch_feeds_cron",
        phase: "fetch_feeds_batch",
        sources_total: 0,
        to_process: 0,
        mode: scrapeMode,
      });
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

    type OriginalInferDebug = {
      path: string;
      phrase: string | null;
      afterPhraseOffset: number | null;
      tightChars: number;
      wideChars: number;
      usedWide: boolean;
      candidateCount: number;
      /** host@distanceAfterPhrase for up to 8 candidates, closest first */
      candidatesPreview: string[];
      chosen: string | null;
      chosenDistanceAfterPhrase: number | null;
      /** Set when path is no_marker — helps see if wording differed from our list */
      noMarkerHint?: { hasPublished: boolean; hasFirst: boolean; headerScannedChars: number };
    };

    /**
     * External https URLs in `slice` with start offset relative to **after-phrase** origin (0 = first char after the attribution phrase).
     */
    function collectExternalUrlsAfterPhrase(slice: string, syndHost: string): { url: string; dist: number; host: string }[] {
      const urlRe = /https?:\/\/[^\s)\]<>"]+/gi;
      const out: { url: string; dist: number; host: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = urlRe.exec(slice)) !== null) {
        const u = stripUrlTrailingJunk(m[0]);
        try {
          const h = new URL(u).hostname.replace(/^www\./, "").toLowerCase();
          if (h === syndHost) continue;
          if (ORIGINAL_URL_SKIP_HOSTS.has(h)) continue;
          out.push({ url: u, dist: m.index, host: h });
        } catch {
          continue;
        }
      }
      return out;
    }

    /**
     * Pick the external URL **closest to the end of the attribution phrase** (minimum character distance in
     * the scraped text after the phrase). Syndication bylines put the canonical link first; unrelated citations
     * in quotes appear later — no per-domain blocklist required.
     */
    function pickOriginalUrlAfterPhrase(
      markdown: string,
      syndHost: string,
      phraseStartIdx: number,
      matchedPhrase: string,
      tightMax: number,
      wideMax: number,
    ): { url: string | null; debug: OriginalInferDebug } {
      const afterPhrase = phraseStartIdx + matchedPhrase.length;
      const tightSlice = markdown.slice(afterPhrase, afterPhrase + tightMax);
      let cands = collectExternalUrlsAfterPhrase(tightSlice, syndHost);
      let usedWide = false;
      if (cands.length === 0) {
        const wideSlice = markdown.slice(afterPhrase, afterPhrase + wideMax);
        cands = collectExternalUrlsAfterPhrase(wideSlice, syndHost);
        usedWide = true;
      }
      cands.sort((a, b) => a.dist - b.dist);
      const best = cands[0];
      const preview = cands.slice(0, 8).map((c) => `${c.host}@${c.dist}`);
      const emptyDebug = (path: string): OriginalInferDebug => ({
        path,
        phrase: matchedPhrase,
        afterPhraseOffset: afterPhrase,
        tightChars: tightMax,
        wideChars: wideMax,
        usedWide,
        candidateCount: cands.length,
        candidatesPreview: preview,
        chosen: best?.url ?? null,
        chosenDistanceAfterPhrase: best?.dist ?? null,
      });
      if (!best) {
        return { url: null, debug: emptyDebug("no_candidates") };
      }
      return { url: best.url, debug: emptyDebug(usedWide ? "after_phrase_wide" : "after_phrase_tight") };
    }

    /**
     * Normalize scraped text for phrase matching only. Replacements are 1:1 UTF-16 code units so indices
     * stay aligned with `markdown` for slicing (smart quotes/dashes break naive `indexOf("first published on")`).
     */
    function normalizePhraseHaystack(s: string): string {
      return s
        .replace(/\u2019|\u2018/g, "'")
        .replace(/\u201c|\u201d/g, '"')
        .replace(/[\u2010-\u2015]/g, "-");
    }

    /** Match bylines like “First published on …” before loose “first published” in blockquotes. */
    const ATTRIBUTION_MARKERS_SPECIFIC = [
      "first published on",
      "originally published on",
      "originally published at",
      "reprinted from",
      "republished from",
      "first posted on",
      "originally posted on",
      "first appeared on",
      "originally appeared on",
      "cross-posted from",
      "cross posted from",
    ] as const;

    const ATTRIBUTION_MARKERS_GENERIC = ["first published", "originally published"] as const;

    /** Earliest match among `markers` in lower[0..rangeEnd). */
    function firstPhraseMatch(
      lower: string,
      markers: readonly string[],
      rangeEnd: number,
    ): { idx: number; phrase: string } | null {
      const slice = lower.slice(0, rangeEnd);
      let best: { idx: number; phrase: string } | null = null;
      for (const phrase of markers) {
        const idx = slice.indexOf(phrase);
        if (idx === -1) continue;
        if (!best || idx < best.idx) best = { idx, phrase };
      }
      return best;
    }

    /** Latest (rightmost) match among `markers` in full `lower`. */
    function lastPhraseMatch(lower: string, markers: readonly string[]): { idx: number; phrase: string } | null {
      let best: { idx: number; phrase: string } | null = null;
      for (const phrase of markers) {
        const idx = lastIndexOfPhrase(lower, phrase);
        if (idx === -1) continue;
        if (!best || idx > best.idx) best = { idx, phrase };
      }
      return best;
    }

    /**
     * Infer canonical `original_url` from text **after** syndication attribution phrases. Chooses the
     * external URL with minimum distance from the end of the matched phrase (byline link first).
     *
     * Requires untruncated scrape text.
     */
    function inferOriginalUrlFromAttributionFooter(
      markdown: string,
      syndicatedArticleUrl: string,
    ): { url: string | null; debug: OriginalInferDebug | null } {
      const TIGHT = 450;
      const WIDE = 5200;
      let syndHost: string;
      try {
        syndHost = new URL(syndicatedArticleUrl).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return { url: null, debug: null };
      }
      const lower = normalizePhraseHaystack(markdown.toLowerCase());
      const headerCap = Math.min(lower.length, 16_000);

      const headSpec = firstPhraseMatch(lower, ATTRIBUTION_MARKERS_SPECIFIC, headerCap);
      const headGen = firstPhraseMatch(lower, ATTRIBUTION_MARKERS_GENERIC, headerCap);
      const header = headSpec ?? headGen;

      if (header) {
        const r = pickOriginalUrlAfterPhrase(markdown, syndHost, header.idx, header.phrase, TIGHT, WIDE);
        r.debug.path = `${headSpec ? "header_specific" : "header_generic"}_${r.debug.path}`;
        if (r.url) return { url: r.url, debug: r.debug };
      }

      const footSpec = lastPhraseMatch(lower, ATTRIBUTION_MARKERS_SPECIFIC);
      const footGen = lastPhraseMatch(lower, ATTRIBUTION_MARKERS_GENERIC);
      /** Prefer specific syndication phrases; never pick a later generic body hit over an earlier specific byline (rightmost-of-both was wrong). */
      const footer = footSpec ?? footGen;

      if (!footer) {
        return {
          url: null,
          debug: {
            path: "no_marker",
            phrase: null,
            afterPhraseOffset: null,
            tightChars: TIGHT,
            wideChars: WIDE,
            usedWide: false,
            candidateCount: 0,
            candidatesPreview: [],
            chosen: null,
            chosenDistanceAfterPhrase: null,
            noMarkerHint: {
              hasPublished: lower.includes("published"),
              hasFirst: lower.includes("first "),
              headerScannedChars: headerCap,
            },
          },
        };
      }

      const r = pickOriginalUrlAfterPhrase(markdown, syndHost, footer.idx, footer.phrase, TIGHT, WIDE);
      const useSpec = footSpec && footer.idx === footSpec.idx && footer.phrase === footSpec.phrase;
      r.debug.path = `${useSpec ? "footer_specific" : "footer_generic"}_${r.debug.path}`;
      return { url: r.url, debug: r.debug };
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

    /**
     * Use Firecrawl `metadata` (canonical / Open Graph) when it points at another https host — common for
     * republishers that set `rel=canonical` or `og:url` to the primary article.
     */
    function tryOriginalUrlFromFirecrawlMetadata(
      metadata: Record<string, unknown> | null,
      syndicatedArticleUrl: string,
    ): { url: string | null; tried: string[] } {
      if (!metadata) return { url: null, tried: [] };
      let syndHost: string;
      try {
        syndHost = new URL(syndicatedArticleUrl).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return { url: null, tried: [] };
      }
      const tried: string[] = [];
      for (const key of ["canonicalUrl", "canonical", "ogUrl", "og:url"] as const) {
        const v = metadata[key];
        if (typeof v !== "string" || !v.startsWith("http")) continue;
        const cleaned = stripUrlTrailingJunk(v.trim());
        tried.push(`${key}`);
        try {
          const u = new URL(cleaned);
          if (u.protocol !== "https:") continue;
          const h = u.hostname.replace(/^www\./, "").toLowerCase();
          if (h === syndHost) continue;
          if (ORIGINAL_URL_SKIP_HOSTS.has(h)) continue;
          return { url: u.toString(), tried };
        } catch {
          continue;
        }
      }
      return { url: null, tried };
    }

    // Firecrawl `links` fallback removed: it picked the earliest external link in the body, which
    // is almost always a citation/reference — not an original publication. Articles without an
    // attribution byline or cross-site canonical are native content; original_url should stay null.

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
          return { refs: [{ url: source.url, feedAuthor: null, publishedAt: null }], discovery: "site_map_fallback_single" };
        }
        const mapped = await firecrawlMapArticleUrls(source.url, FIRECRAWL_API_KEY, hzLog);
        if (mapped.length > 0) {
          hzLog(`map: ${mapped.length} candidate URLs for ${source.name}`);
          return {
            refs: mapped.map((url) => ({ url, feedAuthor: null, publishedAt: null })),
            discovery: "site_map",
          };
        }
        hzLog(`map: empty, falling back to single URL for ${source.name}`);
        return { refs: [{ url: source.url, feedAuthor: null, publishedAt: null }], discovery: "site_map_fallback_single" };
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

      return { refs: [{ url: source.url, feedAuthor: null, publishedAt: null }], discovery: "single_page" };
    }

    async function ingestArticle(
      source: SourceRow,
      articleRef: FeedArticleRef,
      discovery: FeedDiscovery,
      opts?: { skipPreUrlDedup?: boolean },
    ): Promise<"inserted" | "skipped" | "failed"> {
      const articleUrl = articleRef.url;
      const contentType = source.category === "signal" ? "essay" : "paper";

      const preUrlCandidates = urlDedupCandidates(articleUrl);
      if (!opts?.skipPreUrlDedup && preUrlCandidates.length > 0) {
        const { data: existingPre } = await supabase
          .from("content_library")
          .select("id")
          .eq("type", contentType)
          .eq("active", true)
          .in("url", preUrlCandidates)
          .limit(1);
        if (existingPre && existingPre.length > 0) {
          results.push(`${source.name}: URL already in library (skipped before scrape)`);
          log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
      let firecrawlMetadata: Record<string, unknown> | null = null;

      if (scrapeMode === "firecrawl") {
        const fc = await scrapeWithFirecrawl(articleUrl, FIRECRAWL_API_KEY!, hzLog, {
          onlyMainContent: contentType !== "essay",
        }, req);
        if (fc) {
          scrapedContent = fc.markdown;
          firecrawlMetadata = fc.metadata;
          citations = [articleUrl];
          if (contentType === "essay") {
            const mdLower = fc.markdown.toLowerCase();
            const articleHost = safeUrlHost(articleUrl);
            const crossHostLinks = fc.links.filter((l) => {
              try { return new URL(l).hostname.replace(/^www\./, "").toLowerCase() !== articleHost; }
              catch { return false; }
            });
            log("fetch_feeds_scrape_payload", {
              holzen_event: "fetch_feeds_cron",
              ms: Date.now() - t0,
              urlHost: articleHost,
              mdChars: fc.markdown.length,
              mdHead: fc.markdown.slice(0, 800),
              mdTail: fc.markdown.slice(-400),
              metaKeys: fc.metadata ? Object.keys(fc.metadata) : null,
              metaCanonical: fc.metadata?.canonicalUrl ?? fc.metadata?.canonical ?? null,
              metaOgUrl: fc.metadata?.ogUrl ?? fc.metadata?.["og:url"] ?? null,
              linksCount: fc.links.length,
              crossHostLinksCount: crossHostLinks.length,
              crossHostLinksPreview: crossHostLinks.slice(0, 15),
              hasBylineFirstPublished: mdLower.includes("first published"),
              hasBylineOriginallyPublished: mdLower.includes("originally published"),
            });
          }
        }
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
        log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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

      const structureRes = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        fetchInitWithIncomingTrace(req, {
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
        }),
      );

      if (!structureRes.ok) {
        results.push(`${source.name}: structure error ${structureRes.status}`);
        log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
        log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
        log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
        log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
          log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
        log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
        const logOriginalResolution = Deno.env.get("FETCH_FEEDS_LOG_ORIGINAL_INFER") !== "false";
        const llmOriginalRaw = originalUrl;
        const llmOriginalSanitized = originalUrl
          ? sanitizeCrossSiteOriginalUrl(originalUrl, articleUrl)
          : null;

        /** Phrase-based URL from full markdown — deterministic for “First published on …” bylines; prefer over LLM (excerpt can confuse citations vs syndication). */
        const inferred = inferOriginalUrlFromAttributionFooter(scrapedContent, articleUrl);
        if (logOriginalResolution && inferred.debug) {
          log("fetch_feeds_original_infer", {
              holzen_event: "fetch_feeds_cron",
            ms: Date.now() - t0,
            urlHost: safeUrlHost(articleUrl),
            title: String(entry.title).slice(0, 80),
            ...inferred.debug,
          });
        }

        if (inferred.url) {
          originalUrl = inferred.url;
          originalPublication = null;
        } else {
          originalUrl = llmOriginalSanitized;
          if (llmOriginalRaw && !originalUrl) {
            log("fetch_feeds_original_llm_rejected", {
              holzen_event: "fetch_feeds_cron",
              ms: Date.now() - t0,
              urlHost: safeUrlHost(articleUrl),
              title: String(entry.title).slice(0, 80),
              reason: "same_host_as_article",
            });
          }
          if (!originalUrl) originalPublication = null;
        }

        if (!originalUrl && firecrawlMetadata) {
          const metaPick = tryOriginalUrlFromFirecrawlMetadata(firecrawlMetadata, articleUrl);
          const sanitized = metaPick.url ? sanitizeCrossSiteOriginalUrl(metaPick.url, articleUrl) : null;
          if (sanitized) {
            originalUrl = sanitized;
            if (logOriginalResolution) {
              log("fetch_feeds_original_firecrawl", {
              holzen_event: "fetch_feeds_cron",
                ms: Date.now() - t0,
                urlHost: safeUrlHost(articleUrl),
                title: String(entry.title).slice(0, 80),
                source: "metadata",
                chosen: sanitized,
                metadataKeysChecked: metaPick.tried,
              });
            }
          }
        }
        // Firecrawl `links` fallback removed — grabbing the first external body link was a
        // false-positive machine for native articles with normal citations/references.
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
      log("fetch_feeds_article", {
          holzen_event: "fetch_feeds_cron",
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
    log("fetch_feeds_batch", {
      holzen_event: "fetch_feeds_cron",
      phase: "fetch_feeds_batch_start",
      sources_total: sources.length,
      to_process: toProcess.length,
      max_articles_per_source: maxArticlesPerSource,
      article_delay_ms: articleDelayMs,
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
        const contentType = sourceNorm.category === "signal" ? "essay" : "paper";
        const batchDedup = await filterArticleRefsNotInLibrary(supabase, contentType, articlePool);
        let poolToIngest = batchDedup.batchQueryOk ? batchDedup.pending : articlePool;
        const skippedKnown = batchDedup.batchQueryOk ? batchDedup.skippedKnown : 0;
        if (discovery === "rss_feed") {
          poolToIngest = sortFeedArticleRefsByPublishedAtDesc(poolToIngest);
        }
        if (!batchDedup.batchQueryOk) {
          log.warn("fetch_feeds_batch", {
            holzen_event: "fetch_feeds_cron",
            phase: "batch_dedup_failed",
            source: sourceNorm.name,
            hint: "falling back to per-URL pre-scrape dedup",
          });
        }
        log("fetch_feeds_discover", {
          holzen_event: "fetch_feeds_cron",
          ms: Date.now() - t0,
          source: sourceNorm.name,
          sourceType: sourceNorm.type,
          discovery,
          poolSize: articlePool.length,
          poolPending: poolToIngest.length,
          poolSkippedKnown: skippedKnown,
          batchDedupOk: batchDedup.batchQueryOk,
          feedAuthorsInPool: articlePool.filter((r) => r.feedAuthor).length,
        });

        if (poolToIngest.length === 0) {
          hzLog(
            `${sourceNorm.name}: no new URLs to ingest (${skippedKnown} already in library, pool ${articlePool.length})`,
          );
        }

        const maxAttempts = Math.min(poolToIngest.length, 100);
        let insertedForSource = 0;

        for (let i = 0; i < maxAttempts && insertedForSource < maxArticlesPerSource; i++) {
          const articleRef = poolToIngest[i]!;
          const outcome = await ingestArticle(sourceNorm, articleRef, discovery, {
            skipPreUrlDedup: batchDedup.batchQueryOk,
          });
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
        log.warn("fetch_feeds_source", {
          holzen_event: "fetch_feeds_cron",
          phase: "source_error",
          source: source.name,
          err: String(e).slice(0, 500),
        });
      }
    }

    log("fetch_feeds_complete", {
      holzen_event: "fetch_feeds_cron",
      phase: "fetch_feeds_complete",
      ms: Date.now() - t0,
      fetched,
      sources_tried: toProcess.length,
      mode: scrapeMode,
      results_lines: results.length,
    });
    return new Response(JSON.stringify({ fetched, mode: scrapeMode, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("fetch_feeds_uncaught", {
      holzen_event: "fetch_feeds_cron",
      phase: "uncaught",
      ...unknownErrorForLog(e),
    });
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
