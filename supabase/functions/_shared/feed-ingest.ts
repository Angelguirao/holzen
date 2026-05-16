/**
 * Helpers for fetch-source-feeds: RSS/Atom link extraction and Firecrawl Map
 * so admins can register a feed URL or site root instead of one article at a time.
 *
 * Firecrawl docs: https://docs.firecrawl.dev/features/map — Map discovers URLs;
 * Scrape (used elsewhere) pulls markdown per page.
 */

import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";

const MAX_LINKS_FROM_FEED = 40;

/** Firecrawl Map `limit` — max raw URLs returned per request (see https://docs.firecrawl.dev/features/map). */
const FIRECRAWL_MAP_LIMIT = 500;
/** After scoring/filtering in `filterArticleLikeUrls`, keep this many URLs for the article pool (large indexes e.g. SNI Library). */
const MAX_ARTICLE_URLS_AFTER_FILTER = 200;

/**
 * Trim whitespace and fix a common paste error: a trailing "." after a path that
 * already ends in a feed-like extension (`.../atom.xml.` → `.../atom.xml`).
 * Also prepends `https://` when the value is missing a scheme (`example.com/feed.xml`),
 * which would otherwise make `fetch()` throw `TypeError: Invalid URL`.
 */
export function normalizeSourceUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return s;

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    try {
      if (s.startsWith("//")) {
        u = new URL(`https:${s}`);
      } else {
        u = new URL(`https://${s.replace(/^\/+/, "")}`);
      }
    } catch {
      return s;
    }
  }

  const p = u.pathname;
  if (/\.(atom|rss|xml|html|htm)\.$/i.test(p)) {
    u.pathname = p.slice(0, -1);
  }
  return u.href;
}

/** Types that mean "URL is an RSS/Atom feed" (explicit). */
export function isExplicitFeedSourceType(type: string | null | undefined): boolean {
  return type === "rss" || type === "feed";
}

/** Types that mean "URL is a site / section root — discover articles via Map". */
export function isExplicitSiteMapSourceType(type: string | null | undefined): boolean {
  return type === "site_map" || type === "site";
}

/**
 * Fetch body if the URL looks like RSS or Atom (by Content-Type or XML prefix).
 * Returns XML text or null if not a feed.
 */
export async function fetchFeedXmlIfApplicable(
  feedUrl: string,
  log: (msg: string) => void,
  incoming?: Request,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(
      feedUrl,
      fetchInitWithIncomingTrace(incoming, {
        signal: controller.signal,
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
          "User-Agent": "HolzenFetchSourceFeeds/1.0",
        },
      }),
    );
    clearTimeout(t);

    const ct = res.headers.get("content-type") ?? "";
    const text = await res.text();
    const head = text.slice(0, 4000);

    if (ct.includes("rss") || ct.includes("atom") || ct.includes("xml")) {
      if (/<rss[\s>]/i.test(head) || /<feed[\s>]/i.test(head)) return text;
    }
    if (/<rss[\s>]/i.test(head) || /<feed[\s>]/i.test(head)) return text;

    return null;
  } catch (e) {
    log(`feed fetch failed: ${e}`);
    return null;
  }
}

function resolveHref(raw: string, baseUrl: string): string | null {
  const t = raw.trim();
  if (!t || t.startsWith("#")) return null;
  try {
    return new URL(t, baseUrl).href;
  } catch {
    return null;
  }
}

function stripCdataInner(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
}

/** Per-item metadata from RSS/Atom (best-effort). */
export type FeedArticleRef = {
  url: string;
  feedAuthor: string | null;
  /** ISO 8601 from RSS `<pubDate>` or Atom `<published>` / `<updated>`; null for site_map / single-page. */
  publishedAt: string | null;
};

/** Newest first; refs without a parseable date sort after dated refs (stable among nulls). */
export function sortFeedArticleRefsByPublishedAtDesc(refs: FeedArticleRef[]): FeedArticleRef[] {
  return [...refs].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : NaN;
    const aOk = !Number.isNaN(ta);
    const bOk = !Number.isNaN(tb);
    if (aOk && bOk) return tb - ta;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });
}

