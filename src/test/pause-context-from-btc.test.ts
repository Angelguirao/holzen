import { describe, expect, it } from "vitest";
import { buildPauseContextFromBtc } from "@/lib/pause-context-from-btc";
import type { BtcPriceData } from "@/lib/btc";

function baseData(overrides: Partial<BtcPriceData> = {}): BtcPriceData {
  return {
    currentPrice: 60000,
    price24hAgo: 63000,
    changePercent: -4.76,
    direction: "down",
    currency: "USD",
    ...overrides,
  };
}

describe("buildPauseContextFromBtc", () => {
  it("produces the 24h line only when no cumulative move is triggered", () => {
    const ctx = buildPauseContextFromBtc(
      baseData({ changePercent: -4.76, direction: "down" }),
      15,
    );
    expect(ctx).toBe("BTC is down 4.8% in the last 24 hours.");
  });

  it("appends the 7d line when cumulative move meets the threshold", () => {
    const ctx = buildPauseContextFromBtc(
      baseData({
        changePercent: 2,
        direction: "up",
        cumulativeChangePercent: -18.3,
        cumulativeDirection: "down",
      }),
      15,
    );
    expect(ctx).toBe(
      "BTC is up 2.0% in the last 24 hours. Over 7 days, it's down 18.3%.",
    );
  });

  it("omits the 7d line when cumulative threshold is disabled", () => {
    const ctx = buildPauseContextFromBtc(
      baseData({
        cumulativeChangePercent: -25,
        cumulativeDirection: "down",
      }),
      0,
    );
    expect(ctx).toBe("BTC is down 4.8% in the last 24 hours.");
  });

  it("appends Fear & Greed and on-chain enrichment in the canonical order", () => {
    const ctx = buildPauseContextFromBtc(
      baseData({
        fearGreed: { value: 22, label: "Fear" },
        onChain: { blockHeight: 800000 },
      }),
      15,
    );
    expect(ctx).toBe(
      "BTC is down 4.8% in the last 24 hours. Market sentiment: Fear (22/100). Block height: 800,000.",
    );
  });
});
