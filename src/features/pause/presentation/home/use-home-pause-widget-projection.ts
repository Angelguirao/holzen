import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { trackedAssetSymbol } from '@/features/market/domain/tracked-assets';
import type { BtcPriceData } from '@/features/market/public';
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
import { computeAutoCooldownRemainingMs } from '@/features/pause/domain/reflect/generation/compute-pause-trigger-cooldowns';
import { shouldSurfacePauseWidgetError } from '@/features/pause/domain/home/pause-home-widget-error';
import {
  fetchRecentContextLostPause,
  CONTEXT_LOST_HOME_WINDOW_MS,
} from '@/features/pause/infrastructure/queries/recent-context-lost-pause-query';
import { usePendingPauseOffer } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';

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
  onDismissOpenPause: () => void;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  onReflectionRetry: (mood?: string) => Promise<ManualPauseTriggerResult>;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  onNeedPause: () => void;
  onPauseAgain: () => void;
  completedPauseCount: number;
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
  isBriefRitual: boolean;
  contextSnapshot: Record<string, unknown> | null;
  openPauseCreatedAt: string | null;
  contextText: string | null;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  manualTrigger: (mood?: string) => Promise<ManualPauseTriggerResult>;
  onNavigatePauseWithThis: () => void;
  onNavigatePauseFromPendingBanner: () => void;
  onDismissOpenPause: () => void;
  onNeedPause: () => void;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  completedPauseCount: number | null;
  trackedAssetId: string;
  newPauseArrival: boolean;
  profileLastTriggerAt: string | null;
};

function readExpandedPreference(): boolean | null {
  try {
    const v = sessionStorage.getItem(HOME_PAUSE_WIDGET_EXPANDED_STORAGE_KEY);
    if (v === null) return null;
    return v === 'true';
  } catch {
    return null;
  }
}

function writeExpandedPreference(expanded: boolean): void {
  try {
    sessionStorage.setItem(HOME_PAUSE_WIDGET_EXPANDED_STORAGE_KEY, expanded ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

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

  const postPauseAutoCooldownRemainingMs = useMemo(() => {
    if (params.hasOpenPause) {
      return params.autoCooldownRemaining();
    }
    return computeAutoCooldownRemainingMs(params.profileLastTriggerAt, params.cooldownHours);
  }, [
    params.hasOpenPause,
    params.autoCooldownRemaining,
    params.profileLastTriggerAt,
    params.cooldownHours,
  ]);

  const showCalmWaters = Boolean(
    !params.hasOpenPause &&
      calmQuery.data &&
      Date.now() - new Date(calmQuery.data.expiredAt).getTime() < CONTEXT_LOST_HOME_WINDOW_MS,
  );

  const blockingError = Boolean(
    params.error && shouldSurfacePauseWidgetError(params.error, params.btcData),
  );

  const assetSymbol = trackedAssetSymbol(params.trackedAssetId);

  const [userExpanded, setUserExpanded] = useState<boolean>(() => readExpandedPreference() ?? false);

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
        isBriefRitual: params.isBriefRitual,
        hasPendingOffer: Boolean(pending),
        postPauseAutoCooldownRemainingMs,
        completedPauseCount: params.completedPauseCount ?? 0,
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
      params.isBriefRitual,
      assetSymbol,
      pending,
      postPauseAutoCooldownRemainingMs,
      params.completedPauseCount,
      userExpanded,
    ],
  );

  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = widgetMode;

    const autoExpandModes: HomePauseWidgetMode[] = ['B', 'C', 'C_prime', 'E'];
    const enteredAutoExpand =
      prev !== null && autoExpandModes.includes(widgetMode) && !autoExpandModes.includes(prev);

    if (params.newPauseArrival || enteredAutoExpand) {
      setUserExpanded(true);
      writeExpandedPreference(true);
    }
  }, [widgetMode, params.newPauseArrival]);

  const collapsible =
    homePauseWidgetModeIsCollapsible(widgetMode) || widgetMode === 'calm_waters';
  const collapsed =
    widgetMode === 'calm_waters'
      ? !userExpanded
      : homePauseWidgetModeIsCollapsed(widgetMode);

  const onToggleCollapse = useCallback(() => {
    setUserExpanded((prev) => {
      const next = !prev;
      writeExpandedPreference(next);
      return next;
    });
  }, []);

  const marketBlock = useMemo(
    () =>
      formatHomePauseMarketBlock({
        contextText: params.contextText,
        btcData: params.btcData,
        trackedAssetId: params.trackedAssetId,
        instanceCreatedAt: params.openPauseCreatedAt,
      }),
    [params.contextText, params.btcData, params.trackedAssetId, params.openPauseCreatedAt],
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

  const pendingMarketBlock =
    widgetMode === 'C_prime' && pending
      ? formatHomePauseMarketBlock({
          contextText: pendingContextText,
          btcData: params.btcData,
          trackedAssetId: params.trackedAssetId,
          instanceCreatedAt: pending.created_at ?? null,
        })
      : null;

  const pendingPreviewLine =
    widgetMode === 'C_prime' && pending
      ? resolveHomePauseWidgetPreviewLine({
          hasReflectionStep: false,
          reflectionMessage: pending.preview_message,
          trackedAssetSymbol: assetSymbol,
          contextSnapshot: pendingSnapshot,
          openPauseState: 'active',
        })
      : null;

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
    onPauseWithNewContext: params.onNavigatePauseFromPendingBanner,
    onDismissOpenPause: params.onDismissOpenPause,
    loading: params.loading,
    error: params.error,
    btcData: params.btcData,
    onReflectionRetry: params.manualTrigger,
    showPauseScheduling: params.showPauseScheduling,
    autoCooldownRemaining: params.autoCooldownRemaining,
    cooldownHours: params.cooldownHours,
    nextCronCheckIn: params.nextCronCheckIn,
    manualCooldownRemaining: params.manualCooldownRemaining,
    onNeedPause: params.onNeedPause,
    onPauseAgain: params.onNeedPause,
    completedPauseCount: params.completedPauseCount ?? 0,
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
