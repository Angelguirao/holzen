import { useMemo } from 'react';
import type { ZenModeHomeProps } from '@/components/home/ZenModeHome';

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
  showPauseScheduling: ZenModeHomeProps['showPauseScheduling'];
  autoCooldownRemaining: CooldownFn;
  cooldownHours: ZenModeHomeProps['cooldownHours'];
  nextCronCheckIn: CooldownFn;
  manualCooldownRemaining: CooldownFn;
  checkoutLoading: ZenModeHomeProps['checkoutLoading'];
  onStartCheckoutPro: ZenModeHomeProps['onStartCheckoutPro'];
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
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    checkoutLoading,
    onStartCheckoutPro,
  } = args;

  return useMemo(
    () => ({
      hasOpenPause,
      context,
      contextPreview,
      openPauseState,
      companions: { haiku: null, groundingTitle: null, groundingBody: null },
      companionPrefs: {
        breathing: true,
        haiku: false,
        grounding: false,
        signal: false,
        zoomOut: false,
        history: false,
      },
      severity: 'mild',
      lastPauseInstanceId: null,
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
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      checkoutLoading,
      onStartCheckoutPro,
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
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      checkoutLoading,
      onStartCheckoutPro,
    ],
  );
}
