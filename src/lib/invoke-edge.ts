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
  method?: "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
  /**
   * URL query string for the edge function. When set, uses `fetch` (still with anon key +
   * `x-cid`) because `supabase.functions.invoke` does not attach query parameters to the URL.
   */
  query?: Record<string, string | undefined>;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

export interface InvokeEdgeResult<T> {
  data: T | null;
  error: Error | null;
  /** Correlation id sent on this call — pivot anchor for Sentry/BetterStack/audit_log. */
  cid: string;
}

function buildEdgeQueryString(query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, value);
  }
  return params.toString();
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
    const queryString = options.query ? buildEdgeQueryString(options.query) : "";
    const useFetchForQuery = queryString.length > 0;

    let data: T | null = null;
    let error: Error | null = null;

    if (useFetchForQuery) {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const url = `${baseUrl.replace(/\/$/, "")}/functions/v1/${encodeURIComponent(functionName)}?${queryString}`;
      const fetchHeaders: Record<string, string> = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        ...headers,
      };
      const method = options.method ?? "GET";
      const init: RequestInit = {
        method,
        headers: fetchHeaders,
        signal: options.signal,
      };
      if (method !== "GET" && method !== "HEAD" && options.body !== undefined) {
        init.headers = { ...fetchHeaders, "Content-Type": "application/json" };
        init.body = JSON.stringify(options.body);
      }
      const res = await fetch(url, init);
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        let message = res.statusText || `Edge function error (${res.status})`;
        if (contentType.includes("application/json")) {
          try {
            const errBody = (await res.json()) as { error?: string; message?: string };
            if (typeof errBody.error === "string") message = errBody.error;
            else if (typeof errBody.message === "string") message = errBody.message;
          } catch {
            /* keep statusText */
          }
        }
        error = new Error(message);
      } else if (contentType.includes("application/json")) {
        try {
          data = (await res.json()) as T;
        } catch {
          error = new Error("Invalid JSON response from edge function");
        }
      } else {
        // Empty or non-JSON success body
        data = null;
      }
    } else {
      const invoked = await supabase.functions.invoke<T>(functionName, {
        body: options.body as unknown,
        headers,
        method: options.method,
        // `signal` is supported on newer supabase-js; ignored on older versions.
        ...(options.signal ? { signal: options.signal } : {}),
      });
      data = invoked.data ?? null;
      error = invoked.error ?? null;
    }

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

    return { data, error, cid };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
      cid,
    };
  }
}
