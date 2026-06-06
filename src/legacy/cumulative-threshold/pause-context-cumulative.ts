import type { MarketQuote } from '@/features/market/domain/market-quote';
import { isCumulativeMoveTriggered } from '@/legacy/cumulative-threshold/volatility-thresholds-cumulative';

/** Archived: append 7-day move line when cumulative threshold is breached. */
export function appendCumulativePauseContextLine(
  baseContext: string,
  data: Pick<MarketQuote, 'cumulativeChangePercent' | 'cumulativeDirection'>,
  cumulativeThreshold: number,
): string {
  if (!isCumulativeMoveTriggered(data.cumulativeChangePercent, cumulativeThreshold)) {
    return baseContext;
  }
  const cumDir = data.cumulativeDirection === 'down' ? 'down' : 'up';
  return `${baseContext} Over 7 days, it's ${cumDir} ${Math.abs(data.cumulativeChangePercent!).toFixed(1)}%.`;
}
