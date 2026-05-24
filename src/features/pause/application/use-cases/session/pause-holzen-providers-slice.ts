import { normalizeTrackedAssetId, type BtcPriceData } from '@/features/market/public';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { PauseHomeContextValue } from '@/features/pause/domain/home/pause-home-context-value';
import type { PauseSeverity } from './location-state';

/** Pause home + profile fields required by `/pause` session providers. */
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

/** Explicit pick source — compose {@link PauseHomeContextValue} + profile fields in the conductor. */
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

type ProfilePickForPauseSession = {
  mantra: string | null;
  companionPrefs: CompanionPrefs;
  profileLoaded: boolean;
  trackedAssetId: string;
};

/** Merges pause home context + user profile for `pickPauseHolzenProvidersSlice`. */
export function buildPauseHolzenProvidersPickSource(
  pause: PauseHomeContextValue,
  profile: ProfilePickForPauseSession,
): PickPauseHolzenProvidersSliceSource {
  return {
    ...pause,
    mantra: profile.mantra,
    companionPrefs: profile.companionPrefs,
    profileLoaded: profile.profileLoaded,
    trackedAssetId: normalizeTrackedAssetId(profile.trackedAssetId),
  };
}

/** Maps pause home + profile into the pause session provider slice. */
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
