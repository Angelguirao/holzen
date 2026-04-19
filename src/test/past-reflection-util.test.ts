import { describe, it, expect } from "vitest";
import {
  assemblePastReflectionPool,
  buildUserWordsForReflection,
  parseDirectionFromContext,
  pickPastReflection,
  projectPastReflection,
  type PracticeEntryRow,
  type ReflectionRow,
} from "../../supabase/functions/_shared/past-reflection-util";

function makeReflection(overrides: Partial<ReflectionRow> = {}): ReflectionRow {
  return {
    id: "r1",
    created_at: "2026-04-10T12:00:00.000Z",
    message: "holzen prompt",
    note: null,
    mood: null,
    outcome: null,
    context: null,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<PracticeEntryRow> = {}): PracticeEntryRow {
  return {
    source_reflection_id: "r1",
    body: "my reply",
    created_at: "2026-04-11T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildUserWordsForReflection", () => {
  it("returns empty array when note is blank and there are no entries", () => {
    const r = makeReflection({ note: null });
    expect(buildUserWordsForReflection(r, [])).toEqual([]);
    expect(buildUserWordsForReflection({ note: "   ", created_at: r.created_at }, [])).toEqual([]);
  });

  it("includes a non-blank note as a kind:note entry at the reflection's created_at", () => {
    const r = makeReflection({ note: "  I felt calm.  " });
    const out = buildUserWordsForReflection(r, []);
    expect(out).toEqual([
      { kind: "note", body: "I felt calm.", created_at: r.created_at },
    ]);
  });

  it("skips practice entries with missing or whitespace-only body", () => {
    const r = makeReflection();
    const out = buildUserWordsForReflection(r, [
      makeEntry({ body: "" }),
      makeEntry({ body: "  " }),
      makeEntry({ body: null }),
    ]);
    expect(out).toEqual([]);
  });

  it("sorts merged note + replays chronologically ascending", () => {
    const r = makeReflection({
      note: "first thought",
      created_at: "2026-04-01T00:00:00.000Z",
    });
    const out = buildUserWordsForReflection(r, [
      makeEntry({ body: "b (later)", created_at: "2026-04-10T00:00:00.000Z" }),
      makeEntry({ body: "a (sooner)", created_at: "2026-04-05T00:00:00.000Z" }),
    ]);
    expect(out.map((w) => [w.kind, w.body])).toEqual([
      ["note", "first thought"],
      ["replay", "a (sooner)"],
      ["replay", "b (later)"],
    ]);
  });
});

describe("projectPastReflection", () => {
  it("returns null when the reflection has no user words", () => {
    expect(projectPastReflection(makeReflection(), [])).toBeNull();
  });

  it("exposes aiPrompt from reflections.message and projects shape", () => {
    const r = makeReflection({ message: "Holzen asked X", note: "my note" });
    const out = projectPastReflection(r, []);
    expect(out).not.toBeNull();
    expect(out!.aiPrompt).toBe("Holzen asked X");
    expect(out!.userWords.length).toBe(1);
    expect(out!.userWords[0].kind).toBe("note");
  });
});

describe("assemblePastReflectionPool", () => {
  it("pairs each reflection with its entries by source_reflection_id", () => {
    const reflections = [
      makeReflection({ id: "a", note: "note-a" }),
      makeReflection({ id: "b" }),
      makeReflection({ id: "c", note: "note-c" }),
    ];
    const entries = [
      makeEntry({ source_reflection_id: "b", body: "replay-b" }),
      makeEntry({ source_reflection_id: "a", body: "replay-a" }),
      makeEntry({ source_reflection_id: "zzz" }), // orphan — ignored
    ];
    const pool = assemblePastReflectionPool(reflections, entries);
    expect(pool.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(pool[0].userWords.length).toBe(2); // note + replay
    expect(pool[1].userWords.length).toBe(1); // only replay
    expect(pool[2].userWords.length).toBe(1); // only note
  });

  it("drops reflections that end up with zero user words", () => {
    const reflections = [
      makeReflection({ id: "a" }),
      makeReflection({ id: "b", note: "only b has text" }),
    ];
    const pool = assemblePastReflectionPool(reflections, []);
    expect(pool.map((p) => p.id)).toEqual(["b"]);
  });
});

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
