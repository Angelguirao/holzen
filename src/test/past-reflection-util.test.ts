import { describe, it, expect } from "vitest";
import {
  parseDirectionFromContext,
  pickPastReflection,
} from "../../supabase/functions/_shared/past-reflection-util";

describe("parseDirectionFromContext", () => {
  it("extracts direction from common phrasings", () => {
    expect(parseDirectionFromContext("BTC is down 4% today")).toBe("down");
    expect(parseDirectionFromContext("btc IS UP today")).toBe("up");
    expect(parseDirectionFromContext(null)).toBeNull();
    expect(parseDirectionFromContext("sideways week")).toBeNull();
  });
});

describe("pickPastReflection", () => {
  const pool = [
    { id: "x", created_at: "2026-04-01", context: "BTC is down", aiPrompt: null, mood: null, outcome: null, userWords: [{ kind: "note" as const, body: "a", created_at: "2026-04-01" }] },
    { id: "y", created_at: "2026-04-02", context: "BTC is up",   aiPrompt: null, mood: null, outcome: null, userWords: [{ kind: "note" as const, body: "b", created_at: "2026-04-02" }] },
    { id: "z", created_at: "2026-04-03", context: null,           aiPrompt: null, mood: null, outcome: null, userWords: [{ kind: "note" as const, body: "c", created_at: "2026-04-03" }] },
  ];

  it("returns null on empty pool", () => {
    expect(pickPastReflection([], "up")).toBeNull();
  });

  it("prefers direction-matching entries when available", () => {
    const picked = pickPastReflection(pool, "down", () => 0);
    expect(picked?.id).toBe("x");
  });

  it("falls back to full pool when no direction match", () => {
    const downOnly = [pool[1], pool[2]]; // no "down" rows
    const picked = pickPastReflection(downOnly, "down", () => 0);
    expect(picked).toBe(downOnly[0]);
  });

  it("returns a non-null entry even when direction is null", () => {
    const picked = pickPastReflection(pool, null, () => 0);
    expect(picked).not.toBeNull();
  });
});
