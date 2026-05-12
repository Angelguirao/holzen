// External dependency (HTTP) call logging helper for edge functions.
//
// `logDependencyCall` wraps any `Promise` representing a call to an external service
// (Anthropic, Perplexity, Stripe, Lovable Email, CoinGecko, etc.) and produces a single structured
// log entry with the dependency name, duration, and outcome. This gives us:
//
//   - A canonical timing / error log for every upstream call, without per-call ad hoc logs.
//   - One place to add features (retries, breaker tie-ins, cost tagging) later.
//   - BetterStack queries like `dep:anthropic AND status:error` → fast dependency dashboards.
//
// Usage:
//
//   const response = await logDependencyCall(log, "anthropic", () =>
//     fetch("https://api.anthropic.com/v1/messages", { ... })
//   );
//
//   // Or with a named operation for dashboards:
//   const price = await logDependencyCall(log, "coingecko", () => fetchPrice(), {
//     operation: "simple/price",
//   });
//
// The helper re-throws on failure so the caller's error semantics are unchanged.

import type { createLogger } from "./observe.ts";

type Logger = ReturnType<typeof createLogger>;

export interface LogDependencyOptions {
  /** Operation label for dashboards (e.g. "messages.create", "simple/price"). */
  operation?: string;
  /** HTTP-like status codes that represent expected cleanup paths, not incidents. */
  expectedStatusCodes?: number[];
  /** Extra structured fields — scrubbed before hitting BetterStack via the logger. */
  extra?: Record<string, unknown>;
}

function statusCodeFromError(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const record = err as Record<string, unknown>;
  const value = record.statusCode ?? record.status;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function logDependencyCall<T>(
  log: Logger,
  dependency: string,
  fn: () => Promise<T>,
  options: LogDependencyOptions = {}
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    log("dependency_call", {
      dep: dependency,
      status: "ok",
      duration_ms: Date.now() - start,
      ...(options.operation ? { operation: options.operation } : {}),
      ...(options.extra ?? {}),
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const statusCode = statusCodeFromError(err);
    const isExpectedStatus = statusCode !== null && (options.expectedStatusCodes ?? []).includes(statusCode);
    const payload = {
      dep: dependency,
      status: isExpectedStatus ? "expected_error" : "error",
      duration_ms: Date.now() - start,
      message,
      ...(statusCode !== null ? { status_code: statusCode } : {}),
      ...(options.operation ? { operation: options.operation } : {}),
      ...(options.extra ?? {}),
    };
    if (isExpectedStatus) {
      log.warn("dependency_call", payload);
    } else {
      log.error("dependency_call", payload);
    }
    throw err;
  }
}
