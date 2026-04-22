import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarClock, RefreshCw, Settings as SettingsIcon, AlertTriangle, Receipt, FileCheck } from 'lucide-react';
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

type Mode = 'subscription' | 'flex_pack_s' | 'flex_pack_m' | null;

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
const CHECKOUT_CONFIRMED_WINDOW_MS = 30 * 60 * 1000;

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
    if (Date.now() - parsed.ts > CHECKOUT_CONFIRMED_WINDOW_MS) {
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
    localStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode, ts: Date.now() }),
    );
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
  const refreshAttemptRef = useRef(0);
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
        toast.message('Confirmation already shown for this checkout.', {
          description: 'Open Settings to review your subscription or credits.',
          duration: 4000,
          id: `checkout-suppressed:${detected}`,
        });
      }
      return;
    }
    setMode(detected);
    baselineBalanceRef.current = sub.flexCreditsBalance ?? 0;
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
    // Trigger a refresh in case the focus listener didn't fire (e.g. same-tab redirect).
    void sub.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const open = mode !== null;

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
    setRefreshState('idle');
    setRefreshError(null);
    refreshAttemptRef.current = 0;
    stickyBalanceRef.current = null;
    stickyCreditsAddedRef.current = 0;
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
   * User-facing retry: re-invokes the subscription snapshot and surfaces an
   * explicit error state if the underlying TanStack query throws (network
   * down, edge function 5xx, etc.). Keeps `creditsAdded` / `projectedBalance`
   * intact — they're authoritative regardless of refresh outcome.
   */
  const handleRetryRefresh = async () => {
    refreshAttemptRef.current += 1;
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

    notifySentRef.current = mode;

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
      .catch((e) => {
        // Best-effort — never block the dialog or toast on failure.
        console.warn('[checkout-confirmation] notify failed', e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      const { data, error } = await supabase.functions.invoke('retry-flex-credit');
      if (error) throw error;
      const applied = Number(data?.applied) || 0;
      const scanned = Number(data?.scanned) || 0;
      if (applied > 0) {
        // Quiet state: no success-coloured toast. Neutral acknowledgement only.
        toast.message(`Credits restored from ${applied} session${applied === 1 ? '' : 's'}.`);
      } else if (scanned > 0) {
        toast.message('No missing credits found. Your balance is already up to date.');
      } else {
        toast.message('No recent flex-pack sessions to recover.');
      }
      await sub.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Retry failed';
      toast.error(`Retry failed: ${msg}`);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/*
            Quiet state: no celebratory badge / coloured halo. A single neutral
            mono mark, left-aligned with the title, communicates "this is a
            receipt" without praise or ambient motion.
          */}
          <div className="mb-2 flex items-center gap-2 text-muted-foreground" aria-hidden>
            {mode === 'subscription' ? (
              <FileCheck className="h-4 w-4" />
            ) : (
              <Receipt className="h-4 w-4" />
            )}
            <span className="text-xs uppercase tracking-wide">
              {mode === 'subscription' ? 'Subscription receipt' : 'Credits receipt'}
            </span>
          </div>
          <DialogTitle className="text-left">
            {mode === 'subscription' ? `Holzen ${tierLabel} active` : 'Credits added'}
          </DialogTitle>
          <DialogDescription className="text-left">
            {mode === 'subscription'
              ? isTrialing
                ? `Your ${PRICING.trialDays}-day trial has started. Manage or cancel anytime from Settings.`
                : 'Your subscription is active. Manage or cancel anytime from Settings.'
              : 'Your Flex credits are available below.'}
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
          />
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
          <Button onClick={handleClose} className="w-full sm:w-auto">
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
}: {
  state: 'updating' | 'timeout' | 'error';
  errorMessage: string | null;
  onRetry: () => void;
}) {
  if (state === 'updating') {
    return (
      <div
        className="mt-3 flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner className="h-3 w-3 border-[1.5px]" />
        <span>Updating balance…</span>
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
          Balance is still syncing. Your credits are safe.
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="mr-1.5 h-3 w-3" aria-hidden />
          Try again
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
          Could not refresh balance
          {errorMessage ? <span className="ml-1 opacity-70">({errorMessage})</span> : null}
          . Your credits are still safe.
        </span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="h-7 px-2 text-xs"
      >
        <RefreshCw className="mr-1.5 h-3 w-3" aria-hidden />
        Try again
      </Button>
    </div>
  );
}