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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Stale-guard cleanup
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `CheckoutConfirmation` writes up to four checkout-related entries to
 * `localStorage`:
 *
 *   1. `holzen_checkout_confirmed`         — `{ mode, ts }`
 *      The 30-min (configurable) suppression guard. Authoritative `ts`.
 *   2. `holzen_checkout_refresh_state`     — `{ guardTs, mode, … }`
 *      Wallet-refresh lifecycle pinned to a specific guard.
 *
 * Plus two `sessionStorage` entries that are tab-scoped and self-clear when
 * the tab closes; we still scrub them opportunistically:
 *
 *   3. `holzen_checkout_refresh_idempotency` — `{ guardTs, mode, fired[] }`
 *   4. `holzen_checkout_started_at`          — raw timestamp (number)
 *
 * Every site that reads these already lazy-evicts on miss/expiry, so we
 * never *accumulate* in steady state — but a user who abandons mid-flow
 * (closes the tab before the dialog reads the guard, or browses away
 * without ever revisiting checkout) leaves the entries behind for the full
 * window. Multiplied by repeat purchase flows over months that's still only
 * a handful of bytes, but we sweep them anyway so the storage stays tidy
 * and easy to reason about.
 */

const CONFIRMED_KEY = 'holzen_checkout_confirmed';
const REFRESH_STATE_KEY = 'holzen_checkout_refresh_state';
const REFRESH_IDEMPOTENCY_KEY = 'holzen_checkout_refresh_idempotency';
const STARTED_KEY = 'holzen_checkout_started_at';

/** All known checkout-guard storage keys, exported for tests/debugging. */
export const CHECKOUT_GUARD_LOCAL_KEYS = [CONFIRMED_KEY, REFRESH_STATE_KEY] as const;
export const CHECKOUT_GUARD_SESSION_KEYS = [REFRESH_IDEMPOTENCY_KEY, STARTED_KEY] as const;

