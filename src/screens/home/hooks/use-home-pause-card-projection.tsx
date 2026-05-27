import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseWidgetBody } from '@/screens/home/components/HomePauseWidgetBody';
import { SnoozeToolbarControl } from '@/screens/home/components/SnoozeControl';
import {
  usePauseCardProjection,
  type UsePauseCardProjectionParams,
} from '@/features/pause/presentation/home/use-pause-card-projection';
import { useHomePauseWidgetProjection } from '@/features/pause/presentation/home/use-home-pause-widget-projection';

export type UseHomePauseCardProjectionParams = UsePauseCardProjectionParams & {
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  contextSnapshot: Record<string, unknown> | null;
  openPauseCreatedAt: string | null;
  contextText: string | null;
  completedPauseCount: number | null;
  trackedAssetId: string;
  newPauseArrival: boolean;
  profileLastTriggerAt: string | null;
};

/** Screen conductor: pause widget projection + Home route components (snooze + body). */
export function useHomePauseCardProjection(params: UseHomePauseCardProjectionParams) {
  const { showSnoozeToolbar } = usePauseCardProjection(params);

  const widgetProjection = useHomePauseWidgetProjection({
    subLoading: params.subLoading,
    hasAccess: params.hasAccess,
    entitlement: params.entitlement,
    checkoutLoading: params.checkoutLoading,
    trialLoading: params.trialLoading,
    hasOpenPause: params.hasOpenPause,
    openPauseState: params.openPauseState,
    hasReflectionStep: params.hasReflectionStep,
    reflectionMessage: params.reflectionMessage,
    contextSnapshot: params.contextSnapshot,
    openPauseCreatedAt: params.openPauseCreatedAt,
    contextText: params.contextText,
    loading: params.loading,
    error: params.error,
    btcData: params.btcData,
    showPauseScheduling: params.showPauseScheduling,
    autoCooldownRemaining: params.autoCooldownRemaining,
    cooldownHours: params.cooldownHours,
    nextCronCheckIn: params.nextCronCheckIn,
    manualCooldownRemaining: params.manualCooldownRemaining,
    manualTrigger: params.manualTrigger,
    onNavigatePauseWithThis: params.onNavigatePauseWithThis,
    onNavigatePauseFromPendingBanner: params.onNavigatePauseFromPendingBanner,
    onDismissOpenPause: params.onDismissOpenPause,
    onNeedPause: params.onNeedPause,
    onStartCheckoutPro: params.onStartCheckoutPro,
    onStartTrial: params.onStartTrial,
    onReactivate: params.onReactivate,
    completedPauseCount: params.completedPauseCount,
    trackedAssetId: params.trackedAssetId,
    newPauseArrival: params.newPauseArrival,
    profileLastTriggerAt: params.profileLastTriggerAt,
  });

  const pauseSectionHeaderRight = useMemo((): ReactNode | undefined => {
    if (!showSnoozeToolbar) return undefined;
    return <SnoozeToolbarControl />;
  }, [showSnoozeToolbar]);

  const pauseCardBody = useMemo(
    () => <HomePauseWidgetBody {...widgetProjection.body} />,
    [widgetProjection.body],
  );

  return {
    pauseSectionHeaderRight,
    pauseCardBody,
    pauseWidgetProjection: widgetProjection,
  };
}
