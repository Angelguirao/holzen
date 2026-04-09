import { describe, expect, it } from "vitest";
import {
  filterArticleLikeUrls,
  normalizeSourceUrl,
} from "../../supabase/functions/_shared/feed-ingest.ts";

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
