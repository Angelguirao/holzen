import type { ReactNode } from 'react';
import { useMemo } from 'react';
import type { ZenModeHomeProps } from '@/components/home/ZenModeHome';

type CooldownFn = () => number;

/**
 * Stable props object for {@link HomeZenModeRoute} / {@link ZenModeHome}.
 * Keeps Zen branch readable and avoids accidental prop drift vs the type.
 */
export function useHomeZenModeRouteProps(args: {
  message: ZenModeHomeProps['message'];
  context: ZenModeHomeProps['context'];
  companions: ZenModeHomeProps['companions'];
  companionPrefs: ZenModeHomeProps['companionPrefs'];
  severity: ZenModeHomeProps['severity'];
  lastPauseInstanceId: ZenModeHomeProps['lastPauseInstanceId'];
  loading: ZenModeHomeProps['loading'];
  error: ZenModeHomeProps['error'];
  btcData: ZenModeHomeProps['btcData'];
  onDismiss: ZenModeHomeProps['onDismiss'];
  onNeedPause: ZenModeHomeProps['onNeedPause'];
  onManualTrigger: ZenModeHomeProps['onManualTrigger'];
  subscriptionReady: ZenModeHomeProps['subscriptionReady'];
  hasAccess: ZenModeHomeProps['hasAccess'];
  showLimitUpsell: ZenModeHomeProps['showLimitUpsell'];
  showPauseScheduling: ZenModeHomeProps['showPauseScheduling'];
  pinnedPreview: ReactNode;
  autoCooldownRemaining: CooldownFn;
  cooldownHours: ZenModeHomeProps['cooldownHours'];
  nextCronCheckIn: CooldownFn;
  manualCooldownRemaining: CooldownFn;
  checkoutLoading: ZenModeHomeProps['checkoutLoading'];
  onStartCheckoutPro: ZenModeHomeProps['onStartCheckoutPro'];
}): ZenModeHomeProps {
  const {
    message,
    context,
    companions,
    companionPrefs,
    severity,
    lastPauseInstanceId,
    loading,
    error,
    btcData,
    onDismiss,
    onNeedPause,
    onManualTrigger,
    subscriptionReady,
    hasAccess,
    showLimitUpsell,
    showPauseScheduling,
    pinnedPreview,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    checkoutLoading,
    onStartCheckoutPro,
  } = args;

  return useMemo(
    () => ({
      message,
      context,
      companions,
      companionPrefs,
      severity,
      lastPauseInstanceId,
      loading,
      error,
      btcData,
      onDismiss,
      onNeedPause,
      onManualTrigger,
      subscriptionReady,
      hasAccess,
      showLimitUpsell,
      showPauseScheduling,
      pinnedPreview,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      checkoutLoading,
      onStartCheckoutPro,
    }),
    [
      message,
      context,
      companions,
      companionPrefs,
      severity,
      lastPauseInstanceId,
      loading,
      error,
      btcData,
      onDismiss,
      onNeedPause,
      onManualTrigger,
      subscriptionReady,
      hasAccess,
      showLimitUpsell,
      showPauseScheduling,
      pinnedPreview,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      checkoutLoading,
      onStartCheckoutPro,
    ],
  );
}
