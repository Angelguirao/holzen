import { describe, expect, it } from "vitest";
import {
  resolveAttributionFromUrl,
  validateSource,
} from "../../supabase/functions/_shared/source-validation";

describe("resolveAttributionFromUrl", () => {
  it("returns null for empty / un-parseable input", () => {
    expect(resolveAttributionFromUrl("")).toBeNull();
    expect(resolveAttributionFromUrl("not a url")).toBeNull();
  });

  it("prefers publication over author when the domain is a publication", () => {
    expect(resolveAttributionFromUrl("https://bitcoinmagazine.com/article")).toBe(
      "Bitcoin Magazine",
    );
    expect(resolveAttributionFromUrl("https://nakamotoinstitute.org/library/bitcoin/")).toBe(
      "Nakamoto Institute",
    );
  });

  it("returns a mapped known author for a personal domain", () => {
    expect(resolveAttributionFromUrl("https://lynalden.com/essays/")).toBe("Lyn Alden");
    expect(resolveAttributionFromUrl("https://saifedean.com/")).toBe("Saifedean Ammous");
  });

  it("handles www. and http(s) scheme variations and subdomains", () => {
    expect(resolveAttributionFromUrl("http://www.lynalden.com")).toBe("Lyn Alden");
    expect(resolveAttributionFromUrl("bitcoinmagazine.com")).toBe("Bitcoin Magazine");
  });

  it("returns null for unknown hosts", () => {
    expect(resolveAttributionFromUrl("https://random-blog.example.com/")).toBeNull();
  });
});

describe("validateSource", () => {
  it("passes through the AI label when it matches the URL attribution", () => {
    const out = validateSource(
      "Lyn Alden",
      "https://lynalden.com/essay",
      ["https://lynalden.com/essay"],
    );
    expect(out).toBe("Lyn Alden");
  });

  it("overrides a mismatched AI label with the URL attribution", () => {
    const out = validateSource(
      "Someone Else",
      "https://lynalden.com/essay",
      ["https://lynalden.com/essay"],
    );
    expect(out).toBe("Lyn Alden");
  });

  it("falls back to secondary citations when citationUrl has no attribution", () => {
    const out = validateSource(
      "Ignored",
      "https://unknown.example/",
      ["https://unknown.example/", "https://lynalden.com/essay"],
    );
    expect(out).toBe("Lyn Alden");
  });

  it("keeps the AI label when no URL maps but the label names a catalogued source", () => {
    const out = validateSource(
      "My Favorite Podcast",
      "https://unknown.example/",
      [],
      [{ name: "My Favorite Podcast" }],
    );
    expect(out).toBe("My Favorite Podcast");
  });

  it("keeps the AI label when it names a known author even without a URL mapping", () => {
    const out = validateSource("Something by Lyn Alden", "https://unknown.example/", []);
    expect(out).toBe("Something by Lyn Alden");
  });

  it("appends a transparency hostname suffix when no attribution matches", () => {
    const out = validateSource("Random Label", "https://some-site.example/path", []);
    expect(out).toBe("Random Label (via some-site.example)");
  });

  it("uses the hostname as the attribution when the AI label is empty", () => {
    const out = validateSource("", "https://some-site.example/path", []);
    expect(out).toBe("some-site.example");
  });
});