function parseRssPubDateFromBlock(block: string): string | null {
  const m = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
  if (!m?.[1]) return null;
  const raw = stripCdataInner(m[1]).trim();
  const d = Date.parse(raw);
  if (Number.isNaN(d)) return null;
  return new Date(d).toISOString();
}

function parseAtomPublishedFromBlock(block: string): string | null {
  const pub = block.match(/<published[^>]*>([\s\S]*?)<\/published>/i);
  const upd = block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
  const raw = (pub?.[1] ?? upd?.[1])?.trim();
  if (!raw) return null;
  const inner = stripCdataInner(raw);
  const d = Date.parse(inner);
  if (Number.isNaN(d)) return null;
  return new Date(d).toISOString();
}

function extractFeedAuthorFromBlock(block: string): string | null {
  const dc = block.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
  if (dc?.[1]) {
    const t = stripCdataInner(dc[1]).replace(/<[^>]+>/g, "").trim();
    if (t) return t;
  }
  const atomName = block.match(/<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>/i);
  if (atomName?.[1]) {
    const t = stripCdataInner(atomName[1]).replace(/<[^>]+>/g, "").trim();
    if (t) return t;
  }
  const authorTag = block.match(/<author[^>]*>([\s\S]*?)<\/author>/i);
  if (authorTag?.[1] && !/<email/i.test(authorTag[1])) {
    const t = stripCdataInner(authorTag[1]).replace(/<[^>]+>/g, "").trim();
    if (t && t.length < 200) return t;
  }
  return null;
}

/**
 * Extract article URLs + optional feed author from RSS 2.0 or Atom XML (best-effort).
 */
export function parseArticleRefsFromFeedXml(xml: string, baseUrl: string): FeedArticleRef[] {
  const out: FeedArticleRef[] = [];
  const seen = new Set<string>();

  const pushRef = (u: string | null, slice: string, publishedAt: string | null) => {
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push({ url: u, feedAuthor: extractFeedAuthorFromBlock(slice), publishedAt });
    if (out.length >= MAX_LINKS_FROM_FEED) return;
  };

  // ── RSS 2.0: <item> ... <link>...</link>
  const itemParts = xml.split(/<item[\s>]/i);
  for (let i = 1; i < itemParts.length; i++) {
    const block = itemParts[i] ?? "";
    const end = block.search(/<\/item>/i);
    const slice = end >= 0 ? block.slice(0, end) : block;
    let href: string | null = null;
    const mLink = slice.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    if (mLink?.[1]) href = resolveHref(stripCdataInner(mLink[1]), baseUrl);
    if (!href) {
      const mEmpty = slice.match(/<link[^>]+href\s*=\s*["']([^"']+)["']/i);
      if (mEmpty?.[1]) href = resolveHref(mEmpty[1], baseUrl);
    }
    if (!href) {
      const mGuid = slice.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      if (mGuid?.[1]) {
        const g = stripCdataInner(mGuid[1]);
        if (g.startsWith("http")) href = resolveHref(g, baseUrl);
      }
    }
    pushRef(href, slice, parseRssPubDateFromBlock(slice));
    if (out.length >= MAX_LINKS_FROM_FEED) break;
  }

  if (out.length > 0) return out;

  // ── Atom: <entry> ... <link href="..." rel="alternate" .../>
  const entryParts = xml.split(/<entry[\s>]/i);
  for (let i = 1; i < entryParts.length; i++) {
    const block = entryParts[i] ?? "";
    const end = block.search(/<\/entry>/i);
    const slice = end >= 0 ? block.slice(0, end) : block;
    const linkTags = [...slice.matchAll(/<link\s+([^>]+)\/?>/gi)];
    let href: string | null = null;
    let bestAlt: string | null = null;
    let fallback: string | null = null;
    for (const m of linkTags) {
      const attrs = m[1] ?? "";
      const hm = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (!hm?.[1]) continue;
      const resolved = resolveHref(hm[1], baseUrl);
      if (!resolved) continue;
      const relM = attrs.match(/\brel\s*=\s*["']([^"']*)["']/i);
      const rel = (relM?.[1] ?? "").toLowerCase();
      const typeM = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);
      const typ = (typeM?.[1] ?? "").toLowerCase();
      if (rel.includes("enclosure") || rel === "self") continue;
      if (rel.includes("alternate") && (typ.includes("html") || typ === "")) {
        bestAlt = resolved;
        break;
      }
      if (!fallback && (rel === "" || rel === "alternate")) fallback = resolved;
    }
    href = bestAlt ?? fallback;
    pushRef(href, slice, parseAtomPublishedFromBlock(slice));
    if (out.length >= MAX_LINKS_FROM_FEED) break;
  }

  return out;
}

