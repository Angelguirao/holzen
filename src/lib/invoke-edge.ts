// Canonical helper for calling Supabase edge functions from the frontend.
//
// Why this exists even though `supabase.functions.invoke` is patched to inject `x-cid`:
//   - It returns a normalized `{ data, error }` with a consistent error shape.
//   - It lets us add cross-cutting behavior (breadcrumbs, PostHog timing, retries) in one place
//     without touching every call site.
//   - It's explicit: grep `invokeEdge(` to find all edge calls made from the UI.
//
// Existing code using `supabase.functions.invoke(...)` still works and still gets a cid —
// new code should prefer this helper.

import { supabase } from "@/integrations/supabase/client";
import { getCid } from "./cid";
import { Sentry } from "./sentry";

declare const __APP_VERSION__: string;

export interface InvokeEdgeOptions<B = unknown> {
  /** JSON body. */
  body?: B;
  /** Extra headers (`x-cid` is added automatically if missing). */
  headers?: Record<string, string>;
  /** HTTP method override (defaults to POST; edge functions accept GET when declared). */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

export interface InvokeEdgeResult<T> {
  data: T | null;
  error: Error | null;
  /** Correlation id sent on this call — pivot anchor for Sentry/BetterStack/audit_log. */
  cid: string;
}

export async function invokeEdge<T = unknown, B = unknown>(
  functionName: string,
  options: InvokeEdgeOptions<B> = {}
): Promise<InvokeEdgeResult<T>> {
  const cid = getCid();
  // `x-app-version` lets edge Sentry + BetterStack tag every event with the
  // exact frontend build that issued the request — decisive when debugging
  // "this edge errored, was the user on a stale PWA cache?" questions.
  // Matches Sentry `release` on the frontend (`__APP_VERSION__` from Vite).
  const headers: Record<string, string> = {
    "x-cid": cid,
    "x-app-version": typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev",
    ...options.headers,
  };

  const start = performance.now();
  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: options.body as unknown,
      headers,
      method: options.method,
      // `signal` is supported on newer supabase-js; ignored on older versions.
      ...(options.signal ? { signal: options.signal } : {}),
    });
    const durationMs = Math.round(performance.now() - start);

    try {
      Sentry.addBreadcrumb({
        category: "edge",
        type: error ? "error" : "http",
        level: error ? "warning" : "info",
        message: functionName,
        data: { cid, durationMs, status: error ? "error" : "ok" },
      });
    } catch {
      /* no-op */
    }

    return { data: data ?? null, error: error ?? null, cid };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
      cid,
    };
  }
}
