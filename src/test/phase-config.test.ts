import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getActivePhases,
  getPhaseConfig,
} from "../../supabase/functions/_shared/phase-config";

// The phase-config module reads env via `globalThis.Deno.env.get`. We stub
// that API in jsdom so tests don't depend on a Deno runtime.
interface DenoStub {
  env: { get: (key: string) => string | undefined };
}

const originalDeno = (globalThis as unknown as { Deno?: DenoStub }).Deno;

function setEnv(map: Record<string, string | undefined>) {
  (globalThis as unknown as { Deno?: DenoStub }).Deno = {
    env: { get: (key: string) => map[key] },
  };
}

beforeEach(() => {
  setEnv({});
});

afterEach(() => {
  (globalThis as unknown as { Deno?: DenoStub }).Deno = originalDeno;
});

describe("getPhaseConfig", () => {
  it("defaults every phase to enabled when env is empty", () => {
    expect(getPhaseConfig()).toEqual({ library: true, cache: true, live: true });
  });

  it("treats '0' / 'false' / 'no' as disabled", () => {
    setEnv({ COMPANION_PHASE_LIBRARY: "0" });
    expect(getPhaseConfig().library).toBe(false);
    setEnv({ COMPANION_PHASE_CACHE: "false" });
    expect(getPhaseConfig().cache).toBe(false);
    setEnv({ COMPANION_PHASE_LIVE: "no" });
    expect(getPhaseConfig().live).toBe(false);
  });

  it("treats any other truthy string as enabled", () => {
    setEnv({
      COMPANION_PHASE_LIBRARY: "1",
      COMPANION_PHASE_CACHE: "yes",
      COMPANION_PHASE_LIVE: "on",
    });
    expect(getPhaseConfig()).toEqual({ library: true, cache: true, live: true });
  });

  it("falls back to the default when the value is empty string", () => {
    setEnv({ COMPANION_PHASE_LIBRARY: "" });
    expect(getPhaseConfig().library).toBe(true);
  });
});

describe("getActivePhases", () => {
  it("returns phases in the library → cache → live order", () => {
    expect(getActivePhases()).toEqual(["library", "cache", "live"]);
  });

  it("omits disabled phases but preserves ordering of the rest", () => {
    setEnv({ COMPANION_PHASE_CACHE: "0" });
    expect(getActivePhases()).toEqual(["library", "live"]);
  });

  it("returns [] when all phases are disabled", () => {
    setEnv({
      COMPANION_PHASE_LIBRARY: "0",
      COMPANION_PHASE_CACHE: "0",
      COMPANION_PHASE_LIVE: "0",
    });
    expect(getActivePhases()).toEqual([]);
  });
});
