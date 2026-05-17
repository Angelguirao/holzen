import { describe, expect, it } from "vitest";
import { extractDoi, normalizeCitation } from "../../../supabase/functions/_shared/grounding-enrichment-util";

describe("normalizeCitation", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeCitation("  Kahneman    &    Tversky  \n1979  "))
      .toBe("kahneman & tversky 1979");
  });

  it("strips trailing punctuation so '.' and ',' don't split the cache", () => {
    expect(normalizeCitation("Kahneman, Tversky 1979."))
      .toBe(normalizeCitation("Kahneman, Tversky 1979"));
  });

  it("is deterministic across case and spacing", () => {
    expect(normalizeCitation("Kahneman 1979")).toBe(normalizeCitation("KAHNEMAN 1979"));
  });
});

describe("extractDoi", () => {
  it("extracts a DOI from a plain citation string", () => {
    expect(extractDoi("Shiller, R. (2000). Irrational Exuberance. doi:10.1515/9781400865536 Princeton."))
      .toBe("10.1515/9781400865536");
  });

  it("extracts a DOI from a https://doi.org URL", () => {
    expect(extractDoi("https://doi.org/10.1257/000282803321455322"))
      .toBe("10.1257/000282803321455322");
  });

  it("returns null when there is no DOI", () => {
    expect(extractDoi("Thaler 1980, working paper, no doi")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractDoi("")).toBeNull();
  });

  it("trims trailing punctuation so the DOI is usable as a URL path", () => {
    expect(extractDoi("See 10.1016/j.jfineco.2021.04.008.")).toBe("10.1016/j.jfineco.2021.04.008");
  });
});
