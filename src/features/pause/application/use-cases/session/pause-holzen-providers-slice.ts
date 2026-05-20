import type { BtcPriceData } from '@/features/market/public';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseSeverity } from './location-state';

/** Holzen home context fields required by `/pause` providers (injected from `useHolzen` in screens). */
export type PauseHolzenProvidersSlice = {
  mantra: string;
  dismissMessage: () => void | Promise<void>;
  message: string | null;
  context: string | null;
  companions: CompanionData;
  lastPauseInstanceId: string | null;
  companionPrefs: CompanionPrefs;
  severity: PauseSeverity;
  profileLoaded: boolean;
  resyncOpenPauseFromDb: () => void | Promise<void>;
  btcData: BtcPriceData | null;
  trackedAssetId: string;
};

/** Superset of {@link PauseHolzenProvidersSlice} fields on `useHolzen()` for explicit picking. */
export type PickPauseHolzenProvidersSliceSource = {
  mantra: string | null;
  dismissMessage: PauseHolzenProvidersSlice['dismissMessage'];
  message: PauseHolzenProvidersSlice['message'];
  context: PauseHolzenProvidersSlice['context'];
  companions: PauseHolzenProvidersSlice['companions'];
  lastPauseInstanceId: PauseHolzenProvidersSlice['lastPauseInstanceId'];
  companionPrefs: PauseHolzenProvidersSlice['companionPrefs'];
  severity: PauseHolzenProvidersSlice['severity'];
  profileLoaded: PauseHolzenProvidersSlice['profileLoaded'];
  resyncOpenPauseFromDb: PauseHolzenProvidersSlice['resyncOpenPauseFromDb'];
  btcData: PauseHolzenProvidersSlice['btcData'];
  trackedAssetId: PauseHolzenProvidersSlice['trackedAssetId'];
};

/** Maps shared Holzen context into the pause session provider slice (screen conductor helper). */
export function pickPauseHolzenProvidersSlice(
  source: PickPauseHolzenProvidersSliceSource,
): PauseHolzenProvidersSlice {
  return {
    mantra: source.mantra ?? '',
    dismissMessage: source.dismissMessage,
    message: source.message,
    context: source.context,
    companions: source.companions,
    lastPauseInstanceId: source.lastPauseInstanceId,
    companionPrefs: source.companionPrefs,
    severity: source.severity,
    profileLoaded: source.profileLoaded,
    resyncOpenPauseFromDb: source.resyncOpenPauseFromDb,
    btcData: source.btcData,
    trackedAssetId: source.trackedAssetId,
  };
}
