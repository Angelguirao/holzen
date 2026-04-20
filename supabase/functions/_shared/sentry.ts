// Shared Sentry helpers for Supabase edge functions (Deno).
//
// Design:
//   - One init per cold start. Subsequent calls are no-ops (an `initialized` module flag).
//   - `initSentryEdges()` is safe to call from every function's entry point. It no-ops
//     entirely when `SENTRY_DSN_EDGES` is unset, so local/dev has zero cost.
//   - `captureEdgeError(err, ctx)` returns the Sentry event id (or empty string on no-op).
//     Skips expected `EdgeError` codes (auth_required, rate_limited, etc.) to protect quota.
//   - `scrubPiiEdge` is the server-side sibling of the frontend `sentry.ts` scrubber.
//     Applies to `beforeSend` + any user-supplied context.
//
// Import path uses `esm.sh` because edge functions run on Deno without npm resolution —
// the stable `@sentry/deno` package is published as an ESM module there.

import * as Sentry from "https://esm.sh/@sentry/deno@8.47.0";
import { isEdgeError, type EdgeError } from "./edge-error.ts";
import { EDGE_RELEASE } from "./release.ts";

/** Keys whose values are user-authored free-text content — never forward to Sentry. */
const PII_VALUE_KEYS = new Set<string>([
  "email",
  "user_email",
  "reflection",
  "reflection_text",
  "reflection_body",
  "journal",
  "journal_text",
  "journal_entry",
  "letter",
  "letter_body",
  "prompt",
  "user_input",
  "text",
  "body",
  "content",
  "message_body",
  "password",
  "api_key",
  "authorization",
]);

const STRING_MAX_LEN = 500;

function scrubString(v: string): string {
  const emailMasked = v.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "<email>"
  );
  return emailMasked.length > STRING_MAX_LEN
    ? `${emailMasked.slice(0, STRING_MAX_LEN)}…[truncated]`
    : emailMasked;
}

function scrubValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  if (PII_VALUE_KEYS.has(key.toLowerCase())) return "[redacted]";
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((v) => scrubValue(key, v));
  if (typeof value === "object") return scrubPiiEdge(value as Record<string, unknown>);
  return value;
}

export function scrubPiiEdge(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = scrubValue(k, v);
  return out;
}

let initialized = false;

/**
 * Initialise Sentry for edge functions. Safe to call once per cold start.
 *
 * `tracesSampleRate: 0` — edge tracing duplicates what BetterStack already captures and
 * blows through Sentry performance quota fast. Re-enable per-function later if we need it.
 */
export function initSentryEdges(): void {
  if (initialized) return;
  const dsn = Deno.env.get("SENTRY_DSN_EDGES");
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      // Resolution order mirrors the frontend (`resolveAppVersion` in vite.config.ts):
      //   1. `SENTRY_RELEASE` secret — lets ops override per-environment without a redeploy.
      //   2. `APP_VERSION` secret — legacy alias kept for backwards compat.
      //   3. `EDGE_RELEASE` constant — stamped at pre-push by `scripts/stamp-edge-release.mjs`
      //      and committed, so every `supabase functions deploy` ships a real Git SHA.
      //   4. `"unknown"` only if the stamp somehow got lost — should never happen.
      release:
        Deno.env.get("SENTRY_RELEASE") ??
        Deno.env.get("APP_VERSION") ??
        EDGE_RELEASE ??
        "unknown",
      environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
      tracesSampleRate: 0,
      // Don't sample frequent noise. Upstream rate limiting / invocation quotas are the real
      // defense; this is a belt-and-suspenders cap.
      maxBreadcrumbs: 20,
      beforeSend(event, hint) {
        try {
          const error = hint?.originalException;
          // Skip expected EdgeError codes — they are normal user flow, not regressions.
          if (isEdgeError(error) && (error as EdgeError).isExpected) return null;

          if (event.extra) event.extra = scrubPiiEdge(event.extra);
          if (event.tags) event.tags = scrubPiiEdge(event.tags) as typeof event.tags;
          if (event.contexts) {
            event.contexts = scrubPiiEdge(event.contexts) as typeof event.contexts;
          }
          // Never send request bodies — they can carry reflection/journal content.
          if (event.request) {
            delete event.request.data;
            delete event.request.cookies;
            if (event.request.headers) {
              const safe: Record<string, string> = {};
              for (const [k, v] of Object.entries(event.request.headers)) {
                if (/authorization|cookie|apikey|token/i.test(k)) continue;
                if (typeof v === "string") safe[k] = v.slice(0, 200);
              }
              event.request.headers = safe;
            }
          }
          if (event.user) event.user = { id: event.user.id ?? undefined };
          return event;
        } catch {
          return null;
        }
      },
    });
    initialized = true;
  } catch (err) {
    console.error("[edge-sentry] init failed", err);
  }
}

export interface EdgeErrorContext {
  /** Function name (mirror of the logger prefix). */
  fn: string;
  /** Correlation id from the request. */
  cid?: string;
  /** User id — safe because it's an opaque UUID, never an email. */
  userId?: string;
  /** Any extra structured fields. Values are scrubbed before send. */
  extra?: Record<string, unknown>;
  /**
   * Frontend release (`x-app-version` header) at the time of the erroring request.
   * Indexed as the `frontend_release` tag so Sentry filters can answer "this edge
   * error — which frontend build was the user on?" without joining across projects.
   */
  frontendRelease?: string;
  /** Expected-error override (normally resolved from EdgeError.isExpected). */
  forceSend?: boolean;
}

/**
 * Capture an exception in the edge runtime. Returns the Sentry event id (empty when no-op).
 *
 * Expected `EdgeError` codes (auth_required, rate_limited, bad_input, not_found) are dropped
 * unless `forceSend: true` — they belong in BetterStack as structured logs, not in Sentry.
 */
export function captureEdgeError(err: unknown, ctx: EdgeErrorContext): string {
  if (!initialized) return "";
  try {
    if (!ctx.forceSend && isEdgeError(err) && (err as EdgeError).isExpected) return "";

    let eventId = "";
    Sentry.withScope((scope) => {
      scope.setTag("fn", ctx.fn);
      if (ctx.cid) scope.setTag("cid", ctx.cid);
      if (ctx.userId) scope.setUser({ id: ctx.userId });
      if (ctx.extra) scope.setContext("extra", scrubPiiEdge(ctx.extra));
      if (ctx.frontendRelease) scope.setTag("frontend_release", ctx.frontendRelease);
      if (isEdgeError(err)) {
        scope.setTag("error.code", (err as EdgeError).code);
        scope.setFingerprint([ctx.fn, (err as EdgeError).code]);
      }
      eventId = Sentry.captureException(err) ?? "";
    });
    return eventId;
  } catch (captureErr) {
    console.error("[edge-sentry] capture failed", captureErr);
    return "";
  }
}

export { Sentry };