function safeRemoveLocal(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function safeRemoveSession(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

type SweepReport = {
  removed: string[];
  kept: string[];
};

/**
 * Sweep stale checkout-guard entries from `localStorage` (and the matching
 * `sessionStorage` siblings). Returns a small report so callers can log
 * what happened.
 *
 * Behaviour per key:
 *   - `holzen_checkout_confirmed`: parsed; removed if malformed or older
 *     than the configured suppression window. The parsed `ts` is the
 *     anchor for every other key below.
 *   - `holzen_checkout_refresh_state`: removed if its `guardTs` no longer
 *     matches a live `confirmed` row (i.e. the guard expired or rolled),
 *     or if it itself is malformed.
 *   - `holzen_checkout_refresh_idempotency` (sessionStorage): same rule.
 *   - `holzen_checkout_started_at` (sessionStorage): removed if older
 *     than the suppression window — it's only consulted by `useSubscription`
 *     within that same window.
 *
 * Idempotent and safe to call repeatedly. No-ops in non-browser envs.
 */
export function sweepStaleCheckoutGuards(): SweepReport {
  const report: SweepReport = { removed: [], kept: [] };
  if (typeof window === 'undefined') return report;

  const windowMs = getCheckoutSuppressionWindowMs();
  const now = Date.now();

  // 1. The authoritative confirmed-guard row.
  let liveGuard: { ts: number; mode: unknown } | null = null;
  try {
    const raw = window.localStorage.getItem(CONFIRMED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts?: unknown; mode?: unknown };
      const ts = typeof parsed?.ts === 'number' ? parsed.ts : NaN;
      if (!Number.isFinite(ts) || now - ts > windowMs) {
        safeRemoveLocal(CONFIRMED_KEY);
        report.removed.push(CONFIRMED_KEY);
      } else {
        liveGuard = { ts, mode: parsed.mode };
        report.kept.push(CONFIRMED_KEY);
      }
    }
  } catch {
    safeRemoveLocal(CONFIRMED_KEY);
    report.removed.push(CONFIRMED_KEY);
  }

  // 2. Refresh-lifecycle row, only valid while pinned to the live guard.
  try {
    const raw = window.localStorage.getItem(REFRESH_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { guardTs?: unknown; mode?: unknown };
      const guardTs = typeof parsed?.guardTs === 'number' ? parsed.guardTs : NaN;
      const stillPinned =
        liveGuard !== null &&
        Number.isFinite(guardTs) &&
        guardTs === liveGuard.ts &&
        parsed.mode === liveGuard.mode;
      if (!stillPinned) {
        safeRemoveLocal(REFRESH_STATE_KEY);
        report.removed.push(REFRESH_STATE_KEY);
      } else {
        report.kept.push(REFRESH_STATE_KEY);
      }
    }
  } catch {
    safeRemoveLocal(REFRESH_STATE_KEY);
    report.removed.push(REFRESH_STATE_KEY);
  }

  // 3. Idempotency row (sessionStorage) — same pinning rule.
  try {
    const raw = window.sessionStorage.getItem(REFRESH_IDEMPOTENCY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { guardTs?: unknown; mode?: unknown };
      const guardTs = typeof parsed?.guardTs === 'number' ? parsed.guardTs : NaN;
      const stillPinned =
        liveGuard !== null &&
        Number.isFinite(guardTs) &&
        guardTs === liveGuard.ts &&
        parsed.mode === liveGuard.mode;
      if (!stillPinned) {
        safeRemoveSession(REFRESH_IDEMPOTENCY_KEY);
        report.removed.push(REFRESH_IDEMPOTENCY_KEY);
      } else {
        report.kept.push(REFRESH_IDEMPOTENCY_KEY);
      }
    }
  } catch {
    safeRemoveSession(REFRESH_IDEMPOTENCY_KEY);
    report.removed.push(REFRESH_IDEMPOTENCY_KEY);
  }

  // 4. `started_at` sentinel (sessionStorage) — purely time-based.
  try {
    const raw = window.sessionStorage.getItem(STARTED_KEY);
    if (raw) {
      const startedAt = Number(raw);
      if (!Number.isFinite(startedAt) || now - startedAt > windowMs) {
        safeRemoveSession(STARTED_KEY);
        report.removed.push(STARTED_KEY);
      } else {
        report.kept.push(STARTED_KEY);
      }
    }
  } catch {
    safeRemoveSession(STARTED_KEY);
    report.removed.push(STARTED_KEY);
  }

  return report;
}

/**
 * Schedule `sweepStaleCheckoutGuards` to run:
 *   - immediately (synchronously),
 *   - again whenever the tab regains visibility (cheap catch-up after sleep),
 *   - and on a long polling interval (default: every 15 minutes) so a tab
 *     left open all day still trims expired entries.
 *
 * Returns a teardown that removes the listener and clears the interval.
 * No-ops in non-browser envs.
 */
export function scheduleCheckoutGuardCleanup(
  intervalMs = 15 * 60 * 1000,
): () => void {
  if (typeof window === 'undefined') return () => {};

  sweepStaleCheckoutGuards();

  const onVisibility = () => {
    if (document.visibilityState === 'visible') sweepStaleCheckoutGuards();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const id = window.setInterval(sweepStaleCheckoutGuards, intervalMs);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.clearInterval(id);
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-tab confirmation sync
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The persistent `holzen_checkout_confirmed` row already gives us cross-tab
 * suppression "for free" whenever a sibling tab mounts *after* the first tab
 * recorded its guard — every read of `readConfirmedGuard()` consults
 * `localStorage` synchronously.
 *
 * What it does *not* cover:
 *
 *   1. **Concurrent arrival.** The user clicks a Stripe email receipt while
 *      the success-redirect tab is also opening. Both mount in the same few
 *      hundred ms with the checkout query string, both read no guard, and
 *      both want to `setMode(...)` + `sub.refresh()`. We need a fast
 *      cross-tab broadcast so the laggard collapses into the suppression
 *      path before it issues the redundant edge call.
 *
 *   2. **Already-open siblings.** Tab A is still showing the celebratory
 *      dialog from a confirmation 30s ago. Tab B opens a deep link with the
 *      same checkout params. Tab B will silently suppress (good), but tab A
 *      is still a stale celebratory surface that the user can't dismiss
 *      from B. We dispatch a notification so tab A can fold into the same
 *      quiet "already confirmed" state instead of two surfaces drifting.
 *
 * We use `BroadcastChannel` when available (all evergreen browsers since
 * 2022) and fall back to a `storage`-event ping written to a dedicated key.
 * The ping payload is intentionally small — `{ mode, ts, source }` — and is
 * idempotent: subscribers re-read `readConfirmedGuard()` themselves, so a
 * dropped or duplicate broadcast is non-fatal (the persistent guard is
 * still authoritative).
 */

export type CheckoutConfirmedBroadcast = {
  mode: string;
  /** Guard timestamp (`localStorage[holzen_checkout_confirmed].ts`). */
  ts: number;
  /** Per-tab id of the broadcaster — listeners ignore their own broadcasts. */
  source: string;
};

const BROADCAST_CHANNEL_NAME = 'holzen_checkout_guard';
const BROADCAST_PING_STORAGE_KEY = 'holzen_checkout_guard_ping';

/**
 * Per-tab id used to filter out self-broadcasts. We need this because both
 * `BroadcastChannel` (in some browsers, on the same realm) and the
 * `storage`-event fallback (always, in same-tab cross-frame setups) can
 * deliver our own messages back to us, which would cause the broadcasting
 * tab to dedupe its own dialog into nothing.
 */
const TAB_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export function getCheckoutGuardTabId(): string {
  return TAB_ID;
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (typeof BroadcastChannel === 'undefined') return null;
  try {
    return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    return null;
  }
}

/**
 * Notify other tabs that a checkout confirmation was just recorded by this
 * tab. Safe to call even when no listeners exist.
 */
export function broadcastCheckoutConfirmed(payload: Omit<CheckoutConfirmedBroadcast, 'source'>): void {
  if (typeof window === 'undefined') return;
  const message: CheckoutConfirmedBroadcast = { ...payload, source: TAB_ID };
  const channel = getBroadcastChannel();
  try {
    if (channel) {
      channel.postMessage(message);
      // BroadcastChannel.close() is safe immediately after postMessage —
      // delivery is queued before close resolves the underlying port.
      channel.close();
    }
  } catch {
    /* ignore */
  }
  // Always also write a storage ping. Two reasons:
  //   1. Acts as a fallback for environments without BroadcastChannel
  //      (older Safari, some embedded webviews, jsdom in tests).
  //   2. Lets late-mounting tabs that subscribe *after* the post still pick
  //      up the latest confirmation by reading the ping key on init.
  try {
    window.localStorage.setItem(BROADCAST_PING_STORAGE_KEY, JSON.stringify(message));
  } catch {
    /* ignore quota / privacy mode */
  }
}

/**
 * Subscribe to checkout-confirmation broadcasts from sibling tabs. The
 * handler is **never** invoked for messages this tab itself broadcast.
 * Returns a teardown function. No-op in non-browser envs.
 */
export function subscribeToCheckoutConfirmations(
  handler: (payload: CheckoutConfirmedBroadcast) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const safeHandle = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const msg = raw as Partial<CheckoutConfirmedBroadcast>;
    if (typeof msg.mode !== 'string') return;
    if (typeof msg.ts !== 'number') return;
    if (typeof msg.source !== 'string') return;
    if (msg.source === TAB_ID) return; // ignore self
    handler(msg as CheckoutConfirmedBroadcast);
  };

  // 1. BroadcastChannel listener (evergreen browsers).
  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (ev) => safeHandle(ev.data);
    }
  } catch {
    channel = null;
  }

  // 2. storage-event fallback (works cross-tab, never same-tab — exactly the
  //    semantic we want).
  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== BROADCAST_PING_STORAGE_KEY) return;
    if (!ev.newValue) return;
    try {
      safeHandle(JSON.parse(ev.newValue));
    } catch {
      /* malformed payload — ignore */
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    if (channel) {
      try {
        channel.close();
      } catch {
        /* ignore */
      }
    }
  };
}