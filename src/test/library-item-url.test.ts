import { describe, expect, it } from "vitest";
import { normalizeLibraryItemUrl } from "@/lib/library-item-url";

describe("normalizeLibraryItemUrl", () => {
  it("prepends https when scheme is missing", () => {
    expect(normalizeLibraryItemUrl("example.com/paper.pdf")).toBe("https://example.com/paper.pdf");
  });

  it("leaves full URLs unchanged", () => {
    expect(normalizeLibraryItemUrl("https://nakamotoinstitute.org/library/bitcoin/")).toBe(
      "https://nakamotoinstitute.org/library/bitcoin/",
    );
  });
});
