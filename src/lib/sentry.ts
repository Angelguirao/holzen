// Sentry bootstrap for the frontend SPA.
//
// Design choices (see docs/ops/observability-setup.md + docs/ops/pii-masking-review.md):
//   - Session Replay is on-error only (never sample; only attach when an error is captured).
//     Recordings mask all text, inputs, and media — reflection content must never leak.
//   - `tracesSampleRate` is 0.1 (10% of navigations). We can raise later if performance budget
//     is fine; lower cost/quota risk early.
//   - `beforeSend` scrubs known PII fields (emails, reflection/journal content, free-text bodies)
//     and drops expected/benign errors so Sentry quota is spent on real regressions.
//   - No init when `SENTRY_DSN` is empty — zero side effects in local/dev unless you opt in.
//
// This module must stay small: it is imported synchronously at the top of `main.tsx` before
// React renders, so any failure here can brick the app. Guard everything behind try/catch.

import * as Sentry from "@sentry/react";

import { SENTRY_DSN } from "@/config/public-env";

function tracePropagationTargets(): (string | RegExp)[] {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!raw || typeof raw !== "string") return [];
  try {
    return [new URL(raw).origin];
  } catch {
    return [];
  }
}

/** Keys whose values are free-text user content we must never send to Sentry. */
const PII_VALUE_KEYS = new Set<string>([
  "email",
  "user_email",
  "reflection",
  "reflection_text",
  "opening_message",
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
]);

/** Truncation limit for any string that passes the scrubber (defense in depth). */
const STRING_MAX_LEN = 500;

/** Error messages we expect during normal operation — they waste Sentry quota. */
const EXPECTED_ERROR_PATTERNS = [
  /auth session missing/i,
  /jwt expired/i,
  /refresh token not found/i,
  /failed to fetch/i, // offline/captive-portal transient; PWA handles these
  /load failed/i,
  /networkerror/i,
  /aborterror/i,
  /^canceled$/i,
  /resizeobserver loop/i, // benign browser noise
  /non-error promise rejection captured/i,
];

function scrubString(v: string): string {
  // Mask anything that looks like an email — cheap regex, catches most leaks.
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
  if (Array.isArray(value)) return value.map((item) => scrubValue(key, item));
  if (typeof value === "object") return scrubObject(value as Record<string, unknown>);
  return value;
}

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = scrubValue(k, v);
  return out;
}

function isExpectedError(message: string | undefined): boolean {
  if (!message) return false;
  return EXPECTED_ERROR_PATTERNS.some((rx) => rx.test(message));
}

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!SENTRY_DSN) return;

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      release: __APP_VERSION__,
      environment: import.meta.env.MODE,
      // Browser tracing + on-error Replay. Replay is `errorSampleRate: 1.0` so every *captured*
      // error has a short recording attached; `sessionSampleRate: 0` means we never record
      // non-erroring sessions (cost + privacy).
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1,
      // W3C `traceparent` + Sentry headers on edge calls (CORS allow-list in `cors.ts`).
      propagateTraceparent: true,
      tracePropagationTargets: tracePropagationTargets(),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      // Keep breadcrumbs short — they can carry PII from console/fetch traffic.
      maxBreadcrumbs: 30,
      // Attach stack traces to `Sentry.captureMessage` too (rare but useful).
      attachStacktrace: true,
      beforeSend(event, hint) {
        try {
          const error = hint?.originalException as Error | undefined;
          const message = (event.message || error?.message || "") as string;
          if (isExpectedError(message)) return null;

          if (event.request) {
            // Never send cookies, auth headers, or raw bodies.
            delete event.request.cookies;
            if (event.request.headers) {
              const safeHeaders: Record<string, string> = {};
              for (const [k, v] of Object.entries(event.request.headers)) {
                if (/authorization|cookie|apikey|token/i.test(k)) continue;
                if (typeof v === "string") safeHeaders[k] = v.slice(0, 200);
              }
              event.request.headers = safeHeaders;
            }
            delete event.request.data;
          }

          if (event.extra) event.extra = scrubObject(event.extra);
          if (event.contexts) event.contexts = scrubObject(event.contexts) as typeof event.contexts;
          if (event.tags) event.tags = scrubObject(event.tags) as typeof event.tags;

          // `user` must stay id-only (set by setSentryUser below); strip anything else.
          if (event.user) {
            event.user = { id: event.user.id ?? undefined };
          }

          return event;
        } catch {
          // Never let the scrubber throw — drop the event instead.
          return null;
        }
      },
      beforeBreadcrumb(crumb) {
        if (!crumb) return crumb;
        if (crumb.data) crumb.data = scrubObject(crumb.data);
        if (typeof crumb.message === "string") crumb.message = scrubString(crumb.message);
        return crumb;
      },
    });

    initialized = true;
  } catch (err) {
    console.error("[sentry] init failed", err);
  }
}

/** Set the current user id on Sentry scope — never send email/name. Call on sign-in. */
export function setSentryUser(userId: string | null | undefined): void {
  if (!initialized) return;
  try {
    Sentry.setUser(userId ? { id: userId } : null);
  } catch {
    /* no-op */
  }
}

/** Set a Sentry tag (e.g. `cid`). Values are stringified + truncated by Sentry. */
export function setSentryTag(key: string, value: string | number | undefined): void {
  if (!initialized) return;
  try {
    Sentry.setTag(key, value ?? "");
  } catch {
    /* no-op */
  }
}

/**
 * Capture an exception with optional extra context. Safe to call before init (no-op).
 * Returns the Sentry event id (or empty string) so callers like ErrorBoundary + FeedbackWidget
 * can pivot back to the event.
 */
export function captureException(err: unknown, extra?: Record<string, unknown>): string {
  if (!initialized) return "";
  try {
    return Sentry.captureException(err, { extra: extra ? scrubObject(extra) : undefined });
  } catch {
    return "";
  }
}

export { Sentry };
