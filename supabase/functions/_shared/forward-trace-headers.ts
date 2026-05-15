/**
 * Extract W3C Trace Context + Sentry propagation headers from an incoming edge
 * `Request` for re-use on outbound HTTP (e.g. PostgREST via `createCidSupabaseClient`).
 *
 * Header names are lowercase on the wire; `Headers.get` is case-insensitive.
 * Values are clamped to avoid accidental log/header blowups.
 */

const INCOMING_TRACE_HEADER_NAMES = ["traceparent", "tracestate", "sentry-trace", "baggage"] as const;

const MAX_TRACE_HEADER_LEN = 8192;

export function extractForwardedTraceHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of INCOMING_TRACE_HEADER_NAMES) {
    const raw = req.headers.get(name);
    if (!raw) continue;
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_TRACE_HEADER_LEN) continue;
    out[name] = trimmed;
  }
  return out;
}
