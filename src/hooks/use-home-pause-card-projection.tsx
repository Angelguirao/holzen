import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseCardBody } from '@/components/home/HomePauseCardBody';
import type { Entitlement } from '@/lib/subscription-entitlement';
import { SnoozeToolbarControl } from '@/components/SnoozeControl';
import type { BtcPriceData } from '@/lib/btc';
import type { ManualPauseTriggerResult } from '@/lib/manual-pause-trigger-result';

/** Shape returned by {@link parsePauseContextForHomePreview}. */
type PauseContextPreview = {
  btc24h: string | null;
  marketSentiment: string | null;
};

export function useHomePauseCardProjection(args: {
  subscriptionReady: boolean;
  hasAccess: boolean;
  subLoading: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  pauseContextHomePreview: PauseContextPreview;
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
}) {
  const {
    subscriptionReady,
    hasAccess,
    subLoading,
    entitlement,
    checkoutLoading,
    trialLoading,
    hasOpenPause,
    openPauseState,
    pauseContextHomePreview,
    loading,
    error,
    btcData,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    manualTrigger,
    onNavigatePauseWithThis,
    onNavigatePauseFromPendingBanner,
    onDismissOpenPause,
    onNeedPause,
    onStartCheckoutPro,
    onStartTrial,
    onReactivate,
  } = args;

  const pauseSectionHeaderRight = useMemo(() => {
    if (!subscriptionReady || !hasAccess) return undefined;
    return <SnoozeToolbarControl />;
  }, [subscriptionReady, hasAccess]);

  const pauseCardBody: ReactNode = useMemo(
    () => (
      <HomePauseCardBody
        subLoading={subLoading}
        hasAccess={hasAccess}
        entitlement={entitlement}
        checkoutLoading={checkoutLoading}
        trialLoading={trialLoading}
        onStartCheckoutPro={onStartCheckoutPro}
        onStartTrial={onStartTrial}
        onReactivate={onReactivate}
        hasOpenPause={hasOpenPause}
        openPauseState={openPauseState}
        contextPreview={pauseContextHomePreview}
        onPauseWithThis={onNavigatePauseWithThis}
        onPauseWithThisFromPendingBanner={onNavigatePauseFromPendingBanner}
        onDismissOpenPause={onDismissOpenPause}
        loading={loading}
        error={error}
        btcData={btcData}
        onReflectionRetry={manualTrigger}
        showPauseScheduling={showPauseScheduling}
        autoCooldownRemaining={autoCooldownRemaining}
        cooldownHours={cooldownHours}
        nextCronCheckIn={nextCronCheckIn}
        manualCooldownRemaining={manualCooldownRemaining}
        onNeedPause={onNeedPause}
      />
    ),
    [
      subLoading,
      hasAccess,
      entitlement,
      checkoutLoading,
      trialLoading,
      onStartCheckoutPro,
      onStartTrial,
      onReactivate,
      hasOpenPause,
      openPauseState,
      pauseContextHomePreview,
      onNavigatePauseWithThis,
      onNavigatePauseFromPendingBanner,
      onDismissOpenPause,
      loading,
      error,
      btcData,
      manualTrigger,
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      onNeedPause,
    ],
  );

  return { pauseSectionHeaderRight, pauseCardBody };
}
