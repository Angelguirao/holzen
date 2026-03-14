import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';

interface Props {
  threshold: number;
  className?: string;
}

interface VolatilityStats {
  crossings30d: number;
  crossings90d: number;
  avgDailyMove: number;
}

const CACHE_KEY = 'holzen_btc_volatility_stats';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function fetchVolatilityStats(): Promise<number[] | null> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { dailyChanges, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return dailyChanges;
    }

    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90'
    );
    if (!res.ok) return null;
    const data = await res.json();
    const prices: [number, number][] = data.prices;
    if (!prices || prices.length < 2) return null;

    // Calculate daily changes (sample once per ~24h)
    const dailyChanges: number[] = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    let lastPrice = prices[0][1];
    let lastTime = prices[0][0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i][0] - lastTime >= msPerDay * 0.8) {
        const change = Math.abs(((prices[i][1] - lastPrice) / lastPrice) * 100);
        dailyChanges.push(change);
        lastPrice = prices[i][1];
        lastTime = prices[i][0];
      }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify({ dailyChanges, timestamp: Date.now() }));
    return dailyChanges;
  } catch {
    return null;
  }
}

function computeStats(dailyChanges: number[], threshold: number): VolatilityStats {
  const last30 = dailyChanges.slice(-30);
  const crossings30d = last30.filter((c) => c >= threshold).length;
  const crossings90d = dailyChanges.filter((c) => c >= threshold).length;
  const avgDailyMove = dailyChanges.reduce((s, c) => s + c, 0) / dailyChanges.length;
  return { crossings30d, crossings90d, avgDailyMove };
}

export function ThresholdFrequencyEstimator({ threshold, className }: Props) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<VolatilityStats | null>(null);
  const [dailyChanges, setDailyChanges] = useState<number[] | null>(null);

  useEffect(() => {
    fetchVolatilityStats().then((changes) => {
      if (changes) setDailyChanges(changes);
    });
  }, []);

  useEffect(() => {
    if (dailyChanges) {
      setStats(computeStats(dailyChanges, threshold));
    }
  }, [dailyChanges, threshold]);

  if (!stats) return null;

  const monthlyEstimate = Math.round((stats.crossings90d / 90) * 30);

  return (
    <div className={className}>
      <div className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2.5">
        <Activity className="h-3 w-3 text-primary/50 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono text-foreground/70 leading-snug">
            {t('threshold.estimator.result', 'At {{threshold}}%, you\'d have paused ~{{count}} times in the last 30 days', {
              threshold: threshold.toFixed(1),
              count: stats.crossings30d,
            })}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/50 leading-snug">
            {t('threshold.estimator.monthly', '~{{count}}/month estimated · avg daily move: {{avg}}%', {
              count: monthlyEstimate,
              avg: stats.avgDailyMove.toFixed(1),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
