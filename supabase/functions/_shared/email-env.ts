/**
 * Resend / transactional email identity — env-driven per Supabase project.
 *
 * Production defaults: holzen.app / notify.holzen.app
 * Staging: set EMAIL_FROM_DOMAIN=resend.dev, EMAIL_FROM_LOCAL=onboarding,
 * EMAIL_SUBJECT_PREFIX=[STAGING] (see docs/ops/resend-environment-setup.md).
 */

export const DEFAULT_EMAIL_BRAND_NAME = "holzen";
export const DEFAULT_EMAIL_FROM_DOMAIN = "holzen.app";
export const DEFAULT_EMAIL_SENDER_DOMAIN = "notify.holzen.app";
export const DEFAULT_EMAIL_ROOT_DOMAIN = "holzen.app";
export const DEFAULT_EMAIL_APP_URL = "https://holzen.app";
export const DEFAULT_EMAIL_FEEDBACK_INBOX = "hello@holzen.app";

function trimEnv(key: string): string | undefined {
  const value = readEnv(key);
  return value || undefined;
}

/** Read env in Deno edges and Vitest (process.env). */
function readEnv(key: string): string | undefined {
  if (typeof Deno !== "undefined" && typeof Deno.env?.get === "function") {
    const value = Deno.env.get(key)?.trim();
    return value || undefined;
  }
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key]?.trim();
    return value || undefined;
  }
  return undefined;
}

/** Display name in From: headers (e.g. holzen vs Holzen Staging). */
export function resolveEmailBrandName(): string {
  return trimEnv("EMAIL_BRAND_NAME") ?? DEFAULT_EMAIL_BRAND_NAME;
}

/** Domain in From: local@domain (must be verified in Resend for that project). */
export function resolveEmailFromDomain(): string {
  return trimEnv("EMAIL_FROM_DOMAIN") ?? DEFAULT_EMAIL_FROM_DOMAIN;
}

/** Local part for auth / product mail (default noreply). Staging on resend.dev: onboarding. */
export function resolveEmailFromLocal(): string {
  return trimEnv("EMAIL_FROM_LOCAL") ?? "noreply";
}

/** Verified Resend sender subdomain FQDN (legacy metadata; optional override). */
export function resolveEmailSenderDomain(): string {
  return trimEnv("EMAIL_SENDER_DOMAIN") ?? DEFAULT_EMAIL_SENDER_DOMAIN;
}

/** Root domain for links inside templates when site_url is absent. */
export function resolveEmailRootDomain(): string {
  return trimEnv("EMAIL_ROOT_DOMAIN") ?? DEFAULT_EMAIL_ROOT_DOMAIN;
}

/** Canonical app URL for email deep links (admin, marketing). */
export function resolveEmailAppUrl(): string {
  return trimEnv("EMAIL_APP_URL") ?? `https://${resolveEmailRootDomain()}`;
}

/** Ops inbox for feedback copies (send-feedback). */
export function resolveFeedbackInbox(): string {
  return trimEnv("EMAIL_FEEDBACK_INBOX") ?? DEFAULT_EMAIL_FEEDBACK_INBOX;
}

/** Build `Brand <local@domain>` for auth / welcome / checkout. */
export function resolveEmailFromAddress(displayName?: string): string {
  const name = displayName ?? resolveEmailBrandName();
  return `${name} <${resolveEmailFromLocal()}@${resolveEmailFromDomain()}>`;
}

/** Build `Brand <notify@domain>` (or EMAIL_NOTIFY_LOCAL) for notifications / ops. */
export function resolveNotifyFromAddress(displayName?: string): string {
  const name = displayName ?? resolveEmailBrandName();
  const local = trimEnv("EMAIL_NOTIFY_LOCAL") ?? "notify";
  return `${name} <${local}@${resolveEmailFromDomain()}>`;
}

/** Prefix non-prod subjects, e.g. `[STAGING] Confirm your email`. */
export function prefixEmailSubject(subject: string): string {
  const prefix = trimEnv("EMAIL_SUBJECT_PREFIX");
  if (!prefix) return subject;
  if (subject.startsWith(prefix)) return subject;
  const withSpace = prefix.endsWith(" ") ? prefix : `${prefix} `;
  return `${withSpace}${subject}`;
}

/** Web Push VAPID contact URI. */
export function resolveVapidMailto(): string {
  const local = trimEnv("EMAIL_VAPID_MAILTO_LOCAL") ?? resolveEmailFromLocal();
  return `mailto:${local}@${resolveEmailFromDomain()}`;
}

function readBoolEnv(key: string, defaultValue: boolean): boolean {
  const v = readEnv(key);
  if (v === undefined) return defaultValue;
  return !(v === "0" || v === "false" || v === "no");
}

/**
 * Volatility pause-offer email from `check-volatility`.
 * Default enabled; set `PAUSE_VOLATILITY_EMAIL_ENABLED=false` on Edge secrets to disable
 * without affecting auth, welcome, checkout, or web push / in-app bell.
 */
export function isPauseVolatilityEmailEnabled(): boolean {
  return readBoolEnv("PAUSE_VOLATILITY_EMAIL_ENABLED", true);
}
