// Per-tab correlation id.
//
// The `cid` is a UUID generated once per browser tab and sent on every outgoing edge call
// via the `x-cid` header. Edge functions log it; Sentry tags events with it; PostHog attaches
// it as a super-property; `audit_log.cid` stores it for sensitive actions. That way a single
// user complaint can be pivoted across every surface in one click.
//
// Scope: tab-local (sessionStorage). We deliberately avoid localStorage so opening a second
// tab doesn't confuse the trace. If sessionStorage is unavailable (private mode, Safari lockdown)
// we fall back to an in-memory id that still correlates within the page lifetime.

import { setSentryTag } from "./sentry";

const STORAGE_KEY = "holzen.cid";

let memoryCid: string | null = null;

function randomUuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  // RFC 4122 v4 fallback — not crypto-strong but fine for a correlation id.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readFromSession(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToSession(cid: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, cid);
  } catch {
    /* ignore */
  }
}

export function getCid(): string {
  if (memoryCid) return memoryCid;
  const existing = readFromSession();
  if (existing) {
    memoryCid = existing;
    return existing;
  }
  const fresh = randomUuid();
  writeToSession(fresh);
  memoryCid = fresh;
  // Tag Sentry once per tab so every event in this session carries the cid.
  try {
    setSentryTag("cid", fresh);
  } catch {
    /* no-op */
  }
  return fresh;
}

/** Initialise Sentry tagging + any future super-property wiring. Safe to call multiple times. */
export function initCid(): string {
  const cid = getCid();
  try {
    setSentryTag("cid", cid);
  } catch {
    /* no-op */
  }
  return cid;
}
