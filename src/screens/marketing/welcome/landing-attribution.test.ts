import { describe, expect, it } from "vitest";
import {
  attributionHasSignal,
  readAttributionFromSearch,
  resolveLandingAttribution,
} from "./landing-attribution";

describe("landing-attribution", () => {
  it("reads UTM + ref from search params", () => {
    const params = new URLSearchParams(
      "utm_source=x&utm_medium=organic&utm_campaign=waitlist&utm_content=impulse-01&ref=x-impulse-01",
    );
    const attr = readAttributionFromSearch(params);
    expect(attr.utm_source).toBe("x");
    expect(attr.utm_content).toBe("impulse-01");
    expect(attr.ref).toBe("x-impulse-01");
    expect(attributionHasSignal(attr)).toBe(true);
  });

  it("returns empty when no attribution params", () => {
    const attr = resolveLandingAttribution(new URLSearchParams());
    expect(attributionHasSignal(attr)).toBe(false);
  });
});
