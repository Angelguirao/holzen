import { describe, expect, it } from "vitest";
import {
  filterArticleLikeUrls,
  normalizeSourceUrl,
  parseArticleRefsFromFeedXml,
  sortFeedArticleRefsByPublishedAtDesc,
} from "../../../supabase/functions/_shared/feed-ingest.ts";

describe("normalizeSourceUrl", () => {
  it("prepends https when scheme is missing (admin paste)", () => {
    expect(normalizeSourceUrl("nakamotoinstitute.org/mempool/atom.xml")).toBe(
      "https://nakamotoinstitute.org/mempool/atom.xml",
    );
  });

  it("leaves full URLs unchanged", () => {
    expect(normalizeSourceUrl("https://nakamotoinstitute.org/mempool/atom.xml")).toBe(
      "https://nakamotoinstitute.org/mempool/atom.xml",
    );
  });
});

describe("filterArticleLikeUrls (site_map / Firecrawl Map)", () => {
  const root = "https://nakamotoinstitute.org/library/";

  it("drops SNI library auxiliary pages (copyright, TOC)", () => {
    const out = filterArticleLikeUrls(
      [
        "https://nakamotoinstitute.org/library/the-ethics-of-money-production/copyright",
        "https://nakamotoinstitute.org/library/the-ethics-of-money-production/table-of-contents",
        "https://nakamotoinstitute.org/library/the-ethics-of-money-production/",
      ],
      root,
    );
    expect(out).toContain("https://nakamotoinstitute.org/library/the-ethics-of-money-production/");
    expect(out).not.toContain(
      "https://nakamotoinstitute.org/library/the-ethics-of-money-production/copyright",
    );
    expect(out).not.toContain(
      "https://nakamotoinstitute.org/library/the-ethics-of-money-production/table-of-contents",
    );
  });

  it("prefers main /library/<slug>/ over unrelated paths when scoring", () => {
    const out = filterArticleLikeUrls(
      [
        "https://nakamotoinstitute.org/mempool/speculative-attack-season-2/",
        "https://nakamotoinstitute.org/library/the-ethics-of-money-production/",
      ],
      root,
    );
    expect(out[0]).toBe("https://nakamotoinstitute.org/library/the-ethics-of-money-production/");
  });
});

describe("RSS/Atom publishedAt and sort (fetch-source-feeds)", () => {
  const rssXml = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item><link>https://example.com/old</link><pubDate>Mon, 01 Jan 2020 00:00:00 GMT</pubDate></item>
  <item><link>https://example.com/new</link><pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate></item>
  <item><link>https://example.com/mid</link><pubDate>Mon, 01 Jan 2022 00:00:00 GMT</pubDate></item>
</channel></rss>`;

  it("parses pubDate per item and sorts newest first", () => {
    const refs = parseArticleRefsFromFeedXml(rssXml, "https://example.com/feed.xml");
    expect(refs.map((r) => r.url)).toEqual([
      "https://example.com/old",
      "https://example.com/new",
      "https://example.com/mid",
    ]);
    expect(refs[0]?.publishedAt).toBe("2020-01-01T00:00:00.000Z");
    const sorted = sortFeedArticleRefsByPublishedAtDesc(refs);
    expect(sorted.map((r) => r.url)).toEqual([
      "https://example.com/new",
      "https://example.com/mid",
      "https://example.com/old",
    ]);
  });
});
