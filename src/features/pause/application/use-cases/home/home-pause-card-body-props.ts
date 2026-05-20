import type { BtcPriceData } from '@/features/market/public';
import type { Entitlement } from '@/features/subscription/public';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';

/** Parsed preview lines for the open pause context on Home. */
export type PauseContextHomePreview = {
  btc24h: string | null;
  marketSentiment: string | null;
};

/** Props for {@link HomePauseCardBody} (screen component) — built in the pause feature. */
export type HomePauseCardBodyPropsProjection = {
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  onStartCheckoutPro: () => void;
  onStartTrial: () => void;
  onReactivate: () => void;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  contextPreview: PauseContextHomePreview;
  onPauseWithThis: () => void;
  onPauseWithThisFromPendingBanner?: () => void;
  onDismissOpenPause: () => void;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  onReflectionRetry: (mood?: string) => Promise<ManualPauseTriggerResult>;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  onNeedPause: () => void;
};

export type BuildHomePauseCardBodyPropsInput = {
  subLoading: boolean;
  hasAccess: boolean;
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  pauseContextHomePreview: PauseContextHomePreview;
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
};

/** Maps Home pause card conductor inputs to `HomePauseCardBody` props (behavior parity). */
export function buildHomePauseCardBodyProps(
  input: BuildHomePauseCardBodyPropsInput,
): HomePauseCardBodyPropsProjection {
  return {
    subLoading: input.subLoading,
    hasAccess: input.hasAccess,
    entitlement: input.entitlement,
    checkoutLoading: input.checkoutLoading,
    trialLoading: input.trialLoading,
    onStartCheckoutPro: input.onStartCheckoutPro,
    onStartTrial: input.onStartTrial,
    onReactivate: input.onReactivate,
    hasOpenPause: input.hasOpenPause,
    openPauseState: input.openPauseState,
    contextPreview: input.pauseContextHomePreview,
    onPauseWithThis: input.onNavigatePauseWithThis,
    onPauseWithThisFromPendingBanner: input.onNavigatePauseFromPendingBanner,
    onDismissOpenPause: input.onDismissOpenPause,
    loading: input.loading,
    error: input.error,
    btcData: input.btcData,
    onReflectionRetry: input.manualTrigger,
    showPauseScheduling: input.showPauseScheduling,
    autoCooldownRemaining: input.autoCooldownRemaining,
    cooldownHours: input.cooldownHours,
    nextCronCheckIn: input.nextCronCheckIn,
    manualCooldownRemaining: input.manualCooldownRemaining,
    onNeedPause: input.onNeedPause,
  };
}
