import type { BtcPriceData, BtcMoveSeverity } from '@/features/market/public';
import type { Entitlement } from '@/features/subscription/public';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseContextHomePreview } from './home-pause-card-body-props';
import { zenModeHomePauseSnapshot } from './zen-mode-home-pause-snapshot';

export type BuildZenModeHomeRoutePropsInput = {
  hasOpenPause: boolean;
  context: string | null;
  contextPreview: PauseContextHomePreview;
  openPauseState: 'active' | 'engaged' | null;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  onDismiss: () => void;
  onNeedPause: () => void;
  onManualTrigger: () => void;
  onPauseWithThis: () => void;
  subscriptionReady: boolean;
  hasAccess: boolean;
  showLimitUpsell: boolean;
  entitlement: Entitlement;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  checkoutLoading: boolean;
  trialLoading: boolean;
  onStartTrial: () => void;
  onReactivate: () => void;
};

/** Stable props for Zen reflection Home (`ZenModeHome` / `HomeZenModeRoute`). */
export type ZenModeHomeRoutePropsProjection = BuildZenModeHomeRoutePropsInput & {
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: BtcMoveSeverity;
  lastPauseInstanceId: null;
};

/** Merges dynamic zen inputs with static pause snapshot fields (no open instance in zen). */
export function buildZenModeHomeRouteProps(
  input: BuildZenModeHomeRoutePropsInput,
): ZenModeHomeRoutePropsProjection {
  return {
    ...input,
    ...zenModeHomePauseSnapshot(),
  };
}
