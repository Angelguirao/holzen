import { describe, expect, it } from "vitest";
import { hostnameFromUrl } from "@/lib/companion-url";

describe("hostnameFromUrl", () => {
  it("returns '' for missing / empty input", () => {
    expect(hostnameFromUrl(undefined)).toBe("");
    expect(hostnameFromUrl("")).toBe("");
  });

  it("extracts the hostname from a full URL", () => {
    expect(hostnameFromUrl("https://bitcoinmagazine.com/technical/article")).toBe(
      "bitcoinmagazine.com",
    );
  });

  it("prepends https:// when the input has no scheme", () => {
    expect(hostnameFromUrl("nakamotoinstitute.org/library/bitcoin/")).toBe(
      "nakamotoinstitute.org",
    );
  });

  it("strips a leading 'www.'", () => {
    expect(hostnameFromUrl("https://www.example.com/")).toBe("example.com");
    expect(hostnameFromUrl("www.example.com/page")).toBe("example.com");
  });

  it("returns '' for un-parseable URLs", () => {
    expect(hostnameFromUrl("http://")).toBe("");
    expect(hostnameFromUrl("not a url at all")).toBe("");
  });
});
