import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { usePauseHomeContext } from '@/features/pause/public-home';
import { useAuth } from '@/features/auth/public';
import { useHolzenCommunityStatsRealtime, useProfile } from '@/features/user/public-hooks';
import {
  useDismissOutletPauseReady,
  useHomePracticeStats,
  usePauseArrivalAudio,
} from '@/features/pause/public-home';
import { isBitcoinTrackedAsset } from '@/features/market/public';
import { useMarketDisplayPreferences } from '@/features/market/public-hooks';
import { getHomeSubscriptionGate } from '@/features/subscription/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useWidgetLayout } from '@/screens/home/components/HomeWidget';
import { HOME_WIDGET_DEFAULT_ORDER } from '@/screens/home/lib/home-section-visibility-constants';
import type { HomeAppLayoutOutletContext } from '@/screens/home/lib/home-app-layout-outlet';
import { useHomeCheckoutWelcomeToast } from '@/screens/home/hooks/use-home-checkout-welcome-toast';
import { useHomeCustomizeBridge } from '@/screens/home/hooks/use-home-customize-bridge';
import { useHomeDashboardLayoutProps } from '@/screens/home/hooks/use-home-dashboard-layout-props';
import { useHomeDashboardTodayWiring } from '@/screens/home/hooks/use-home-dashboard-today-wiring';
import { useHomeDocumentTitle } from '@/screens/home/hooks/use-home-document-title';
import { useHomeMarketGoalHeaders } from '@/screens/home/hooks/use-home-market-goal-headers';
import { useHomeOptionalVisibility } from '@/screens/home/hooks/use-home-optional-visibility';
import { useHomePauseCardProjection } from '@/screens/home/hooks/use-home-pause-card-projection';
import { useHomePullFullReload } from '@/screens/home/hooks/use-home-pull-full-reload';
import { useHomeVisibleSections } from '@/screens/home/hooks/use-home-visible-sections';
import { useHomePrefetch } from '@/screens/home/hooks/use-home-prefetch';
import { useHomePauseHelpFeedback } from '@/features/pause/presentation/home/use-home-pause-help-feedback';

/**
 * Home route conductor — composes Holzen outlet, subscription gate, pause card, and dashboard layout.
 */
export function useHomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    subscribed,
    loading: subLoading,
    entitlement,
    checkoutLoading,
    trialLoading,
    startCheckout,
    startReactivationCheckout,
    ensureTrial,
    refresh,
  } = useSubscription();
  const [searchParams] = useSearchParams();
  useHomeCheckoutWelcomeToast(searchParams.get('subscribed'), refresh, t);
  useHomeDocumentTitle(true);

  const {
    marketData,
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    contextSnapshot,
    loading,
    error,
    newPauseArrival,
    clearNewPauseArrival,
  } = usePauseHomeContext();

  const {
    firstName,
    currency,
    trackedAssetId,
    threshold,
    thresholdDown,
    profileLoaded,
  } = useProfile();

  useHomePrefetch({
    userId: user?.id,
    coinIdRaw: trackedAssetId,
    currency,
  });

  useHolzenCommunityStatsRealtime(Boolean(user?.id));

  const hasOpenPause = Boolean(lastPauseInstanceId);

  const { subscriptionReady } = getHomeSubscriptionGate({
    subLoading,
    entitlement,
    hasOpenPause,
    loading,
  });

  const outletCtx = useOutletContext<HomeAppLayoutOutletContext>();
  const pauseReady = outletCtx?.pauseReady ?? false;
  const dismissPauseReady = outletCtx?.dismissPauseReady;
  useDismissOutletPauseReady(pauseReady, hasOpenPause, dismissPauseReady);
  usePauseArrivalAudio(newPauseArrival, lastPauseInstanceId, clearNewPauseArrival);

  const {
    priceHidden,
    unitBasisMode,
    marketChartExpanded,
    marketChartExpandBlocked,
    togglePriceHidden,
    toggleUnitBasisMode,
    toggleMarketChartExpanded,
  } = useMarketDisplayPreferences();
  const unitBasisModeSupported = isBitcoinTrackedAsset(trackedAssetId);
  const { stats: practiceStats, isLoading: practiceStatsLoading } = useHomePracticeStats();

  const { order, collapsed, reorder, toggleCollapsed, resetLayout } = useWidgetLayout(
    HOME_WIDGET_DEFAULT_ORDER,
    user?.id,
  );
  const { visible: sectionVisible, setVisible, resetVisibility: resetSectionVisibility } =
    useHomeOptionalVisibility(user?.id);

  const { visibleOrderedSectionIds, todaySectionIds } = useHomeVisibleSections({
    order,
    sectionVisible,
  });

  const { customizeSheet, onOpenCustomize } = useHomeCustomizeBridge({
    t,
    order,
    reorder,
    sectionVisible,
    setVisible,
    resetLayout,
    resetSectionVisibility,
  });

  const { marketHeaderRight } = useHomeMarketGoalHeaders({
    t,
    marketChartExpanded,
    marketChartExpandBlocked,
    toggleMarketChartExpanded,
  });

  const pauseProjection = useHomePauseCardProjection({
    subscriptionReady,
    navigate,
    startCheckout,
    startReactivationCheckout,
    ensureTrial,
  });

  const { pullDistance, refreshing: pullRefreshing, handlers: pullHandlers } = useHomePullFullReload();

  const { renderSection, goalWhyBlock } = useHomeDashboardTodayWiring(
    {
      t,
      error,
      marketHeaderRight,
      marketData,
      threshold,
      thresholdDown,
      openPauseSource,
      openPauseState,
      openPauseContextSnapshot: contextSnapshot,
      priceHidden,
      togglePriceHidden,
      currency,
      trackedAssetId,
      unitBasisModeSupported,
      unitBasisMode,
      toggleUnitBasisMode,
      marketChartExpanded,
      toggleMarketChartExpanded,
      pauseCardBody: pauseProjection.pauseCardBody,
      pauseSectionHeaderRight: pauseProjection.pauseSectionHeaderRight,
      pauseWidgetProjection: pauseProjection.pauseWidgetProjection,
      subscribed,
      collapsed,
      toggleCollapsed,
      presenceXp: practiceStats?.presenceXp ?? null,
      completedPauseCount: practiceStats?.completedPauseCount ?? null,
      practiceStatsLoading,
    },
    visibleOrderedSectionIds,
  );

  const dashboardLayout = useHomeDashboardLayoutProps({
    pullHandlers,
    pullDistance,
    pullRefreshing,
    userId: user?.id,
    firstName,
    todaySectionIds,
    goalWhyBlock,
    renderSection,
    onOpenCustomize,
    customize: customizeSheet,
    completedPauseCount: practiceStats?.completedPauseCount ?? null,
  });

  const pauseHelpFeedback = useHomePauseHelpFeedback({
    blocked: customizeSheet.open,
  });

  return {
    profileLoaded,
    dashboardLayout,
    pauseHelpFeedback,
  };
}
