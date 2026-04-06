/**
 * Helpers for fetch-source-feeds: RSS/Atom link extraction and Firecrawl Map
 * so admins can register a feed URL or site root instead of one article at a time.
 *
 * Firecrawl docs: https://docs.firecrawl.dev/features/map — Map discovers URLs;
 * Scrape (used elsewhere) pulls markdown per page.
 */

const MAX_LINKS_FROM_FEED = 40;

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
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
        "User-Agent": "HolzenFetchSourceFeeds/1.0",
      },
    });
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

/**
 * Extract article URLs from RSS 2.0 or Atom XML (best-effort, no full XML parser).
 */
export function parseArticleLinksFromFeedXml(xml: string, baseUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (u: string | null) => {
    if (!u) return;
    if (seen.has(u)) return;
    seen.add(u);
    out.push(u);
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
    if (mLink?.[1]) href = resolveHref(mLink[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim(), baseUrl);
    if (!href) {
      const mEmpty = slice.match(/<link[^>]+href\s*=\s*["']([^"']+)["']/i);
      if (mEmpty?.[1]) href = resolveHref(mEmpty[1], baseUrl);
    }
    if (!href) {
      const mGuid = slice.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      if (mGuid?.[1]) {
        const g = mGuid[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
        if (g.startsWith("http")) href = resolveHref(g, baseUrl);
      }
    }
    push(href);
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
    push(href);
    if (out.length >= MAX_LINKS_FROM_FEED) break;
  }

  return out;
}

/** Heuristic: prefer article-like paths; drop tags, feeds, pagers. */
export function filterArticleLikeUrls(candidateUrls: string[], siteRootUrl: string): string[] {
  let origin: string;
  try {
    origin = new URL(siteRootUrl).origin;
  } catch {
    return candidateUrls.slice(0, 20);
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
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25_000);
    const res = await fetch("https://api.firecrawl.dev/v2/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: siteUrl,
        limit: 80,
      }),
      signal: controller.signal,
    });
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
