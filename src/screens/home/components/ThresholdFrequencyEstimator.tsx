import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { getThresholdVolatilityEstimatorQueryOptions } from '@/features/user/public-queries';

interface Props {
  thresholdUp: number;
  thresholdDown?: number;
  cooldownHours?: number;
  className?: string;
  /** CoinGecko coin id for historical volatility fetch. */
  coinId?: string;
}

interface VolatilityStats {
  crossings30d: number;
  crossings90d: number;
  avgDailyMove: number;
  rawSignals30d: number;
}

function findIndexAtOrBeforeTimestamp(
  prices: [number, number][],
  targetTimestamp: number,
  maxIndex: number
): number {
  let lo = 0;
  let hi = maxIndex;
  let ans = 0;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (prices[mid][0] <= targetTimestamp) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return ans;
}

function computeStatsDaily(
  dailyChanges: number[],
  thresholdUp: number,
  thresholdDown: number,
): VolatilityStats {
  const effectiveThreshold = Math.min(thresholdUp, thresholdDown);
  const last30 = dailyChanges.slice(-30);
  const crossings30d = last30.filter((c) => c >= effectiveThreshold).length;
  const crossings90d = dailyChanges.filter((c) => c >= effectiveThreshold).length;
  const avgDailyMove = dailyChanges.reduce((s, c) => s + c, 0) / dailyChanges.length;
  return { crossings30d, crossings90d, avgDailyMove, rawSignals30d: crossings30d };
}

/**
 * Simulates daily trigger logic with cooldown gating (matches active cron/UI).
 */
function computeStatsSimulated(
  hourlyPrices: [number, number][],
  thresholdUp: number,
  thresholdDown: number,
  cooldownHours: number,
  avgDailyMove: number,
): VolatilityStats {
  const msPerDay = 24 * 60 * 60 * 1000;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;

  const now = hourlyPrices[hourlyPrices.length - 1][0];
  const t30 = now - 30 * msPerDay;
  const t90 = now - 90 * msPerDay;

  let triggers90 = 0;
  let triggers30 = 0;
  let rawSignals30d = 0;
  let lastTriggerTime = -Infinity;

  for (let i = 1; i < hourlyPrices.length; i++) {
    const [ts, priceNow] = hourlyPrices[i];

    const has24hHistory = ts - hourlyPrices[0][0] >= msPerDay;

    let dailyTriggered = false;
    if (has24hHistory) {
      const idx24 = findIndexAtOrBeforeTimestamp(hourlyPrices, ts - msPerDay, i - 1);
      const price24hAgo = hourlyPrices[idx24][1];
      const change24h = ((priceNow - price24hAgo) / price24hAgo) * 100;

      dailyTriggered = change24h >= 0
        ? change24h >= thresholdUp
        : Math.abs(change24h) >= thresholdDown;
    }

    if (dailyTriggered) {
      if (ts >= t30) rawSignals30d++;

      if (ts - lastTriggerTime >= cooldownMs) {
        if (ts >= t90) triggers90++;
        if (ts >= t30) triggers30++;
        lastTriggerTime = ts;
      }
    }
  }

  return { crossings30d: triggers30, crossings90d: triggers90, avgDailyMove, rawSignals30d };
}

export function ThresholdFrequencyEstimator({
  thresholdUp,
  thresholdDown,
  cooldownHours,
  className,
  coinId = 'bitcoin',
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const effectiveDown = thresholdDown ?? thresholdUp;

  const { data: cachedData = null } = useQuery(getThresholdVolatilityEstimatorQueryOptions(coinId));

  const stats = useMemo((): VolatilityStats | null => {
    if (!cachedData) return null;

    const avgDailyMove =
      cachedData.dailyChanges.length > 0
        ? cachedData.dailyChanges.reduce((s, c) => s + c, 0) / cachedData.dailyChanges.length
        : 0;

    if (cachedData.hourlyPrices?.length > 1) {
      return computeStatsSimulated(
        cachedData.hourlyPrices,
        thresholdUp,
        effectiveDown,
        cooldownHours ?? 24,
        avgDailyMove,
      );
    }
    return computeStatsDaily(cachedData.dailyChanges, thresholdUp, effectiveDown);
  }, [cachedData, thresholdUp, effectiveDown, cooldownHours]);

  if (!stats) return null;

  return (
    <div className={className}>
      <div className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/30 px-3 py-2.5">
        <Activity className="h-3 w-3 mt-0.5 shrink-0 text-secondary-foreground" />
        <div className="space-y-0.5">
          <p className="leading-snug pb-2 font-sans text-sm font-normal text-secondary-foreground">
            {t('threshold.estimator.result', {
              count: stats.crossings30d,
              defaultValue: "You'd have paused ~{{count}} times last month",
            })}
          </p>
          {stats.rawSignals30d > stats.crossings30d && (
            <p className="leading-snug text-sm font-sans text-muted-foreground">
              {t('threshold.estimator.raw', {
                raw: stats.rawSignals30d,
                filtered: stats.rawSignals30d - stats.crossings30d,
                cooldown: cooldownHours ?? 24,
                defaultValue:
                  '{{raw}} signals detected · {{filtered}} filtered by {{cooldown}}h cooldown',
              })}
            </p>
          )}
          <p className="leading-snug text-sm font-sans text-muted-foreground">
            {t('threshold.estimator.avg', {
              avg: stats.avgDailyMove.toFixed(1),
              defaultValue: 'avg daily move: {{avg}}%',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
