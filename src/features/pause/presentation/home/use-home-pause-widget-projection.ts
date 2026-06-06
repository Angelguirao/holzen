import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { trackedAssetSymbol } from '@/features/market/domain/tracked-assets';
import type { MarketQuote } from '@/features/market/public';
import type { Entitlement } from '@/features/subscription/public';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';
import { formatHomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';
import {
  homePauseWidgetModeIsCollapsible,
  homePauseWidgetModeIsCollapsed,
  homePauseWidgetSectionTitleKey,
  resolveHomePauseWidgetMode,
  type HomePauseWidgetMode,
} from '@/features/pause/domain/home/home-pause-widget-mode';
import {
  resolveHomePauseWidgetPreviewLine,
  type HomePauseWidgetPreviewLine,
} from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';
import { shouldSurfacePauseWidgetError } from '@/features/pause/domain/home/pause-home-widget-error';
import {
  fetchRecentContextLostPause,
  CONTEXT_LOST_HOME_WINDOW_MS,
} from '@/features/pause/infrastructure/queries/recent-context-lost-pause-query';
import { usePendingPauseOffer } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';
import { useCalmWatersToast } from '@/features/pause/presentation/home/use-calm-waters-toast';
import {
  markHomePauseWidgetFirstVisitHandled,
  shouldExpandHomePauseWidgetFirstVisit,
} from '@/features/pause/infrastructure/home-pause-widget-first-visit-storage';

export const HOME_PAUSE_WIDGET_EXPANDED_STORAGE_KEY = 'holzen_home_pause_widget_expanded_v1';

export type HomePauseWidgetBodyProjection = {
  widgetMode: HomePauseWidgetMode;
  previewLine: HomePauseWidgetPreviewLine;
  marketBlock: ReturnType<typeof formatHomePauseMarketBlock>;
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  onPauseWithThis: () => void;
  onPauseWithNewContext?: () => void;
  onDeclinePendingOffer?: () => void;
  pendingOfferBusy?: boolean;
  showPendingQueuedBanner: boolean;
  onDismissOpenPause: () => void;
  loading: boolean;
  error: string | null;
  marketData: MarketQuote | null;
  onReflectionRetry: (mood?: string) => Promise<ManualPauseTriggerResult>;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  onNeedPause: () => void;
  onPauseAgain: () => void;
  completedPauseCount: number;
  profileLastTriggerAt: string | null;
  manualCooldownRemainingMs: number;
  pendingPreviewLine: HomePauseWidgetPreviewLine | null;
  pendingMarketBlock: ReturnType<typeof formatHomePauseMarketBlock> | null;
  calmWatersExpiredAt: string | null;
};

export type UseHomePauseWidgetProjectionParams = {
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  contextSnapshot: Record<string, unknown> | null;
  openPauseCreatedAt: string | null;
  contextText: string | null;
  loading: boolean;
  error: string | null;
  marketData: MarketQuote | null;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  manualTrigger: (mood?: string) => Promise<ManualPauseTriggerResult>;
  onNavigatePauseWithThis: () => void;
  onAdoptPendingOffer: () => void | Promise<boolean>;
  onDeclinePendingOffer: () => void | Promise<boolean>;
  pendingOfferBusy: boolean;
  onDismissOpenPause: () => void;
  onNeedPause: () => void;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  completedPauseCount: number | null;
  trackedAssetId: string;
  newPauseArrival: boolean;
  profileLastTriggerAt: string | null;
  hasOpenPauseStepEvents: boolean;
};

export type HomePauseWidgetProjection = {
  sectionTitleKey: string;
  showMoonIcon: boolean;
  collapsible: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  body: HomePauseWidgetBodyProjection;
};

export function useHomePauseWidgetProjection(
  params: UseHomePauseWidgetProjectionParams,
): HomePauseWidgetProjection {
  const { user } = useAuth();
  const userId = user?.id;
  const { pending } = usePendingPauseOffer();
  const prevModeRef = useRef<HomePauseWidgetMode | null>(null);

  const calmQuery = useQuery({
    queryKey: ['home-recent-context-lost', userId],
    queryFn: () => fetchRecentContextLostPause(userId!),
    enabled: Boolean(userId) && !params.hasOpenPause,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const showCalmWaters = Boolean(
    !params.hasOpenPause &&
      calmQuery.data &&
      Date.now() - new Date(calmQuery.data.expiredAt).getTime() < CONTEXT_LOST_HOME_WINDOW_MS,
  );

  useCalmWatersToast({
    userId,
    showCalmWaters,
    pauseInstanceId: calmQuery.data?.pauseInstanceId ?? null,
  });

  const blockingError = Boolean(
    params.error && shouldSurfacePauseWidgetError(params.error, params.marketData),
  );

  const assetSymbol = trackedAssetSymbol(params.trackedAssetId);

  const [userExpanded, setUserExpanded] = useState(false);
  const [cooldownNowMs, setCooldownNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setCooldownNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const manualCooldownRemainingMs = useMemo(
    () => params.manualCooldownRemaining(),
    [params.manualCooldownRemaining, cooldownNowMs],
  );

  useEffect(() => {
    if (!userId || params.hasOpenPause || params.loading) return;
    if (manualCooldownRemainingMs > 0) return;
    if (!shouldExpandHomePauseWidgetFirstVisit(userId)) return;
    setUserExpanded(true);
  }, [userId, params.hasOpenPause, params.loading, manualCooldownRemainingMs]);

  useEffect(() => {
    if (!userId || !params.hasOpenPause) return;
    if (!shouldExpandHomePauseWidgetFirstVisit(userId)) return;
    markHomePauseWidgetFirstVisitHandled(userId);
  }, [userId, params.hasOpenPause]);

  const { mode: widgetMode } = useMemo(
    () =>
      resolveHomePauseWidgetMode({
        loading: params.loading,
        blockingError,
        showCalmWaters,
        hasOpenPause: params.hasOpenPause,
        openPauseState: params.openPauseState,
        hasReflectionStep: params.hasReflectionStep,
        reflectionMessage: params.reflectionMessage,
        trackedAssetSymbol: assetSymbol,
        hasPendingOffer: Boolean(pending),
        manualCooldownRemainingMs,
        completedPauseCount: params.completedPauseCount ?? 0,
        hasOpenPauseStepEvents: params.hasOpenPauseStepEvents,
        userExpanded,
      }),
    [
      params.loading,
      blockingError,
      showCalmWaters,
      params.hasOpenPause,
      params.openPauseState,
      params.hasReflectionStep,
      params.reflectionMessage,
      assetSymbol,
      pending,
      manualCooldownRemainingMs,
      params.completedPauseCount,
      params.hasOpenPauseStepEvents,
      userExpanded,
    ],
  );

  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = widgetMode;

    const restModes: HomePauseWidgetMode[] = [
      'A_collapsed',
      'A_expanded',
      'D_collapsed',
      'D_expanded',
      'D_prime_collapsed',
      'D_prime_expanded',
    ];
    const activeModes: HomePauseWidgetMode[] = ['B', 'B_in_progress', 'C', 'C_prime', 'E'];
    if (prev && activeModes.includes(prev) && restModes.includes(widgetMode)) {
      setUserExpanded(false);
    }

    const autoExpandModes: HomePauseWidgetMode[] = ['B', 'B_in_progress', 'C', 'C_prime', 'E'];
    const enteredAutoExpand =
      prev !== null && autoExpandModes.includes(widgetMode) && !autoExpandModes.includes(prev);

    if (params.newPauseArrival || enteredAutoExpand) {
      setUserExpanded(true);
    }
  }, [widgetMode, params.newPauseArrival]);

  const collapsible = homePauseWidgetModeIsCollapsible(widgetMode);
  const collapsed = homePauseWidgetModeIsCollapsed(widgetMode);

  const onToggleCollapse = useCallback(() => {
    setUserExpanded((prev) => !prev);
  }, []);

  const marketBlock = useMemo(
    () =>
      formatHomePauseMarketBlock({
        contextText: params.contextText,
        marketData: params.marketData,
        trackedAssetId: params.trackedAssetId,
        instanceCreatedAt: params.openPauseCreatedAt,
      }),
    [params.contextText, params.marketData, params.trackedAssetId, params.openPauseCreatedAt],
  );

  const previewLine = useMemo(
    () =>
      resolveHomePauseWidgetPreviewLine({
        hasReflectionStep: params.hasReflectionStep,
        reflectionMessage: params.reflectionMessage,
        trackedAssetSymbol: assetSymbol,
        contextSnapshot: params.contextSnapshot,
        openPauseState: params.openPauseState,
      }),
    [
      params.hasReflectionStep,
      params.reflectionMessage,
      assetSymbol,
      params.contextSnapshot,
      params.openPauseState,
    ],
  );

  const pendingSnapshot = pending?.context_snapshot ?? null;
  const pendingContextText =
    typeof pendingSnapshot?.context_text === 'string' ? pendingSnapshot.context_text : null;

  const pendingPreviewLine =
    pending && (widgetMode === 'C_prime' || widgetMode === 'B' || widgetMode === 'E')
      ? resolveHomePauseWidgetPreviewLine({
          hasReflectionStep: false,
          reflectionMessage: pending.preview_message,
          trackedAssetSymbol: assetSymbol,
          contextSnapshot: pendingSnapshot,
          openPauseState: 'active',
        })
      : null;

  const pendingMarketBlock =
    pending && (widgetMode === 'C_prime' || widgetMode === 'B' || widgetMode === 'E')
      ? formatHomePauseMarketBlock({
          contextText: pendingContextText,
          marketData: params.marketData,
          trackedAssetId: params.trackedAssetId,
          instanceCreatedAt: pending.created_at ?? null,
        })
      : null;

  const showPendingQueuedBanner =
    (widgetMode === 'B' || widgetMode === 'E') && Boolean(pending);

  const body: HomePauseWidgetBodyProjection = {
    widgetMode,
    previewLine,
    marketBlock,
    subLoading: params.subLoading,
    hasAccess: params.hasAccess,
    entitlement: params.entitlement,
    checkoutLoading: params.checkoutLoading,
    trialLoading: params.trialLoading,
    onStartCheckoutPro: params.onStartCheckoutPro,
    onStartTrial: params.onStartTrial,
    onReactivate: params.onReactivate,
    onPauseWithThis: params.onNavigatePauseWithThis,
    onPauseWithNewContext: () => void params.onAdoptPendingOffer(),
    onDeclinePendingOffer: () => void params.onDeclinePendingOffer(),
    pendingOfferBusy: params.pendingOfferBusy,
    showPendingQueuedBanner,
    onDismissOpenPause: params.onDismissOpenPause,
    loading: params.loading,
    error: params.error,
    marketData: params.marketData,
    onReflectionRetry: params.manualTrigger,
    showPauseScheduling: params.showPauseScheduling,
    autoCooldownRemaining: params.autoCooldownRemaining,
    cooldownHours: params.cooldownHours,
    nextCronCheckIn: params.nextCronCheckIn,
    manualCooldownRemaining: params.manualCooldownRemaining,
    onNeedPause: params.onNeedPause,
    onPauseAgain: params.onNeedPause,
    completedPauseCount: params.completedPauseCount ?? 0,
    profileLastTriggerAt: params.profileLastTriggerAt,
    manualCooldownRemainingMs,
    pendingPreviewLine,
    pendingMarketBlock,
    calmWatersExpiredAt: calmQuery.data?.expiredAt ?? null,
  };

  return {
    sectionTitleKey: homePauseWidgetSectionTitleKey(widgetMode),
    showMoonIcon: true,
    collapsible,
    collapsed,
    onToggleCollapse,
    body,
  };
}
