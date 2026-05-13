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
  /** HTTP/status codes that are expected and should not page as errors. */
  expectedStatusCodes?: number[];
  /** Extra structured fields — scrubbed before hitting BetterStack via the logger. */
  extra?: Record<string, unknown>;
}

function statusCodeFromUnknown(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybe = err as { statusCode?: unknown; status?: unknown };
  const raw = maybe.statusCode ?? maybe.status;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
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
    const statusCode = statusCodeFromUnknown(err);
    const expected = statusCode != null && options.expectedStatusCodes?.includes(statusCode) === true;
    const fields = {
      dep: dependency,
      status: "error",
      duration_ms: Date.now() - start,
      message,
      ...(statusCode != null ? { status_code: statusCode } : {}),
      ...(expected ? { expected_status: true } : {}),
      ...(options.operation ? { operation: options.operation } : {}),
      ...(options.extra ?? {}),
    };
    if (expected) {
      log.warn("dependency_call", fields);
    } else {
      log.error("dependency_call", fields);
    }
    throw err;
  }
}
