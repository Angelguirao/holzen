import { useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth/public';
import { trackedAssetSymbol } from '@/features/market/domain/tracked-assets';
import { formatHomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';
import { resolveHomePauseWidgetSurface } from '@/features/pause/domain/home/home-pause-widget-surface';
import { resolveHomePauseWidgetPreviewLine } from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';
import { resolveEngagedPauseMarketSettled } from '@/features/pause/domain/home/resolve-engaged-pause-market-settled';
import { resolveHomePauseWidgetOpenMaxAnchorAt } from '@/features/pause/domain/home/resolve-home-pause-widget-open-max-anchor';
import { shouldSurfacePauseWidgetError } from '@/features/pause/domain/home/pause-home-widget-error';
import type { HomePauseWidgetProjection } from '@/features/pause/domain/home/home-pause-widget-projection-types';
import { assembleHomePauseWidgetProjection } from '@/features/pause/presentation/home/assemble-home-pause-widget-projection';
import {
  useHomePauseWidgetInputs,
  type UseHomePauseWidgetScreenDeps,
} from '@/features/pause/presentation/home/use-home-pause-widget-inputs';
import { usePendingPauseOffer } from '@/features/pause/presentation/reflect/pending-offer/use-pending-pause-offer';
import { useHomePauseWidgetCollapsePreference } from '@/features/pause/presentation/home/use-home-pause-widget-collapse-preference';
import { useHomePauseWidgetCooldownClock } from '@/features/pause/presentation/home/use-home-pause-widget-cooldown-clock';
import { useHomePauseRecentContextLost } from '@/features/pause/presentation/home/use-home-pause-recent-context-lost';
import { useHomePauseWidgetSurfaceTransition } from '@/features/pause/presentation/home/use-home-pause-widget-surface-transition';

export type {
  HomePauseWidgetBodyProjection,
  HomePauseWidgetProjection,
} from '@/features/pause/domain/home/home-pause-widget-projection-types';

export type { UseHomePauseWidgetScreenDeps } from '@/features/pause/presentation/home/use-home-pause-widget-inputs';

/** @deprecated Session-only expand flag; not persisted. Kept for grep / legacy references. */
export const HOME_PAUSE_WIDGET_EXPANDED_STORAGE_KEY = 'holzen_home_pause_widget_expanded_v1';

/**
 * Home “Your pause” widget conductor — composes context + domain surface resolver.
 * See `docs/systems/home-pause-widget-client-architecture.md`.
 */
export function useHomePauseWidgetProjection(
  deps: UseHomePauseWidgetScreenDeps,
): HomePauseWidgetProjection {
  const ctx = useHomePauseWidgetInputs(deps);
  const { user } = useAuth();
  const userId = user?.id;
  const { pending } = usePendingPauseOffer();

  useHomePauseRecentContextLost({
    userId,
    hasOpenPause: ctx.hasOpenPause,
  });

  const manualCooldownRemainingMs = useHomePauseWidgetCooldownClock(ctx.manualCooldownRemaining);

  const { userExpanded, setUserExpanded, postManualCooldownIdle } =
    useHomePauseWidgetCollapsePreference({
      userId,
      hasOpenPause: ctx.hasOpenPause,
      loading: ctx.loading,
      manualCooldownRemainingMs,
    });

  const blockingError = Boolean(
    ctx.error && shouldSurfacePauseWidgetError(ctx.error, ctx.marketData),
  );

  const assetSymbol = trackedAssetSymbol(ctx.trackedAssetId);

  const { surface } = useMemo(
    () =>
      resolveHomePauseWidgetSurface({
        loading: ctx.loading,
        blockingError,
        hasOpenPause: ctx.hasOpenPause,
        openPauseState: ctx.openPauseState,
        hasReflectionStep: ctx.hasReflectionStep,
        reflectionMessage: ctx.reflectionMessage,
        trackedAssetSymbol: assetSymbol,
        hasPendingOffer: Boolean(pending),
        manualCooldownRemainingMs,
        completedPauseCount: ctx.completedPauseCount,
        hasOpenPauseStepEvents: ctx.hasOpenPauseStepEvents,
        userExpanded,
      }),
    [
      ctx.loading,
      blockingError,
      ctx.hasOpenPause,
      ctx.openPauseState,
      ctx.hasReflectionStep,
      ctx.reflectionMessage,
      assetSymbol,
      pending,
      manualCooldownRemainingMs,
      ctx.completedPauseCount,
      ctx.hasOpenPauseStepEvents,
      userExpanded,
    ],
  );

  useHomePauseWidgetSurfaceTransition({
    surface,
    newPauseArrival: ctx.newPauseArrival,
    userId,
    setUserExpanded,
  });

  const onToggleCollapse = useCallback(() => {
    setUserExpanded((prev) => !prev);
  }, [setUserExpanded]);

  const marketBlock = useMemo(
    () =>
      formatHomePauseMarketBlock({
        contextText: ctx.contextText,
        contextSnapshot: ctx.contextSnapshot,
        marketData: ctx.marketData,
        trackedAssetId: ctx.trackedAssetId,
        instanceCreatedAt: ctx.openPauseCreatedAt,
      }),
    [ctx.contextText, ctx.contextSnapshot, ctx.marketData, ctx.trackedAssetId, ctx.openPauseCreatedAt],
  );

  const previewLine = useMemo(
    () =>
      resolveHomePauseWidgetPreviewLine({
        hasReflectionStep: ctx.hasReflectionStep,
        reflectionMessage: ctx.reflectionMessage,
        trackedAssetSymbol: assetSymbol,
        contextSnapshot: ctx.contextSnapshot,
        openPauseState: ctx.openPauseState,
      }),
    [
      ctx.hasReflectionStep,
      ctx.reflectionMessage,
      assetSymbol,
      ctx.contextSnapshot,
      ctx.openPauseState,
    ],
  );

  const pendingSnapshot = pending?.context_snapshot ?? null;
  const pendingContextText =
    typeof pendingSnapshot?.context_text === 'string' ? pendingSnapshot.context_text : null;

  const pendingMarketBlock =
    pending && surface === 'open_engaged_pending_offer'
      ? formatHomePauseMarketBlock({
          contextText: pendingContextText,
          contextSnapshot: pendingSnapshot,
          marketData: ctx.marketData,
          trackedAssetId: ctx.trackedAssetId,
          instanceCreatedAt: pending.created_at ?? null,
        })
      : null;

  const engagedPauseMarketSettled = resolveEngagedPauseMarketSettled({
    openPauseState: ctx.openPauseState,
    marketData: ctx.marketData,
    threshold: ctx.threshold,
    thresholdDown: ctx.thresholdDown,
  });

  const openPauseOpenMaxAnchorAt = resolveHomePauseWidgetOpenMaxAnchorAt({
    openPauseState: ctx.openPauseState,
    openPauseSource: ctx.openPauseSource,
    openPauseEngagedAt: ctx.openPauseEngagedAt,
    openPauseCreatedAt: ctx.openPauseCreatedAt,
    openPauseMetadata: ctx.openPauseMetadata,
  });

  const chromeAndBody = assembleHomePauseWidgetProjection({
    surface,
    display: {
      previewLine,
      marketBlock,
      pendingMarketBlock,
      postManualCooldownIdle,
      engagedPauseMarketSettled,
      openPauseOpenMaxAnchorAt,
      openPauseState: ctx.openPauseState,
      manualCooldownRemainingMs,
      completedPauseCount: ctx.completedPauseCount,
      profileLastTriggerAt: ctx.profileLastTriggerAt,
      marketData: ctx.marketData,
      showPauseScheduling: ctx.showPauseScheduling,
      cooldownHours: ctx.cooldownHours,
      loading: ctx.loading,
      error: ctx.error,
    },
    subscription: {
      subLoading: ctx.subLoading,
      hasAccess: ctx.hasAccess,
      entitlement: ctx.entitlement,
      checkoutLoading: ctx.checkoutLoading,
      trialLoading: ctx.trialLoading,
      showPauseScheduling: ctx.showPauseScheduling,
    },
    actions: ctx,
  });

  return {
    ...chromeAndBody,
    onToggleCollapse,
  };
}
