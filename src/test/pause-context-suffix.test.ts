import { describe, expect, it } from "vitest";
import {
  appendFearGreedToPauseContext,
  appendOnChainToPauseContext,
  enrichPauseContextWithMarketData,
} from "../../supabase/functions/_shared/pause-context-suffix";

const BASE = "BTC is down 5.2% in the last 24 hours.";

describe("appendFearGreedToPauseContext", () => {
  it("is a no-op when fear & greed data is missing", () => {
    expect(appendFearGreedToPauseContext(BASE, null)).toBe(BASE);
    expect(appendFearGreedToPauseContext(BASE, undefined)).toBe(BASE);
  });

  it("appends the standard sentiment line", () => {
    expect(appendFearGreedToPauseContext(BASE, { value: 20, label: "Extreme Fear" })).toBe(
      `${BASE} Market sentiment: Extreme Fear (20/100).`,
    );
  });
});

describe("appendOnChainToPauseContext", () => {
  it("is a no-op when on-chain data is missing", () => {
    expect(appendOnChainToPauseContext(BASE, null)).toBe(BASE);
    expect(appendOnChainToPauseContext(BASE, undefined)).toBe(BASE);
  });

  it("skips zero/undefined fields (matches manual pause copy)", () => {
    expect(appendOnChainToPauseContext(BASE, { mempoolSize: 0, fastestFee: 0 })).toBe(BASE);
  });

  it("formats mempool, fees, hashrate, and block height in order", () => {
    const result = appendOnChainToPauseContext(BASE, {
      mempoolSize: 12345,
      fastestFee: 42,
      medianFee: 18,
      hashrate: "612.3 EH/s",
      blockHeight: 850000,
    });
    expect(result).toBe(
      `${BASE} Mempool: 12,345 unconfirmed txs. Fees: 42 sat/vB (fastest), 18 sat/vB (medium). Hashrate: 612.3 EH/s. Block height: 850,000.`,
    );
  });

  it("falls back to '?' for medianFee when missing", () => {
    const result = appendOnChainToPauseContext(BASE, { fastestFee: 10 });
    expect(result).toBe(`${BASE} Fees: 10 sat/vB (fastest), ? sat/vB (medium).`);
  });
});

describe("enrichPauseContextWithMarketData", () => {
  it("appends fear & greed before on-chain (matches use-holzen order)", () => {
    const out = enrichPauseContextWithMarketData(
      BASE,
      { value: 60, label: "Greed" },
      { blockHeight: 900000 },
    );
    expect(out).toBe(
      `${BASE} Market sentiment: Greed (60/100). Block height: 900,000.`,
    );
  });

  it("returns the base context untouched when both inputs are missing", () => {
    expect(enrichPauseContextWithMarketData(BASE, null, null)).toBe(BASE);
    expect(enrichPauseContextWithMarketData(BASE, undefined, undefined)).toBe(BASE);
  });
});
