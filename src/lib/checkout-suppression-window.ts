/**
 * Centralized configuration for the **checkout-confirmed suppression window**.
 *
 * After a successful Stripe checkout return, two surfaces deliberately
 * short-circuit re-fetches and re-celebrations for a configurable window:
 *
 *   1. `CheckoutConfirmation` — suppresses the celebratory dialog and the
 *      mount-time `sub.refresh()` while a confirmation is fresh.
 *   2. `useSubscription` — clears the `holzen_checkout_started_at` sentinel
 *      so the first `check-subscription` call does NOT promote to
 *      `{ force: true }` if we already confirmed within the window.
 *
 * Both surfaces MUST agree on the window length, otherwise users would see
 * the dialog suppressed but still hit `check-subscription` (or vice versa).
 * This module is the single source of truth.
 *
 * Users can override the default (30 minutes) under Settings → Preferences.
 * The override persists in `localStorage` and is read synchronously, so the
 * very first mount after a page load already honors it.
 */

const STORAGE_KEY = 'holzen_checkout_confirmed_window_minutes';
const DEFAULT_MINUTES = 30;
const MIN_MINUTES = 1;
const MAX_MINUTES = 24 * 60; // one day — anything longer is almost certainly a typo

export const CHECKOUT_SUPPRESSION_WINDOW_STORAGE_KEY = STORAGE_KEY;
export const CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES = DEFAULT_MINUTES;
export const CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES = MIN_MINUTES;
export const CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES = MAX_MINUTES;

function clamp(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

/**
 * Read the configured window in **minutes**. Falls back to the default if
 * the stored value is missing, malformed, or out of bounds. Safe to call in
 * non-browser environments (returns the default).
 */
export function getCheckoutSuppressionWindowMinutes(): number {
  if (typeof window === 'undefined') return DEFAULT_MINUTES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_MINUTES;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_MINUTES;
    return clamp(parsed);
  } catch {
    return DEFAULT_MINUTES;
  }
}

/** Same value as {@link getCheckoutSuppressionWindowMinutes} but in milliseconds. */
export function getCheckoutSuppressionWindowMs(): number {
  return getCheckoutSuppressionWindowMinutes() * 60 * 1000;
}

/**
 * Persist a new window length (in minutes). Out-of-bounds values are clamped
 * into `[MIN_MINUTES, MAX_MINUTES]`. Returns the value that was actually
 * stored so callers can reflect the clamp in their UI state.
 */
export function setCheckoutSuppressionWindowMinutes(minutes: number): number {
  const clamped = clamp(minutes);
  if (typeof window === 'undefined') return clamped;
  try {
    if (clamped === DEFAULT_MINUTES) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
    }
  } catch {
    /* ignore quota / privacy-mode failures — caller still gets the clamped value */
  }
  return clamped;
}

/** Restore the default window length. */
export function resetCheckoutSuppressionWindow(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}