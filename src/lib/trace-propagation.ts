// W3C Trace Context + Sentry propagation for Supabase edge calls.
//
// Sentry v10 exposes `getTraceData({ propagateTraceparent: true })`, which yields
// `sentry-trace`, `baggage`, and W3C `traceparent` when a propagation context exists.
// We also copy `tracestate` when Sentry (or a future SDK) provides it — same W3C header
// set OpenTelemetry’s default composite propagator would attach.
// We merge these onto every edge request so BetterStack + downstream tooling can align
// with OpenTelemetry-style correlation (alongside Holzen's `x-cid`).
//
// Imports `@sentry/react` directly to avoid a dependency cycle with `sentry.ts`.

import * as Sentry from "@sentry/react";

export function getHolzenOutgoingTraceHeaders(): Record<string, string> {
  try {
    if (typeof Sentry.getTraceData !== "function") return {};
    const data = Sentry.getTraceData({ propagateTraceparent: true }) as Record<string, unknown>;
    const out: Record<string, string> = {};
    /** Same cap as edge `forward-trace-headers.ts` — W3C + Sentry propagation keys only. */
    const maxLen = 8192;
    for (const key of ["sentry-trace", "baggage", "traceparent", "tracestate"] as const) {
      const v = data[key];
      if (typeof v !== "string") continue;
      const t = v.trim();
      if (t.length === 0 || t.length > maxLen) continue;
      out[key] = t;
    }
    return out;
  } catch {
    return {};
  }
}
