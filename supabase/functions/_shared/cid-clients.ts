/**
 * Correlation-ID-aware constructors for downstream calls.
 *
 * Background: every edge request has a per-request correlation id (`cid`)
 * that the `withRequestLogging` wrapper reads from the `x-cid` request
 * header (or generates), binds to the logger, and echoes back on the
 * response. That `cid` is the join key across BetterStack (edge logs),
 * Sentry (tag), PostHog (super-property), and Postgres (`audit_log.cid`).
 *
 * Without these helpers, calls leaving the function — Supabase REST/Auth
 * round-trips, web-push deliveries — never carry the cid, so:
 *
 *   - Server-side row-level audit triggers can't stamp `audit_log.cid`,
 *     breaking the join from "the user clicked X" → "the DB write that
 *     resulted from it".
 *   - A failing push delivery shows up as an opaque webpush error in
 *     Edge Logs with no link back to the originating request.
 *
 * These two helpers make the cid travel with the call, and ensure the
 * dependency log line carries it (the logger is already `cid`-bound, so
 * `logDependencyCall(log, ...)` inherits it automatically).
 *
 * Read alongside `with-request-logging.ts` and `deps.ts`.
 */

import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logDependencyCall } from "./deps.ts";
import type { createLogger } from "./observe.ts";

type Logger = ReturnType<typeof createLogger>;

/**
 * Build a Supabase client whose every outbound HTTP request carries the
 * caller's `x-cid` header. This makes the `cid` available to:
 *
 *   - PostgREST → SQL session (`request.headers` GUC) → audit triggers.
 *   - Auth API logs (Supabase dashboard).
 *   - Storage API logs.
 *
 * The request header is intentionally set in addition to (not in place of)
 * the user's `Authorization`. If the caller passes their own
 * `global.headers`, those win — we only fill in `x-cid` and only when
 * absent, to avoid clobbering a forwarded one.
 *
 * Returned client behaves identically to `createClient` otherwise; this is
 * a drop-in replacement intended for use inside edge handlers:
 *
 *   const supabase = createCidSupabaseClient(
 *     Deno.env.get("SUPABASE_URL")!,
 *     Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
 *     cid,
 *     { auth: { persistSession: false } },
 *   );
 */
export function createCidSupabaseClient(
  url: string,
  key: string,
  cid: string,
  opts: SupabaseClientOptions<"public"> = {},
): SupabaseClient {
  const callerHeaders = opts.global?.headers ?? {};
  // Don't overwrite an explicit x-cid that the caller already set (e.g. a
  // chained edge fn forwarding the upstream cid verbatim).
  const headersWithCid = "x-cid" in callerHeaders || "X-Cid" in callerHeaders
    ? callerHeaders
    : { ...callerHeaders, "x-cid": cid };

  return createClient(url, key, {
    ...opts,
    global: {
      ...opts.global,
      headers: headersWithCid,
    },
  });
}

/**
 * Web-push subscription shape expected by `web-push@3.6.7`. Matches the
 * `PushSubscription.toJSON()` output that the browser stores in
 * `push_subscriptions`.
 */
export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface WebPushLike {
  sendNotification(
    sub: PushSubscriptionRecord,
    payload: string,
    options?: Record<string, unknown>,
  ): Promise<{ statusCode?: number } | unknown>;
}

export interface SendWebPushOptions {
  /** Optional structured tag (idempotency key, notification type) for log dashboards. */
  notificationTag?: string;
  /** Delivery status codes that are expected and handled by the caller. */
  expectedStatusCodes?: number[];
  /** Optional VAPID/TTL/etc options forwarded to `webpush.sendNotification`. */
  webpushOptions?: Record<string, unknown>;
}

/**
 * Wrap `webpush.sendNotification` in `logDependencyCall` so each delivery
 * produces a structured `dependency_call` log line with the caller's cid,
 * the push endpoint host (not the full URL — endpoints contain
 * provider-side opaque tokens), the notification tag, and the delivery
 * outcome.
 *
 * Why a host hash instead of the full endpoint?
 *   - Full endpoints are PII-adjacent (per-device opaque IDs that, joined
 *     with `push_subscriptions.user_id`, identify the device).
 *   - The host (e.g. `fcm.googleapis.com`, `web.push.apple.com`) is the
 *     useful pivot for "is FCM down right now?".
 *
 * The helper re-throws on failure so the caller can still inspect
 * `err.statusCode` (e.g. to prune 404/410 subscriptions).
 */
export async function sendWebPushWithCid(
  log: Logger,
  webpush: WebPushLike,
  sub: PushSubscriptionRecord,
  payload: string,
  options: SendWebPushOptions = {},
): Promise<unknown> {
  let endpointHost = "unknown";
  try {
    endpointHost = new URL(sub.endpoint).host;
  } catch {
    // Malformed endpoint — keep "unknown" rather than throw before sending;
    // webpush itself will produce the actionable error.
  }

  return logDependencyCall(
    log,
    "webpush",
    () => webpush.sendNotification(sub, payload, options.webpushOptions),
    {
      operation: "send",
      expectedStatusCodes: options.expectedStatusCodes,
      extra: {
        endpoint_host: endpointHost,
        ...(options.notificationTag ? { notification_tag: options.notificationTag } : {}),
      },
    },
  );
}
