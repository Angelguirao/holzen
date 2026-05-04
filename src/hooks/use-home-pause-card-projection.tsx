import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseCardBody } from '@/components/home/HomePauseCardBody';
import { HomePinnedPauseInset } from '@/components/home/HomePinnedPauseInset';
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
  message: string | null;
  openPauseState: 'active' | 'engaged' | null;
  pauseContextHomePreview: PauseContextPreview;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  pinnedPausePreview: { context: string | null } | null;
  pinnedPreviewFields: PauseContextPreview;
  unpinPausePreview: () => void;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  manualTrigger: () => void;
  onNavigatePauseWithThis: () => void;
  onNavigatePauseFromPendingBanner: () => void;
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
    message,
    openPauseState,
    pauseContextHomePreview,
    loading,
    error,
    btcData,
    pinnedPausePreview,
    pinnedPreviewFields,
    unpinPausePreview,
    showPauseScheduling,
    autoCooldownRemaining,
    cooldownHours,
    nextCronCheckIn,
    manualCooldownRemaining,
    manualTrigger,
    onNavigatePauseWithThis,
    onNavigatePauseFromPendingBanner,
    onNeedPause,
    onStartCheckoutPro,
  } = args;

  const pauseSectionHeaderRight = useMemo(() => {
    if (!subscriptionReady || !hasAccess) return undefined;
    return <SnoozeToolbarControl />;
  }, [subscriptionReady, hasAccess]);

  const pauseEmptyPinnedPreview = useMemo(
    () =>
      pinnedPausePreview ? (
        <HomePinnedPauseInset
          btc24h={pinnedPreviewFields.btc24h}
          marketSentiment={pinnedPreviewFields.marketSentiment}
          onUnpin={unpinPausePreview}
        />
      ) : null,
    [pinnedPausePreview, pinnedPreviewFields.btc24h, pinnedPreviewFields.marketSentiment, unpinPausePreview],
  );

  const pauseCardBody: ReactNode = useMemo(
    () => (
      <HomePauseCardBody
        subLoading={subLoading}
        hasAccess={hasAccess}
        subscribed={subscribed}
        monthlyRemaining={monthlyRemaining}
        checkoutLoading={checkoutLoading}
        onStartCheckoutPro={onStartCheckoutPro}
        message={message}
        openPauseState={openPauseState}
        contextPreview={pauseContextHomePreview}
        onPauseWithThis={onNavigatePauseWithThis}
        onPauseWithThisFromPendingBanner={onNavigatePauseFromPendingBanner}
        loading={loading}
        error={error}
        btcData={btcData}
        onReflectionRetry={manualTrigger}
        pinnedPreview={pauseEmptyPinnedPreview}
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
      message,
      openPauseState,
      pauseContextHomePreview,
      onNavigatePauseWithThis,
      onNavigatePauseFromPendingBanner,
      loading,
      error,
      btcData,
      manualTrigger,
      pauseEmptyPinnedPreview,
      showPauseScheduling,
      autoCooldownRemaining,
      cooldownHours,
      nextCronCheckIn,
      manualCooldownRemaining,
      onNeedPause,
    ],
  );

  return { pauseSectionHeaderRight, pauseEmptyPinnedPreview, pauseCardBody };
}
