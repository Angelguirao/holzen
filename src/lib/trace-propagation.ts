// W3C Trace Context + Sentry propagation for Supabase edge calls.
//
// Sentry v10 exposes `getTraceData({ propagateTraceparent: true })`, which yields
// `sentry-trace`, `baggage`, and W3C `traceparent` when a propagation context exists.
// We merge these onto every edge request so BetterStack + downstream tooling can align
// with OpenTelemetry-style correlation (alongside Holzen's `x-cid`).
//
// Imports `@sentry/react` directly to avoid a dependency cycle with `sentry.ts`.

import * as Sentry from "@sentry/react";

export function getHolzenOutgoingTraceHeaders(): Record<string, string> {
  try {
    if (typeof Sentry.getTraceData !== "function") return {};
    const data = Sentry.getTraceData({ propagateTraceparent: true });
    const out: Record<string, string> = {};
    if (typeof data["sentry-trace"] === "string" && data["sentry-trace"].length > 0) {
      out["sentry-trace"] = data["sentry-trace"];
    }
    if (typeof data.baggage === "string" && data.baggage.length > 0) {
      out.baggage = data.baggage;
    }
    if (typeof data.traceparent === "string" && data.traceparent.length > 0) {
      out.traceparent = data.traceparent;
    }
    return out;
  } catch {
    return {};
  }
}
