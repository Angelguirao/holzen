import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HolzenNumber } from '@/components/HolzenNumber';
import type { HomeDashboardSectionDeps } from '@/screens/home/components/render-home-dashboard-section';
import type { BtcPriceData, TrackedAssetId } from '@/features/market/public';

/** Memoized bundle passed into {@link renderHomeDashboardSection}. */
export function useHomeDashboardSectionDeps(args: {
  t: TFunction;
  goalWhyHoldSummary: string | null;
  setGoalWhyHoldSummary: (v: string | null) => void;
  goalWhyHeaderRight: ReactNode;
  goalWhyExpanded: boolean;
  error: string | null;
  marketHeaderRight: ReactNode;
  /** Defaults to a compact {@link HolzenNumber} when omitted. */
  marketFooter?: ReactNode;
  btcData: BtcPriceData | null;
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
  subscribed: boolean;
  collapsed: Record<string, boolean>;
  toggleCollapsed: (id: string) => void;
}): HomeDashboardSectionDeps {
  const defaultMarketFooter = useMemo(() => <HolzenNumber variant="compact" />, []);

  const {
    t,
    goalWhyHoldSummary,
    setGoalWhyHoldSummary,
    goalWhyHeaderRight,
    goalWhyExpanded,
    error,
    marketHeaderRight,
    marketFooter: marketFooterProp,
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
    subscribed,
    collapsed,
    toggleCollapsed,
  } = args;

  const marketFooter = marketFooterProp ?? defaultMarketFooter;

  return useMemo(
    () => ({
      t,
      goalWhyHoldSummary,
      setGoalWhyHoldSummary,
      goalWhyHeaderRight,
      goalWhyExpanded,
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
      subscribed,
      collapsed,
      toggleCollapsed,
    }),
    [
      t,
      goalWhyHoldSummary,
      setGoalWhyHoldSummary,
      goalWhyHeaderRight,
      goalWhyExpanded,
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
      subscribed,
      collapsed,
      toggleCollapsed,
    ],
  );
}
