import type { NavigateFunction } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { getHomeSubscriptionGate } from '@/features/subscription/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import { usePauseHomeContext } from '@/features/pause/presentation/home/pause-home-context';
import { useCompletedPauseCount } from '@/features/pause/presentation/home/use-completed-pause-count';
import { useHomePauseActions } from '@/features/pause/presentation/home/use-home-pause-actions';
import { useHomePendingPauseOfferActions } from '@/features/pause/presentation/home/use-home-pending-pause-offer-actions';
import { useHomePauseWelcomeBackSheet } from '@/features/pause/presentation/home/use-home-pause-welcome-back-sheet';
import type { HomePauseWidgetProjectionContext } from '@/features/pause/domain/home/home-pause-widget-projection-types';

export type UseHomePauseWidgetScreenDeps = {
  subscriptionReady: boolean;
  navigate: NavigateFunction;
  startCheckout: (target?: 'pro' | 'flex_pack_s' | 'flex_pack_m') => Promise<void>;
  startReactivationCheckout: () => Promise<void>;
  ensureTrial: () => Promise<void>;
};

/** Composes pause context, profile, subscription gate, and Home widget actions for projection. */
export function useHomePauseWidgetInputs(
  deps: UseHomePauseWidgetScreenDeps,
): HomePauseWidgetProjectionContext {
  const { user } = useAuth();
  const {
    companionPrefs,
    cooldownHours,
    trackedAssetId,
    threshold,
    thresholdDown,
    profileLastTriggerAt,
  } = useProfile();

  const {
    loading: subLoading,
    entitlement,
    checkoutLoading,
    trialLoading,
  } = useSubscription();

  const {
    marketData,
    message,
    context,
    companions,
    severity,
    lastPauseInstanceId,
    openPauseState,
    openPauseSource,
    contextSnapshot,
    hasReflectionStep,
    hasOpenPauseStepEvents,
    openPauseCreatedAt,
    openPauseEngagedAt,
    openPauseMetadata,
    loading,
    error,
    newPauseArrival,
    dismissMessage,
    dismissOpenPauseFromWidget,
    manualTrigger,
    manualCooldownRemaining,
    autoCooldownRemaining,
    nextCronCheckIn,
    resyncOpenPauseFromDb,
  } = usePauseHomeContext();

  const hasOpenPause = Boolean(lastPauseInstanceId);
  const { hasAccess, showPauseScheduling } = getHomeSubscriptionGate({
    subLoading,
    entitlement,
    hasOpenPause,
    loading,
  });

  const pauseActions = useHomePauseActions({
    message,
    context,
    lastPauseInstanceId,
    companions,
    companionPrefs,
    severity,
    navigate: deps.navigate,
    dismissMessage,
    dismissOpenPauseFromWidget,
    manualTrigger,
    manualCooldownRemaining,
    startCheckout: deps.startCheckout,
    dismissAnalyticsSurface: 'home_your_pause_widget',
    userId: user?.id,
  });

  const pendingOfferActions = useHomePendingPauseOfferActions(deps.navigate);
  const completedPauseCount = useCompletedPauseCount() ?? 0;

  const welcomeBack = useHomePauseWelcomeBackSheet({
    handleNavigatePauseWithThis: pauseActions.handleNavigatePauseWithThis,
    handleStartOverEngagedPause: pauseActions.handleStartOverEngagedPause,
    handleDismiss: pauseActions.handleDismiss,
  });

  return useMemo(
    (): HomePauseWidgetProjectionContext => ({
      lastPauseInstanceId,
      hasOpenPause,
      openPauseState,
      openPauseSource,
      openPauseEngagedAt,
      openPauseMetadata,
      openPauseCreatedAt,
      hasReflectionStep,
      reflectionMessage: message,
      hasOpenPauseStepEvents,
      contextSnapshot,
      contextText: context,
      subLoading,
      hasAccess,
      entitlement,
      checkoutLoading,
      trialLoading,
      loading,
      error,
      marketData,
      showPauseScheduling,
      completedPauseCount,
      profileLastTriggerAt,
      newPauseArrival,
      trackedAssetId,
      threshold,
      thresholdDown,
      cooldownHours,
      autoCooldownRemaining,
      nextCronCheckIn,
      manualCooldownRemaining,
      resyncOpenPauseFromDb,
      onNavigatePauseWithThis: pauseActions.handleNavigatePauseWithThis,
      onOpenWelcomeBackSheet: welcomeBack.openWelcomeBackSheet,
      onAdoptPendingOffer: pendingOfferActions.adoptPendingOffer,
      onDeclinePendingOffer: pendingOfferActions.declinePendingOffer,
      pendingOfferBusy: pendingOfferActions.pendingOfferBusy,
      onDismissOpenPause: pauseActions.handleDismiss,
      onNeedPause: pauseActions.handleNeedAPause,
      onStartCheckoutPro: pauseActions.startProCheckout,
      onStartTrial: () => void deps.ensureTrial(),
      onReactivate: () => void deps.startReactivationCheckout(),
      manualTrigger,
      welcomeBackOpen: welcomeBack.welcomeBackOpen,
      setWelcomeBackOpen: welcomeBack.setWelcomeBackOpen,
      welcomeBackHandlers: welcomeBack.welcomeBackHandlers,
    }),
    [
      lastPauseInstanceId,
      hasOpenPause,
      openPauseState,
      openPauseSource,
      openPauseEngagedAt,
      openPauseMetadata,
      openPauseCreatedAt,
      hasReflectionStep,
      message,
      hasOpenPauseStepEvents,
      contextSnapshot,
      context,
      subLoading,
      hasAccess,
      entitlement,
      checkoutLoading,
      trialLoading,
      loading,
      error,
      marketData,
      showPauseScheduling,
      completedPauseCount,
      profileLastTriggerAt,
      newPauseArrival,
      trackedAssetId,
      threshold,
      thresholdDown,
      cooldownHours,
      autoCooldownRemaining,
      nextCronCheckIn,
      manualCooldownRemaining,
      resyncOpenPauseFromDb,
      pauseActions.handleNavigatePauseWithThis,
      pauseActions.handleStartOverEngagedPause,
      pauseActions.handleDismiss,
      welcomeBack.openWelcomeBackSheet,
      pauseActions.handleNeedAPause,
      pauseActions.startProCheckout,
      pendingOfferActions.adoptPendingOffer,
      pendingOfferActions.declinePendingOffer,
      pendingOfferActions.pendingOfferBusy,
      manualTrigger,
      welcomeBack.welcomeBackOpen,
      welcomeBack.setWelcomeBackOpen,
      welcomeBack.welcomeBackHandlers,
      deps.ensureTrial,
      deps.startReactivationCheckout,
    ],
  );
}
