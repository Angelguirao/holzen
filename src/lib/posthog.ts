// PostHog bootstrap — privacy-first analytics + feature flags.
//
// Hard rules (see docs/ops/event-taxonomy.md + docs/ops/pii-masking-review.md):
//   - `autocapture: false` — no DOM scraping. Only deliberate `track()` calls.
//   - `session_recording.disabled: true` — no replay. Sentry handles error replay with masking.
//   - `person_profiles: 'identified_only'` — anonymous users don't create person records
//     (keeps MTU count + costs down).
//   - `sanitize_properties` strips anything that looks like free-text user content before it
//     leaves the browser. Backstop to `event-taxonomy.md` discipline, not a replacement.
//   - `capture_pageview: false` — no automatic pageviews; add route-level events explicitly if needed.

import posthog, { type PostHog, type Properties } from "posthog-js";

import { POSTHOG_HOST, POSTHOG_KEY } from "@/config/public-env";
import { getCid } from "./cid";

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
]);

const STRING_MAX_LEN = 500;

function sanitizeString(v: string): string {
  const emailMasked = v.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "<email>"
  );
  return emailMasked.length > STRING_MAX_LEN
    ? `${emailMasked.slice(0, STRING_MAX_LEN)}…[truncated]`
    : emailMasked;
}

function sanitizeProperties(properties: Properties): Properties {
  const out: Properties = {};
  for (const [k, v] of Object.entries(properties)) {
    if (PII_VALUE_KEYS.has(k.toLowerCase())) {
      out[k] = "[redacted]";
      continue;
    }
    if (typeof v === "string") out[k] = sanitizeString(v);
    else out[k] = v;
  }
  return out;
}

let initialized = false;
let posthogInstance: PostHog | null = null;

export function initPostHog(): void {
  if (initialized) return;
  if (!POSTHOG_KEY) return;

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
      loaded: (ph) => {
        posthogInstance = ph as unknown as PostHog;
        // Register super-properties attached to every event.
        try {
          ph.register({
            cid: getCid(),
            $app_version: __APP_VERSION__,
            environment: import.meta.env.MODE,
          });
        } catch {
          /* no-op */
        }
      },
      sanitize_properties: (properties) => sanitizeProperties(properties ?? {}),
    });
    initialized = true;
    posthogInstance = posthog;
  } catch (err) {
    console.error("[posthog] init failed", err);
  }
}

/** Identify the current user by id only — never pass email/name. */
export function identifyPostHog(userId: string): void {
  if (!initialized || !posthogInstance) return;
  try {
    posthogInstance.identify(userId);
  } catch {
    /* no-op */
  }
}

/** Clear the identified user (sign-out). */
export function resetPostHog(): void {
  if (!initialized || !posthogInstance) return;
  try {
    posthogInstance.reset();
  } catch {
    /* no-op */
  }
}

/**
 * Fire a product analytics event. Event names MUST appear in
 * docs/ops/event-taxonomy.md. Properties are sanitized by the init-time hook.
 */
export function trackEvent(event: string, properties?: Properties): void {
  if (!initialized || !posthogInstance) return;
  try {
    posthogInstance.capture(event, properties);
  } catch {
    /* no-op */
  }
}

export function getPostHog(): PostHog | null {
  return posthogInstance;
}
