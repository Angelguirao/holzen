import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarClock, RefreshCw, Settings as SettingsIcon, AlertTriangle, Receipt, FileCheck, Mail, BellRing, BellOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSubscription } from '@/hooks/use-subscription';
import { PRICING } from '@/lib/pricing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  getCheckoutSuppressionWindowMs,
  broadcastCheckoutConfirmed,
  subscribeToCheckoutConfirmations,
} from '@/lib/checkout-suppression-window';

type Mode = 'subscription' | 'flex_pack_s' | 'flex_pack_m' | null;

/**
 * QUIET_STATE_CHECKLIST — internal pre-ship rules for this dialog.
 *
 * The checkout confirmation must read like a receipt, not a celebration.
 * Each rule below is enforced at runtime by the dev-only audit effect at
 * the bottom of `CheckoutConfirmation` (no-op in production builds).
 *
 * If you find yourself wanting to add a 🎉, a "Welcome", or a coloured
 * "Success!" badge, stop and re-read this list — the answer is no.
 */
const QUIET_STATE_CHECKLIST = {
  // 1. No praise / hype / "wellness influencer" language. Receipts don't
  //    congratulate. Use factual, past-tense or neutral verbs.
  forbiddenPhrases: [
    'welcome',
    'congrat', // congrats / congratulations
    'awesome',
    'great job',
    'amazing',
    'enjoy',
    'thank you',
    'thanks for',
    'success!', // bare "success" is fine in technical strings, the bang isn't
    "you're all set",
    'get started',
    "let's go",
  ] as const,
  // 2. No celebratory / decorative icons. The dialog uses neutral
  //    receipt-style marks only (FileCheck, Receipt, AlertTriangle,
  //    CalendarClock, Mail, BellRing, BellOff, RefreshCw, Settings,
  //    LoadingSpinner). The names below would imply praise / motion.
  forbiddenIconNames: [
    'PartyPopper',
    'Sparkles',
    'Sparkle',
    'Confetti',
    'Trophy',
    'Award',
    'Medal',
    'Star',
    'Heart',
    'ThumbsUp',
    'Rocket',
    'Crown',
    'Gift',
  ] as const,
  // 3. No emojis. Anywhere. Receipts are text + monochrome glyphs only.
  //    Detected via the Extended_Pictographic Unicode property.
  emojiPattern: /\p{Extended_Pictographic}/u,
  // 4. Clear exits required. The dialog must always render at least one
  //    affordance whose accessible name dismisses or navigates away.
  requiredExits: ['Close', 'Manage subscription'] as const,
} as const;

/**
 * Subset of the `list-checkout-events` row we care about. The full shape lives
 * in `src/pages/BillingHistory.tsx`; we duplicate the slice here to avoid a
 * cross-page import for a tiny structural type.
 */
type CheckoutEventLite = {
  session_id: string;
  created: number;
  pack_type: string | null;
  expected_credits: number;
  payment_status: string;
  grant_status: 'applied' | 'pending' | 'not_applicable';
  granted_credits: number | null;
};

/**
 * Persistent guard for the most-recently-confirmed checkout outcome.
 *
 * We persist `{ mode, ts }` to **`localStorage`** (not `sessionStorage`) so a
 * user who closes the tab and returns within `CHECKOUT_CONFIRMED_WINDOW_MS`
 * — e.g. clicked the Stripe email receipt 10 minutes later, or just hit
 * back-and-forward in a fresh tab — still gets a quiet confirmation
 * suppression instead of a re-opened celebratory dialog *and* a redundant
 * `sub.refresh()` round-trip.
 *
 * The window is intentionally bounded (30 min) so a genuinely new checkout
 * later in the day still triggers a fresh confirmation.
 *
 * Suppression effects (both, when the guard hits):
 *   1. Dialog is not re-opened — `setMode` is never called.
 *   2. Underlying sync requests are skipped:
 *        - the in-component `sub.refresh()` (line ~204) is bypassed,
 *        - the `useSubscription` hook's initial checkout-return force flag
 *          (`holzen_checkout_started_at`) is cleared so its first fetch
 *          uses the cached snapshot instead of hitting `check-subscription`
 *          with `{ force: true }`.
 */
const CHECKOUT_CONFIRMED_KEY = 'holzen_checkout_confirmed';
const CHECKOUT_STARTED_KEY = 'holzen_checkout_started_at'; // mirrors useSubscription

/**
 * Per-checkout idempotency guard for `sub.refresh()` calls driven by this
 * component.
 *
 * Two call sites refresh the subscription snapshot:
 *   1. Mount-time refresh on a fresh checkout return (`sub.refresh()` near
 *      the bottom of the detect-mode effect).
 *   2. The user-clicked "Try again" / "Retry credit grant" button
 *      (`handleRetryRefresh`).
 *
 * Without a guard the dialog can remount in the middle of an intentional
 * retry flow (back-nav, focus jitter, React StrictMode double-invoke,
 * persisted-state hydration) and re-issue `sub.refresh()` for the *same*
 * logical action. That's wasted edge invocations and, worse, can race the
 * lifecycle effect into a stale snapshot.
 *
 * Each call site is keyed by `{guardTs, mode, slot}`:
 *   - `mount`     → fires at most once per confirmed checkout (same guardTs)
 *   - `retry:N`   → fires at most once per click of "Try again" (attempt N)
 *
 * Module-level + persisted to `localStorage` so a remount within the same
 * tab — *and* a concurrent mount in a sibling tab racing the same checkout
 * return — both hit the guard. Without cross-tab visibility two tabs that
 * open the success URL within the same few hundred ms would each fire a
 * `mount`-slot refresh. Cleared whenever a fresh confirmation guard is
 * written (new checkout) so a genuinely new purchase always gets fresh slots.
 */
const CHECKOUT_REFRESH_IDEMPOTENCY_KEY = 'holzen_checkout_refresh_idempotency';

type RefreshIdempotencyRow = {
  guardTs: number;
  mode: Exclude<Mode, null>;
  /** Which logical refresh this was: mount-time or a specific retry attempt. */
  fired: string[];
};

function readRefreshIdempotency(): RefreshIdempotencyRow | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_REFRESH_IDEMPOTENCY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RefreshIdempotencyRow;
  } catch {
    return null;
  }
}

