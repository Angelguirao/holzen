import { describe, it, expect } from "vitest";
import {
  combineNoteAndReplayWords,
  mergeUserWordsChronological,
  parseDirectionFromContext,
  pickPastReflection,
} from "./past-reflection-util.ts";

describe("parseDirectionFromContext", () => {
  it("extracts direction from common phrasings", () => {
    expect(parseDirectionFromContext("BTC is down 4% today")).toBe("down");
    expect(parseDirectionFromContext("btc IS UP today")).toBe("up");
    expect(parseDirectionFromContext(null)).toBeNull();
    expect(parseDirectionFromContext("sideways week")).toBeNull();
  });
});

describe("mergeUserWordsChronological", () => {
  it("orders by created_at with note before replay on timestamp ties", () => {
    const merged = mergeUserWordsChronological([
      { kind: "replay", body: "r", created_at: "2026-04-02T12:00:00Z" },
      { kind: "note", body: "n", created_at: "2026-04-02T12:00:00Z" },
    ]);
    expect(merged[0].kind).toBe("note");
    expect(merged[1].kind).toBe("replay");
  });
});

describe("combineNoteAndReplayWords", () => {
  it("merges and sorts notes with replay rows", () => {
    const notes = [{ kind: "note" as const, body: "a", created_at: "2026-04-02T10:00:00Z" }];
    const replays = [{ body: "  b  ", created_at: "2026-04-01T10:00:00Z" }];
    const out = combineNoteAndReplayWords(notes, replays);
    expect(out.map((w) => w.kind)).toEqual(["replay", "note"]);
    expect(out[0].body).toBe("b");
  });

  it("drops blank replay bodies", () => {
    const out = combineNoteAndReplayWords(
      [{ kind: "note" as const, body: "x", created_at: "2026-04-01T10:00:00Z" }],
      [{ body: "   ", created_at: "2026-04-02T10:00:00Z" }],
    );
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe("note");
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
