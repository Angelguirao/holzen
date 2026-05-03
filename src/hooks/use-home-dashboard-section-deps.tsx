import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { HomeDashboardSectionDeps } from '@/components/home/render-home-dashboard-section';
import type { BtcPriceData } from '@/lib/btc';
import type { TrackedAssetId } from '@/lib/tracked-assets';
import type { ComponentProps } from 'react';
import { NightReflectionCard } from '@/components/NightReflectionCard';

type NightReflection = NonNullable<ComponentProps<typeof NightReflectionCard>['reflection']>;

/** Memoized bundle passed into {@link renderHomeDashboardSection}. */
export function useHomeDashboardSectionDeps(args: {
  t: TFunction;
  goalWhyHoldSummary: string | null;
  setGoalWhyHoldSummary: (v: string | null) => void;
  goalWhyHeaderRight: ReactNode;
  goalWhyExpanded: boolean;
  error: string | null;
  marketHeaderRight: ReactNode;
  marketFooter: ReactNode;
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
  nightReflection: NightReflection | null;
  dismissNight: () => void;
  subscribed: boolean;
  collapsed: Record<string, boolean>;
  toggleCollapsed: (id: string) => void;
}): HomeDashboardSectionDeps {
  const {
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
    nightReflection,
    dismissNight,
    subscribed,
    collapsed,
    toggleCollapsed,
  } = args;

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
      nightReflection,
      dismissNight,
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
      nightReflection,
      dismissNight,
      subscribed,
      collapsed,
      toggleCollapsed,
    ],
  );
}
