import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Check, Clock, Minus } from 'lucide-react';
import { invokeEdge } from '@/lib/invoke-edge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type CheckoutEvent = {
  session_id: string;
  created: number; // unix seconds
  kind: string | null;
  pack_type: string | null;
  expected_credits: number;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  status: string | null;
  grant_status: 'applied' | 'pending' | 'not_applicable';
  granted_credits: number | null;
  granted_at: string | null;
  grant_reason: string | null;
};

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount == null || !currency) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDateTime(value: string | number | null): string {
  if (value == null) return '—';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function describeKind(event: CheckoutEvent): string {
  if (event.kind === 'subscription') return 'Subscription';
  if (event.pack_type === 'flex_pack_s') return 'Flex Pack S';
  if (event.pack_type === 'flex_pack_m') return 'Flex Pack M';
  if (event.kind) return event.kind;
  return 'Checkout';
}

/**
 * Humanise Stripe's raw `payment_status` for display. Stripe returns
 * `unpaid` on subscription sessions until the first invoice is paid (which
 * is normal during trial / activation, not a "due amount"), and
 * `no_payment_required` on $0 / 100%-coupon checkouts (e.g. lifetime).
 * Map those to friendlier copy + tone so the page never reads as if the
 * user owes money.
 */
function describePaymentStatus(event: CheckoutEvent): { label: string; tone: 'paid' | 'free' | 'pending' | 'failed' | 'neutral' } {
  const raw = (event.payment_status || '').toLowerCase();
  if (raw === 'paid') return { label: 'Paid', tone: 'paid' };
  if (raw === 'no_payment_required') return { label: 'Free', tone: 'free' };
  if (raw === 'unpaid') {
    // Subscription sessions sit at `unpaid` until the first invoice settles.
    if (event.kind === 'subscription') return { label: 'Activating', tone: 'pending' };
    return { label: 'Pending', tone: 'pending' };
  }
  if (raw === 'pending' || raw === 'processing') return { label: 'Processing', tone: 'pending' };
  if (raw === 'failed' || raw === 'canceled') return { label: raw === 'failed' ? 'Failed' : 'Cancelled', tone: 'failed' };
  if (!raw || raw === 'unknown') return { label: 'Unknown', tone: 'neutral' };
  return { label: raw, tone: 'neutral' };
}

const STATUS_TONE_CLASS: Record<'paid' | 'free' | 'pending' | 'failed' | 'neutral', string> = {
  paid: 'text-primary',
  free: 'text-primary',
  pending: 'text-muted-foreground',
  failed: 'text-destructive',
  neutral: 'text-muted-foreground',
};

function GrantBadge({ event }: { event: CheckoutEvent }) {
  if (event.grant_status === 'applied') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-primary">
        <Check className="h-3 w-3" aria-hidden />
        +{event.granted_credits} credits applied
      </span>
    );
  }
  if (event.grant_status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
        <Clock className="h-3 w-3" aria-hidden />
        Grant pending ({event.expected_credits} expected)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
      <Minus className="h-3 w-3" aria-hidden />
      No credit grant
    </span>
  );
}

export default function BillingHistory() {
  const [events, setEvents] = useState<CheckoutEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const { data, error } = await invokeEdge<{ events?: CheckoutEvent[] }>('list-checkout-events', {
        body: {},
      });
      if (error) throw error;
      const list = data?.events ?? [];
      setEvents(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load checkout history';
      setError(msg);
      if (silent) toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          Settings
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void load(true)}
          disabled={loading || refreshing}
          className="text-xs font-mono"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-base font-sans">Checkout history</h1>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
          Recent Stripe checkout sessions for your account, with credit-grant
          status from the webhook. Duplicates are not double-credited.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-destructive/40 p-4 space-y-2">
          <p className="text-sm font-sans text-destructive">Couldn't load checkout history</p>
          <p className="text-xs font-mono text-muted-foreground break-words">{error}</p>
          <Button size="sm" variant="outline" onClick={() => void load(false)} className="text-xs font-mono">
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && events && events.length === 0 && (
        <div className="rounded-md border border-border/40 p-6 text-center">
          <p className="text-sm font-sans text-muted-foreground">
            No checkout sessions yet.
          </p>
        </div>
      )}

      {!loading && !error && events && events.length > 0 && (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.session_id}
              className="rounded-md border border-border/40 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-sans">{describeKind(event)}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {formatDateTime(event.created)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-mono">
                    {formatCurrency(event.amount_total, event.currency)}
                  </p>
                  {(() => {
                    const status = describePaymentStatus(event);
                    return (
                      <p className={`text-xs font-mono ${STATUS_TONE_CLASS[status.tone]}`}>
                        {status.label}
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <GrantBadge event={event} />
                {event.grant_status === 'applied' && event.granted_at && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatDateTime(event.granted_at)}
                  </span>
                )}
              </div>

              <p className="text-[10px] font-mono text-muted-foreground/60 break-all pt-1">
                {event.session_id}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}