export function parseArticleLinksFromFeedXml(xml: string, baseUrl: string): string[] {
  return parseArticleRefsFromFeedXml(xml, baseUrl).map((r) => r.url);
}

/** Last path segment: auxiliary pages under curated libraries (not primary reading HTML). */
function isLibraryAuxiliarySubpage(pathname: string): boolean {
  const p = pathname.toLowerCase().replace(/\/$/, "");
  if (!p.includes("/library/")) return false;
  const last = p.split("/").pop() ?? "";
  return /^(copyright|table-of-contents|toc)$/i.test(last);
}

/** Prefer …/library/<work-slug>/ (and locale-prefixed …/library/<work-slug>/) over deeper child routes. */
function libraryMainWorkScore(pathname: string): number {
  const segs = pathname.split("/").filter(Boolean);
  const i = segs.findIndex((s) => s.toLowerCase() === "library");
  if (i < 0) return 0;
  // Exactly one segment after `library` → main work root (e.g. /library/foo/ or /en/library/foo/).
  return segs.length === i + 2 ? 5 : 0;
}

/** Heuristic: prefer article-like paths; drop tags, feeds, pagers. */
export function filterArticleLikeUrls(candidateUrls: string[], siteRootUrl: string): string[] {
  let origin: string;
  try {
    origin = new URL(siteRootUrl).origin;
  } catch {
    return candidateUrls.slice(0, MAX_ARTICLE_URLS_AFTER_FILTER);
  }

  const bad = /\/(tag|tags|category|author|page|feed|wp-json|search)(\/|$)/i;
  const good = /\/(blog|article|posts?|news|essays?|magazine|journal)\b/i;
  const hasYear = /\/(19|20)\d{2}\//;

  const scored = candidateUrls
    .filter((u) => {
      try {
        const p = new URL(u);
        if (p.origin !== origin) return false;
        const path = p.pathname.toLowerCase();
        if (bad.test(path)) return false;
        if (isLibraryAuxiliarySubpage(p.pathname)) return false;
        if (path.length < 3) return false;
        if (path.endsWith(".pdf")) return false;
        return true;
      } catch {
        return false;
      }
    })
    .map((u) => {
      try {
        const path = new URL(u).pathname;
        let score = 0;
        if (good.test(path)) score += 3;
        if (hasYear.test(path)) score += 2;
        score += libraryMainWorkScore(path);
        if (path.split("/").filter(Boolean).length >= 3) score += 1;
        if (/^\/[^/]+\/?$/.test(path)) score -= 2;
        return { u, score };
      } catch {
        return { u, score: 0 };
      }
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.u);

  return scored.slice(0, 25);
}

/**
 * Firecrawl Map — discover URLs on a site (sitemap + discovery). 1 credit per call.
 * https://docs.firecrawl.dev/features/map
 */
export async function firecrawlMapArticleUrls(
  siteUrl: string,
  apiKey: string,
  log: (msg: string) => void,
  incoming?: Request,
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch(
      "https://api.firecrawl.dev/v2/map",
      fetchInitWithIncomingTrace(incoming, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: siteUrl,
          limit: FIRECRAWL_MAP_LIMIT,
        }),
        signal: controller.signal,
      }),
    );
    clearTimeout(t);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      log(`Firecrawl map error ${res.status}: ${errText.slice(0, 200)}`);
      return [];
    }

    const data = await res.json();
    const rawLinks = (data.links ?? data.data?.links ?? []) as Array<{ url?: string } | string>;
    const urls: string[] = [];
    for (const item of rawLinks) {
      if (typeof item === "string") urls.push(item);
      else if (item?.url) urls.push(item.url);
    }
    return filterArticleLikeUrls(urls, siteUrl);
  } catch (e) {
    log(`Firecrawl map error: ${e}`);
    return [];
  }
}