function writeRefreshIdempotency(row: RefreshIdempotencyRow | null) {
  try {
    if (!row) {
      localStorage.removeItem(CHECKOUT_REFRESH_IDEMPOTENCY_KEY);
      return;
    }
    localStorage.setItem(CHECKOUT_REFRESH_IDEMPOTENCY_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
}

/**
 * Returns `true` if this `slot` for `(guardTs, mode)` has not yet been fired,
 * and atomically marks it fired. Returns `false` if the slot is already used
 * — caller MUST skip the `sub.refresh()` call in that case.
 */
function claimRefreshSlot(
  guardTs: number,
  mode: Exclude<Mode, null>,
  slot: string,
): boolean {
  const existing = readRefreshIdempotency();
  // Different guard (new checkout, or window rolled) → start fresh row.
  if (!existing || existing.guardTs !== guardTs || existing.mode !== mode) {
    writeRefreshIdempotency({ guardTs, mode, fired: [slot] });
    return true;
  }
  if (existing.fired.includes(slot)) return false;
  writeRefreshIdempotency({ ...existing, fired: [...existing.fired, slot] });
  return true;
}

/**
 * Persisted wallet-refresh lifecycle for the *current* confirmation guard.
 *
 * Keyed implicitly by the active `holzen_checkout_confirmed` row (`mode + ts`)
 * — when the guard rolls (new checkout, or 30-min window elapses) we discard
 * any stale lifecycle so a fresh confirmation always starts from `idle`.
 *
 * We persist the user-visible banner state (`updating`/`timeout`/`error`) so
 * a user who closes the dialog and re-triggers it within the same window
 * (e.g. back-nav with the same checkout params, or the explicit re-open path
 * below) sees the same status row instead of a misleading reset to "idle".
 * Sticky display values are persisted alongside so the shown numbers also
 * never regress across close/reopen.
 */
const CHECKOUT_REFRESH_STATE_KEY = 'holzen_checkout_refresh_state';

type PersistedRefreshState = {
  guardTs: number;
  mode: Mode;
  state: 'idle' | 'updating' | 'timeout' | 'error';
  error: string | null;
  attempts: number;
  stickyBalance: number | null;
  stickyCreditsAdded: number;
  baseline: number | null;
};

function readPersistedRefreshState(
  guard: { mode: Mode; ts: number } | null,
): PersistedRefreshState | null {
  if (!guard) return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_REFRESH_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedRefreshState;
    // Only honour the persisted row if it belongs to the *current* guard.
    if (parsed?.guardTs !== guard.ts || parsed?.mode !== guard.mode) {
      localStorage.removeItem(CHECKOUT_REFRESH_STATE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedRefreshState(next: PersistedRefreshState | null) {
  try {
    if (!next) {
      localStorage.removeItem(CHECKOUT_REFRESH_STATE_KEY);
      return;
    }
    localStorage.setItem(CHECKOUT_REFRESH_STATE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function readConfirmedGuard(): { mode: Mode; ts: number } | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_CONFIRMED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { mode: Mode; ts: number };
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > getCheckoutSuppressionWindowMs()) {
      localStorage.removeItem(CHECKOUT_CONFIRMED_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeConfirmedGuard(mode: Mode) {
  try {
    const ts = Date.now();
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode, ts }),
    );
    // Notify sibling tabs so any of them currently rendering the
    // celebratory dialog (or about to mount with the same checkout query
    // params) can fold into the suppression path instead of double-firing
    // `sub.refresh()` and stacking duplicate dialogs.
    if (mode) {
      broadcastCheckoutConfirmed({ mode, ts });
    }
  } catch {
    /* ignore */
  }
}

/**
 * When the guard suppresses a confirmation we also want to make sure the
 * `useSubscription` hook does not still issue a `check-subscription` call
 * with `{ force: true }` on its first fetch (its initial-checkout sweep
 * looks at `sessionStorage[CHECKOUT_STARTED_KEY]`). Clearing it here keeps
 * the suppressed return path fully sync-free — the cached snapshot from
 * the original confirmation is authoritative.
 */
function clearPendingForceRefreshSentinel() {
  try {
    sessionStorage.removeItem(CHECKOUT_STARTED_KEY);
  } catch {
    /* ignore */
  }
}

function detectMode(search: string): Mode {
  const params = new URLSearchParams(search);
  if (params.get('subscribed') === 'true') return 'subscription';
  if (params.get('credits') === 'true') {
    const pack = params.get('pack');
    if (pack === 'flex_pack_m') return 'flex_pack_m';
    if (pack === 'flex_pack_s') return 'flex_pack_s';
    // Default credits return: surface as a generic credit pack confirmation.
    return 'flex_pack_s';
  }
  return null;
}

/**
 * Post-checkout confirmation dialog.
 *
 * Stripe checkout returns:
 *  - subscription → `/?subscribed=true`
 *  - flex pack    → `/settings?credits=true` (optionally `&pack=flex_pack_s|flex_pack_m`)
 *
 * On detection we:
 *  1. force-refresh the subscription snapshot (already wired via `consumeInitialCheckoutForce`),
 *  2. show a summary of the new tier OR credits granted + updated balance,
 *  3. strip the query params so reloads don't re-open the dialog.
 */
export function CheckoutConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const sub = useSubscription();

  const [mode, setMode] = useState<Mode>(null);
  const [retrying, setRetrying] = useState(false);
  // Per-tab dedup so the suppression status line shows at most once per
  // guard hit — repeated re-renders of the same suppressed URL don't pile up
  // duplicate toasts. Cleared implicitly when the tab closes (sessionStorage
  // semantics aren't needed here; a render-scoped ref suffices because the
  // suppressing effect only fires once per `location.search` change).
  const suppressionAnnouncedRef = useRef<string | null>(null);
  // Snapshot the credit balance at the moment the dialog opens so we can show
  // "+N credits" once the refreshed balance comes in.
  const baselineBalanceRef = useRef<number | null>(null);
  // Guards against React StrictMode double-invoke + accidental re-fires while
  // the dialog is still open. The server itself is idempotent per minute, but
  // there's no reason to issue multiple round-trips from the client.
  const notifySentRef = useRef<Mode | null>(null);
  // Authoritative credit amount sourced from Stripe checkout metadata via
  // `list-checkout-events`. Falls back to PRICING constants only when the
  // lookup hasn't returned yet — this prevents drift if pack sizes change in
  // Stripe but the bundled PRICING constants haven't been redeployed.
  const [purchasedCredits, setPurchasedCredits] = useState<number | null>(null);
  // Tracks whether the matched session has been credited server-side. When
  // true we trust `currentBalance` even before the local subscription snapshot
  // catches up via its own polling.
  const [grantApplied, setGrantApplied] = useState(false);
  // Refresh lifecycle for the wallet balance after a flex-pack purchase:
  //  - 'idle'    : not waiting (subscription mode, or grant already applied)
  //  - 'updating': polling/awaiting wallet refresh
  //  - 'timeout' : wallet didn't reflect the purchase within the budget
  //  - 'error'   : explicit refresh failure surfaced by `sub.refresh()`
  // The numbers shown remain authoritative (Stripe metadata) — this state only
  // drives the inline status messaging + retry affordance.
  const [refreshState, setRefreshState] = useState<'idle' | 'updating' | 'timeout' | 'error'>('idle');
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Notify-channel status for the *current* confirmation. Purely informational —
  // the dialog never blocks on it. `null` = request still in flight (or not yet
  // dispatched for a syncing subscription); otherwise the resolved per-channel
  // outcome from `notify-checkout-confirmation`.
  const [notifyStatus, setNotifyStatus] = useState<{
    emailed: boolean;
    pushed: number;
    skipped?: string | null;
    failed: boolean;
    errorMessage?: string | null;
  } | null>(null);
  const refreshAttemptRef = useRef(0);
  // Mirror of `refreshAttemptRef` for rendering (refs don't trigger re-renders).
  // Bumped in lock-step inside `handleRetryRefresh` so the banner can show
  // "Attempt N/MAX" without us having to thread a derived value through props.
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  // Signature of the last lifecycle row we wrote to localStorage. Used to
  // throttle the persistence effect: the deps array also includes
  // `projectedBalance` / `creditsAdded` (so the persisted snapshot stays in
  // sync with whatever sticky values we'd restore on remount), but those
  // numbers can wobble between identical Stripe / wallet snapshots without
  // the user-visible lifecycle (state / error / attempts) actually moving.
  // Re-serialising + writing on every such tick is wasted work and shows up
  // as `storage` events to other tabs. We only flush when the lifecycle
  // tuple itself changes — sticky/baseline numbers piggy-back on those flushes.
  const lastPersistedSigRef = useRef<string | null>(null);
  // Hard cap on user-initiated retries within a single confirmation window.
  // Matches the implicit ceiling already enforced by the backoff polling
  // (`maxAttempts = 6`) but applies to the *manual* "Try again" button only.
  const MAX_REFRESH_RETRIES = 3;
  // Sticky display values. We only ever advance forward (never regress to a
  // smaller balance / "credits added" than what we previously showed) so the
  // dialog never flickers between an authoritative snapshot and a stale one
  // arriving from a focus-driven refetch a second later.
  const stickyBalanceRef = useRef<number | null>(null);
  const stickyCreditsAddedRef = useRef<number>(0);
  // Tracks the persisted-guard timestamp the lifecycle state currently
  // belongs to. Used both as the persistence key and as a hydration guard
  // (so we don't repeatedly re-hydrate on every render).
  const activeGuardTsRef = useRef<number | null>(null);
  // Dev-only: ref to the rendered dialog root, scanned by the
  // QUIET_STATE_CHECKLIST audit effect below. Never read in production.
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const detected = detectMode(location.search);
    if (!detected) return;
    // If we already showed a confirmation for this mode within the window,
    // strip params silently and bail — handles refresh + back-navigation
    // arriving with the same checkout query string.
    const guard = readConfirmedGuard();
    const alreadyConfirmed = guard?.mode === detected;
    if (!alreadyConfirmed) {
      writeConfirmedGuard(detected);
      // Fresh guard → discard any stale persisted lifecycle from an older
      // confirmation. The fresh row will be written below as the dialog
      // drives its lifecycle effect.
      writePersistedRefreshState(null);
      // Reset the throttle signature so the fresh lifecycle's first write
      // isn't accidentally suppressed by a stale sig from the prior guard.
      lastPersistedSigRef.current = null;
      // Fresh guard → also drop the per-checkout refresh idempotency row so
      // mount-time + retry slots are available again for this new purchase.
      writeRefreshIdempotency(null);
      activeGuardTsRef.current = null;
    }
    if (alreadyConfirmed) {
      const params = new URLSearchParams(location.search);
      params.delete('subscribed');
      params.delete('credits');
      params.delete('pack');
      const next = params.toString();
      navigate(
        { pathname: location.pathname, search: next ? `?${next}` : '', hash: location.hash },
        { replace: true },
      );
      // Skip the underlying sync. The guard's whole point is "we already
      // confirmed this checkout within the window" — re-running
      // `sub.refresh()` (and the hook's force-refresh sentinel) would defeat
      // the persisted-outcome shortcut and burn an edge invocation per
      // refresh / back-nav.
      clearPendingForceRefreshSentinel();
      // If the previous confirmation left the wallet refresh in a non-idle
      // state (still updating, timed out, or errored), re-open the dialog
      // so the user sees the same banner — the refresh outcome is the part
      // of the confirmation they actually need to act on. Hydrate sticky
      // numbers from the persisted row so the displayed balance / credits
      // also don't regress.
      const persisted = readPersistedRefreshState(guard);
      if (persisted && persisted.state !== 'idle') {
        activeGuardTsRef.current = guard.ts;
        stickyBalanceRef.current = persisted.stickyBalance;
        stickyCreditsAddedRef.current = persisted.stickyCreditsAdded;
        baselineBalanceRef.current = persisted.baseline ?? sub.flexCreditsBalance ?? 0;
        refreshAttemptRef.current = persisted.attempts;
        setRefreshAttempt(persisted.attempts);
        setRefreshError(persisted.error);
        setRefreshState(persisted.state);
        setMode(detected);
        return;
      }
      // Quiet, non-rewarding status line. The guard intentionally does *not*
      // re-open the celebratory dialog (refresh / back-nav with stale params
      // shouldn't re-trigger praise UI), but the user just performed an
      // action that *looked* like it should have produced a confirmation.
      // Surfacing a one-liner avoids the silent-failure feeling without
      // veering into "Welcome back!" territory:
      //   - neutral `toast.message` (no success colour, no icon)
      //   - past-tense, descriptive copy ("already shown", not "great job")
      //   - dedup keyed on the suppressed search string so back-and-forth
      //     navigation doesn't stack toasts.
      const dedupeKey = `${detected}:${location.search}`;
      if (suppressionAnnouncedRef.current !== dedupeKey) {
        suppressionAnnouncedRef.current = dedupeKey;
        toast.message('Checkout already confirmed — no new sync triggered.', {
          description: 'Your previous confirmation is still on record. Subscription and credit data were not re-fetched.',
          duration: 4000,
          id: `checkout-suppressed:${detected}`,
        });
      }
      return;
    }
    setMode(detected);
    baselineBalanceRef.current = sub.flexCreditsBalance ?? 0;
    // Anchor the active guard timestamp so subsequent persistence writes
    // share the same row. `writeConfirmedGuard` above just wrote
    // `Date.now()`, so re-read to capture the exact value.
    activeGuardTsRef.current = readConfirmedGuard()?.ts ?? Date.now();
    // Strip checkout query params; keep path + hash.
    const params = new URLSearchParams(location.search);
    params.delete('subscribed');
    params.delete('credits');
    params.delete('pack');
    const next = params.toString();
    navigate(
      { pathname: location.pathname, search: next ? `?${next}` : '', hash: location.hash },
      { replace: true },
    );
    // Trigger a refresh in case the focus listener didn't fire (e.g. same-tab
    // redirect). Idempotency-guarded: if the dialog remounts within the same
    // confirmation guard window (back-nav, persisted-state hydration, React
    // StrictMode double-invoke) the second call is a no-op so we don't burn
    // a redundant `check-subscription` round-trip per remount.
    const guardTs = activeGuardTsRef.current;
    if (guardTs !== null && claimRefreshSlot(guardTs, detected, 'mount')) {
      void sub.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkout query + localStorage guard; listing sub/navigate would re-run and duplicate side effects
  }, [location.search]);

  const open = mode !== null;

  /**
   * Cross-tab listener: when a sibling tab records a fresh checkout
   * confirmation we want this tab to fold into the same suppressed,
   * receipt-only state — without firing its own `sub.refresh()`.
   *
   * Two scenarios this covers:
   *
   *   1. **Sibling already shows the dialog.** This tab has the celebratory
   *      dialog open from a confirmation a few seconds ago. The user opens
   *      another tab (e.g. clicked the Stripe email receipt) and that tab
   *      writes a fresh guard for the same `mode`. We close the local
   *      dialog here so two tabs don't drift on stale celebratory UI.
   *
   *   2. **This tab arrives second on the same checkout.** The detect-mode
   *      effect above already consults `localStorage` synchronously, so a
   *      late-arriving tab usually sees the guard and goes straight to the
   *      suppression path. The broadcast is the safety net for the small
   *      window where two mounts race in the same few hundred ms before
   *      either has written its guard.
   */
  useEffect(() => {
    const unsubscribe = subscribeToCheckoutConfirmations(({ mode: incoming, ts }) => {
      // Sibling tab reported a confirmation that's newer than what we have
      // staged locally. The persistent guard is already written by the
      // sibling, so any subsequent re-render in this tab will read it via
      // `readConfirmedGuard()`. Two things to do *now*:
      //
      //   1. Close any locally-open dialog whose mode matches — we don't
      //      want two tabs showing the same celebratory surface.
      //   2. Pre-mark the mount slot as fired for this guard so a later
      //      remount in this tab (URL strip, focus jitter) does not issue
      //      a redundant `sub.refresh()` for a confirmation already
      //      reconciled by the sibling.
      if (mode && incoming === mode) {
        // Suppress the dialog quietly. Mirrors the suppression toast path
        // in the detect-mode effect so the user gets a single, neutral
        // status line per logical confirmation regardless of which tab
        // authored it.
        const dedupeKey = `${incoming}:cross-tab:${ts}`;
        if (suppressionAnnouncedRef.current !== dedupeKey) {
          suppressionAnnouncedRef.current = dedupeKey;
          toast.message('Checkout already confirmed in another tab.', {
            description:
              'Your previous confirmation is still on record. Subscription and credit data were not re-fetched here.',
            duration: 4000,
            id: `checkout-suppressed-cross-tab:${incoming}`,
          });
        }
        setMode(null);
      }
      // Mark mount slot as claimed so the local detect-mode effect won't
      // fire its own `sub.refresh()` on a subsequent param-stripping
      // remount. Safe even if `mode` here is null — the slot is keyed on
      // `(guardTs, mode, slot)` and any local mount must match `incoming`
      // for the same checkout to be relevant.
      const incomingMode = incoming as Exclude<Mode, null>;
      if (incomingMode) {
        claimRefreshSlot(ts, incomingMode, 'mount');
      }
    });
    return unsubscribe;
  }, [mode]);

  // Fallback when the Stripe lookup hasn't completed yet. Always replaced by
  // the metadata value once `list-checkout-events` returns.
  const fallbackExpectedCredits = useMemo(() => {
    if (mode === 'flex_pack_m') return PRICING.flexPackMCredits;
    if (mode === 'flex_pack_s') return PRICING.flexPackSCredits;
    return 0;
  }, [mode]);
  const expectedCredits = purchasedCredits ?? fallbackExpectedCredits;

  // Resolve the actual purchased credit amount from the most recent paid
  // checkout session matching this mode. Polls briefly because the session
  // may not yet be visible to Stripe's list API the instant we redirect back.
  useEffect(() => {
    if (!mode || mode === 'subscription') return;
    let cancelled = false;
    let attempt = 0;
    const maxAttempts = 6; // ~ up to 30s with the backoff below

    const tick = async () => {
      attempt += 1;
      try {
        const { data, error } = await supabase.functions.invoke('list-checkout-events');
        if (error) throw error;
        const events = (data?.events ?? []) as CheckoutEventLite[];
        // Most recent paid session for this pack type, by created desc.
        const match = events
          .filter(
            (e) =>
              e.pack_type === mode &&
              e.payment_status === 'paid' &&
              (e.expected_credits > 0 || (e.granted_credits ?? 0) > 0),
          )
          .sort((a, b) => b.created - a.created)[0];
        if (match && !cancelled) {
          // Prefer the actual granted amount once the webhook applied it
          // (handles partial grants or future per-session pricing). Otherwise
          // use the metadata-declared expected amount, which is what Stripe
          // recorded at checkout time.
          const authoritative =
            match.grant_status === 'applied' && (match.granted_credits ?? 0) > 0
              ? (match.granted_credits as number)
              : match.expected_credits;
          setPurchasedCredits(authoritative);
          setGrantApplied(match.grant_status === 'applied');
          if (match.grant_status === 'applied') return; // done
        }
      } catch {
        // Best-effort; we'll fall back to PRICING constants until success.
      }
      if (cancelled) return;
      if (attempt < maxAttempts) {
        // Backoff: 1.5s, 3s, 5s, 8s, 12s, 18s
        const delays = [1500, 3000, 5000, 8000, 12000, 18000];
        setTimeout(tick, delays[Math.min(attempt - 1, delays.length - 1)]);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const tierLabel = useMemo(() => {
    if (sub.tier === 'pro_plus') return 'Pro+';
    if (sub.tier === 'pro') return 'Pro';
    if (sub.tier === 'lifetime') return 'Lifetime';
    return 'Pro';
  }, [sub.tier]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  // Trial / billing dates come straight from Stripe via check-subscription.
  // `trial_start` / `trial_end` are only set when Stripe applied a trial;
  // otherwise we fall back to the current period end as the first charge.
  const trialStart = useMemo(
    () => (sub.trialStart ? new Date(sub.trialStart) : null),
    [sub.trialStart],
  );
  const trialEnd = useMemo(
    () => (sub.trialEnd ? new Date(sub.trialEnd) : null),
    [sub.trialEnd],
  );
  const periodEnd = useMemo(
    () => (sub.subscriptionEnd ? new Date(sub.subscriptionEnd) : null),
    [sub.subscriptionEnd],
  );
  const isTrialing = sub.subscriptionStatus === 'trialing' && !!trialEnd;
  const firstChargeAt = isTrialing ? trialEnd : periodEnd;
  const awaitingStripe = mode === 'subscription' && sub.loading && !sub.subscriptionStatus;

  const baseline = baselineBalanceRef.current ?? 0;
  const currentBalance = sub.flexCreditsBalance ?? 0;
  const observedDelta = Math.max(0, currentBalance - baseline);
  // The wallet has caught up if either (a) the local balance moved by at
  // least the purchased amount, or (b) the server confirmed the grant via
  // `list-checkout-events`. Either path lets us drop the "updating" spinner.
  const balanceReflectsPurchase =
    (expectedCredits > 0 && observedDelta >= expectedCredits) || grantApplied;
  // Authoritative purchased amount from Stripe metadata (or the applied grant
  // amount once available). We track this through a ref so re-fetches that
  // arrive *before* `purchasedCredits` resolves can't transiently regress the
  // shown value to the PRICING fallback.
  if (expectedCredits > stickyCreditsAddedRef.current) {
    stickyCreditsAddedRef.current = expectedCredits;
  }
  const creditsAdded = stickyCreditsAddedRef.current || expectedCredits;
  // Computed new balance: snapshot at dialog-open + authoritative purchased
  // amount, OR the live wallet once it matches/exceeds that figure.
  const computedBalance = balanceReflectsPurchase
    ? Math.max(currentBalance, baseline + creditsAdded)
    : baseline + creditsAdded;
  // Monotonic display value: never regresses below what we've already shown
  // the user. Prevents flicker when a focus refetch returns an intermediate
  // snapshot (e.g. webhook half-applied, or a stale cache hit racing with a
  // fresh one). The number is still capped by reality once `currentBalance`
  // overtakes it.
  if (
    stickyBalanceRef.current === null ||
    computedBalance > stickyBalanceRef.current
  ) {
    stickyBalanceRef.current = computedBalance;
  }
  const projectedBalance = stickyBalanceRef.current ?? computedBalance;
  // True while we're still waiting for the refreshed wallet balance to
  // reflect the purchase. The number shown is already correct; the spinner
  // just signals "we're confirming with the server".
  const creditBalanceUpdating =
    mode !== null && mode !== 'subscription' && !balanceReflectsPurchase;
  const subscriptionSyncing = awaitingStripe;

  const handleClose = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    setMode(null);
    // NOTE: We intentionally do **not** reset `refreshState`, `refreshError`,
    // sticky display refs, or the persisted row here. If the user reopens
    // the dialog within the same confirmation guard window (back-nav with
    // checkout params, or the guard's re-open path above) we want the same
    // banner — closing the dialog is not an acknowledgement that the wallet
    // refresh succeeded. The lifecycle is cleared either when:
    //   - the wallet catches up and the lifecycle effect flips to `idle`
    //     (which clears the persisted row), or
    //   - a fresh guard is written (new checkout), or
    //   - the 30-min guard window elapses (the next `readConfirmedGuard`
    //     call drops both the guard and the persisted lifecycle).
  };

  /**
   * Drives the wallet-refresh lifecycle for flex-pack confirmations.
   *
   * Subscription confirmations rely on `useSubscription`'s own polling; this
   * effect is a no-op for them. For credit packs we:
   *  - mark the row as `updating` while we wait for `currentBalance` to catch
   *    up (or for the server to report `grant_status: 'applied'`),
   *  - flip to `timeout` after a generous budget so the user gets an explicit
   *    "we tried, here's a retry" affordance instead of a forever-spinner,
   *  - flip to `idle` the instant the wallet reflects the purchase.
   *
   * The timeout budget intentionally exceeds the `list-checkout-events`
   * back-off window (~30s) so we don't surface a scary state during the
   * normal happy-path lag between checkout return and webhook commit.
   */
  useEffect(() => {
    if (!mode || mode === 'subscription') return;
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (balanceReflectsPurchase) {
      setRefreshState('idle');
      // Wallet caught up — drop the persisted lifecycle so a future
      // re-arrival within the guard window stays quiet (suppressed toast
      // path) instead of re-opening a stale "updating" banner.
      writePersistedRefreshState(null);
      lastPersistedSigRef.current = null;
      return;
    }
    // Don't downgrade an existing 'error' just because we're still waiting.
    setRefreshState((prev) => (prev === 'error' ? prev : 'updating'));
    refreshTimeoutRef.current = setTimeout(() => {
      setRefreshState((prev) => (prev === 'idle' ? prev : 'timeout'));
    }, 45_000);
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [mode, balanceReflectsPurchase]);

  /**
   * Persist the wallet-refresh lifecycle (state, error, sticky display
   * values) so a close + re-open within the same confirmation window
   * restores the same banner instead of resetting to `idle`. Keyed on the
   * active guard timestamp so a fresh checkout always starts clean.
   *
   * Subscriptions don't drive this lifecycle, so we skip them.
   */
  useEffect(() => {
    if (!mode || mode === 'subscription') return;
    if (refreshState === 'idle') return; // cleared by the lifecycle effect above
    const guardTs = activeGuardTsRef.current;
    if (guardTs === null) return;
    // Throttle: only write when the lifecycle tuple
    // (guard / mode / state / error / attempts) actually changes. Sticky
    // balance / creditsAdded / baseline ride along on those flushes — they're
    // monotonic refs that we'd only restore on remount, so a few seconds of
    // staleness in localStorage between lifecycle transitions is harmless.
    const sig = `${guardTs}|${mode}|${refreshState}|${refreshError ?? ''}|${refreshAttemptRef.current}`;
    if (lastPersistedSigRef.current === sig) return;
    lastPersistedSigRef.current = sig;
    writePersistedRefreshState({
      guardTs,
      mode,
      state: refreshState,
      error: refreshError,
      attempts: refreshAttemptRef.current,
      stickyBalance: stickyBalanceRef.current,
      stickyCreditsAdded: stickyCreditsAddedRef.current,
      baseline: baselineBalanceRef.current,
    });
    // `refreshAttempt` is intentionally in the dep array (not just the ref):
    // it's the state mirror of `refreshAttemptRef`, and we want a re-run the
    // moment a retry bumps the counter so the new attempts value lands in
    // localStorage on the same tick the banner re-renders.
  }, [mode, refreshState, refreshError, refreshAttempt, projectedBalance, creditsAdded]);

  /**
   * Proactive cleanup of the persisted refresh lifecycle.
   *
   * Two paths converge here:
   *
   *   1. **Guard expiry timer.** `readConfirmedGuard()` already drops the
   *      `holzen_checkout_confirmed` row lazily (next read after 30 min),
   *      but the *refresh-state* row is keyed off the same `guardTs` and
   *      would otherwise live in `localStorage` until the next confirmation
   *      mounts and prunes it. Schedule a one-shot timer that fires the
   *      moment the guard window elapses for the *currently active* guard
   *      and wipes the persisted lifecycle proactively. This keeps storage
   *      tidy and ensures other tabs / a fresh dialog mount can't pick up
   *      a stale `updating` banner from a guard that's already past TTL.
   *
   *   2. **Unmount-after-timeout.** If the user closes the dialog while it's
   *      sitting in a terminal `timeout` state and never retries, there's
   *      no value in resurrecting the stale "Still syncing" banner on a
   *      future re-open within the same guard — by definition we already
   *      gave up. Drop the row on unmount in that case so the next mount
   *      starts from `idle` (and the suppression-toast path takes over).
   *
   * Subscriptions don't drive this lifecycle, so the effect is a no-op for
   * them.
   */
  useEffect(() => {
    if (!mode || mode === 'subscription') return;
    const guardTs = activeGuardTsRef.current;
    if (guardTs === null) return;

    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    const windowMs = getCheckoutSuppressionWindowMs();
    const remaining = guardTs + windowMs - Date.now();
    if (remaining > 0) {
      // Cap at ~24d to stay inside the 32-bit `setTimeout` ceiling. The
      // suppression window today is 30min so this is purely defensive — if
      // someone bumps it to days via `setCheckoutSuppressionWindowMinutes`
      // we still won't wrap around to a near-zero delay.
      const safeDelay = Math.min(remaining, 2_147_000_000);
      expiryTimer = setTimeout(() => {
        // Re-check: if the user kicked off a new checkout in the meantime,
        // the active guard already moved on and a fresh row was written
        // with a newer `guardTs` — leave that one alone.
        if (activeGuardTsRef.current !== guardTs) return;
        writePersistedRefreshState(null);
        lastPersistedSigRef.current = null;
      }, safeDelay);
    } else {
      // Already past the window on mount (back-nav into a stale URL).
      writePersistedRefreshState(null);
      lastPersistedSigRef.current = null;
    }

    return () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      // Unmount-after-timeout: only clears when the lifecycle has settled
      // into the terminal `timeout` state. We deliberately keep `error` and
      // `updating` rows alive across unmount so a re-open within the guard
      // window can resurface them — the user expects to be able to retry.
      if (refreshState === 'timeout') {
        writePersistedRefreshState(null);
        lastPersistedSigRef.current = null;
      }
    };
    // `refreshState` is intentionally in the deps so the cleanup branch
    // observes the *current* lifecycle value at unmount time. `mode` flips
    // when the dialog detects a new checkout — we want a fresh expiry timer
    // bound to the new `guardTs` in that case.
  }, [mode, refreshState]);

  /**
   * User-facing retry: re-invokes the subscription snapshot and surfaces an
   * explicit error state if the underlying TanStack query throws (network
   * down, edge function 5xx, etc.). Keeps `creditsAdded` / `projectedBalance`
   * intact — they're authoritative regardless of refresh outcome.
   */
  const handleRetryRefresh = async () => {
    if (refreshAttemptRef.current >= MAX_REFRESH_RETRIES) return;
    if (refreshState === 'updating') return;
    const nextAttempt = refreshAttemptRef.current + 1;
    const guardTs = activeGuardTsRef.current;
    // Per-checkout idempotency: each user click owns a unique `retry:N` slot
    // tied to the active confirmation guard. If the dialog remounts mid-retry
    // (state hydration, transient unmount) the in-flight slot is already
    // claimed and the duplicate call is suppressed.
    if (mode && guardTs !== null && !claimRefreshSlot(guardTs, mode, `retry:${nextAttempt}`)) {
      return;
    }
    refreshAttemptRef.current = nextAttempt;
    setRefreshAttempt(nextAttempt);
    setRefreshState('updating');
    setRefreshError(null);
    try {
      await sub.refresh();
      // The lifecycle effect above will flip back to 'idle' or re-arm the
      // timeout depending on whether the new snapshot includes the credits.
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setRefreshError(msg);
      setRefreshState('error');
    }
  };

  /**
   * Refetch policy.
   *
   * We deliberately do **not** auto-refetch on `visibilitychange` or `focus`
   * here. Those events fire indistinguishably for genuine user attention
   * (the user came back to the tab) and for incidental browser activity:
   *
   *  - `navigate({ replace: true })` after stripping the checkout query
   *    params can briefly cycle focus.
   *  - Browser back/forward navigation that lands on this page fires
   *    `focus` even though the user did not ask to refresh anything.
   *  - Other tabs / OS-level focus juggling can fire spurious events.
   *
   * Treating any of those as a refresh trigger results in unintended edge
   * function calls and (worse) silent state churn that can flicker the
   * displayed numbers. The numbers we already show are authoritative
   * (sourced from Stripe checkout metadata via `list-checkout-events`), so
   * the explicit "Try again" / "Retry credit grant" buttons remain the
   * **only** intentional re-fetch surface for users.
   *
   * The single mount-time `sub.refresh()` triggered above (line ~174, when
   * a *fresh* checkout return is detected and the `alreadyConfirmed` guard
   * lets it through) covers the just-returned-from-Stripe happy path.
   */

  // Fire-and-forget the optional email + push confirmation. Honors
  // `profiles.email_notifications` server-side, so users who turned that off
  // get neither channel without any extra UI here.
  useEffect(() => {
    if (!mode) return;
    if (notifySentRef.current === mode) return;
    // For subscriptions we wait until Stripe has populated tier/dates so the
    // email matches what the dialog shows. Subscription-syncing returns early
    // and we'll re-run on the next render once `sub` resolves.
    if (mode === 'subscription' && (sub.loading || !sub.subscriptionStatus)) return;

    // Mark the in-flight intent so concurrent renders / StrictMode double-
    // invokes don't fire twice. We track the snapshot we set so the cleanup
    // below can roll it back **only if it still owns the marker** — a later
    // resolved request must not clobber a fresh attempt.
    const claimedMode = mode;
    notifySentRef.current = claimedMode;
    let cancelled = false;
    let settled = false;
    setNotifyStatus(null);

    const payload =
      mode === 'subscription'
        ? {
            mode,
            tierLabel,
            isTrialing,
            trialStart: trialStart ? dateFmt.format(trialStart) : null,
            firstChargeAt: firstChargeAt ? dateFmt.format(firstChargeAt) : null,
            monthlyPrice:
              sub.tier === 'pro_plus'
                ? `$${PRICING.proPlusMonthlyPrice.toFixed(2)}`
                : `$${PRICING.monthlyPrice.toFixed(2)}`,
            companionUnlocks:
              sub.tier === 'pro_plus'
                ? PRICING.proPlusCompanionUnlocks
                : PRICING.proCompanionUnlocks,
            wallpapers:
              sub.tier === 'pro_plus' ? PRICING.proPlusWallpapers : PRICING.proWallpapers,
            flexCreditsBalance: currentBalance,
          }
        : {
            mode,
            packLabel: mode === 'flex_pack_m' ? 'Flex Pack M' : 'Flex Pack S',
            previousBalance: baseline,
            creditsAdded,
            newBalance: projectedBalance,
          };

    void supabase.functions
      .invoke('notify-checkout-confirmation', { body: payload })
      .then(({ data, error }) => {
        if (cancelled) return;
        settled = true;
        if (error) {
          console.warn('[checkout-confirmation] notify failed', error);
          setNotifyStatus({
            emailed: false,
            pushed: 0,
            failed: true,
            errorMessage: error.message ?? String(error),
          });
          return;
        }
        const emailed = Boolean((data as { emailed?: boolean } | null)?.emailed);
        const pushed = Number((data as { pushed?: number } | null)?.pushed ?? 0);
        const skipped = (data as { skipped?: string | null } | null)?.skipped ?? null;
        setNotifyStatus({ emailed, pushed, skipped, failed: false, errorMessage: null });
      })
      .catch((e) => {
        if (cancelled) return;
        settled = true;
        console.warn('[checkout-confirmation] notify failed', e);
        setNotifyStatus({
          emailed: false,
          pushed: 0,
          failed: true,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      });

    // Cleanup: if the effect tears down (unmount, dependency change, or
    // StrictMode dev double-invoke) before the request resolves, drop the
    // idempotency marker so a future remount can issue the intervention
    // again. We only clear the marker if it still points at *our* claim —
    // a successful resolve happens **after** the await returns, so by the
    // time we'd care to clear, the request is either done (then we keep
    // the marker) or genuinely cancelled (then we release it).
    return () => {
      cancelled = true;
      // Only release the marker if the request never resolved — a settled
      // request (success or handled failure) keeps the marker so the effect
      // doesn't refire when downstream deps (balance, tier) change. An
      // in-flight request that's torn down (unmount, hot-reload, StrictMode
      // double-invoke) frees the slot so a remount can issue it again.
      if (!settled && notifySentRef.current === claimedMode) {
        notifySentRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notify idempotency + cleanup vs full subscription object / formatter deps
  }, [mode, sub.loading, sub.subscriptionStatus, sub.tier, currentBalance, creditsAdded, projectedBalance]);

  const handleManageSubscription = () => {
    setMode(null);
    navigate('/settings');
  };

  /**
   * Manually replays the credit-grant for recent paid flex-pack sessions.
   *
   * Used when the Stripe webhook didn't credit the wallet (misconfig,
   * transient 5xx). Server-side dedup via `(stripe_checkout, cs:<session_id>)`
   * makes this idempotent — re-running after a successful webhook is a no-op.
   */
  const handleRetryGrant = async () => {
    if (retrying) return;
    setRetrying(true);
    // Toast semantics for this dialog (kept consistent across all paths):
    //   • toast.message → acknowledged outcomes (success, no-op, suppressed
    //                     duplicate). Neutral, no colour, no icon.
    //   • toast.error   → real, surfaceable failures only — i.e. the network
    //                     / server call itself rejected. User-facing
    //                     "nothing to do" responses are NOT errors.
    try {
      const { data, error } = await supabase.functions.invoke('retry-flex-credit');
      if (error) throw error;
      const applied = Number(data?.applied) || 0;
      const scanned = Number(data?.scanned) || 0;
      if (applied > 0) {
        toast.message(`Credits reconciled from ${applied} session${applied === 1 ? '' : 's'}.`);
      } else if (scanned > 0) {
        toast.message('No missing credits. Balance already up to date.');
      } else {
        toast.message('No recent flex-pack sessions to reconcile.');
      }
      await sub.refresh();
    } catch (e) {
      // Real failure: the edge function or transport rejected. Use the
      // destructive-styled toast so the user can distinguish this from the
      // neutral acknowledgements above.
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error('Could not reconcile credits', { description: msg });
    } finally {
      setRetrying(false);
    }
  };

  // ── QUIET_STATE_CHECKLIST audit (DEV only) ────────────────────────────
  // Re-scans the rendered dialog after every render and warns once per
  // session for any rule violation. Compiled out of production by Vite via
  // the `import.meta.env.DEV` guard (constant-folded → dead-code-eliminated).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!open) return;
    const root = dialogContentRef.current;
    if (!root) return;
    // Defer one frame so Radix portal content is in the DOM.
    const id = window.requestAnimationFrame(() => {
      const text = (root.textContent ?? '').toLowerCase();
      const violations: string[] = [];
      // 1. Forbidden phrases.
      for (const phrase of QUIET_STATE_CHECKLIST.forbiddenPhrases) {
        if (text.includes(phrase)) {
          violations.push(`praise/hype phrase: "${phrase}"`);
        }
      }
      // 2. Forbidden celebratory icons (lucide renders the component name on
      //    the SVG via `data-lucide` / `class*="lucide-<name>"`).
      const svgs = root.querySelectorAll('svg');
      svgs.forEach((svg) => {
        const cls = svg.getAttribute('class') ?? '';
        for (const name of QUIET_STATE_CHECKLIST.forbiddenIconNames) {
          // lucide-react emits class names like "lucide-party-popper".
          const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
          if (cls.toLowerCase().includes(`lucide-${kebab}`)) {
            violations.push(`celebratory icon: ${name}`);
          }
        }
      });
      // 3. No emojis anywhere in the rendered text.
      if (QUIET_STATE_CHECKLIST.emojiPattern.test(root.textContent ?? '')) {
        violations.push('emoji found in rendered text');
      }
      // 4. At least one clear-exit affordance must be reachable, and the
      //    "Close" button must be the primary action: rendered with the
      //    default Button variant (no `variant="outline"`-style modifier
      //    classes), focusable via keyboard, and carrying an accessible
      //    name that explicitly says "Close".
      const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
      const buttonNames = buttons.map((b) =>
        (b.getAttribute('aria-label') ?? b.textContent ?? '').trim(),
      );
      const hasExit = QUIET_STATE_CHECKLIST.requiredExits.some((label) =>
        buttonNames.some((name) => name.toLowerCase().includes(label.toLowerCase())),
      );
      if (!hasExit) {
        violations.push(
          `no clear exit (expected one of: ${QUIET_STATE_CHECKLIST.requiredExits.join(', ')})`,
        );
      }
      const closeBtn = buttons.find((b) =>
        ((b.getAttribute('aria-label') ?? b.textContent ?? '')
          .toLowerCase()
          .includes('close')),
      );
      if (!closeBtn) {
        violations.push('Close button missing');
      } else {
        // Must be keyboard-reachable.
        if (closeBtn.disabled || closeBtn.tabIndex < 0) {
          violations.push('Close button is not keyboard-reachable');
        }
        // Must be the primary action — the shadcn Button "outline" /
        // "ghost" / "secondary" variants all add a recognizable border or
        // bg-transparent class. Primary uses `bg-primary`.
        const cls = closeBtn.className;
        if (!/bg-primary(?!-)/.test(cls)) {
          violations.push('Close button is not the primary (default) variant');
        }
      }
      if (violations.length > 0) {
        console.warn(
          '[CheckoutConfirmation] QUIET_STATE_CHECKLIST violations:\n  • ' +
            violations.join('\n  • '),
        );
      }
    });
    return () => window.cancelAnimationFrame(id);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent ref={dialogContentRef} className="sm:max-w-md">
        <DialogHeader>
          {/*
            Quiet state: no celebratory badge / coloured halo. A single neutral
            mono mark, left-aligned with the title, communicates "this is a
            receipt" without praise or ambient motion.
          */}
          {/*
            Header mark intentionally lightweight: smaller glyph, lower-contrast
            foreground, mono caption. Communicates "receipt" as state, not as
            decoration — no badge, no fill, no colour halo.
          */}
          <div className="mb-2 flex items-center gap-1.5 text-muted-foreground/70" aria-hidden>
            {mode === 'subscription' ? (
              <FileCheck className="h-3 w-3" strokeWidth={1.5} />
            ) : (
              <Receipt className="h-3 w-3" strokeWidth={1.5} />
            )}
            <span className="text-[10px] font-mono uppercase tracking-wider">
              {mode === 'subscription' ? 'Subscription receipt' : 'Credits receipt'}
            </span>
          </div>
          <DialogTitle className="text-left">
            {mode === 'subscription' ? `Holzen ${tierLabel} subscription` : 'Flex credits added'}
          </DialogTitle>
          <DialogDescription className="text-left">
            {mode === 'subscription'
              ? isTrialing
                ? `${PRICING.trialDays}-day trial started. Manage or cancel anytime in Settings.`
                : 'Subscription active. Manage or cancel anytime in Settings.'
              : 'Updated balance and grant details below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          {mode === 'subscription' ? (
            <ul className="space-y-2">
              <SummaryRow label="Plan" value={`Holzen ${tierLabel}`} />
              {isTrialing ? (
                <SummaryRow
                  label="Trial started"
                  value={trialStart ? dateFmt.format(trialStart) : subscriptionSyncing ? 'Syncing' : '—'}
                  pending={!trialStart && subscriptionSyncing}
                  icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden />}
                />
              ) : null}
              <SummaryRow
                label={isTrialing ? 'First charge on' : 'Next charge on'}
                value={firstChargeAt ? dateFmt.format(firstChargeAt) : subscriptionSyncing ? 'Syncing' : '—'}
                pending={!firstChargeAt && subscriptionSyncing}
                highlight
                icon={!isTrialing ? <CalendarClock className="h-3.5 w-3.5" aria-hidden /> : undefined}
              />
              <SummaryRow
                label="Monthly price"
                value={
                  sub.tier === 'pro_plus'
                    ? `$${PRICING.proPlusMonthlyPrice.toFixed(2)}`
                    : `$${PRICING.monthlyPrice.toFixed(2)}`
                }
              />
              <SummaryRow
                label="Pause companions / month"
                value={
                  sub.tier === 'pro_plus'
                    ? String(PRICING.proPlusCompanionUnlocks)
                    : String(PRICING.proCompanionUnlocks)
                }
              />
              <SummaryRow
                label="Wallpapers / month"
                value={
                  sub.tier === 'pro_plus'
                    ? String(PRICING.proPlusWallpapers)
                    : String(PRICING.proWallpapers)
                }
              />
              <SummaryRow
                label="Flex credits balance"
                value={String(currentBalance)}
                pending={subscriptionSyncing}
              />
            </ul>
          ) : (
            <ul className="space-y-2">
              <SummaryRow
                label="Pack"
                value={mode === 'flex_pack_m' ? 'Flex Pack M' : 'Flex Pack S'}
              />
              <SummaryRow label="Previous balance" value={String(baseline)} />
              <SummaryRow
                label="Credits added"
                value={`+${creditsAdded}`}
                highlight
                pending={creditBalanceUpdating}
              />
              <SummaryRow
                label="New balance"
                value={String(projectedBalance)}
                pending={creditBalanceUpdating}
                pendingHint={
                  refreshState === 'updating'
                    ? 'Updating balance…'
                    : refreshState === 'timeout'
                      ? 'Still syncing'
                      : refreshState === 'error'
                        ? 'Refresh failed'
                        : 'updating'
                }
                highlight
              />
            </ul>
          )}
        </div>

        {mode !== null && mode !== 'subscription' && refreshState !== 'idle' ? (
          <RefreshStatusBanner
            state={refreshState}
            errorMessage={refreshError}
            onRetry={handleRetryRefresh}
            attempt={refreshAttempt}
            maxAttempts={MAX_REFRESH_RETRIES}
          />
        ) : null}

        {mode !== null ? (
          <NotifyDispatchStatus status={notifyStatus} />
        ) : null}

        <DialogFooter className="mt-2">
          {mode !== null && mode !== 'subscription' ? (
            <Button
              variant="outline"
              onClick={handleRetryGrant}
              disabled={retrying}
              className="w-full sm:w-auto"
            >
              {retrying ? (
                <LoadingSpinner className="mr-2 h-4 w-4 border-[1.5px]" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              )}
              Retry credit grant
            </Button>
          ) : null}
          {mode === 'subscription' ? (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="w-full sm:w-auto"
            >
              <SettingsIcon className="mr-2 h-4 w-4" aria-hidden />
              Manage subscription
            </Button>
          ) : null}
          {/*
            Primary exit. Radix Dialog already traps focus, restores focus to
            the trigger on close, and wires Escape → onOpenChange(false). This
            button is the default (primary) variant so it's the visually and
            tabbing-wise prominent action, autoFocused so screen-reader users
            land on a clear exit immediately, and labeled "Close" with an
            explicit aria-label that names the dialog being closed.
          */}
          <Button
            onClick={handleClose}
            autoFocus
            aria-label={
              mode === 'subscription'
                ? 'Close subscription receipt'
                : 'Close credits receipt'
            }
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  icon,
  pending,
  pendingHint,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
  pending?: boolean;
  pendingHint?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={
          (highlight ? 'font-semibold text-primary' : 'font-medium text-foreground') +
          ' inline-flex items-center gap-1.5'
        }
        aria-live={pending ? 'polite' : undefined}
        aria-busy={pending || undefined}
      >
        {value}
        {pending ? (
          <>
            <LoadingSpinner className="h-3 w-3 border-[1.5px]" />
            {pendingHint ? (
              <span className="text-xs font-normal text-muted-foreground">
                {pendingHint}
              </span>
            ) : null}
          </>
        ) : null}
      </span>
    </li>
  );
}

export default CheckoutConfirmation;

/**
 * Inline transparency row showing whether the optional email + web-push
 * confirmation requests were successfully queued for this purchase.
 *
 * Intentionally calm: no celebratory icons, no retry affordance — the channel
 * is best-effort and the dialog never blocks on it. Three states:
 *  - `null`              → still dispatching (muted spinner row)
 *  - server `skipped`    → user opted out of notifications (muted note)
 *  - resolved            → per-channel summary (email + N device(s))
 *  - `failed`            → muted warning row with the error message
 */
function NotifyDispatchStatus({
  status,
}: {
  status: {
    emailed: boolean;
    pushed: number;
    skipped?: string | null;
    failed: boolean;
    errorMessage?: string | null;
  } | null;
}) {
  const baseClass =
    'mt-3 flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground';

  if (status === null) {
    return (
      <div className={baseClass} role="status" aria-live="polite">
        <LoadingSpinner className="h-3 w-3 border-[1.5px]" />
        <span>Queuing email and push confirmation…</span>
      </div>
    );
  }

  if (status.skipped === 'opted_out') {
    return (
      <div className={baseClass} role="status">
        <BellOff className="h-3.5 w-3.5" aria-hidden />
        <span>Notifications are off — no email or push sent.</span>
      </div>
    );
  }

  if (status.failed) {
    return (
      <div
        className="mt-3 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
        role="status"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        <span>
          Could not queue email/push confirmation
          {status.errorMessage ? (
            <span className="ml-1 opacity-70">({status.errorMessage})</span>
          ) : null}
          .
        </span>
      </div>
    );
  }

  const emailLabel = status.emailed ? 'Email queued' : 'Email skipped';
  const pushLabel =
    status.pushed > 0
      ? `Push queued · ${status.pushed} device${status.pushed === 1 ? '' : 's'}`
      : 'Push skipped';

  return (
    <div className={baseClass} role="status">
      <span className="inline-flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5" aria-hidden />
        {emailLabel}
      </span>
      <span aria-hidden className="opacity-50">·</span>
      <span className="inline-flex items-center gap-1.5">
        <BellRing className="h-3.5 w-3.5" aria-hidden />
        {pushLabel}
      </span>
    </div>
  );
}

/**
 * Inline status banner for the wallet-refresh lifecycle on flex-pack
 * confirmations. Renders nothing for the `idle` state — the caller already
 * gates on that, but we double-check defensively.
 *
 * Visual hierarchy is intentionally calm:
 *  - `updating` → muted info row, no call to action
 *  - `timeout`  → muted warning row + outlined "Try again" button
 *  - `error`    → destructive-toned row + outlined "Try again" button
 *
 * The numbers shown above are authoritative either way, so this banner is
 * about transparency, not blocking the user's understanding of the purchase.
 */
function RefreshStatusBanner({
  state,
  errorMessage,
  onRetry,
  attempt,
  maxAttempts,
}: {
  state: 'updating' | 'timeout' | 'error';
  errorMessage: string | null;
  onRetry: () => void;
  attempt: number;
  maxAttempts: number;
}) {
  const exhausted = attempt >= maxAttempts;
  const updating = state === 'updating';
  // Counter shown next to "Try again". Hidden until the user has actually
  // retried at least once so the first attempt looks clean.
  const attemptLabel = attempt > 0 ? `${attempt}/${maxAttempts}` : null;
  if (state === 'updating') {
    return (
      <div
        className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="flex items-center gap-2">
          <LoadingSpinner className="h-3 w-3 border-[1.5px]" />
          <span>
            Updating balance…
            {attemptLabel ? (
              <span className="ml-1 opacity-70">(attempt {attemptLabel})</span>
            ) : null}
          </span>
        </span>
        {/*
          Non-interactive disabled affordance while a refresh is in flight.
          The persisted lifecycle row (`holzen_checkout_refresh_state`) is
          actively being driven here, and `handleRetryRefresh` already short-
          circuits when `refreshState === 'updating'` — but surfacing the
          disabled button (instead of hiding it) communicates *why* clicking
          isn't possible right now and prevents users from rage-clicking the
          empty space where the retry will appear once we settle into
          `timeout` / `error`. `aria-disabled` + `tabIndex={-1}` keep
          assistive tech from offering it as an actionable target.
        */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-disabled="true"
          tabIndex={-1}
          className="h-7 px-2 text-xs"
          // No `onClick` — the upstream guard already blocks duplicate
          // retries, and a disabled button shouldn't fire one anyway.
        >
          <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" aria-hidden />
          Retrying…
        </Button>
      </div>
    );
  }
  if (state === 'timeout') {
    return (
      <div
        className="mt-3 flex flex-col gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        role="status"
        aria-live="polite"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          Balance not yet updated. Credits are recorded server-side.
          {attemptLabel ? (
            <span className="ml-1 opacity-70">(attempt {attemptLabel})</span>
          ) : null}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={updating || exhausted}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className={`mr-1.5 h-3 w-3 ${updating ? 'animate-spin' : ''}`} aria-hidden />
          {exhausted ? 'No retries left' : updating ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    );
  }
  // 'error'
  return (
    <div
      className="mt-3 flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive sm:flex-row sm:items-center sm:justify-between"
      role="alert"
      aria-live="assertive"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        <span>
          Balance refresh failed
          {errorMessage ? <span className="ml-1 opacity-70">({errorMessage})</span> : null}
          . Credits remain recorded server-side.
          {attemptLabel ? (
            <span className="ml-1 opacity-70">(attempt {attemptLabel})</span>
          ) : null}
        </span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={updating || exhausted}
        className="h-7 px-2 text-xs"
      >
        <RefreshCw className={`mr-1.5 h-3 w-3 ${updating ? 'animate-spin' : ''}`} aria-hidden />
        {exhausted ? 'No retries left' : updating ? 'Retrying…' : 'Try again'}
      </Button>
    </div>
  );
}