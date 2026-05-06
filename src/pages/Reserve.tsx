import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { PublicFooter } from '@/components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@/components/PageHeading';
import { StateCard } from '@/components/ui/state-card';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const TREASURY = {
  totalBtc: 0,
  averageCost: 0,
  lastUpdated: '2026-03-08',
  percentOfTreasury: 0,
  hasStarted: false,
};

/** Shared cache if other surfaces ever need the same spot quote. */
export const COINGECKO_BTC_USD_QUERY_KEY = ['external', 'coingecko', 'btc-usd'] as const;

async function fetchBtcUsd(): Promise<number | null> {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (!r.ok) return null;
    const d = (await r.json()) as { bitcoin?: { usd?: number } };
    return d?.bitcoin?.usd ?? null;
  } catch {
    return null;
  }
}

function useBtcPrice() {
  const { data } = useQuery({
    queryKey: COINGECKO_BTC_USD_QUERY_KEY,
    queryFn: fetchBtcUsd,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  return data ?? null;
}

const Reserve = () => {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));
  const btcPrice = useBtcPrice();

  const currentValue = btcPrice ? TREASURY.totalBtc * btcPrice : null;
  const unrealisedPnl = btcPrice
    ? ((btcPrice - TREASURY.averageCost) / TREASURY.averageCost) * 100
    : null;

  const formatUsd = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <PageMeta
        title="BTC Reserve Strategy — Holzen"
        description="Holzen holds Bitcoin as a long-term reserve asset. Our treasury strategy, philosophy, and live metrics — transparent by design."
        path="/reserve"
      />
      <div className="w-full max-w-sm space-y-14">
        <motion.div {...m()}>
          <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </Link>
        </motion.div>

        <motion.div {...m(0.05)} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bitcoin className="h-4 w-4 text-nox-text-highlight" />
            </div>
          </div>
          <PageHeading title={t('reserve.title')} subtitle={t('reserve.subtitle')} />
        </motion.div>

        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{t('reserve.whyWeHold')}</p>
            <p className="text-sm text-foreground leading-relaxed">{t('reserve.whyWeHoldBody1')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('reserve.whyWeHoldBody2')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('reserve.whyWeHoldBody3')}</p>
          </div>
        </motion.div>

        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{t('reserve.ourStrategy')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('reserve.strategyBody')}</p>
            <div className="space-y-2">
              {(['strategyBullet1', 'strategyBullet2', 'strategyBullet3', 'strategyBullet4'] as const).map((key) => (
                <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {t(`reserve.${key}`)}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{t('reserve.treasury')}</p>
            <StateCard title={t('reserve.treasury')} description={t('reserve.subtitle')} className="space-y-4">
              {TREASURY.hasStarted ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">{t('reserve.totalBtcHeld')}</p>
                    <p className="text-lg font-mono text-foreground">{TREASURY.totalBtc.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')} ₿</p>
                  </div>
                  <div className="h-px bg-border/40" />
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">{t('reserve.avgCostBasis')}</p>
                    <p className="text-sm font-mono text-muted-foreground">{formatUsd(TREASURY.averageCost)}</p>
                  </div>
                  {currentValue !== null && (
                    <>
                      <div className="flex items-baseline justify-between">
                        <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">{t('reserve.currentValue')}</p>
                        <p className="text-sm font-mono text-foreground">{formatUsd(currentValue)}</p>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">{t('reserve.unrealisedPnl')}</p>
                        <p className={`text-sm font-mono ${unrealisedPnl !== null && unrealisedPnl >= 0 ? 'text-nox-accent-green' : 'text-destructive'}`}>
                          {unrealisedPnl !== null ? `${unrealisedPnl >= 0 ? '+' : ''}${unrealisedPnl.toFixed(1)}%` : '—'}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-border/40" />
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">{t('reserve.percentOfTreasury')}</p>
                    <p className="text-sm font-mono text-foreground">{TREASURY.percentOfTreasury}%</p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground/40 text-right">
                    Updated {new Date(TREASURY.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <div className="text-center py-3 space-y-2">
                  <p className="text-sm font-mono text-foreground">0 ₿</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('reserve.reserveNotStarted')}</p>
                </div>
              )}
            </StateCard>
          </div>
        </motion.div>

        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">{t('reserve.standingOnConviction')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('reserve.convictionBody1')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('reserve.convictionBody2')}</p>
          </div>
        </motion.div>

        <motion.div {...m(0.1)}>
          <div className="border-t border-border/40 pt-6 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed italic">"{t('reserve.closingQuote')}"</p>
            <p className="text-[10px] font-mono text-muted-foreground/50">{t('reserve.closingAttribution')}</p>
          </div>
        </motion.div>

        <PublicFooter />
      </div>
    </div>
  );
};

export default Reserve;
