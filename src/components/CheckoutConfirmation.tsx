import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Sparkles, Coins, CalendarClock, TrendingUp, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
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
 * Session-scoped guard so refreshing or hitting Back within the same checkout
 * redirect window doesn't re-open the confirmation dialog. Keyed by mode +
 * a short time bucket so a genuinely new checkout (different params arriving
 * later) still triggers a fresh confirmation.
 */
const CHECKOUT_CONFIRMED_KEY = 'holzen_checkout_confirmed';
const CHECKOUT_CONFIRMED_WINDOW_MS = 30 * 60 * 1000;

function readConfirmedGuard(): { mode: Mode; ts: number } | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_CONFIRMED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { mode: Mode; ts: number };
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CHECKOUT_CONFIRMED_WINDOW_MS) {
      sessionStorage.removeItem(CHECKOUT_CONFIRMED_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeConfirmedGuard(mode: Mode) {
  try {
    sessionStorage.setItem(
      CHECKOUT_CONFIRMED_KEY,
      JSON.stringify({ mode, ts: Date.now() }),
    );
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
  // Until the refreshed balance reflects the purchase, fall back to the
  // expected credits for the chosen pack.
  const balanceReflectsPurchase = observedDelta >= expectedCredits && expectedCredits > 0;
  const creditsAdded = balanceReflectsPurchase ? observedDelta : expectedCredits;
  const projectedBalance = balanceReflectsPurchase ? currentBalance : baseline + expectedCredits;
  // True while we're still waiting for the refreshed wallet balance to reflect
  // the purchase. Drives inline spinners on the affected rows so the user sees
  // that the number they're looking at is provisional.
  const creditBalanceUpdating =
    mode !== null && mode !== 'subscription' && !balanceReflectsPurchase;
  const subscriptionSyncing = awaitingStripe;

  const handleClose = () => setMode(null);

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
        toast.success(`Credits restored from ${applied} session${applied === 1 ? '' : 's'}.`);
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
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden
          >
            {mode === 'subscription' ? <Sparkles className="h-6 w-6" /> : <Coins className="h-6 w-6" />}
          </div>
          <DialogTitle className="text-center">
            {mode === 'subscription' ? 'Welcome to Holzen ' + tierLabel : 'Credits added'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'subscription'
              ? isTrialing
                ? `Your ${PRICING.trialDays}-day trial has started. You can manage or cancel anytime from Settings.`
                : 'Your subscription is active. You can manage or cancel anytime from Settings.'
              : 'Thanks for the top-up. Your Flex credits are ready to spend.'}
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
                icon={<TrendingUp className="h-3.5 w-3.5" aria-hidden />}
                pending={creditBalanceUpdating}
              />
              <SummaryRow
                label="New balance"
                value={String(projectedBalance)}
                pending={creditBalanceUpdating}
                pendingHint="updating"
                highlight
              />
            </ul>
          )}
        </div>

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
            <Check className="mr-2 h-4 w-4" aria-hidden />
            Got it
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