import { describe, expect, it } from "vitest";
import {
  DEFAULT_CUMULATIVE_THRESHOLD,
  effectiveCumulativeThreshold,
  isCumulativeMoveTriggered,
} from "@/lib/volatility-thresholds";

describe("effectiveCumulativeThreshold", () => {
  it("uses the default when unset or empty", () => {
    expect(effectiveCumulativeThreshold(null)).toBe(DEFAULT_CUMULATIVE_THRESHOLD);
    expect(effectiveCumulativeThreshold(undefined)).toBe(DEFAULT_CUMULATIVE_THRESHOLD);
    expect(effectiveCumulativeThreshold("")).toBe(DEFAULT_CUMULATIVE_THRESHOLD);
  });

  it("uses the default when the raw value is not finite", () => {
    expect(effectiveCumulativeThreshold("nope")).toBe(DEFAULT_CUMULATIVE_THRESHOLD);
    expect(effectiveCumulativeThreshold(Number.NaN)).toBe(DEFAULT_CUMULATIVE_THRESHOLD);
    expect(effectiveCumulativeThreshold(Infinity)).toBe(DEFAULT_CUMULATIVE_THRESHOLD);
  });

  it("returns null (auto-pause off) when raw <= 0", () => {
    expect(effectiveCumulativeThreshold(0)).toBeNull();
    expect(effectiveCumulativeThreshold(-5)).toBeNull();
    expect(effectiveCumulativeThreshold("0")).toBeNull();
  });

  it("passes through valid positive values (including strings)", () => {
    expect(effectiveCumulativeThreshold(10)).toBe(10);
    expect(effectiveCumulativeThreshold("20")).toBe(20);
    expect(effectiveCumulativeThreshold(7.5)).toBe(7.5);
  });
});

describe("isCumulativeMoveTriggered", () => {
  it("is false when auto-pause is disabled (threshold <= 0)", () => {
    expect(isCumulativeMoveTriggered(50, 0)).toBe(false);
    expect(isCumulativeMoveTriggered(-99, 0)).toBe(false);
  });

  it("is false when no cumulative move data is available", () => {
    expect(isCumulativeMoveTriggered(undefined, 15)).toBe(false);
    expect(isCumulativeMoveTriggered(Number.NaN, 15)).toBe(false);
  });

  it("triggers only once the absolute move meets the threshold", () => {
    expect(isCumulativeMoveTriggered(14.9, 15)).toBe(false);
    expect(isCumulativeMoveTriggered(15, 15)).toBe(true);
    expect(isCumulativeMoveTriggered(-15, 15)).toBe(true);
    expect(isCumulativeMoveTriggered(-14.99, 15)).toBe(false);
  });

  it("uses the default threshold when raw is null/empty", () => {
    // DEFAULT_CUMULATIVE_THRESHOLD is 15 at the time of writing.
    expect(isCumulativeMoveTriggered(DEFAULT_CUMULATIVE_THRESHOLD, null)).toBe(true);
    expect(isCumulativeMoveTriggered(DEFAULT_CUMULATIVE_THRESHOLD - 0.1, "")).toBe(false);
  });
});
