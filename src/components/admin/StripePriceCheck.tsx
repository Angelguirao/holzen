/**
 * Admin diagnostic: validates the four Stripe price ID secrets
 * (Pro, Pro+, Flex S, Flex M) by calling the
 * `admin-check-stripe-prices` edge function. Surfaces clear,
 * actionable error messages when a secret is missing, malformed
 * (e.g. a `prod_…` ID was pasted instead of `price_…`), inactive,
 * or has the wrong recurrence type.
 */
import { useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { invokeEdge } from '@/lib/invoke-edge';
import { useToast } from '@/hooks/use-toast';

type Result = {
  secret: string;
  label: string;
  ok: boolean;
  value: string | null;
  error: string | null;
  active?: boolean;
  type?: string;
  expected_type?: string;
  amount?: number | null;
  currency?: string | null;
};

type Response = {
  ok: boolean;
  error?: string;
  results: Result[];
};

function maskId(value: string | null): string {
  if (!value) return '—';
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatAmount(r: Result): string | null {
  if (r.amount == null || !r.currency) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: r.currency.toUpperCase(),
    }).format(r.amount / 100);
  } catch {
    return `${(r.amount / 100).toFixed(2)} ${r.currency.toUpperCase()}`;
  }
}

export function StripePriceCheck() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Response | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res, error } = await invokeEdge<Response>('admin-check-stripe-prices', { body: {} });
      if (error) throw error;
      setData(res ?? null);
      if (res?.ok) {
        toast({ title: 'Stripe price IDs OK', description: 'All four secrets resolve correctly.' });
      } else {
        toast({
          title: 'Stripe price IDs need attention',
          description: res?.error ?? 'One or more secrets are invalid.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Check failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <div className="space-y-3 rounded-lg border border-border/40 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">
            Stripe price IDs
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            Verifies Pro, Pro+, Flex S, and Flex M secrets resolve in Stripe.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded border border-border/60 bg-background px-2.5 py-1 text-[11px] font-mono text-foreground/80 hover:bg-muted disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {loading ? 'Checking…' : 'Run check'}
        </button>
      </div>

      {data?.error && (
        <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{data.error}</span>
        </div>
      )}

      {data?.results && data.results.length > 0 && (
        <ul className="space-y-1.5">
          {data.results.map((r) => {
            const amount = formatAmount(r);
            return (
              <li
                key={r.secret}
                className={`rounded border p-2 text-[11px] font-mono ${
                  r.ok
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-destructive/40 bg-destructive/5'
                }`}
              >
                <div className="flex items-start gap-2">
                  {r.ok ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-foreground/90">{r.label}</span>
                      <span className="text-muted-foreground/50">{r.secret}</span>
                    </div>
                    <div className="mt-0.5 text-muted-foreground/70">
                      {maskId(r.value)}
                      {r.type && ` · ${r.type}`}
                      {amount && ` · ${amount}`}
                    </div>
                    {r.error && (
                      <div className="mt-1 text-destructive">{r.error}</div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}