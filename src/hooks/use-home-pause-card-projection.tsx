import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseCardBody } from '@/components/home/HomePauseCardBody';
import { SnoozeToolbarControl } from '@/components/SnoozeControl';
import type { BtcPriceData } from '@/lib/btc';

/** Shape returned by {@link parsePauseContextForHomePreview}. */
type PauseContextPreview = {
  btc24h: string | null;
  marketSentiment: string | null;
};

export function useHomePauseCardProjection(args: {
  subscriptionReady: boolean;
  hasAccess: boolean;
  subLoading: boolean;
  subscribed: boolean;
  monthlyRemaining: number | undefined;
  checkoutLoading: boolean;
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
  manualTrigger: () => void;
  onNavigatePauseWithThis: () => void;
  onNavigatePauseFromPendingBanner: () => void;
  onDismissOpenPause: () => void;
  onNeedPause: () => void;
  onStartCheckoutPro: () => void;
}) {
  const {
    subscriptionReady,
    hasAccess,
    subLoading,
    subscribed,
    monthlyRemaining,
    checkoutLoading,
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
        subscribed={subscribed}
        monthlyRemaining={monthlyRemaining}
        checkoutLoading={checkoutLoading}
        onStartCheckoutPro={onStartCheckoutPro}
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
      subscribed,
      monthlyRemaining,
      checkoutLoading,
      onStartCheckoutPro,
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
