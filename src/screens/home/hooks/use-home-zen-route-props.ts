import { useMemo } from 'react';
import type { ZenModeHomeProps } from '@/screens/home/components/ZenModeHome';
import type { Entitlement } from '@/features/subscription/public';
import { zenModeHomePauseSnapshot } from '@/features/pause/public';

type CooldownFn = () => number;

/**
 * Stable props object for {@link HomeZenModeRoute} / {@link ZenModeHome}.
 * Keeps Zen branch readable and avoids accidental prop drift vs the type.
 */
export function useHomeZenModeRouteProps(args: {
  hasOpenPause: ZenModeHomeProps['hasOpenPause'];
  context: ZenModeHomeProps['context'];
  contextPreview: ZenModeHomeProps['contextPreview'];
  openPauseState: ZenModeHomeProps['openPauseState'];
  loading: ZenModeHomeProps['loading'];
  error: ZenModeHomeProps['error'];
  btcData: ZenModeHomeProps['btcData'];
  onDismiss: ZenModeHomeProps['onDismiss'];
  onNeedPause: ZenModeHomeProps['onNeedPause'];
  onManualTrigger: ZenModeHomeProps['onManualTrigger'];
  onPauseWithThis: ZenModeHomeProps['onPauseWithThis'];
  subscriptionReady: ZenModeHomeProps['subscriptionReady'];
  hasAccess: ZenModeHomeProps['hasAccess'];
  showLimitUpsell: ZenModeHomeProps['showLimitUpsell'];
  entitlement: Entitlement;
  showPauseScheduling: ZenModeHomeProps['showPauseScheduling'];
  autoCooldownRemaining: CooldownFn;
  cooldownHours: ZenModeHomeProps['cooldownHours'];
  nextCronCheckIn: CooldownFn;
  manualCooldownRemaining: CooldownFn;
  checkoutLoading: ZenModeHomeProps['checkoutLoading'];
  trialLoading: ZenModeHomeProps['trialLoading'];
  onStartTrial: ZenModeHomeProps['onStartTrial'];
  onReactivate: ZenModeHomeProps['onReactivate'];
}): ZenModeHomeProps {
  const {
    hasOpenPause,
    context,
    contextPreview,
    openPauseState,
    loading,
    error,
    btcData,
    onDismiss,
    onNeedPause,
    onManualTrigger,
    onPauseWithThis,
    subscriptionReady,
    hasAccess,
    showLimitUpsell,
    entitlement,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    checkoutLoading,
    trialLoading,
    onStartTrial,
    onReactivate,
  } = args;

  return useMemo(
    () => ({
      hasOpenPause,
      context,
      contextPreview,
      openPauseState,
      ...zenModeHomePauseSnapshot(),
      loading,
      error,
      btcData,
      onDismiss,
      onNeedPause,
      onManualTrigger,
      onPauseWithThis,
      subscriptionReady,
      hasAccess,
      showLimitUpsell,
      entitlement,
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      checkoutLoading,
      trialLoading,
      onStartTrial,
      onReactivate,
    }),
    [
      hasOpenPause,
      context,
      contextPreview,
      openPauseState,
      loading,
      error,
      btcData,
      onDismiss,
      onNeedPause,
      onManualTrigger,
      onPauseWithThis,
      subscriptionReady,
      hasAccess,
      showLimitUpsell,
      entitlement,
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      checkoutLoading,
      trialLoading,
      onStartTrial,
      onReactivate,
    ],
  );
}
