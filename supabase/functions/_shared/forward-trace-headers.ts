/**
 * Extract W3C Trace Context + Sentry propagation headers from an incoming edge
 * `Request` for re-use on outbound HTTP (e.g. PostgREST via `createCidSupabaseClient`).
 *
 * Header names follow W3C Trace Context (https://www.w3.org/TR/trace-context/) so the
 * same values work with OpenTelemetry propagators and vendor tracers (Sentry).
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

/**
 * Merge W3C / Sentry trace headers from the incoming edge `Request` into a
 * `fetch` `RequestInit`. Existing header keys (case-insensitive) are not overwritten.
 */
export function fetchInitWithIncomingTrace(
  incoming: Request | undefined,
  init: RequestInit,
): RequestInit {
  if (!incoming) return init;
  const trace = extractForwardedTraceHeaders(incoming);
  if (Object.keys(trace).length === 0) return init;
  const headers = new Headers(init.headers ?? undefined);
  for (const [k, v] of Object.entries(trace)) {
    let has = false;
    for (const hk of headers.keys()) {
      if (hk.toLowerCase() === k.toLowerCase()) {
        has = true;
        break;
      }
    }
    if (!has) headers.set(k, v);
  }
  return { ...init, headers };
}
