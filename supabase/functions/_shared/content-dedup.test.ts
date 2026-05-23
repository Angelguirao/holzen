import { describe, expect, it } from "vitest";
import { partitionArticleRefsByUrlInDb } from "./content-dedup.ts";

describe("partitionArticleRefsByUrlInDb", () => {
  it("keeps refs whose URLs are not in the DB set", () => {
    const refs = [
      { url: "https://example.com/a", feedAuthor: null, publishedAt: null },
      { url: "https://example.com/b", feedAuthor: null, publishedAt: null },
    ];
    const { pending, skippedKnown } = partitionArticleRefsByUrlInDb(refs, new Set(["https://example.com/a"]));
    expect(skippedKnown).toBe(1);
    expect(pending).toEqual([{ url: "https://example.com/b", feedAuthor: null, publishedAt: null }]);
  });

  it("drops refs when a canonical variant exists in the set", () => {
    const refs = [{ url: "https://www.example.com/paper/", feedAuthor: null, publishedAt: null }];
    const { pending, skippedKnown } = partitionArticleRefsByUrlInDb(
      refs,
      new Set(["https://example.com/paper"]),
    );
    expect(skippedKnown).toBe(1);
    expect(pending).toEqual([]);
  });
});

