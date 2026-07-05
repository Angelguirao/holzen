import type { MarketQuote } from '@/features/market/domain/market-quote';
import type { VolatilityThresholdProfile } from '@/features/market/domain/volatility-thresholds';

export type MarketVolatilityRangeStatus =
  | { kind: 'within' }
  | { kind: 'beyond'; axis: 'daily_up' | 'daily_down' };

export type MarketVolatilityRangeInput = {
  changePercent: number;
  direction: 'up' | 'down';
};

export type HomeMarketRangeStatusInput = {
  marketData: MarketQuote | null;
  threshold: number;
  thresholdDown: number;
  openPauseSource?: string | null;
  openPauseState?: 'active' | 'engaged' | null;
  openPauseContextSnapshot?: Record<string, unknown> | null;
};

function cronPauseBeyondAxis(
  contextSnapshot: Record<string, unknown> | null | undefined,
): 'daily_up' | 'daily_down' {
  if (contextSnapshot?.direction === 'down') return 'daily_down';
  const snapPct = contextSnapshot?.change_24h_pct;
  if (typeof snapPct === 'number' && Number.isFinite(snapPct) && snapPct < 0) {
    return 'daily_down';
  }
  return 'daily_up';
}

/**
 * UI projection: is the current quote inside the user's daily pause auto-trigger bands?
 * Authority for cron triggers remains server-side; this mirrors `_shared/volatility-thresholds`.
 */
export function resolveMarketVolatilityRangeStatus(
  profile: VolatilityThresholdProfile,
  data: MarketVolatilityRangeInput,
): MarketVolatilityRangeStatus {
  const absChange = Math.abs(data.changePercent);
  const effectiveThreshold =
    data.direction === 'down'
      ? (profile.threshold_down ?? profile.threshold ?? 5)
      : (profile.threshold ?? 5);
  if (absChange < effectiveThreshold) {
    return { kind: 'within' };
  }
  return {
    kind: 'beyond',
    axis: data.direction === 'down' ? 'daily_down' : 'daily_up',
  };
}

/**
 * Home Market footer: live quote vs thresholds, aligned with an open cron pause when present.
 * Cron offers only open on server-side breach — show beyond while that pause is open even if
 * the cached live quote has not refetched yet.
 */
export function resolveHomeMarketRangeStatus(
  input: HomeMarketRangeStatusInput,
): MarketVolatilityRangeStatus | null {
  const profile = { threshold: input.threshold, threshold_down: input.thresholdDown };

  const liveStatus =
    input.marketData != null
      ? resolveMarketVolatilityRangeStatus(profile, {
          changePercent: input.marketData.changePercent,
          direction: input.marketData.direction,
        })
      : null;

  const openCronPause =
    input.openPauseSource === 'cron_volatility' &&
    (input.openPauseState === 'active' || input.openPauseState === 'engaged');

  if (!openCronPause) {
    return liveStatus;
  }

  // Engaged + live within band: calm waters (Figma 578:27830) — market footer matches live quote.
  if (input.openPauseState === 'engaged' && liveStatus?.kind === 'within') {
    return liveStatus;
  }

  const snapPct = input.openPauseContextSnapshot?.change_24h_pct;
  if (typeof snapPct === 'number' && Number.isFinite(snapPct)) {
    const snapStatus = resolveMarketVolatilityRangeStatus(profile, {
      changePercent: snapPct,
      direction: snapPct >= 0 ? 'up' : 'down',
    });
    if (snapStatus.kind === 'beyond') {
      return snapStatus;
    }
  }

  return { kind: 'beyond', axis: cronPauseBeyondAxis(input.openPauseContextSnapshot) };
}
