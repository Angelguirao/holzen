import { describe, expect, it } from "vitest";
import {
  mergeRecentSignalUrls,
  preferNonYoutubeCitationsFirst,
} from "../../supabase/functions/_shared/recent-signal-urls";

describe("mergeRecentSignalUrls", () => {
  it("returns undefined when there is nothing to merge", () => {
    expect(mergeRecentSignalUrls([], [], 5)).toBeUndefined();
  });

  it("puts DB URLs before client URLs", () => {
    const out = mergeRecentSignalUrls(
      ["https://db-1.example", "https://db-2.example"],
      ["https://client-1.example"],
      10,
    );
    expect(out).toEqual([
      "https://db-1.example",
      "https://db-2.example",
      "https://client-1.example",
    ]);
  });

  it("dedupes across DB + client with whitespace trimming", () => {
    const out = mergeRecentSignalUrls(
      ["https://a.example", "  https://b.example  "],
      ["https://b.example", "https://c.example"],
      10,
    );
    expect(out).toEqual([
      "https://a.example",
      "https://b.example",
      "https://c.example",
    ]);
  });

  it("respects the cap", () => {
    const out = mergeRecentSignalUrls(
      ["https://a.example", "https://b.example"],
      ["https://c.example", "https://d.example"],
      2,
    );
    expect(out).toEqual(["https://a.example", "https://b.example"]);
  });

  it("filters falsy / non-string entries", () => {
    const out = mergeRecentSignalUrls(
      ["", "https://real.example", "   "],
      [undefined as unknown as string, null as unknown as string, "https://also.example"],
      10,
    );
    expect(out).toEqual(["https://real.example", "https://also.example"]);
  });
});

describe("preferNonYoutubeCitationsFirst", () => {
  it("reorders so non-YouTube URLs come first when both are present", () => {
    const out = preferNonYoutubeCitationsFirst([
      "https://youtube.com/watch?v=abc",
      "https://example.com/article",
      "https://youtu.be/xyz",
      "https://example.org/other",
    ]);
    expect(out).toEqual([
      "https://example.com/article",
      "https://example.org/other",
      "https://youtube.com/watch?v=abc",
      "https://youtu.be/xyz",
    ]);
  });

  it("leaves the list untouched when only one kind is present", () => {
    const yt = ["https://youtube.com/a", "https://youtu.be/b"];
    expect(preferNonYoutubeCitationsFirst(yt)).toBe(yt);
    const non = ["https://a.example", "https://b.example"];
    expect(preferNonYoutubeCitationsFirst(non)).toBe(non);
  });

  it("skips empty / non-string entries without throwing", () => {
    const mixed = [
      "https://example.com/article",
      "" as string,
      null as unknown as string,
      "https://youtube.com/watch?v=a",
    ];
    expect(preferNonYoutubeCitationsFirst(mixed)).toEqual([
      "https://example.com/article",
      "https://youtube.com/watch?v=a",
    ]);
  });
});
