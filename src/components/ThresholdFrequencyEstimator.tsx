import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';

interface Props {
  threshold: number;
  cooldownHours?: number;
  className?: string;
}

interface VolatilityStats {
  crossings30d: number;
  crossings90d: number;
  avgDailyMove: number;
}

const CACHE_KEY = 'holzen_btc_volatility_stats';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

interface CachedData {
  dailyChanges: number[];
  hourlyPrices: [number, number][];
  timestamp: number;
}

async function fetchVolatilityData(): Promise<CachedData | null> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
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

    const result: CachedData = { dailyChanges, hourlyPrices: prices, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

function computeStatsDaily(dailyChanges: number[], threshold: number): VolatilityStats {
  const last30 = dailyChanges.slice(-30);
  const crossings30d = last30.filter((c) => c >= threshold).length;
  const crossings90d = dailyChanges.filter((c) => c >= threshold).length;
  const avgDailyMove = dailyChanges.reduce((s, c) => s + c, 0) / dailyChanges.length;
  return { crossings30d, crossings90d, avgDailyMove };
}

function computeStatsHourly(
  hourlyPrices: [number, number][],
  threshold: number,
  cooldownHours: number
): VolatilityStats {
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const msPerDay = 24 * 60 * 60 * 1000;
  const now = hourlyPrices[hourlyPrices.length - 1][0];
  const t30 = now - 30 * msPerDay;
  const t90 = now - 90 * msPerDay;

  let triggers90 = 0;
  let triggers30 = 0;
  let lastTriggerTime = -Infinity;
  let anchorPrice = hourlyPrices[0][1];

  // Walk through hourly data, simulate triggers with cooldown
  for (let i = 1; i < hourlyPrices.length; i++) {
    const [ts, price] = hourlyPrices[i];
    const change = Math.abs(((price - anchorPrice) / anchorPrice) * 100);

    if (change >= threshold && ts - lastTriggerTime >= cooldownMs) {
      if (ts >= t90) triggers90++;
      if (ts >= t30) triggers30++;
      lastTriggerTime = ts;
      anchorPrice = price; // reset anchor after trigger
    } else if (ts - lastTriggerTime >= cooldownMs) {
      // Update anchor when cooldown has passed even without trigger
      anchorPrice = price;
    }
  }

  // Avg daily move from daily samples for consistency
  const dailyChanges: number[] = [];
  let lp = hourlyPrices[0][1];
  let lt = hourlyPrices[0][0];
  for (let i = 1; i < hourlyPrices.length; i++) {
    if (hourlyPrices[i][0] - lt >= msPerDay * 0.8) {
      dailyChanges.push(Math.abs(((hourlyPrices[i][1] - lp) / lp) * 100));
      lp = hourlyPrices[i][1];
      lt = hourlyPrices[i][0];
    }
  }
  const avgDailyMove = dailyChanges.length > 0
    ? dailyChanges.reduce((s, c) => s + c, 0) / dailyChanges.length
    : 0;

  return { crossings30d: triggers30, crossings90d: triggers90, avgDailyMove };
}

export function ThresholdFrequencyEstimator({ threshold, cooldownHours, className }: Props) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<VolatilityStats | null>(null);
  const [cachedData, setCachedData] = useState<CachedData | null>(null);

  useEffect(() => {
    fetchVolatilityData().then((d) => {
      if (d) setCachedData(d);
    });
  }, []);

  useEffect(() => {
    if (!cachedData) return;

    if (cooldownHours && cooldownHours < 24) {
      setStats(computeStatsHourly(cachedData.hourlyPrices, threshold, cooldownHours));
    } else {
      setStats(computeStatsDaily(cachedData.dailyChanges, threshold));
    }
  }, [cachedData, threshold, cooldownHours]);

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
