import { describe, expect, it } from "vitest";
import { dateKeyToCoinGeckoHistory } from "./coingecko-util.ts";

describe("dateKeyToCoinGeckoHistory", () => {
  it("converts YYYY-MM-DD to DD-MM-YYYY (CoinGecko's /history format)", () => {
    expect(dateKeyToCoinGeckoHistory("2016-04-18")).toBe("18-04-2016");
    expect(dateKeyToCoinGeckoHistory("2026-01-01")).toBe("01-01-2026");
    expect(dateKeyToCoinGeckoHistory("2020-12-31")).toBe("31-12-2020");
  });

  it("rejects malformed inputs rather than building a bad URL", () => {
    expect(dateKeyToCoinGeckoHistory("")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("2016/04/18")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("18-04-2016")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("2016-4-18")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("not a date")).toBeNull();
  });

  it("rejects impossible calendar dates (guards against silent 400s)", () => {
    expect(dateKeyToCoinGeckoHistory("2024-02-30")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("2024-13-01")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("2024-00-10")).toBeNull();
    expect(dateKeyToCoinGeckoHistory("2024-06-00")).toBeNull();
  });

  it("accepts leap-year Feb 29 but rejects non-leap Feb 29", () => {
    expect(dateKeyToCoinGeckoHistory("2024-02-29")).toBe("29-02-2024");
    expect(dateKeyToCoinGeckoHistory("2023-02-29")).toBeNull();
  });
});
