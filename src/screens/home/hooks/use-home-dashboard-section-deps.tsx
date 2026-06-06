import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomeMarketWidgetFooter } from '@/screens/home/components/HomeMarketWidgetFooter';
import type { HomeDashboardSectionDeps } from '@/screens/home/components/render-home-dashboard-section';
import type { MarketQuote, TrackedAssetId } from '@/features/market/public';

/** Memoized bundle passed into {@link renderHomeDashboardSection}. */
export function useHomeDashboardSectionDeps(args: {
  t: TFunction;
  error: string | null;
  marketHeaderRight: ReactNode;
  /** Defaults to {@link HomeMarketWidgetFooter} when omitted. */
  marketFooter?: ReactNode;
  marketData: MarketQuote | null;
  threshold: number;
  thresholdDown: number;
  /** Mid-ritual open pause — community stat copy switches to Figma 3.4.4.2. */
  marketCommunityPauseInProgress?: boolean;
  priceHidden: boolean;
  togglePriceHidden: () => void;
  currency: string;
  trackedAssetId: TrackedAssetId;
  unitBasisModeSupported: boolean;
  unitBasisMode: boolean;
  toggleUnitBasisMode: () => void;
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
    marketData,
    threshold,
    thresholdDown,
    marketCommunityPauseInProgress = false,
    priceHidden,
    togglePriceHidden,
    currency,
    trackedAssetId,
    unitBasisModeSupported,
    unitBasisMode,
    toggleUnitBasisMode,
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
    (marketData && !error ? (
      <HomeMarketWidgetFooter
        marketData={marketData}
        threshold={threshold}
        thresholdDown={thresholdDown}
        pauseInProgress={marketCommunityPauseInProgress}
      />
    ) : null);

  return useMemo(
    () => ({
      t,
      error,
      marketHeaderRight,
      marketFooter,
      marketData,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      unitBasisMode,
      toggleUnitBasisMode,
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
      marketData,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      unitBasisMode,
      toggleUnitBasisMode,
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
