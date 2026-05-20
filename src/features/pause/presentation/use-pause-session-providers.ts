import { useCallback, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { usePauseSessionExitNavigation } from './use-pause-session-exit-navigation';
import { usePauseSessionBreathSecondLabelVariant } from './use-pause-session-breath-second-label-variant';
import { JOURNEY_PREFIX } from '@/lib/app-routes';
import { clearSession } from '@/features/pause/public';
import type { PauseSessionShellHolzen } from '@/features/pause/public';
import type {
  PauseSessionHolzenProvidersSlice,
  PauseSessionProviders,
} from './session/pause-session-providers-types';

/**
 * Cross-route providers for `/pause`: i18n, subscription gates, exit nav, and injected Holzen snapshot.
 * Route entry uses `usePauseSessionProviders` from `use-pause-session-providers-conductor.ts` (reads Holzen in presentation).
 */
export function usePauseSessionProvidersFromHolzenSlice(
  holzen: PauseSessionHolzenProvidersSlice,
): PauseSessionProviders {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleReturn, handleClose } = usePauseSessionExitNavigation(navigate);

  const handleBriefSaveToJourney = useCallback(() => {
    clearSession();
    navigate(JOURNEY_PREFIX, { replace: true });
  }, [navigate]);

  const prefersReducedMotion = useReducedMotion();
  const breathSecondLabelVariant = usePauseSessionBreathSecondLabelVariant();

  const {
    mantra,
    dismissMessage,
    message,
    context,
    companions,
    lastPauseInstanceId,
    companionPrefs,
    severity,
    profileLoaded,
    resyncOpenPauseFromDb,
    btcData,
    trackedAssetId,
  } = holzen;

  const holzenForShell = useMemo<PauseSessionShellHolzen>(
    () => ({
      message,
      context,
      lastPauseInstanceId,
      companions,
      companionPrefs,
      severity,
    }),
    [message, context, lastPauseInstanceId, companions, companionPrefs, severity],
  );

  const {
    subscribed,
    loading: subLoading,
    entitlement,
    canEngagePause,
    checkoutLoading,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    refresh: refreshSubscription,
  } = useSubscription();
  const { requirePro } = useProGate();

  return {
    t,
    navigate,
    handleReturn,
    handleClose,
    handleBriefSaveToJourney,
    prefersReducedMotion,
    breathSecondLabelVariant,
    holzenForShell,
    mantra,
    dismissMessage,
    message,
    context,
    companions,
    companionPrefs,
    severity,
    profileLoaded,
    resyncOpenPauseFromDb,
    btcData,
    trackedAssetId,
    subscribed,
    subLoading,
    entitlement,
    canEngagePause,
    checkoutLoading,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    refreshSubscription,
    requirePro,
  };
}
