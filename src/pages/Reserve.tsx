import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Bitcoin } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useState, useEffect } from 'react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

// Treasury data — update periodically
const TREASURY = {
  totalBtc: 0.25,
  averageCost: 62_400,
  lastUpdated: '2026-03-01',
  percentOfTreasury: 85,
};

function useBtcPrice() {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      .then((r) => r.json())
      .then((d) => setPrice(d?.bitcoin?.usd ?? null))
      .catch(() => {});
  }, []);
  return price;
}

const Reserve = () => {
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
        {/* Nav */}
        <motion.div {...m()}>
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div {...m(0.05)} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bitcoin className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl text-foreground leading-relaxed">
              BTC Reserve Strategy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We hold what we help others hold.
          </p>
        </motion.div>

        {/* Philosophy */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Why we hold
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              A product that helps people hold Bitcoin should itself hold Bitcoin. Anything else would be a contradiction.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Holzen maintains a Bitcoin reserve — not as a financial strategy, but as a statement of conviction. We believe Bitcoin is the best savings technology ever created. We believe in multi-decade time horizons. We believe the hardest part of holding is the emotional cost, and that cost is worth paying.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our reserve is denominated in Bitcoin, not dollars. We don't measure success by fiat returns. We measure it by the discipline of not selling — the same discipline we ask of our users every day.
            </p>
          </div>
        </motion.div>

        {/* Strategy */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Our strategy
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We allocate a significant portion of company treasury to Bitcoin. We acquire through dollar-cost averaging and opportunistic buys during periods of elevated fear. We do not trade. We do not hedge. We do not lend.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                Self-custody only — no third-party risk
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                No selling — indefinite time horizon
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                DCA + conviction buys during fear
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                Transparent reporting, updated periodically
              </div>
            </div>
          </div>
        </motion.div>

        {/* Treasury tracker */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Treasury
            </p>
            <div className="border border-border/60 rounded-lg p-5 space-y-4 bg-muted/10">
              {/* BTC held */}
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                  Total BTC held
                </p>
                <p className="text-lg font-mono text-foreground">
                  {TREASURY.totalBtc.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')} ₿
                </p>
              </div>

              <div className="h-px bg-border/40" />

              {/* Average cost */}
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                  Avg. cost basis
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  {formatUsd(TREASURY.averageCost)}
                </p>
              </div>

              {/* Current value */}
              {currentValue !== null && (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                      Current value
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {formatUsd(currentValue)}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                      Unrealised P&L
                    </p>
                    <p className={`text-sm font-mono ${unrealisedPnl !== null && unrealisedPnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {unrealisedPnl !== null ? `${unrealisedPnl >= 0 ? '+' : ''}${unrealisedPnl.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                </>
              )}

              <div className="h-px bg-border/40" />

              {/* Treasury allocation */}
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                  % of treasury
                </p>
                <p className="text-sm font-mono text-foreground">
                  {TREASURY.percentOfTreasury}%
                </p>
              </div>

              <p className="text-[10px] font-mono text-muted-foreground/40 text-right">
                Updated {new Date(TREASURY.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Inspiration */}
        <motion.div {...m(0.1)}>
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Standing on conviction
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our approach is inspired by companies like MicroStrategy, who demonstrated that a corporate Bitcoin reserve isn't speculative — it's a statement about the future of money. We operate at a different scale, but with the same philosophical commitment: Bitcoin is not an asset to trade. It's an asset to hold.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every sat in our treasury represents the same conviction we ask our users to practice. We don't just build tools for holders — we are holders.
            </p>
          </div>
        </motion.div>

        {/* Closing */}
        <motion.div {...m(0.1)}>
          <div className="border-t border-border/40 pt-6 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "The practice is the same whether you hold 0.001 BTC or 10,000. Sit with the volatility. Notice the impulse. Choose deliberately."
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/50">
              — Holzen
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...m()}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border">
            <Link to="/welcome" className="hover:text-foreground transition-colors">Home</Link>
            <span>·</span>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>·</span>
            <a href="mailto:hello@holzen.app" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reserve;
