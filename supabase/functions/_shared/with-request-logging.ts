// Shared request wrapper for edge functions.
//
// Cross-cutting concerns this owns (so individual functions don't reinvent them):
//   - CORS preflight
//   - Correlation id (reads `x-cid` header; generates one if missing)
//   - Structured request/response logs via `createLogger` (→ stdout + BetterStack)
//   - EdgeError → JSON response with the standardized envelope
//   - Sentry capture for unexpected errors (skips `EdgeError.isExpected` codes)
//   - One-time Sentry init per cold start
//
// Usage (see docs/ops/edge-logging-conventions.md):
//
//   import { withRequestLogging } from "../_shared/with-request-logging.ts";
//
//   Deno.serve(withRequestLogging("my-function", async ({ req, log, cid }) => {
//     log("handled", { path: new URL(req.url).pathname });
//     return jsonResponse({ ok: true });
//   }));
//
// Handlers receive `{ req, log, cid }` and return a `Response`. Throwing `EdgeError` produces
// a structured client response; any other throw becomes a 500 + Sentry capture.

import { corsHeaders, handleCors } from "./cors.ts";
import { createLogger } from "./observe.ts";
import { edgeErrorToJson, EdgeError, isEdgeError } from "./edge-error.ts";
import { captureEdgeError, initSentryEdges } from "./sentry.ts";

export interface RequestLoggingContext {
  req: Request;
  /** Structured logger bound to this request (already carries cid + fn + release + frontend_release). */
  log: ReturnType<typeof createLogger>;
  /** Correlation id — same value as the `x-cid` request header (or a freshly generated UUID). */
  cid: string;
  /**
   * Frontend release (`x-app-version` header) of the caller, or `undefined` if the caller is
   * an internal invocation (cron, another edge fn) that doesn't carry the header. Handlers
   * generally don't need this — Sentry + the logger already include it automatically.
   */
  frontendRelease?: string;
}

export type EdgeHandler = (ctx: RequestLoggingContext) => Promise<Response> | Response;

function readCid(req: Request): string {
  const fromHeader = req.headers.get("x-cid") || req.headers.get("X-Cid");
  if (fromHeader && fromHeader.length > 0 && fromHeader.length < 128) return fromHeader;
  return crypto.randomUUID();
}

/**
 * W3C Trace Context version `00` (https://www.w3.org/TR/trace-context/#traceparent-header).
 * Matches OpenTelemetry’s default propagator format for interoperable trace / span ids.
 */
const TRACEPARENT_V00_RE = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

/** W3C `tracestate` max length is 512; keep log field smaller for drain safety. */
const TRACESTATE_LOG_MAX = 256;

function parseTraceparentHeader(header: string | null): {
  trace_id: string;
  parent_span_id: string;
  trace_flags: string;
  trace_sampled: boolean;
} | undefined {
  if (!header) return undefined;
  const m = header.trim().match(TRACEPARENT_V00_RE);
  if (!m) return undefined;
  const trace_flags = m[3].toLowerCase();
  const n = parseInt(trace_flags, 16);
  const trace_sampled = Number.isFinite(n) && (n & 0x01) === 0x01;
  return {
    trace_id: m[1].toLowerCase(),
    parent_span_id: m[2].toLowerCase(),
    trace_flags,
    trace_sampled,
  };
}

/** Optional `tracestate` list-member header (same spec); truncated for structured logs. */
function tracestateForRequestLog(header: string | null): string | undefined {
  if (!header) return undefined;
  const t = header.trim();
  if (t.length === 0) return undefined;
  if (t.length > TRACESTATE_LOG_MAX) return `${t.slice(0, TRACESTATE_LOG_MAX)}…`;
  return t;
}

function readFrontendRelease(req: Request): string | undefined {
  const raw = req.headers.get("x-app-version") || req.headers.get("X-App-Version");
  if (!raw) return undefined;
  // Keep it short + ascii-safe — `release` strings are a Git SHA (12 hex) or
  // `<semver>-b<stamp>`. Anything wildly longer is suspect (header injection, bug);
  // clamp rather than propagate. Drop it entirely if it looks like garbage.
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 64) return undefined;
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function decorateResponse(res: Response, cid: string): Response {
  // Attach cid + ensure CORS headers are present on every response so handlers can return
  // bare `new Response(...)` without repeating CORS plumbing.
  const headers = new Headers(res.headers);
  headers.set("x-cid", cid);
  for (const [k, v] of Object.entries(corsHeaders)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

/**
 * Wrap an edge handler with CORS, logging, Sentry, and EdgeError handling.
 *
 * @param fnName Function name — used as log prefix, Sentry tag, and BetterStack `service`.
 * @param handler Business logic. Throw `EdgeError` for user-visible failures; throw anything
 *                else and it becomes a 500 + Sentry capture.
 */
export function withRequestLogging(fnName: string, handler: EdgeHandler) {
  // Init Sentry once per cold start — no-op when SENTRY_DSN_EDGES is unset.
  initSentryEdges();

  return async (req: Request): Promise<Response> => {
    const cors = handleCors(req);
    if (cors) return cors;

    const cid = readCid(req);
    const frontendRelease = readFrontendRelease(req);
    const log = createLogger(fnName, cid, { frontendRelease });
    const url = new URL(req.url);
    const traceparent =
      req.headers.get("traceparent") || req.headers.get("Traceparent") || req.headers.get("TRACEPARENT");
    const w3c = parseTraceparentHeader(traceparent);
    const tracestate =
      req.headers.get("tracestate") || req.headers.get("Tracestate") || req.headers.get("TRACESTATE");
    const tracestateLog = w3c ? tracestateForRequestLog(tracestate) : undefined;

    log("request", {
      method: req.method,
      path: url.pathname,
      // Query string is safe to log in principle, but some functions accept `?q=` free text.
      // Keep it off by default — functions that need it can log inside the handler.
      ...(w3c ?? {}),
      ...(tracestateLog ? { tracestate: tracestateLog } : {}),
    });

    try {
      const response = await handler({ req, log, cid, frontendRelease });
      log("response", { status: response.status });
      return decorateResponse(response, cid);
    } catch (err) {
      if (isEdgeError(err)) {
        const ee = err as EdgeError;
        log.warn("edge_error", { code: ee.code, status: ee.status, message: ee.message });
        // `captureEdgeError` already short-circuits on `isExpected`.
        captureEdgeError(err, { fn: fnName, cid, frontendRelease });
        return decorateResponse(
          new Response(JSON.stringify(edgeErrorToJson(ee, cid)), {
            status: ee.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }),
          cid
        );
      }

      // Unexpected throw — capture to Sentry, log structurally, return 500.
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      log.error("unhandled_exception", { message, stack });
      captureEdgeError(err, { fn: fnName, cid, frontendRelease, forceSend: true });
      return decorateResponse(
        new Response(
          JSON.stringify({
            error: { code: "internal", message: "Internal error", cid },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        ),
        cid
      );
    }
  };
}
