import { describe, it, expect } from "vitest";

import { createHolzenQueryClient, isTransientQueryFailure } from "@/lib/query-client";

function functionsHttpError(status?: number): unknown {
  return {
    name: "FunctionsHttpError",
    context: status === undefined ? undefined : { response: { status } as Response },
  };
}

describe("isTransientQueryFailure", () => {
  it("treats PostgREST errors as non-transient", () => {
    expect(isTransientQueryFailure({ name: "PostgrestError" })).toBe(false);
  });

  it("treats edge 429/5xx as transient and edge 4xx as non-transient", () => {
    expect(isTransientQueryFailure(functionsHttpError(429))).toBe(true);
    expect(isTransientQueryFailure(functionsHttpError(503))).toBe(true);
    expect(isTransientQueryFailure(functionsHttpError(404))).toBe(false);
  });

  it("treats unknown edge transport failures as transient", () => {
    expect(isTransientQueryFailure(functionsHttpError())).toBe(true);
  });

  it("does not retry auth 4xx but retries auth 5xx", () => {
    expect(isTransientQueryFailure({ name: "AuthApiError", status: 401 })).toBe(false);
    expect(isTransientQueryFailure({ name: "AuthError", status: 500 })).toBe(true);
  });

  it("retries browser/network transport failures", () => {
    expect(isTransientQueryFailure(new TypeError("load failed"))).toBe(true);
    expect(isTransientQueryFailure(new Error("ECONNRESET while fetching"))).toBe(true);
  });

  it("does not retry unknown non-network failures", () => {
    expect(isTransientQueryFailure(new Error("validation failed"))).toBe(false);
    expect(isTransientQueryFailure(null)).toBe(false);
  });
});

describe("createHolzenQueryClient", () => {
  it("disables focus refetch churn and applies online defaults", () => {
    const client = createHolzenQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.networkMode).toBe("online");
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.networkMode).toBe("online");
    expect(defaults.mutations?.retry).toBe(0);
  });

  it("retries only transient query failures for first two attempts", () => {
    const client = createHolzenQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe("function");

    const retryFn = retry as (failureCount: number, error: unknown) => boolean;
    expect(retryFn(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(retryFn(1, { name: "PostgrestError" })).toBe(false);
    expect(retryFn(2, new TypeError("Failed to fetch"))).toBe(false);
  });
});
