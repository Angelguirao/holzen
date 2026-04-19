import { describe, expect, it } from "vitest";
import {
  parseGroundLocationState,
  parsePauseSessionLocationState,
  parseProfileLocationState,
  PROFILE_TAB_IDS,
} from "@/lib/router-location-state";

// These parsers sit at the browser-router boundary: `history.state` is
// untrusted `unknown`, and the parsers must coerce it to a typed, validated
// shape without throwing. Contract tests pin the "garbage in → safe defaults
// out" guarantee that protects downstream pages.

const EMPTY_PAUSE = {
  reflectionId: null,
  reflectionMessage: "",
  context: null,
  companions: undefined,
  companionPrefs: undefined,
  severity: undefined,
};

describe("parsePauseSessionLocationState", () => {
  it("returns all-empty defaults for non-objects", () => {
    expect(parsePauseSessionLocationState(null)).toEqual(EMPTY_PAUSE);
    expect(parsePauseSessionLocationState(undefined)).toEqual(EMPTY_PAUSE);
    expect(parsePauseSessionLocationState("string")).toEqual(EMPTY_PAUSE);
    expect(parsePauseSessionLocationState(42)).toEqual(EMPTY_PAUSE);
  });

  it("coerces string fields and trims reflectionMessage", () => {
    const out = parsePauseSessionLocationState({
      reflectionId: "abc",
      reflectionMessage: "  hello  ",
      context: "BTC is down 5%",
    });
    expect(out.reflectionId).toBe("abc");
    expect(out.reflectionMessage).toBe("hello");
    expect(out.context).toBe("BTC is down 5%");
  });

  it("rejects non-string reflectionId / reflectionMessage / context", () => {
    const out = parsePauseSessionLocationState({
      reflectionId: 7,
      reflectionMessage: {},
      context: ["BTC"],
    });
    expect(out.reflectionId).toBeNull();
    expect(out.reflectionMessage).toBe("");
    expect(out.context).toBeNull();
  });

  it("accepts only a whitelist of severities", () => {
    expect(parsePauseSessionLocationState({ severity: "mild" }).severity).toBe("mild");
    expect(parsePauseSessionLocationState({ severity: "moderate" }).severity).toBe("moderate");
    expect(parsePauseSessionLocationState({ severity: "high" }).severity).toBe("high");
    expect(parsePauseSessionLocationState({ severity: "extreme" }).severity).toBeUndefined();
    expect(parsePauseSessionLocationState({ severity: 5 }).severity).toBeUndefined();
  });

  it("accepts companions only when shape-matches (all nullable strings)", () => {
    const good = parsePauseSessionLocationState({
      companions: { haiku: "a poem", groundingTitle: "Title", groundingBody: null },
    });
    expect(good.companions).toEqual({ haiku: "a poem", groundingTitle: "Title", groundingBody: null });

    const bad = parsePauseSessionLocationState({
      companions: { haiku: 1, groundingTitle: "Title", groundingBody: null },
    });
    expect(bad.companions).toBeUndefined();
  });

  it("accepts companionPrefs only when all six booleans are present", () => {
    const prefs = { breathing: true, haiku: true, grounding: true, signal: false, zoomOut: true, history: true };
    expect(parsePauseSessionLocationState({ companionPrefs: prefs }).companionPrefs).toEqual(prefs);

    const missing = { breathing: true, haiku: true, grounding: true, signal: false, zoomOut: true };
    expect(parsePauseSessionLocationState({ companionPrefs: missing }).companionPrefs).toBeUndefined();
  });
});

describe("parseGroundLocationState", () => {
  it("returns {} for invalid input", () => {
    expect(parseGroundLocationState(null)).toEqual({});
    expect(parseGroundLocationState({ preGenerated: null })).toEqual({});
    expect(parseGroundLocationState({ preGenerated: "string" })).toEqual({});
  });

  it("drops preGenerated when required string fields are missing", () => {
    expect(parseGroundLocationState({ preGenerated: { activity: "walk" } })).toEqual({});
    expect(parseGroundLocationState({ preGenerated: { suggestion: "try this" } })).toEqual({});
  });

  it("defaults duration to 10 when missing / non-finite", () => {
    const out = parseGroundLocationState({
      preGenerated: { activity: "walk", suggestion: "try this" },
    });
    expect(out.preGenerated?.duration).toBe(10);

    const bad = parseGroundLocationState({
      preGenerated: { activity: "walk", suggestion: "try this", duration: Number.NaN },
    });
    expect(bad.preGenerated?.duration).toBe(10);
  });

  it("preserves insight when string, else null", () => {
    const withInsight = parseGroundLocationState({
      preGenerated: { activity: "walk", suggestion: "try", insight: "something" },
    });
    expect(withInsight.preGenerated?.insight).toBe("something");
    const nonString = parseGroundLocationState({
      preGenerated: { activity: "walk", suggestion: "try", insight: 42 },
    });
    expect(nonString.preGenerated?.insight).toBeNull();
  });

  it("accepts article only when the shape is correct", () => {
    const good = parseGroundLocationState({
      preGenerated: {
        activity: "walk",
        suggestion: "try",
        article: { snippet: "hello", url: "https://example.com" },
      },
    });
    expect(good.preGenerated?.article).toEqual({ snippet: "hello", url: "https://example.com" });

    const bad = parseGroundLocationState({
      preGenerated: {
        activity: "walk",
        suggestion: "try",
        article: { snippet: 1, url: null },
      },
    });
    expect(bad.preGenerated?.article).toBeNull();
  });
});

describe("parseProfileLocationState", () => {
  it("returns {} for invalid input", () => {
    expect(parseProfileLocationState(null)).toEqual({});
    expect(parseProfileLocationState("string")).toEqual({});
  });

  it("only accepts tabs from the whitelist", () => {
    for (const tab of PROFILE_TAB_IDS) {
      expect(parseProfileLocationState({ tab }).tab).toBe(tab);
    }
    expect(parseProfileLocationState({ tab: "nope" }).tab).toBeUndefined();
    expect(parseProfileLocationState({ tab: 7 }).tab).toBeUndefined();
  });

  it("preserves letterId only when it's a string", () => {
    expect(parseProfileLocationState({ letterId: "abc" }).letterId).toBe("abc");
    expect(parseProfileLocationState({ letterId: 42 }).letterId).toBeUndefined();
  });
});
