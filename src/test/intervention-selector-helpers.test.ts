import { describe, expect, it } from "vitest";
import {
  bucketSeverity,
  parseDirection,
} from "../../supabase/functions/_shared/intervention-selector";

describe("parseDirection", () => {
  it("returns 'neutral' for missing / empty context", () => {
    expect(parseDirection()).toBe("neutral");
    expect(parseDirection("")).toBe("neutral");
  });

  it("detects 'is down' regardless of case", () => {
    expect(parseDirection("BTC is down 5.2% in the last 24 hours.")).toBe("down");
    expect(parseDirection("btc IS DOWN 2%")).toBe("down");
  });

  it("detects 'is up' regardless of case", () => {
    expect(parseDirection("BTC is up 1.1% in the last 24 hours.")).toBe("up");
    expect(parseDirection("BTC Is Up 2%")).toBe("up");
  });

  it("returns 'neutral' when neither phrase appears", () => {
    expect(parseDirection("Market is flat today.")).toBe("neutral");
    expect(parseDirection("nothing to report")).toBe("neutral");
  });
});

describe("bucketSeverity", () => {
  it("buckets by absolute change", () => {
    expect(bucketSeverity(0)).toBe("mild");
    expect(bucketSeverity(4.9)).toBe("mild");
    expect(bucketSeverity(-4.9)).toBe("mild");
    expect(bucketSeverity(5)).toBe("moderate");
    expect(bucketSeverity(-9.99)).toBe("moderate");
    expect(bucketSeverity(10)).toBe("high");
    expect(bucketSeverity(-25)).toBe("high");
  });
});
