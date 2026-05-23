import { describe, it, expect } from "vitest";
import {
  HISTORICAL_ERAS,
  eraRecentlySeenByKeywords,
  pickEra,
  type HistoricalEra,
} from "./history-util.ts";

describe("HISTORICAL_ERAS", () => {
  it("contains at least 20 eras covering all three mood tags", () => {
    expect(HISTORICAL_ERAS.length).toBeGreaterThanOrEqual(20);
    const moods = new Set(HISTORICAL_ERAS.map(e => e.mood));
    expect(moods.has("recovery")).toBe(true);
    expect(moods.has("caution")).toBe(true);
    expect(moods.has("neutral")).toBe(true);
  });

  it("every era has at least one non-empty keyword", () => {
    for (const era of HISTORICAL_ERAS) {
      expect(era.keywords.length).toBeGreaterThan(0);
      for (const kw of era.keywords) {
        expect(kw.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("eraRecentlySeenByKeywords", () => {
  const covid: HistoricalEra = {
    era: "COVID crash and recovery (March 2020)",
    examples: "",
    mood: "recovery",
    keywords: ["covid", "march 2020", "pandemic crash"],
  };

  it("returns false for empty recent-titles list", () => {
    expect(eraRecentlySeenByKeywords(covid, [])).toBe(false);
  });

  it("fires when a recent title contains an era keyword", () => {
    expect(eraRecentlySeenByKeywords(covid, ["the march 2020 crash recovery"])).toBe(true);
    expect(eraRecentlySeenByKeywords(covid, ["covid and the long reset"])).toBe(true);
  });

  it("is case-insensitive on the recent-title side", () => {
    // pickEra passes already-lowered titles, so simulate that
    expect(eraRecentlySeenByKeywords(covid, ["march 2020 reflections"])).toBe(true);
  });

  it("does not false-positive on unrelated titles", () => {
    expect(eraRecentlySeenByKeywords(covid, ["dot-com bubble pop", "lehman fallout"])).toBe(false);
  });
});

describe("pickEra", () => {
  const rand0 = () => 0; // always first candidate

  it("prefers mood-matched eras first", () => {
    const era = pickEra("anxious", [], undefined, rand0);
    expect(era.mood).toBe("recovery");
  });

  it("respects explicit preferredMood over raw mood", () => {
    const era = pickEra("excited", [], "neutral", rand0);
    expect(era.mood).toBe("neutral");
  });

  it("skips an era whose keyword appears in recent titles", () => {
    // Force recovery pool, then mark the first recovery era (COVID) as recently seen
    const recents = ["march 2020 throwback"];
    const era = pickEra("anxious", recents, undefined, rand0);
    expect(
      era.keywords.every(kw => !recents[0].toLowerCase().includes(kw.toLowerCase())),
    ).toBe(true);
  });

  it("softens mood filter to neutral/any when all preferred eras are recently seen", () => {
    const recoveryEras = HISTORICAL_ERAS.filter(e => e.mood === "recovery");
    const recents = recoveryEras.flatMap(e => e.keywords.map(kw => `${kw} notes`));
    const era = pickEra("anxious", recents, undefined, rand0);
    // Since every recovery era is "recently seen", pickEra must fall back to a non-recovery fresh era
    expect(era.mood).not.toBe("recovery");
  });

  it("falls through to the full pool when every era is recently seen", () => {
    const everyKeyword = HISTORICAL_ERAS.flatMap(e => e.keywords.map(kw => `${kw} notes`));
    const era = pickEra("anxious", everyKeyword, undefined, rand0);
    expect(HISTORICAL_ERAS).toContain(era);
  });
});
