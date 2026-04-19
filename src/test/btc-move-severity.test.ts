import { describe, expect, it } from "vitest";
import { severityFromBtcChangePercent } from "@/lib/btc-move-severity";

describe("severityFromBtcChangePercent", () => {
  it("returns 'mild' for null / undefined / NaN", () => {
    expect(severityFromBtcChangePercent(null)).toBe("mild");
    expect(severityFromBtcChangePercent(undefined)).toBe("mild");
    expect(severityFromBtcChangePercent(Number.NaN)).toBe("mild");
  });

  it("returns 'mild' below 5% (both directions)", () => {
    expect(severityFromBtcChangePercent(0)).toBe("mild");
    expect(severityFromBtcChangePercent(4.9)).toBe("mild");
    expect(severityFromBtcChangePercent(-4.9)).toBe("mild");
  });

  it("returns 'moderate' at exactly the 5% boundary", () => {
    expect(severityFromBtcChangePercent(5)).toBe("moderate");
    expect(severityFromBtcChangePercent(-5)).toBe("moderate");
  });

  it("returns 'moderate' between 5% and 10%", () => {
    expect(severityFromBtcChangePercent(7.5)).toBe("moderate");
    expect(severityFromBtcChangePercent(-9.99)).toBe("moderate");
  });

  it("returns 'high' at exactly the 10% boundary", () => {
    expect(severityFromBtcChangePercent(10)).toBe("high");
    expect(severityFromBtcChangePercent(-10)).toBe("high");
  });

  it("returns 'high' for large swings", () => {
    expect(severityFromBtcChangePercent(25)).toBe("high");
    expect(severityFromBtcChangePercent(-40)).toBe("high");
  });
});
