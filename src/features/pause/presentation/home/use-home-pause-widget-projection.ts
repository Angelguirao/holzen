import { useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth/public';
import { trackedAssetSymbol } from '@/features/market/domain/tracked-assets';
import { formatHomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';
import { buildHomePauseWidgetProjection } from '@/features/pause/domain/home/build-home-pause-widget-projection';
import { resolveHomePauseWidgetMode } from '@/features/pause/domain/home/home-pause-widget-mode';
import { resolveHomePauseWidgetPreviewLine } from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';
import { resolveEngagedPauseMarketSettled } from '@/features/pause/domain/home/resolve-engaged-pause-market-settled';
import { resolveHomePauseWidgetOpenMaxAnchorAt } from '@/features/pause/domain/home/resolve-home-pause-widget-open-max-anchor';
import { shouldSurfacePauseWidgetError } from '@/features/pause/domain/home/pause-home-widget-error';
import type {
  HomePauseWidgetProjection,
  UseHomePauseWidgetProjectionParams,
} from '@/features/pause/domain/home/home-pause-widget-projection-types';
import { usePendingPauseOffer } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';
import { useHomePauseWidgetCollapseState } from '@/features/pause/presentation/home/widget/use-home-pause-widget-collapse-state';
import { useHomePauseWidgetCooldownClock } from '@/features/pause/presentation/home/widget/use-home-pause-widget-cooldown-clock';
import { useHomePauseRecentContextLost } from '@/features/pause/presentation/home/widget/use-home-pause-recent-context-lost';
import { useHomePauseWidgetModeTransition } from '@/features/pause/presentation/home/widget/use-home-pause-widget-mode-transition';

export type {
  HomePauseWidgetBodyProjection,
  HomePauseWidgetProjection,
  UseHomePauseWidgetProjectionParams,
} from '@/features/pause/domain/home/home-pause-widget-projection-types';

/** @deprecated Session-only expand flag; not persisted. Kept for grep / legacy references. */
export const HOME_PAUSE_WIDGET_EXPANDED_STORAGE_KEY = 'holzen_home_pause_widget_expanded_v1';

/**
 * Home “Your pause” widget conductor — composes domain resolver + side-effect hooks.
 *
 * Flow: `usePauseHomeContext` + screen params → mode resolver → body DTO → `HomePauseWidgetBody`.
 * See `docs/systems/home-pause-widget-client-architecture.md`.
 */
export function useHomePauseWidgetProjection(
  params: UseHomePauseWidgetProjectionParams,
): HomePauseWidgetProjection {
  const { user } = useAuth();
  const userId = user?.id;
  const { pending } = usePendingPauseOffer();

  useHomePauseRecentContextLost({
    userId,
    hasOpenPause: params.hasOpenPause,
  });

  const manualCooldownRemainingMs = useHomePauseWidgetCooldownClock(
    params.manualCooldownRemaining,
  );

  const { userExpanded, setUserExpanded, postManualCooldownIdle } =
    useHomePauseWidgetCollapseState({
      userId,
      hasOpenPause: params.hasOpenPause,
      loading: params.loading,
      manualCooldownRemainingMs,
    });

  const blockingError = Boolean(
    params.error && shouldSurfacePauseWidgetError(params.error, params.marketData),
  );

  const assetSymbol = trackedAssetSymbol(params.trackedAssetId);

  const { mode: widgetMode } = useMemo(
    () =>
      resolveHomePauseWidgetMode({
        loading: params.loading,
        blockingError,
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

  useHomePauseWidgetModeTransition({
    widgetMode,
    newPauseArrival: params.newPauseArrival,
    userId,
    setUserExpanded,
  });

  const onToggleCollapse = useCallback(() => {
    setUserExpanded((prev) => !prev);
  }, [setUserExpanded]);

  const marketBlock = useMemo(
    () =>
      formatHomePauseMarketBlock({
        contextText: params.contextText,
        contextSnapshot: params.contextSnapshot,
        marketData: params.marketData,
        trackedAssetId: params.trackedAssetId,
        instanceCreatedAt: params.openPauseCreatedAt,
      }),
    [
      params.contextText,
      params.contextSnapshot,
      params.marketData,
      params.trackedAssetId,
      params.openPauseCreatedAt,
    ],
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
    pending && widgetMode === 'C_prime'
      ? formatHomePauseMarketBlock({
          contextText: pendingContextText,
          contextSnapshot: pendingSnapshot,
          marketData: params.marketData,
          trackedAssetId: params.trackedAssetId,
          instanceCreatedAt: pending.created_at ?? null,
        })
      : null;

  const engagedPauseMarketSettled = resolveEngagedPauseMarketSettled({
    openPauseState: params.openPauseState,
    marketData: params.marketData,
    threshold: params.threshold,
    thresholdDown: params.thresholdDown,
  });

  const openPauseOpenMaxAnchorAt = resolveHomePauseWidgetOpenMaxAnchorAt({
    openPauseState: params.openPauseState,
    openPauseSource: params.openPauseSource,
    openPauseEngagedAt: params.openPauseEngagedAt,
    openPauseCreatedAt: params.openPauseCreatedAt,
    openPauseMetadata: params.openPauseMetadata,
  });

  const chromeAndBody = buildHomePauseWidgetProjection({
    widgetMode,
    previewLine,
    marketBlock,
    pendingMarketBlock,
    postManualCooldownIdle,
    engagedPauseMarketSettled,
    openPauseOpenMaxAnchorAt,
    manualCooldownRemainingMs,
    params,
  });

  return {
    ...chromeAndBody,
    onToggleCollapse,
  };
}
