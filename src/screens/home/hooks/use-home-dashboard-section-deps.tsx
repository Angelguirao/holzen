import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomeMarketWidgetFooter } from '@/screens/home/components/HomeMarketWidgetFooter';
import type { HomeDashboardSectionDeps } from '@/screens/home/components/render-home-dashboard-section';
import type { BtcPriceData, TrackedAssetId } from '@/features/market/public';

/** Memoized bundle passed into {@link renderHomeDashboardSection}. */
export function useHomeDashboardSectionDeps(args: {
  t: TFunction;
  error: string | null;
  marketHeaderRight: ReactNode;
  /** Defaults to {@link HomeMarketWidgetFooter} when omitted. */
  marketFooter?: ReactNode;
  btcData: BtcPriceData | null;
  threshold: number;
  thresholdDown: number;
  cumulativeThreshold: number;
  priceHidden: boolean;
  togglePriceHidden: () => void;
  currency: string;
  trackedAssetId: TrackedAssetId;
  unitBasisModeSupported: boolean;
  btcMode: boolean;
  toggleBtcMode: () => void;
  marketChartExpanded: boolean;
  toggleMarketChartExpanded: () => void;
  pauseCardBody: ReactNode;
  pauseSectionHeaderRight: ReactNode | undefined;
  pauseWidgetProjection: import('@/features/pause/presentation/home/use-home-pause-widget-projection').HomePauseWidgetProjection;
  subscribed: boolean;
  collapsed: Record<string, boolean>;
  toggleCollapsed: (id: string) => void;
  presenceXp: number | null;
  completedPauseCount: number | null;
  practiceStatsLoading: boolean;
}): HomeDashboardSectionDeps {
  const {
    t,
    error,
    marketHeaderRight,
    marketFooter: marketFooterProp,
    btcData,
    threshold,
    thresholdDown,
    cumulativeThreshold,
    priceHidden,
    togglePriceHidden,
    currency,
    trackedAssetId,
    unitBasisModeSupported,
    btcMode,
    toggleBtcMode,
    marketChartExpanded,
    toggleMarketChartExpanded,
    pauseCardBody,
    pauseSectionHeaderRight,
    pauseWidgetProjection,
    subscribed,
    collapsed,
    toggleCollapsed,
    presenceXp,
    completedPauseCount,
    practiceStatsLoading,
  } = args;

  const marketFooter =
    marketFooterProp ??
    (btcData && !error ? (
      <HomeMarketWidgetFooter
        btcData={btcData}
        threshold={threshold}
        thresholdDown={thresholdDown}
        cumulativeThreshold={cumulativeThreshold}
      />
    ) : null);

  return useMemo(
    () => ({
      t,
      error,
      marketHeaderRight,
      marketFooter,
      btcData,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      btcMode,
      toggleBtcMode,
      marketChartExpanded,
      toggleMarketChartExpanded,
      pauseCardBody,
      pauseSectionHeaderRight,
      pauseWidgetProjection,
      subscribed,
      collapsed,
      toggleCollapsed,
      presenceXp,
      completedPauseCount,
      practiceStatsLoading,
    }),
    [
      t,
      error,
      marketHeaderRight,
      marketFooter,
      btcData,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      btcMode,
      toggleBtcMode,
      marketChartExpanded,
      toggleMarketChartExpanded,
      pauseCardBody,
      pauseSectionHeaderRight,
      pauseWidgetProjection,
      subscribed,
      collapsed,
      toggleCollapsed,
      presenceXp,
      completedPauseCount,
      practiceStatsLoading,
    ],
  );
}
