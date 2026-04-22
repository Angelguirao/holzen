import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Sparkles, Coins, CalendarClock, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';
import { PRICING } from '@/lib/pricing';

type Mode = 'subscription' | 'flex_pack_s' | 'flex_pack_m' | null;

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
  // Snapshot the credit balance at the moment the dialog opens so we can show
  // "+N credits" once the refreshed balance comes in.
  const baselineBalanceRef = useRef<number | null>(null);
  // Snapshot the moment the dialog opens — used as the trial start anchor so
  // the displayed dates remain stable even if the snapshot refreshes mid-view.
  const openedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    const detected = detectMode(location.search);
    if (!detected) return;
    setMode(detected);
    baselineBalanceRef.current = sub.flexCreditsBalance ?? 0;
    openedAtRef.current = new Date();
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

  const expectedCredits = useMemo(() => {
    if (mode === 'flex_pack_m') return PRICING.flexPackMCredits;
    if (mode === 'flex_pack_s') return PRICING.flexPackSCredits;
    return 0;
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

  const trialStart = openedAtRef.current;
  const trialEnd = useMemo(() => {
    if (!trialStart) return null;
    const d = new Date(trialStart);
    d.setDate(d.getDate() + PRICING.trialDays);
    return d;
  }, [trialStart]);

  const baseline = baselineBalanceRef.current ?? 0;
  const currentBalance = sub.flexCreditsBalance ?? 0;
  const observedDelta = Math.max(0, currentBalance - baseline);
  // Until the refreshed balance reflects the purchase, fall back to the
  // expected credits for the chosen pack.
  const balanceReflectsPurchase = observedDelta >= expectedCredits && expectedCredits > 0;
  const creditsAdded = balanceReflectsPurchase ? observedDelta : expectedCredits;
  const projectedBalance = balanceReflectsPurchase ? currentBalance : baseline + expectedCredits;

  const handleClose = () => setMode(null);

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
              ? `Your ${PRICING.trialDays}-day trial has started. You can manage or cancel anytime from Settings.`
              : 'Thanks for the top-up. Your Flex credits are ready to spend.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          {mode === 'subscription' ? (
            <ul className="space-y-2">
              <SummaryRow label="Plan" value={`Holzen ${tierLabel}`} />
              <SummaryRow
                label="Trial started"
                value={trialStart ? dateFmt.format(trialStart) : '—'}
                icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden />}
              />
              <SummaryRow
                label="First charge on"
                value={trialEnd ? dateFmt.format(trialEnd) : '—'}
                highlight
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
              <SummaryRow label="Flex credits balance" value={String(currentBalance)} />
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
              />
              <SummaryRow
                label="New balance"
                value={
                  sub.loading && !balanceReflectsPurchase
                    ? `${projectedBalance} (updating…)`
                    : String(projectedBalance)
                }
                highlight
              />
            </ul>
          )}
        </div>

        <DialogFooter className="mt-2">
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
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={highlight ? 'font-semibold text-primary' : 'font-medium text-foreground'}>
        {value}
      </span>
    </li>
  );
}

export default CheckoutConfirmation;